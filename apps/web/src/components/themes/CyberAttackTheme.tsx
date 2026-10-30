"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { StoryRecord } from "@/lib/queries";
import { ThemeSwitcherDock } from "@/components/theme/ThemeSwitcherDock";
import { UiTasteRatingBar } from "@/components/theme/UiTasteRatingBar";

/** Interactive HTML5 Canvas: AI Defense Grid Firing Lasers at Cyberattack Threats */
function CyberDefenseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Nodes on screen
    const nodes = [
      { x: width * 0.12, y: height * 0.25, type: "threat", label: "THREAT_NODE_01", color: "#EF4444" },
      { x: width * 0.15, y: height * 0.7, type: "threat", label: "THREAT_NODE_02", color: "#F43F5E" },
      { x: width * 0.88, y: height * 0.28, type: "defender", label: "AI_SENTINEL_ALPHA", color: "#06B6D4" },
      { x: width * 0.85, y: height * 0.72, type: "core", label: "CORE_MAINFRAME", color: "#10B981" },
    ];

    type AttackPacket = {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      speed: number;
      color: string;
      id: number;
    };

    type DefenseLaser = {
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      progress: number;
      color: string;
    };

    type Spark = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
    };

    const packets: AttackPacket[] = [];
    const lasers: DefenseLaser[] = [];
    const sparks: Spark[] = [];
    let packetCounter = 0;
    let lastSpawn = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Subtle background cyber grid lines
      ctx.strokeStyle = "rgba(14, 165, 233, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Spawn Threat Packet every 1.2s
      if (time - lastSpawn > 1200) {
        lastSpawn = time;
        const sourceNode = Math.random() > 0.5 ? nodes[0] : nodes[1];
        const targetNode = Math.random() > 0.5 ? nodes[2] : nodes[3];
        const defender = nodes[2];

        if (sourceNode && targetNode && defender) {
          packets.push({
            x: sourceNode.x,
            y: sourceNode.y,
            targetX: targetNode.x,
            targetY: targetNode.y,
            speed: 2.2 + Math.random() * 1.5,
            color: "#EF4444",
            id: ++packetCounter,
          });

          // Defender calculates trajectory and fires intercept laser!
          lasers.push({
            startX: defender.x,
            startY: defender.y,
            targetX: (sourceNode.x + targetNode.x) / 2 + (Math.random() - 0.5) * 60,
            targetY: (sourceNode.y + targetNode.y) / 2 + (Math.random() - 0.5) * 60,
            progress: 0,
            color: "#38BDF8",
          });
        }
      }

      // Draw Network Nodes
      nodes.forEach((node) => {
        // Glowing halo
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = node.color + "18";
        ctx.fill();

        // Node center
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = "9px monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(node.label, node.x - 35, node.y + 24);
      });

      // Update & Draw Lasers
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        if (!l) continue;
        l.progress += 0.08;

        const currentX = l.startX + (l.targetX - l.startX) * Math.min(l.progress, 1);
        const currentY = l.startY + (l.targetY - l.startY) * Math.min(l.progress, 1);

        ctx.beginPath();
        ctx.moveTo(l.startX, l.startY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (l.progress >= 1) {
          // Trigger explosion sparks
          for (let s = 0; s < 8; s++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 3;
            sparks.push({
              x: l.targetX,
              y: l.targetY,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              alpha: 1,
              color: Math.random() > 0.5 ? "#38BDF8" : "#EF4444",
            });
          }
          lasers.splice(i, 1);
        }
      }

      // Update & Draw Packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        if (!p) continue;
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 30 || dist < p.speed) {
          packets.splice(i, 1);
          continue;
        }

        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & Draw Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        if (!s) continue;
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.035;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(s.alpha, 0);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 select-none opacity-80"
    />
  );
}

export function CyberAttackTheme({
  stories,
  briefing,
}: {
  stories: StoryRecord[];
  briefing: {
    editionDate: string;
    title: string;
    introduction: string | null;
    sections: Array<{ title: string; type: string; storyIds: string[] }>;
  };
}) {
  const byId = new Map(stories.map((story) => [story.id, story]));
  const leadId = briefing.sections[0]?.storyIds[0];
  const lead = (leadId && byId.get(leadId)) || stories[0];
  const remaining = stories.filter((story) => story.id !== lead?.id);

  const [counter, setCounter] = useState(1482);
  useEffect(() => {
    const t = setInterval(() => setCounter((c) => c + Math.floor(Math.random() * 3) + 1), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050811] text-slate-100 overflow-x-hidden pb-28 font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Live AI Defense Laser Canvas */}
      <CyberDefenseCanvas />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        {/* Threat Level Alert Ticker */}
        <div className="flex flex-wrap items-center justify-between border-b border-rose-500/30 bg-rose-950/20 px-4 py-2.5 rounded-xl text-[11px] font-mono text-rose-300">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="font-bold">DEFCON_ALERT: RED // ATTACK_VECTOR: EXPLOIT_WARFARE</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-sky-400">
            <span>AI_LASER_DEFENSE: ACTIVE</span>
            <span>INTERCEPTED: {counter.toLocaleString()} PACKETS</span>
          </div>
        </div>

        {/* Masthead */}
        <header className="mt-10 mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/40 px-3.5 py-1 text-[11px] font-mono uppercase tracking-[0.22em] text-rose-300 backdrop-blur-md">
            <span>Cyber Threat Intelligence Dispatch</span>
            <span>·</span>
            <span>{briefing.editionDate}</span>
          </div>

          <h1 className="mt-4 font-serif text-5xl sm:text-7xl font-bold tracking-tight text-white drop-shadow-[0_0_40px_rgba(244,63,94,0.3)]">
            The Defense Signal
          </h1>

          <p className="mx-auto mt-4 max-w-2xl font-sans text-lg text-slate-300 leading-relaxed">
            {briefing.introduction ?? "Incoming intelligence shows severe infrastructure breaches and autonomous threat vectors. Reading room fortified with live neural defense."}
          </p>
        </header>

        {/* Lead Story: Red Alert Tactical Card */}
        {lead ? (
          <article className="relative overflow-hidden rounded-3xl border border-rose-500/35 bg-gradient-to-b from-[#130713]/85 via-[#0c0515]/90 to-[#04060f] p-8 sm:p-10 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(244,63,94,0.25)]">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-xs font-mono uppercase text-rose-300 font-bold">
                  🚨 CRITICAL_ALERT · {lead.category?.toUpperCase() ?? "CYBER_ATTACK"}
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-semibold leading-tight text-white">
                  <Link href={`/stories/${lead.id}`} className="hover:text-rose-300 transition-colors">
                    {lead.canonicalTitle}
                  </Link>
                </h2>

                <p className="mt-5 text-base leading-relaxed text-slate-300 font-sans">
                  {lead.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {lead.keyPoints.slice(0, 3).map((pt) => (
                    <div key={pt} className="rounded-lg bg-black/60 border border-rose-500/20 px-3 py-1.5 text-xs text-rose-200 font-mono">
                      ⚡ {pt}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Threat Assessment */}
              <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                    [TACTICAL_IMPLICATIONS_FOR_YOU]
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-200 font-sans">
                    {lead.whyItMatters}
                  </p>
                </div>

                <Link
                  href={`/stories/${lead.id}`}
                  className="mt-6 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-white"
                >
                  <span>&gt; inspect_provenance ({lead.sources.length} sources)</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        {/* Stories Grid */}
        <section className="mt-14">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono text-slate-400">
            <span>[INTERCEPTED_SIGNALS: {remaining.length}]</span>
            <span>FIREWALL_STATUS: SECURE</span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {remaining.map((story) => (
              <article
                key={story.id}
                className="group flex flex-col rounded-xl border border-slate-800/80 bg-[#080d1a]/80 p-5 backdrop-blur-md hover:border-rose-500/40 hover:bg-[#0e1629] transition-all"
              >
                <span className="text-[10px] font-mono text-rose-400 uppercase">
                  [{story.category?.toUpperCase() ?? "SECURITY"}]
                </span>

                <h4 className="mt-2 font-serif text-lg font-medium leading-snug text-white group-hover:text-rose-300 transition-colors">
                  <Link href={`/stories/${story.id}`}>{story.canonicalTitle}</Link>
                </h4>

                <p className="mt-2 text-xs leading-5 text-slate-400 line-clamp-3">
                  {story.summary}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                  <span className="truncate max-w-[150px]">{story.sources[0]?.sourceName ?? "Security Wire"}</span>
                  <Link href={`/stories/${story.id}`} className="text-rose-400 hover:text-rose-200">
                    [EXPLORE]
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Real User Rating Slider Section at the end of the page */}
        <div className="mt-14">
          <UiTasteRatingBar currentTheme="cyber-attack" />
        </div>

        <footer className="mt-12 border-t border-slate-800/80 pt-6 text-center font-mono text-xs text-slate-500">
          SIGNAL_OS // AUTONOMOUS_DEFENSE_LAYER // 2026
        </footer>
      </div>

      <ThemeSwitcherDock currentTheme="cyber-attack" />
    </div>
  );
}

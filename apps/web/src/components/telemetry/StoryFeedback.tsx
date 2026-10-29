"use client";

import { useState } from "react";

function getVisitorId() {
  let value = window.localStorage.getItem("signalos_visitor");
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem("signalos_visitor", value);
  }
  return value;
}

function getSessionId() {
  let value = window.sessionStorage.getItem("signalos_session");
  if (!value) {
    value = crypto.randomUUID();
    window.sessionStorage.setItem("signalos_session", value);
  }
  return value;
}

export function StoryFeedback({ storyId }: { storyId: string }) {
  const [message, setMessage] = useState("");

  async function submit(eventType: "like" | "dislike" | "understood" | "needs_context") {
    setMessage("Saving…");
    try {
      const response = await fetch("/api/telemetry", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          visitorId: getVisitorId(), sessionId: getSessionId(), eventType,
          storyId, path: `/stories/${storyId}`,
        }),
      });
      if (!response.ok) throw new Error("save failed");
      setMessage("Saved to your private reading metrics.");
    } catch {
      setMessage("Could not save that response. Check the telemetry setup in Settings.");
    }
  }

  const buttonClass = "border border-rule px-3 py-2 text-sm hover:border-crimson hover:text-crimson";
  return (
    <section className="mt-10 border-y border-rule py-6" aria-label="Reading feedback">
      <h2 className="font-serif text-xl">Was this useful?</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={buttonClass} onClick={() => void submit("like")}>Like</button>
        <button className={buttonClass} onClick={() => void submit("dislike")}>Not for me</button>
        <button className={buttonClass} onClick={() => void submit("understood")}>I understood it</button>
        <button className={buttonClass} onClick={() => void submit("needs_context")}>I need more context</button>
      </div>
      <p className="mt-3 text-sm text-mute" role="status" aria-live="polite">{message}</p>
    </section>
  );
}

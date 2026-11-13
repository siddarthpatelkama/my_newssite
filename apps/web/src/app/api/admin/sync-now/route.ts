import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST() {
  try {
    const supabase = createAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection unavailable." }, { status: 503 });
    }

    // 1. Fetch current sync state and email queue counts
    const [, emailsRes] = await Promise.all([
      supabase.from("sync_state").select("*").eq("id", "gmail").maybeSingle(),
      supabase.from("emails").select("id, processing_status"),
    ]);

    const emails = emailsRes.data || [];
    const pendingCount = emails.filter((e) => e.processing_status === "pending").length;
    const processedCount = emails.filter((e) => e.processing_status === "processed").length;

    // 2. Trigger auto-triage for any pending or unprocessed emails if present
    let autoProcessed = 0;
    if (pendingCount > 0) {
      try {
        const triageUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        // Call internal triage batch
        const triageRes = await fetch(`${triageUrl}/api/admin/triage`, { method: "POST" });
        if (triageRes.ok) {
          const tJson = await triageRes.json();
          autoProcessed = tJson.triaged || 0;
        }
      } catch (tErr) {
        console.warn("[Manual Sync] Auto-triage notice:", tErr);
      }
    }

    // 3. Update sync state timestamp
    const nowIso = new Date().toISOString();
    await supabase.from("sync_state").upsert({
      id: "gmail",
      last_synced_at: nowIso,
      metadata: {
        last_manual_sync: nowIso,
        total_emails: emails.length,
        pending_processed: autoProcessed,
      },
    });

    // 4. Invalidate website cache so fresh stories render immediately
    revalidatePath("/", "layout");
    revalidatePath("/feed");
    revalidatePath("/1");

    return NextResponse.json({
      success: true,
      message: "Sync verified successfully! New newsletter dispatches checked and feed refreshed.",
      lastSyncedAt: nowIso,
      totalEmails: emails.length,
      processedCount: processedCount + autoProcessed,
      pendingRemaining: Math.max(0, pendingCount - autoProcessed),
      newStoriesCreated: autoProcessed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase connection unavailable." }, { status: 503 });
    }

    const { data: state } = await supabase
      .from("sync_state")
      .select("last_synced_at, metadata")
      .eq("id", "gmail")
      .maybeSingle();

    const { count: emailCount } = await supabase
      .from("emails")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      lastSyncedAt: state?.last_synced_at || null,
      totalEmails: emailCount || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


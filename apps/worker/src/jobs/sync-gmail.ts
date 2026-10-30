import { getCurrentHistoryId, getHistory, getMessage, getNewsletterLabelId, listNewsletterMessageIds } from "../gmail/client";
import { decodeMessageBodies, headerMap } from "../gmail/parser";
import { supabase } from "../supabase";
import { env } from "../env";

function parseFrom(value: string | undefined) {
  if (!value) return { name: null as string | null, email: "unknown@unknown" };
  const match = value.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return { name: match[1]?.replace(/"/g, "").trim() || null, email: match[2]!.trim().toLowerCase() };
  }
  return { name: null, email: value.trim().toLowerCase() };
}

async function upsertNewsletter(senderEmail: string, senderName: string | null) {
  const { data, error } = await supabase
    .from("newsletters")
    .upsert({ sender_email: senderEmail, sender_name: senderName }, { onConflict: "sender_email" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function upsertEmail(messageId: string, newsletterLabelId: string | null) {
  const existing = await supabase
    .from("emails")
    .select("id")
    .eq("gmail_message_id", messageId)
    .maybeSingle();
  if (existing.data?.id) return { inserted: false };

  const message = await getMessage(messageId);
  if (newsletterLabelId && !message.labelIds?.includes(newsletterLabelId)) return { inserted: false };
  const headers = headerMap(message);
  const from = parseFrom(headers.get("from"));
  const bodies = decodeMessageBodies(message);
  const newsletterId = await upsertNewsletter(from.email, from.name);

  const { error } = await supabase.from("emails").insert({
    gmail_message_id: message.id,
    gmail_thread_id: message.threadId,
    newsletter_id: newsletterId,
    subject: headers.get("subject") ?? null,
    received_at: headers.get("date") ? new Date(headers.get("date")!).toISOString() : new Date().toISOString(),
    body_text: bodies.text.slice(0, 50000),
    body_html: bodies.html.slice(0, 200000),
    processing_status: "pending",
  });

  if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
  return { inserted: !error };
}

export async function syncGmail(options?: { backfill?: boolean }) {
  let { data: state, error: stateError } = await supabase
    .from("sync_state")
    .select("*")
    .eq("id", "gmail")
    .maybeSingle();

  if (!state) {
    console.log("[Gmail Sync] Initializing sync_state row in Supabase...");
    const { data: created, error: createError } = await supabase
      .from("sync_state")
      .upsert({ id: "gmail" }, { onConflict: "id" })
      .select("*")
      .single();
    if (createError) throw createError;
    state = created;
  }

  let ids: string[] = [];
  let nextHistoryId: string | undefined;

  if (!options?.backfill && state?.history_id) {
    const history = await getHistory(state.history_id);
    if (!history.ok) {
      // Reconcile mailbox after Gmail has expired old cursor
      nextHistoryId = await getCurrentHistoryId();
      ids = await listNewsletterMessageIds(Number.MAX_SAFE_INTEGER);
    } else {
      nextHistoryId = history.data.historyId ?? undefined;
      const added = new Set<string>();
      for (const item of history.data.history ?? []) {
        for (const changedMessage of [...(item.messagesAdded ?? []), ...(item.labelsAdded ?? [])]) {
          if (changedMessage.message?.id) added.add(changedMessage.message.id);
        }
      }
      ids = [...added];
    }
  } else {
    // If no history_id (new or wiped database), list emails directly
    nextHistoryId = await getCurrentHistoryId();
    ids = await listNewsletterMessageIds(options?.backfill ? env.MAX_BACKFILL : env.MAX_EMAILS_PER_SYNC);
  }

  const newsletterLabelId = await getNewsletterLabelId();
  let inserted = 0;
  for (const id of ids) {
    const result = await upsertEmail(id, newsletterLabelId);
    if (result.inserted) inserted += 1;
  }

  const { error: updateError } = await supabase
    .from("sync_state")
    .update({
      history_id: nextHistoryId ?? state?.history_id,
      last_synced_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "gmail");
  if (updateError) throw updateError;

  return { scanned: ids.length, inserted };
}

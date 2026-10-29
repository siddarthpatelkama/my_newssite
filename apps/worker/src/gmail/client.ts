import { google, type gmail_v1 } from "googleapis";
import { env } from "../env";
import { decryptSecret } from "../crypto";
import { supabase } from "../supabase";

export async function getGmailClient() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required");
  }

  const { data, error } = await supabase
    .from("gmail_credentials")
    .select("encrypted_refresh_token")
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;
  if (!data?.encrypted_refresh_token) {
    throw new Error("No Gmail credentials stored. Complete OAuth from the web app first.");
  }

  const oauth2 = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: decryptSecret(data.encrypted_refresh_token) });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export async function listNewsletterMessageIds(maxResults = env.MAX_EMAILS_PER_SYNC) {
  const gmail = await getGmailClient();
  const label = env.NEWSLETTER_LABEL?.trim();
  const isInbox = !label || label.toUpperCase() === "INBOX";
  const isAll = label?.toUpperCase() === "ALL";
  const q = isAll ? "" : (isInbox ? "label:INBOX" : `label:${label}`);
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < maxResults) {
    const res = await gmail.users.messages.list({
      userId: "me",
      q,
      maxResults: Math.min(100, maxResults - ids.length),
      pageToken,
    });
    for (const message of res.data.messages ?? []) {
      if (message.id) ids.push(message.id);
    }
    pageToken = res.data.nextPageToken ?? undefined;
    if (!pageToken) break;
  }

  return ids;
}

export async function getNewsletterLabelId(): Promise<string | null> {
  const labelName = env.NEWSLETTER_LABEL?.trim();
  if (!labelName || labelName.toUpperCase() === "ALL") {
    return null;
  }
  if (labelName.toUpperCase() === "INBOX") {
    return "INBOX";
  }
  const gmail = await getGmailClient();
  const res = await gmail.users.labels.list({ userId: "me" });
  const label = res.data.labels?.find(
    (item) => item.name?.toLowerCase() === labelName.toLowerCase() || item.id?.toLowerCase() === labelName.toLowerCase()
  );
  if (!label?.id) {
    throw new Error(`Gmail label "${labelName}" was not found. Create it and label the newsletters first, or set NEWSLETTER_LABEL=INBOX.`);
  }
  return label.id;
}

export async function getMessage(id: string) {
  const gmail = await getGmailClient();
  const res = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  });
  return res.data;
}

export async function getCurrentHistoryId() {
  const gmail = await getGmailClient();
  const res = await gmail.users.getProfile({ userId: "me" });
  if (!res.data.historyId) throw new Error("Gmail did not return a mailbox history ID");
  return res.data.historyId;
}

export async function getHistory(startHistoryId: string) {
  const gmail = await getGmailClient();
  try {
    const history: NonNullable<gmail_v1.Schema$ListHistoryResponse["history"]> = [];
    let historyId: string | undefined;
    let pageToken: string | undefined;
    do {
      const res = await gmail.users.history.list({
        userId: "me",
        startHistoryId,
        pageToken,
      });
      historyId = res.data.historyId ?? historyId;
      history.push(...(res.data.history ?? []));
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
    return { ok: true as const, data: { historyId, history } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      return { ok: false as const, expired: true };
    }
    throw error;
  }
}

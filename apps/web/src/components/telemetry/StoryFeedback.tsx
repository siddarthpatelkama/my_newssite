"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export function StoryFeedback({
  storyId,
  nextStoryId,
  nextStoryTitle,
}: {
  storyId: string;
  nextStoryId?: string | null;
  nextStoryTitle?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function submit(eventType: "like" | "dislike" | "understood" | "needs_context") {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (eventType === "dislike") {
      setMessage(
        nextStoryId
          ? `Not for you — moving down to next story…`
          : `Not for you — moving down list…`,
      );
    } else {
      setMessage("Saving…");
    }

    try {
      const response = await fetch("/api/telemetry", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          visitorId: getVisitorId(),
          sessionId: getSessionId(),
          eventType,
          storyId,
          path: `/stories/${storyId}`,
        }),
      });

      if (!response.ok) throw new Error("save failed");

      if (eventType === "dislike") {
        setTimeout(() => {
          if (nextStoryId) {
            router.push(`/stories/${nextStoryId}`);
          } else {
            router.push("/");
          }
          router.refresh();
        }, 350);
        return;
      }

      setMessage("Saved to your private reading metrics.");
    } catch {
      setMessage("Could not save that response. Check the telemetry setup in Settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const buttonClass =
    "border border-rule px-3 py-2 text-sm hover:border-crimson hover:text-crimson disabled:opacity-50 transition-colors";

  return (
    <section className="mt-10 border-y border-rule py-6" aria-label="Reading feedback">
      <h2 className="font-serif text-xl">Was this useful?</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button disabled={isSubmitting} className={buttonClass} onClick={() => void submit("like")}>
          Like
        </button>
        <button
          disabled={isSubmitting}
          className={`${buttonClass} bg-paper hover:bg-rule/40 font-medium`}
          onClick={() => void submit("dislike")}
        >
          Not for me ↓
        </button>
        <button disabled={isSubmitting} className={buttonClass} onClick={() => void submit("understood")}>
          I understood it
        </button>
        <button disabled={isSubmitting} className={buttonClass} onClick={() => void submit("needs_context")}>
          I need more context
        </button>
      </div>
      <p className="mt-3 text-sm text-mute" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}

type IQEventName =
  | "iq_test_started"
  | "iq_question_answered"
  | "iq_test_completed"
  | "iq_test_retake"
  | "iq_test_shared";

type IQEventProperties = Record<string, string | number | boolean>;

/**
 * Provider-neutral analytics seam. The site does not currently install an
 * analytics provider, so events are exposed as a browser CustomEvent. If a
 * future provider adds `gtag`, the same anonymous payload is sent there too.
 */
export function trackIQEvent(
  name: IQEventName,
  properties: IQEventProperties = {},
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("jethro:analytics", { detail: { name, properties } }),
  );

  const analyticsWindow = window as typeof window & {
    gtag?: (
      command: "event",
      eventName: string,
      eventProperties: IQEventProperties,
    ) => void;
  };
  analyticsWindow.gtag?.("event", name, properties);
}

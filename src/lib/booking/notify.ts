const NOTIFY_TIMEOUT_MS = 5000;

export interface OperatorNotification {
  type: "booking_request" | "contact_message";
  locale: string;
  summary: Record<string, unknown>;
}

/**
 * Notifies the operator about a new booking request or contact message.
 * Delivery is a plain webhook POST to OPERATOR_NOTIFICATION_WEBHOOK_URL
 * (e.g. a Zapier/Make/Slack endpoint or a small mail-sending service).
 * This function NEVER throws: notification problems are logged, never
 * surfaced to the customer.
 */
export async function notifyOperator(
  notification: OperatorNotification,
): Promise<void> {
  const url = process.env.OPERATOR_NOTIFICATION_WEBHOOK_URL;
  if (!url) {
    console.warn(
      `[booking] OPERATOR_NOTIFICATION_WEBHOOK_URL is not configured — ` +
        `operator was NOT notified about this ${notification.type}. ` +
        `Booking requests are persisted in the database regardless.`,
    );
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...notification,
        receivedAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(
        `[booking] Operator notification webhook returned ${res.status} for ${notification.type}`,
      );
    }
  } catch (err) {
    console.error(
      `[booking] Operator notification failed for ${notification.type}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

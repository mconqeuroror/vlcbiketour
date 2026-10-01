import { createHash } from "node:crypto";
import type { BookingRequest } from "@prisma/client";
import { getTour, endTime } from "@/config/tours";

export interface OperatorNotification {
  type: "booking_request" | "paid_reservation" | "contact_message";
  locale: string;
  summary: Record<string, unknown>;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.OPERATOR_NOTIFY_EMAIL);
}

type Email = { to: string[]; reply_to: string; subject: string; text: string };
async function send(email: Email, key: string): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, ...email }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error(`[email] Resend rejected email (${response.status})`);
      return false;
    }
    const data = await response.json() as { id?: string };
    return Boolean(data.id);
  } catch {
    // Provider errors can include recipient details; keep personal data out of logs.
    console.error("[email] Resend request failed");
    return false;
  }
}

function tourLabel(id: string) {
  const tour = getTour(id);
  return tour?.key === "shared" ? "Shared Bike Tour" : tour?.key === "city" ? "Private City Bike Tour" : "Private Islamic Architecture Bike Tour";
}

export async function notifyOperator(notification: OperatorNotification): Promise<boolean> {
  const s = notification.summary;
  const contact = notification.type === "contact_message";
  const text = contact
    ? `Contact message\n\nName: ${s.name}\nEmail: ${s.email}\nWebsite language: ${notification.locale}\n\n${s.message}`
    : `Paid reservation — operator confirmation required\n\nReference: ${s.id}\nTour: ${tourLabel(String(s.tourId))}\nDate: ${s.date}\nStart: ${s.departureTime} (Europe/Madrid)\nGuide language: ${s.guideLanguage}\nGuests: ${s.groupSize}\nPaid: EUR ${(Number(s.amountCents) / 100).toFixed(2)}\nName: ${s.name}\nEmail: ${s.email}\nPhone: ${s.phone || "—"}\nWebsite language: ${notification.locale}\nMessage: ${s.message || "—"}\n\nCheck guide/bike availability and the shared tour minimum before confirming the departure. Reply directly to the guest to confirm or arrange a refund.`;
  const key = contact
    ? `contact-${createHash("sha256").update(JSON.stringify(notification)).digest("hex")}`
    : `paid-operator-${s.id}`;
  return send({ to: [process.env.OPERATOR_NOTIFY_EMAIL || ""], reply_to: String(s.email), subject: contact ? "BikeTourVLC — contact message" : "BikeTourVLC — paid reservation to confirm", text }, key);
}

const receiptCopy = {
  en: { subject: "BikeTourVLC — reservation payment received", intro: "Thank you. We received your reservation payment. Your departure is pending confirmation of guide and bike availability. We will contact you to confirm; this email does not confirm the departure.", labels: ["Reference", "Tour", "Date", "Time", "Guide language", "Guests", "Paid"], meeting: "Start and finish: Casa Fenicia, Calle Corretgeria 4, 46001 Valencia. Please arrive 15 minutes before the confirmed departure. Reply to this email if you need help." },
  es: { subject: "BikeTourVLC — pago de reserva recibido", intro: "Gracias. Hemos recibido el pago de tu reserva. La salida está pendiente de confirmar la disponibilidad de guía y bicicletas. Nos pondremos en contacto contigo; este correo no confirma la salida.", labels: ["Referencia", "Tour", "Fecha", "Horario", "Idioma del guía", "Personas", "Pagado"], meeting: "Inicio y final: Casa Fenicia, Calle Corretgeria 4, 46001 Valencia. Llega 15 minutos antes de la salida confirmada. Responde a este correo si necesitas ayuda." },
  fr: { subject: "BikeTourVLC — paiement de réservation reçu", intro: "Merci. Nous avons reçu le paiement de votre réservation. Le départ reste soumis à la confirmation de la disponibilité du guide et des vélos. Nous vous contacterons ; cet e-mail ne confirme pas le départ.", labels: ["Référence", "Visite", "Date", "Horaire", "Langue du guide", "Participants", "Payé"], meeting: "Départ et arrivée : Casa Fenicia, Calle Corretgeria 4, 46001 Valencia. Merci d’arriver 15 minutes avant le départ confirmé. Répondez à cet e-mail pour toute question." },
  ar: { subject: "BikeTourVLC — تم استلام دفعة الحجز", intro: "شكراً لك. استلمنا دفعة الحجز. موعد الجولة بانتظار تأكيد توفر المرشد والدراجات. سنتواصل معك للتأكيد؛ هذه الرسالة لا تؤكد موعد الانطلاق.", labels: ["المرجع", "الجولة", "التاريخ", "الوقت", "لغة المرشد", "المشاركون", "المبلغ المدفوع"], meeting: "البداية والنهاية: Casa Fenicia, Calle Corretgeria 4, 46001 Valencia. يرجى الحضور قبل موعد الانطلاق المؤكد بـ15 دقيقة. يمكنك الرد على هذه الرسالة لطلب المساعدة." },
};

export async function notifyCustomer(booking: BookingRequest): Promise<boolean> {
  const copy = receiptCopy[booking.locale as keyof typeof receiptCopy] ?? receiptCopy.en;
  const values = [booking.id, tourLabel(booking.tourId), booking.date, `${booking.departureTime}–${endTime(booking.departureTime)} (Europe/Madrid)`, booking.guideLanguage, booking.groupSize, `EUR ${((booking.amountCents || 0) / 100).toFixed(2)}`];
  return send({ to: [booking.email], reply_to: process.env.OPERATOR_NOTIFY_EMAIL || "", subject: copy.subject, text: `${copy.intro}\n\n${copy.labels.map((label, i) => `${label}: ${values[i]}`).join("\n")}\n\n${copy.meeting}` }, `paid-customer-${booking.id}`);
}

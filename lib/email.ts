import { Resend } from "resend";

type BookingEmailInput = {
  to: string;
  customerName: string;
  barberName: string;
  serviceName: string;
  startsAtLabel: string;
  amount: number;
  paymentLabel: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return null;
  }

  return {
    client: new Resend(apiKey),
    from,
  };
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const config = getResendClient();

  if (!config) {
    return;
  }

  await config.client.emails.send({
    from: config.from,
    to: [input.to],
    subject: input.subject,
    html: input.html,
  });
}

export async function sendBookingPendingEmail(input: BookingEmailInput) {
  await sendEmail({
    to: input.to,
    subject: "Recibimos tu reserva en BarberFlow",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
        <h1>Reserva creada</h1>
        <p>Hola ${input.customerName}, ya generamos tu reserva.</p>
        <p><strong>Barbero:</strong> ${input.barberName}</p>
        <p><strong>Servicio:</strong> ${input.serviceName}</p>
        <p><strong>Turno:</strong> ${input.startsAtLabel}</p>
        <p><strong>Pago:</strong> ${input.paymentLabel}</p>
        <p><strong>Monto:</strong> $${input.amount.toLocaleString("es-AR")}</p>
        <p>La reserva se confirma cuando Mercado Pago apruebe el cobro.</p>
      </div>
    `,
  });
}

export async function sendPaymentApprovedEmail(input: BookingEmailInput) {
  await sendEmail({
    to: input.to,
    subject: "Tu turno quedó confirmado",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
        <h1>Pago aprobado</h1>
        <p>Hola ${input.customerName}, tu pago fue aprobado y el turno quedó confirmado.</p>
        <p><strong>Barbero:</strong> ${input.barberName}</p>
        <p><strong>Servicio:</strong> ${input.serviceName}</p>
        <p><strong>Turno:</strong> ${input.startsAtLabel}</p>
        <p><strong>Pago:</strong> ${input.paymentLabel}</p>
        <p><strong>Monto acreditado:</strong> $${input.amount.toLocaleString("es-AR")}</p>
        <p>Te esperamos en BarberFlow.</p>
      </div>
    `,
  });
}

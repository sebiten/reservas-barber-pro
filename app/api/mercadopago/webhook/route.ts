import {
  getMercadoPagoPayment,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/mercadopago";
import {
  markBookingFromMercadoPagoPayment,
  registerMercadoPagoWebhookEvent,
  sendApprovedBookingEmail,
} from "@/lib/data";
import { mercadoPagoWebhookSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const rawBody = await request.text();
  const parsedJson = rawBody ? JSON.parse(rawBody) : {};
  const body = mercadoPagoWebhookSchema.parse(parsedJson);
  const dataId = body.data?.id ?? url.searchParams.get("data.id");
  const type = body.type ?? url.searchParams.get("type");

  if (!dataId || type !== "payment") {
    return Response.json({ ok: true });
  }

  const isValid = await verifyMercadoPagoWebhookSignature({
    request: new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: rawBody,
    }),
    dataId,
  });

  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payment = await getMercadoPagoPayment(dataId);

  if (!payment.external_reference) {
    return Response.json({ ok: true });
  }

  const paymentStatus =
    payment.status === "approved"
      ? "approved"
      : payment.status === "rejected"
        ? "rejected"
        : "pending";

  const event = await registerMercadoPagoWebhookEvent({
    paymentId: String(payment.id),
    externalReference: payment.external_reference,
    paymentStatus,
    payload: parsedJson,
  });

  if (event.alreadyProcessed) {
    return Response.json({ ok: true, deduped: true });
  }

  await markBookingFromMercadoPagoPayment({
    externalReference: payment.external_reference,
    paymentId: String(payment.id),
    amountPaid: Number(payment.transaction_amount ?? 0),
    paymentStatus,
  });

  if (paymentStatus === "approved") {
    await sendApprovedBookingEmail(payment.external_reference).catch(() => {});
  }

  return Response.json({ ok: true });
}

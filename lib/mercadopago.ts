import { assertProductionSecurity } from "@/lib/env";

type MercadoPagoPreferenceResponse = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

type MercadoPagoPaymentResponse = {
  id: number;
  status: string;
  external_reference?: string;
  transaction_amount?: number;
};

function getMercadoPagoAccessToken() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "Falta MERCADOPAGO_ACCESS_TOKEN. Agregalo en tus variables de entorno.",
    );
  }

  return accessToken;
}

export function getAppUrl() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

  if (!appUrl) {
    throw new Error(
      "Falta NEXT_PUBLIC_APP_URL para construir las URLs de retorno de Mercado Pago.",
    );
  }

  return appUrl.replace(/\/$/, "");
}

export async function createMercadoPagoPreference(input: {
  title: string;
  amount: number;
  payerEmail?: string | null;
  externalReference: string;
  appUrl?: string;
}) {
  assertProductionSecurity();
  const appUrl = (input.appUrl ?? getAppUrl()).replace(/\/$/, "");
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: 1,
          currency_id: "ARS",
          unit_price: input.amount,
        },
      ],
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      external_reference: input.externalReference,
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: `${appUrl}/checkout/status?status=success`,
        failure: `${appUrl}/checkout/status?status=failure`,
        pending: `${appUrl}/checkout/status?status=pending`,
      },
      auto_return: "approved",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mercado Pago preference error: ${errorText}`);
  }

  return (await response.json()) as MercadoPagoPreferenceResponse;
}

export async function getMercadoPagoPayment(paymentId: string | number) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mercado Pago payment error: ${errorText}`);
  }

  return (await response.json()) as MercadoPagoPaymentResponse;
}

export async function verifyMercadoPagoWebhookSignature(input: {
  request: Request;
  dataId: string;
}) {
  assertProductionSecurity();
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  const xSignature = input.request.headers.get("x-signature");
  const xRequestId = input.request.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    return false;
  }

  const parts = xSignature.split(",");
  const ts = parts
    .find((part) => part.trim().startsWith("ts="))
    ?.split("=")[1]
    ?.trim();
  const hash = parts
    .find((part) => part.trim().startsWith("v1="))
    ?.split("=")[1]
    ?.trim();

  if (!ts || !hash) {
    return false;
  }

  const manifest = `id:${input.dataId};request-id:${xRequestId};ts:${ts};`;
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(manifest),
  );
  const computedHash = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return computedHash === hash;
}

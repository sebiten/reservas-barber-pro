function required(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

export function getRequiredServerEnv() {
  return {
    clerkSecretKey: required("CLERK_SECRET_KEY"),
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    mercadoPagoAccessToken: required("MERCADOPAGO_ACCESS_TOKEN"),
  };
}

export function assertProductionSecurity() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl?.startsWith("https://")) {
    throw new Error(
      "En producción, NEXT_PUBLIC_APP_URL debe existir y usar https://",
    );
  }

  if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    throw new Error(
      "En producción, MERCADOPAGO_WEBHOOK_SECRET es obligatorio.",
    );
  }
}

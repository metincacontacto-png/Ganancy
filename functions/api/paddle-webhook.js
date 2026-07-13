// Cloudflare Pages Function — recibe webhooks de Paddle y sincroniza el estado
// de la suscripción en `profiles`. Corre en el runtime de Workers (no Node),
// por eso la verificación de firma usa Web Crypto nativo en vez de
// @paddle/paddle-node-sdk (evita depender del flag nodejs_compat).
//
// Ruta resultante: POST /api/paddle-webhook
//
// Contrato de Paddle: solo un 2xx dentro de 5s cuenta como "entregado". Cualquier
// otra respuesta (400/401/500, timeout) se reintenta. Nunca devolver 2xx en un
// fallo de verificación — es la única forma de perder el evento para siempre.

import { createClient } from "@supabase/supabase-js";

const TIMESTAMP_TOLERANCE_SECONDS = 300;

export async function onRequestPost(context) {
  const { request, env } = context;

  const signatureHeader = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();

  if (!signatureHeader || !rawBody) {
    return jsonResponse({ error: "Missing signature or body" }, 400);
  }

  try {
    const secret = env.PADDLE_NOTIFICATION_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error("PADDLE_NOTIFICATION_WEBHOOK_SECRET no está configurado");
    }

    const valid = await verifySignature(rawBody, signatureHeader, secret);
    if (!valid) {
      throw new Error("Firma inválida o timestamp fuera de tolerancia");
    }

    const event = JSON.parse(rawBody);
    await processEvent(event, env);

    return jsonResponse({ received: true }, 200);
  } catch (err) {
    // No distinguimos firma inválida de error de handler: ambos casos deben
    // devolver no-2xx para que Paddle reintente. Ver docs/skill de webhooks.
    console.error("Paddle webhook error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
}

async function verifySignature(rawBody, signatureHeader, secret) {
  const parts = Object.fromEntries(
    signatureHeader
      .split(";")
      .map((part) => part.split("=").map((s) => s.trim())),
  );
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsNum) > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signedPayload = `${ts}:${rawBody}`;
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload),
  );
  const computedHex = bufferToHex(signatureBuffer);

  return constantTimeEqual(computedHex, h1);
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function processEvent(event, env) {
  switch (event.event_type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.canceled":
      return upsertSubscription(event.data, env);
    case "transaction.completed":
      // El estado de la suscripción llega por los eventos subscription.*
      // arriba; no hace falta acción propia acá, pero se deja el caso
      // explícito para que quede claro que está contemplado, no olvidado.
      return;
    default:
      return;
  }
}

function priceIdToTier(priceId, env) {
  if (priceId === env.PADDLE_PRICE_ID_PLAN_PERSONAL) return "plan_personal";
  if (priceId === env.PADDLE_PRICE_ID_PLAN_COMPLETO) return "plan_completo";
  if (priceId === env.PADDLE_PRICE_ID_PLAN_FAMILIAR) return "plan_familiar";
  return undefined;
}

async function upsertSubscription(data, env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const priceId = data.items?.[0]?.price?.id ?? null;
  const tier = priceId ? priceIdToTier(priceId, env) : undefined;
  const status = data.status; // active | trialing | past_due | paused | canceled
  const userId = data.custom_data?.user_id ?? null;

  const update = {
    paddle_customer_id: data.customer_id,
    paddle_subscription_id: data.id,
    paddle_price_id: priceId,
    paddle_status: status,
    subscription_scheduled_change: data.scheduled_change?.effective_at ?? null,
    updated_at: new Date().toISOString(),
  };

  if (status === "active" || status === "trialing") {
    if (tier) update.subscription_status = tier;
  } else if (status === "canceled" || status === "paused") {
    update.subscription_status = "expired";
  }
  // past_due: se deja subscription_status intacto — Paddle Retain reintenta
  // el cobro automáticamente, no hay que cortar el acceso todavía.

  let query = supabase.from("profiles").update(update);
  query = userId
    ? query.eq("id", userId)
    : query.eq("paddle_customer_id", data.customer_id);

  const { data: updatedRows, error } = await query.select("id");
  if (error) throw error;

  if (!updatedRows || updatedRows.length === 0) {
    // No se encontró ninguna fila para actualizar (custom_data.user_id
    // ausente/incorrecto y tampoco hay paddle_customer_id previo que matchee).
    // Se devuelve 500 para que Paddle reintente y quede rastro en los logs.
    throw new Error(
      `No matching profile for subscription event: userId=${userId} customerId=${data.customer_id} subscriptionId=${data.id}`,
    );
  }
}

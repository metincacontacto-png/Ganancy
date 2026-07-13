-- Correr una sola vez en el SQL Editor de Supabase (proyecto GANANCY).
-- Agrega las columnas que usa functions/api/paddle-webhook.js para
-- sincronizar el estado de la suscripción de Paddle en `profiles`.

alter table profiles
  add column if not exists paddle_customer_id text unique,
  add column if not exists paddle_subscription_id text unique,
  add column if not exists paddle_price_id text,
  add column if not exists paddle_status text,
  add column if not exists subscription_scheduled_change timestamptz;

-- Hardening: estas columnas solo debe escribirlas la Cloudflare Function
-- (que usa la service role key, la cual no pasa por RLS/grants). Ningún
-- flujo del cliente escribe estas columnas hoy, así que no rompe nada.
-- OJO: `subscription_status` queda deliberadamente afuera de este REVOKE
-- porque la Clave Maestra (bypass administrativo en SubscriptionView.jsx)
-- la sigue escribiendo desde el cliente con la anon key.
revoke update (
  paddle_customer_id,
  paddle_subscription_id,
  paddle_price_id,
  paddle_status,
  subscription_scheduled_change
) on profiles from authenticated, anon;

-- Habilita Realtime en profiles para que SubscriptionView.jsx pueda
-- suscribirse a su propia fila y detectar cuando el webhook confirma el pago.
alter publication supabase_realtime add table profiles;

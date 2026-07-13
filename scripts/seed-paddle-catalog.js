// Crea el catálogo de productos/precios de GANANCY en Paddle (sandbox por defecto).
//
// Uso:
//   PADDLE_API_KEY=pdl_sdbx_apikey_... node scripts/seed-paddle-catalog.js
//
// Para producción, agregar PADDLE_ENV=production (y usar una API key live).
// Sandbox y producción son catálogos completamente separados: los pri_... de uno
// no existen en el otro.

import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY;
if (!apiKey) {
  console.error("Falta PADDLE_API_KEY en el entorno.");
  process.exit(1);
}

const environment =
  process.env.PADDLE_ENV === "production"
    ? Environment.production
    : Environment.sandbox;

const paddle = new Paddle(apiKey, { environment });

async function createPlan({ name, description, amount }) {
  const product = await paddle.products.create({
    name,
    taxCategory: "saas",
    description,
  });

  const price = await paddle.prices.create({
    productId: product.id,
    description: `${name} — mensual USD`,
    unitPrice: { amount, currencyCode: "USD" },
    billingCycle: { interval: "month", frequency: 1 },
  });

  return { productId: product.id, priceId: price.id };
}

async function seed() {
  const planCompleto = await createPlan({
    name: "GANANCY — Plan Único",
    description:
      "Control de ingresos, egresos, deudas, activos y CFO IA para personas y negocios.",
    amount: "1000", // $10.00 USD
  });

  const planFamiliar = await createPlan({
    name: "GANANCY — Plan Familiar",
    description:
      "Todo lo del Plan Único, más hasta 4 perfiles familiares independientes.",
    amount: "1500", // $15.00 USD
  });

  console.log(
    JSON.stringify(
      {
        environment: environment,
        plan_completo: planCompleto,
        plan_familiar: planFamiliar,
      },
      null,
      2,
    ),
  );
  console.log(
    "\nCopiá los priceId de arriba a VITE_PADDLE_PRICE_ID_PLAN_COMPLETO / VITE_PADDLE_PRICE_ID_PLAN_FAMILIAR.",
  );
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

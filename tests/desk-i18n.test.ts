import assert from "node:assert/strict";
import test from "node:test";

import { localizeApiError, translateDesk, translateDeskPhrase } from "../lib/desk-i18n.ts";

test("desk navigation and account language strings follow the saved locale", () => {
  assert.equal(translateDesk("es", "nav.wallet"), "Cartera");
  assert.equal(translateDesk("ja", "account.language"), "言語");
  assert.equal(translateDesk("ru", "activation.acceptError"), "Не удалось сохранить подтверждение условий.");
  assert.match(translateDesk("es", "admin.environmentChanged"), /administración cambió/);
});

test("API errors use the selected language and retain a support reference", () => {
  const message = localizeApiError("es", "English server detail", 403, "req-123");
  assert.match(message, /No tienes permiso/);
  assert.match(message, /req-123/);
  assert.doesNotMatch(message, /English server detail/);
});

test("English API errors retain server detail", () => {
  assert.equal(localizeApiError("en", "Balance too low", 400), "Balance too low");
});

test("workspace phrases and accessible labels use the selected language", () => {
  assert.equal(translateDeskPhrase("es", "Help center"), "Centro de ayuda");
  assert.equal(translateDeskPhrase("ja", "Your market context"), "市場の状況");
  assert.equal(translateDeskPhrase("ru", "  Notifications  "), "  Уведомления  ");
  assert.equal(translateDeskPhrase("it", "ALLOCATION"), "ALLOCAZIONE");
});

test("dynamic phrases are translated without changing their values", () => {
  assert.equal(
    translateDeskPhrase("es", "Loading testnet deposit assets…"),
    "Cargando activos de depósito de testnet…",
  );
});

test("bot onboarding, demo, and notification copy follows the selected language", () => {
  assert.equal(translateDeskPhrase("es", "YOUR BOT FLEET"), "TUS BOTS");
  assert.equal(
    translateDeskPhrase("es", "Set up your first automation"),
    "Configura tu primera automatización",
  );
  assert.equal(translateDeskPhrase("es", "No bots are running yet."), "Todavía no hay bots en ejecución.");
  assert.equal(translateDeskPhrase("it", "Launch your first bot"), "Avvia il tuo primo bot");
  assert.equal(
    translateDeskPhrase("it", "Choose Memecoin or Synthetic Indices when at least $20 is available."),
    "Scegli Memecoin o Synthetic Indices quando hai almeno $20 disponibili.",
  );
  assert.equal(translateDeskPhrase("es", "Review shared virtual demo terms"), "Revisar las condiciones de la demo virtual compartida");
  assert.equal(translateDeskPhrase("es", "This demo uses "), "Esta demo usa ");
  assert.equal(translateDeskPhrase("es", "$2,000.00 shared virtual funds"), "$2,000.00 de fondos virtuales compartidos");
  assert.equal(
    translateDeskPhrase("es", ". They are not real money, cannot be withdrawn, and never touch your wallet."),
    ". No es dinero real, no se puede retirar y nunca afecta a tu cartera.",
  );
  assert.equal(translateDeskPhrase("es", "Start shared virtual demo"), "Iniciar la demo virtual compartida");
  assert.equal(translateDeskPhrase("es", "demo active"), "demo activa");
  assert.equal(
    translateDeskPhrase("ja", "The shared virtual demo runs automatically after activation. Choose its strategy controls below; manual demo orders are never placed and the pool remains separate from your wallet."),
    "共有バーチャルデモは有効化後に自動実行されます。下で戦略を設定してください。手動デモ注文は行われず、プールはウォレットと別管理です。",
  );
  assert.equal(
    translateDeskPhrase("it", "Notifications could not be refreshed. Showing the latest saved notices and trying again automatically."),
    "Impossibile aggiornare le notifiche. Vengono mostrate le ultime salvate e il sistema riproverà automaticamente.",
  );
});

test("dynamic demo and notification translations preserve localized values", () => {
  assert.equal(
    translateDeskPhrase("es", "Virtual funds: {available} available · {locked} locked. Realized demo profit: {realised}.", {
      available: "$30.00",
      locked: "$10.00",
      realised: "$2.00",
    }),
    "Fondos virtuales: $30.00 disponibles · $10.00 bloqueados. Ganancia realizada de la demo: $2.00.",
  );
  assert.equal(
    translateDeskPhrase("es", "{label} notification {state}.", {
      label: translateDeskPhrase("es", "Deposits"),
      state: translateDeskPhrase("es", "enabled"),
    }),
    "Notificación de Depósitos activada.",
  );
  assert.equal(
    translateDeskPhrase("it", "Start the {amount} virtual demo", { amount: "$20.00" }),
    "Avvia la demo virtuale da $20.00",
  );
  assert.equal(translateDeskPhrase("es", "Demo ends in 24 hours"), "La demo termina en 24 horas");
  assert.equal(
    translateDeskPhrase("es", "Received 1.25 USDC. Minimum is $20.00; remaining $18.75. Send the remainder to the same active address using the same asset and network."),
    "Recibido: 1.25 USDC. El mínimo es $20.00; faltan $18.75. Envía el resto a la misma dirección activa con el mismo activo y la misma red.",
  );
  assert.equal(translateDeskPhrase("it", "Demo trading credit available"), "Credito demo per il trading disponibile");
  assert.equal(
    translateDeskPhrase("es", "$20.00 is non-withdrawable trading credit for eligible Memecoin and Synthetic orders. It is not cash or wallet balance."),
    "$20.00 es crédito de trading no retirable para órdenes elegibles de Memecoin y Synthetic. No es efectivo ni saldo de la cartera.",
  );
  assert.equal(
    translateDeskPhrase("it", "RC-123: Your case is queued for manual on-chain and custody review. No wallet credit or transfer has been made."),
    "RC-123: Il caso è in coda per una revisione manuale on-chain e di custodia. Non è stato effettuato alcun accredito o trasferimento.",
  );
});

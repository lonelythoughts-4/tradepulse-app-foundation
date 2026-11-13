import assert from "node:assert/strict";
import test from "node:test";

import { localizeApiError, translateDesk } from "../lib/desk-i18n.ts";

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

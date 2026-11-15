import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(new URL("../components/tradepulse-shell.tsx", import.meta.url), "utf8");
const auth = readFileSync(new URL("../components/auth-entry.tsx", import.meta.url), "utf8");

test("first-run copy names the products and keeps users in control", () => {
  for (const source of [shell, auth]) {
    assert.match(source, /Memecoin/);
    assert.match(source, /Synthetic/);
  }
  assert.match(shell, /Pause, resume, or close automation at any time\./);
});

test("first-run copy does not expose implementation or roadmap notes", () => {
  for (const phrase of [
    "Full desk localization will continue to expand",
    "onboarding-channel gate is disabled",
    "This gate is not ready to enforce",
    "Channel verification is not active",
    "you will not be trapped here",
  ]) {
    assert.doesNotMatch(shell, new RegExp(phrase));
    assert.doesNotMatch(auth, new RegExp(phrase));
  }
});

test("activation panels keep step counts without the TradePulse mark", () => {
  assert.match(shell, /activationProgress\[language\]\(step \+ 1\)/);
  assert.match(shell, /activationProgress\[language\]\(5\)/);
  assert.doesNotMatch(shell, /className="activation-mark"/);
});

test("activation asks for a language only on the first step", () => {
  const start = shell.indexOf("function ActivationJourney");
  const end = shell.indexOf("export type LiveDashboard", start);
  const journey = shell.slice(start, end);
  const finalStep = journey.slice(journey.indexOf("const verified"));

  assert.match(journey, /\{step === 0 && \([\s\S]*<fieldset className="activation-languages"/);
  assert.doesNotMatch(finalStep, /activation-languages/);
});

test("first-run identity is optional and its portraits have no decorative overlays", () => {
  const identityStart = shell.indexOf("function PulseAvatar");
  const pickerStart = shell.indexOf("function AvatarPicker", identityStart);
  const sidebarStart = shell.indexOf("function Sidebar", pickerStart);
  const identityComponents = shell.slice(identityStart, sidebarStart);
  const identityStyles = readFileSync(new URL("../app/identity.css", import.meta.url), "utf8");
  const avatarEffectStart = shell.indexOf("const accountAvatar =");
  const avatarEffectEnd = shell.indexOf("const chooseAvatar =", avatarEffectStart);

  assert.doesNotMatch(identityComponents, /<i\s*\/>/);
  assert.doesNotMatch(identityStyles, /pulse-avatar>i|avatar-\w+>i/);
  assert.doesNotMatch(shell.slice(avatarEffectStart, avatarEffectEnd), /setAvatarPickerOpen\(true\)/);
});

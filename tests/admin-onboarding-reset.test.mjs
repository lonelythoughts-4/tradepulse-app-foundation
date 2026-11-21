import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin onboarding reset accepts an account username without sharing the funding target", async () => {
  const source = await readFile(
    new URL("../components/workspaces/admin-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /const \[onboardingTarget, setOnboardingTarget\] = useState\(""\)/);
  assert.match(source, /aria-label="User to reset onboarding by Telegram ID or username"/);
  assert.match(source, /@username or numeric Telegram ID/);
  assert.match(source, /const validOnboardingTarget =[\s\S]*\^@?\[A-Za-z\]/);
  assert.match(source, /disabled=\{!validOnboardingTarget \|\| pendingAccountActions\.onboarding\}/);
  assert.match(source, /"\/v1\/admin\/onboarding\/reset",\s*\{ target: normalizedOnboardingTarget \}/);
  assert.match(source, /"Onboarding reset\.",\s*true,/);
  assert.match(source, /channel verification, onboarding progress, and Terms acceptance/);
});

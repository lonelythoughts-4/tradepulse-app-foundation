import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("successful auto-user uploads keep the reusable run settings for the next file", async () => {
  const source = await readFile(new URL("../components/workspaces/admin-workspace.tsx", import.meta.url), "utf8");
  const start = source.indexOf("const submitAutouserRun = async");
  const end = source.indexOf("const updateAutouserRun", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const submit = source.slice(start, end);

  assert.match(submit, /setAutouserFile\(null\)/);
  assert.doesNotMatch(submit, /setAutouserMinimum\(""\)|setAutouserMaximum\(""\)|setAutouserConfirmed\(false\)/);
  assert.match(submit, /scheduleReconcile\(\)/);
});

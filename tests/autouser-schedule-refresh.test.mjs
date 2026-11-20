import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("open auto-user schedules refresh state without replacing unsaved time edits", async () => {
  const source = await readFile(new URL("../components/workspaces/admin-workspace.tsx", import.meta.url), "utf8");
  const applyStart = source.indexOf("const applyAutouserSchedule");
  const closeStart = source.indexOf("const closeAutouserSchedule", applyStart);
  const refreshStart = source.indexOf("const refreshAutouserSchedule = async");
  const saveStart = source.indexOf("const saveAutouserScheduleTime", refreshStart);
  assert.notEqual(applyStart, -1);
  assert.notEqual(closeStart, -1);
  assert.notEqual(refreshStart, -1);
  assert.notEqual(saveStart, -1);

  const apply = source.slice(applyStart, closeStart);
  const refresh = source.slice(refreshStart, saveStart);
  const save = source.slice(saveStart, source.indexOf("const confirmAutouserCancel", saveStart));

  assert.match(apply, /autouserScheduleForceServerTimes\.current\.delete\(itemKey\)/);
  assert.match(apply, /item\.editable && !forceServerTime && currentTime !== undefined && currentTime !== previousTime/);
  assert.match(refresh, /schedule\?date=\$\{encodeURIComponent\(date\)\}/);
  assert.match(refresh, /applyAutouserSchedule\(response, true\)/);
  assert.match(refresh, /autouserScheduleRefreshQueued\.current\.add\(date\)/);
  assert.match(refresh, /window\.setInterval/);
  assert.match(refresh, /5_000/);
  assert.match(save, /error\.status === 409/);
  assert.match(save, /autouserScheduleForceServerTimes\.current\.add\(itemKey\)/);
  assert.match(save, /void refreshAutouserSchedule\(date, refreshAfterSave\)/);
});

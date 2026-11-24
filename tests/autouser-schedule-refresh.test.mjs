import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("open auto-user schedules refresh state without replacing unsaved time edits", async () => {
  const source = await readFile(new URL("../components/workspaces/admin-workspace.tsx", import.meta.url), "utf8");
  const openStart = source.indexOf("const openAutouserSchedule = async");
  const applyStart = source.indexOf("const applyAutouserSchedule");
  const closeStart = source.indexOf("const closeAutouserSchedule", applyStart);
  const refreshStart = source.indexOf("const refreshAutouserSchedule = async");
  const saveStart = source.indexOf("const saveAutouserScheduleTime", refreshStart);
  assert.notEqual(openStart, -1);
  assert.notEqual(applyStart, -1);
  assert.notEqual(closeStart, -1);
  assert.notEqual(refreshStart, -1);
  assert.notEqual(saveStart, -1);

  const open = source.slice(openStart, refreshStart);
  const apply = source.slice(applyStart, closeStart);
  const refresh = source.slice(refreshStart, saveStart);
  const save = source.slice(saveStart, source.indexOf("const confirmAutouserCancel", saveStart));

  assert.match(open, /\/v1\/admin\/autousers\/schedule\?date=/);
  assert.doesNotMatch(source, /window\.setInterval/);
  assert.match(apply, /autouserScheduleForceServerTimes\.current\.delete\(itemKey\)/);
  assert.match(apply, /item\.operator_time/);
  assert.doesNotMatch(apply, /previousTimes\.set\(`\$\{item\.source\}:\$\{item\.id\}`, item\.local_time\)/);
  assert.match(apply, /item\.editable && !forceServerTime && currentTime !== undefined && currentTime !== previousTime/);
  assert.match(refresh, /schedule\?date=\$\{encodeURIComponent\(date\)\}/);
  assert.match(refresh, /applyAutouserSchedule\(response, true\)/);
  assert.match(refresh, /autouserScheduleRefreshQueued\.current\.add\(date\)/);
  assert.match(save, /error\.status === 409/);
  assert.match(save, /autouserScheduleForceServerTimes\.current\.add\(itemKey\)/);
  assert.match(save, /void refreshAutouserSchedule\(date, refreshAfterSave\)/);
});

test("auto-user schedule uses Nigeria time while group cards stay U.S. Central", async () => {
  const source = await readFile(new URL("../components/workspaces/admin-workspace.tsx", import.meta.url), "utf8");
  assert.match(source, /const AUTOUSER_DISPLAY_TIMEZONE = "Africa\/Lagos"/);
  assert.match(source, /const AUTOUSER_INPUT_TIMEZONE = "Africa\/Lagos"/);
  assert.match(source, /input_timezone: AUTOUSER_INPUT_TIMEZONE/);
  assert.match(source, /Times use Nigeria time\./);
  assert.doesNotMatch(source, /CARDS · U\.S\. CENTRAL/);
});

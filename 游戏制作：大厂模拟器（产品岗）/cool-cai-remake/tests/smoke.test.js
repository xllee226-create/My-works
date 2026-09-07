"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "levels.js"), "utf8"), sandbox, { filename: "levels.js" });

const levels = sandbox.window.COOL_CAI_LEVELS;
const departments = sandbox.window.COOL_CAI_DEPARTMENTS;
assert.deepEqual(Array.from(levels, level => level.id), [1, 11, 22], "Samples must retain Episode 1, 11 and 22 numbering");
assert.deepEqual(Object.keys(departments), ["orange", "green", "blue", "purple"]);

const level1 = levels[0];
assert.equal(level1.spawn.seedAllDepartments, true);
assert.equal(level1.spawn.min, 22);
assert.equal(level1.spawn.max, 28);
assert.equal(level1.meetings[0].duration, 60);
assert.equal(level1.meetings[0].required, true);
assert.equal(level1.employees[0].name, "Mahavir");

const level11 = levels[1];
assert.equal(level11.id, 11);
assert.ok(level11.employees.some(employee => employee.name === "Winston"));
assert.ok(level11.requiredCopy.some(goal => goal.includes("Atlas")));
assert.ok(level11.requiredCopy.some(goal => goal.includes("Beacon")));
assert.equal(level11.recoverySlots, 2);

const level22 = levels[2];
assert.equal(level22.id, 22);
assert.equal(level22.aiRequired, true);
assert.equal(level22.meetings[0].required, true);
for (const specialist of ["Ashley", "Nadine", "Winston", "Luke"]) {
  assert.ok(level22.employees.some(employee => employee.name === specialist));
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
const htmlIds = new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g), match => match[1]));
const requiredIds = Array.from(game.matchAll(/\$\("#([^"]+)"\)/g), match => match[1]);
for (const id of requiredIds) assert.ok(htmlIds.has(id), `index.html is missing #${id}`);

const assetPaths = new Set([
  "assets/reimagined/steven.png",
  "assets/reimagined/denise.png",
  ...levels.flatMap(level => level.employees.map(employee => employee.portrait))
]);
for (const asset of assetPaths) {
  assert.ok(!asset.includes(".."), `Prototype asset must not escape its own server root: ${asset}`);
  assert.ok(fs.existsSync(path.join(root, asset)), `Missing prototype asset: ${asset}`);
}
assert.ok(!html.includes("assets/legacy/"), "index.html must not load legacy character art");
assert.ok(!game.includes("assets/legacy/"), "game.js must not load legacy character art");
assert.ok(levels.every(level => level.employees.every(employee => employee.portrait.startsWith("assets/reimagined/"))));

assert.match(game, /localStorage\.setItem\(PROFILE_KEY/);
assert.match(game, /state\.meeting \? \.6 : 1/);
assert.match(game, /state\.time \+ preset\.duration > 560/);
assert.match(game, /state\.ai\[task\.dept\].*!task\.review/);
assert.match(game, /assignmentSelections/);
assert.match(game, /meetingSelections/);

console.log("Cool C.A.I. smoke tests passed: levels, assets, UI IDs, profile lock, meeting rules and AI chain.");

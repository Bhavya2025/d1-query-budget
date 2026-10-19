import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { evaluate } from '../src/evaluate.ts';
for (const [scenario, status, exit] of [['unchanged','pass',0],['missing-index','fail',1],['wrong-result','fail',1]] as const) {
  test(`captured remote ${scenario}: shared evaluator and CLI agree`, () => {
    const path = `public/reports/${scenario}.json`;
    const report = JSON.parse(readFileSync(path,'utf8'));
    assert.equal(report.mode, 'remote'); assert.equal(evaluate(report).status, status);
    const command = spawnSync(process.execPath, ['--import','tsx','scripts/check.ts',path], {encoding:'utf8'});
    assert.equal(command.status,exit,command.stderr); assert.equal(JSON.parse(command.stdout).status,status);
  });
}
test('CLI exits 2 on a non-report file or missing argument', () => {
  for (const args of [[],['package.json']]) {
    const result = spawnSync(process.execPath,['--import','tsx','scripts/check.ts',...args],{encoding:'utf8'});
    assert.equal(result.status,2);
  }
});

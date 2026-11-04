const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-demo-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.copyFileSync(path.join(__dirname, '..', 'todo.js'), path.join(dir, 'todo.js'));
  const data = path.join(dir, 'data', 'todos.json');
  const run = (...args) => {
    const result = spawnSync(process.execPath, [path.join(dir, 'todo.js'), ...args], {
      cwd: os.tmpdir(), encoding: 'utf8', timeout: 10000,
    });
    assert.ifError(result.error);
    return result;
  };
  return { run, data, read: () => JSON.parse(fs.readFileSync(data, 'utf8')) };
}

test('REQ-002: 初回は0件と表示し、保存ファイルを作らない', (t) => {
  const { run, data } = setup(t);
  const result = run('list');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /タスクはありません/);
  assert.equal(fs.existsSync(data), false);
});

test('REQ-001,004: 日本語の名前と連番をプロセス間で保存する', (t) => {
  const { run, read } = setup(t);
  assert.equal(run('add', ' 買い物に行く ').status, 0);
  assert.equal(run('add', 'メール確認').status, 0);
  assert.deepEqual(read(), [
    { id: 1, title: '買い物に行く', completed: false },
    { id: 2, title: 'メール確認', completed: false },
  ]);
  assert.match(run('list').stdout, /1\. \[ \] 買い物に行く/);
});

test('REQ-002,003,004: 完了状態の復元と全件表示、再完了の冪等性', (t) => {
  const { run, read, data } = setup(t);
  assert.equal(run('add', '買い物').status, 0);
  assert.equal(run('add', '掃除').status, 0);
  assert.equal(run('done', '1').status, 0);
  assert.equal(read()[0].completed, true);
  assert.equal(read()[1].completed, false);
  const before = fs.readFileSync(data, 'utf8');
  assert.equal(run('done', '1').status, 0);
  const list = run('list');
  assert.equal(list.status, 0);
  assert.equal(list.stdout.trim(), '1. [x] 買い物\n2. [ ] 掃除');
  assert.equal(fs.readFileSync(data, 'utf8'), before);
});

test('REQ-005: 入力エラーを日本語で報告し、データを変更しない', (t) => {
  const { run, data } = setup(t);
  assert.equal(run('add', '残すタスク').status, 0);
  const before = fs.readFileSync(data, 'utf8');
  const cases = [[], ['unknown'], ['add'], ['add', ''], ['add', '   '],
    ['add', 'a', 'b'], ['done'], ['done', '999'], ['done', '0'],
    ['done', '-1'], ['done', '1.5'], ['done', '1abc'], ['done', '1', '2'], ['list', 'extra']];
  for (const args of cases) {
    const result = run(...args);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.match(result.stderr, /エラー/, JSON.stringify(args));
    assert.equal(fs.readFileSync(data, 'utf8'), before);
  }
});

test('不正な保存データをエラーにし、上書きしない', (t) => {
  const { run, data } = setup(t);
  fs.mkdirSync(path.dirname(data));
  for (const invalid of ['broken json', '{}', '[{"id":1}]']) {
    fs.writeFileSync(data, invalid);
    for (const args of [['list'], ['add', '上書きしない']]) {
      const result = run(...args);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /エラー/);
      assert.equal(fs.readFileSync(data, 'utf8'), invalid);
    }
  }
});

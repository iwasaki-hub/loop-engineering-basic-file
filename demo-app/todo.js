const fs = require('node:fs');
const path = require('node:path');

const dataFile = path.join(__dirname, 'data', 'todos.json');
const usage = '使い方: node todo.js add "名前" | list | done ID';

function load() {
  let text;
  try {
    text = fs.readFileSync(dataFile, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new Error('保存データを読み込めません。');
  }
  let todos;
  try {
    todos = JSON.parse(text);
  } catch {
    throw new Error('保存データのJSONが破損しています。');
  }
  const ids = new Set();
  if (!Array.isArray(todos) || !todos.every((todo) => {
    if (!todo || !Number.isSafeInteger(todo.id) || todo.id < 1 || ids.has(todo.id)
      || typeof todo.title !== 'string' || !todo.title.trim()
      || typeof todo.completed !== 'boolean') return false;
    ids.add(todo.id);
    return true;
  })) throw new Error('保存データの形式が不正です。');
  return todos;
}

function save(todos) {
  const temporary = `${dataFile}.${process.pid}.tmp`;
  try {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(temporary, `${JSON.stringify(todos, null, 2)}\n`, 'utf8');
    fs.renameSync(temporary, dataFile);
  } catch {
    throw new Error('保存データを書き込めません。');
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function main(args) {
  const [command, value] = args;
  if (command === 'add') {
    if (args.length !== 2 || !value.trim()) throw new Error(`タスク名を指定してください。${usage}`);
  } else if (command === 'done') {
    if (args.length !== 2 || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new Error(`IDは正の整数で指定してください。${usage}`);
    }
  } else if (command !== 'list' || args.length !== 1) {
    throw new Error(`コマンドまたは引数が不正です。${usage}`);
  }

  const todos = load();
  if (command === 'list') {
    console.log(todos.length ? todos.map((todo) =>
      `${todo.id}. [${todo.completed ? 'x' : ' '}] ${todo.title}`).join('\n') : 'タスクはありません。');
  } else if (command === 'add') {
    const id = todos.reduce((maximum, todo) => Math.max(maximum, todo.id), 0) + 1;
    if (!Number.isSafeInteger(id)) throw new Error('これ以上IDを発行できません。');
    todos.push({ id, title: value.trim(), completed: false });
    save(todos);
    console.log(`追加しました: ${id}. ${value.trim()}`);
  } else {
    const todo = todos.find((item) => item.id === Number(value));
    if (!todo) throw new Error('指定したIDのタスクが見つかりません。');
    if (!todo.completed) {
      todo.completed = true;
      save(todos);
    }
    console.log(`完了しました: ${todo.id}. ${todo.title}`);
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(`エラー: ${error.message}`);
  process.exitCode = 1;
}

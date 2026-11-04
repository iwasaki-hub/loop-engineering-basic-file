# ターミナル版ToDoデモ

Node.js標準機能のみで動作します。依存パッケージのインストールは不要です。
Windows／Node.js v26.13.0で検証しています。

## 操作

リポジトリ直下から次のコマンドを実行します。

```powershell
cd demo-app
node todo.js add "買い物"
node todo.js add "メール確認"
node todo.js list
node todo.js done 1
node todo.js list
```

一覧の例：

```text
1. [x] 買い物
2. [ ] メール確認
```

タスクはこのフォルダの `data/todos.json` に保存され、終了後も残ります。
`data/` はGit管理対象外です。タスク名は引用符で囲んでください。
空の名前・不正なID・不明コマンドは日本語エラーになり、保存済みデータは変更しません。
削除・期限・通知・同時書き込みは対象外です。

## テスト

demo-app内で実行します。

```powershell
node --test
```

テストは一時ディレクトリで実行し、利用者用データには触れません。
目的と合格基準は requirements.md、設計は design.md、検証結果は tasks.md を参照してください。

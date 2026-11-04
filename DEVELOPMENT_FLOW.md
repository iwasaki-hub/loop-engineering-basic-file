# ChatGPTとCodexで進める開発の流れ

ChatGPTで「何を作り、何を合格とするか」を整理し、採用した文書をCodexへ渡して実装します。
開始時に使うプロンプトは [START_PROMPT.md](START_PROMPT.md) にあります。

## 全体のイメージ

```mermaid
flowchart TD
    idea["あなた：作りたいもの・困りごと"]
    interview["ChatGPT：最大3問ずつ質問<br/>目的・機能・制約・合格基準を整理"]
    draft["ChatGPT：基本セットの文書案を作成<br/>未決事項と提案も明記"]
    review{"あなた：内容を確認・採用"}
    handoff["あなた：採用版の文書と引き継ぎメモを渡す<br/>対象フォルダ・タスク・実装指示を指定"]
    inspect["Codex：文書と既存コード・テストを照合"]
    ready{"実装に必要な情報が揃っている？"}
    clarify["相違点・未決事項を確認<br/>要件変更が必要なら採用版を更新"]
    build["Codex：小さなタスクごとに<br/>テスト → 失敗確認 → 実装 → 検証"]
    report["Codex：差分確認・文書更新・結果報告<br/>未検証の条件を明記"]
    use["あなた：実際に使って確認"]
    next{"次に何をする？"}
    finish["今回の作業を終了"]

    idea --> interview --> draft --> review
    review -->|修正する| interview
    review -->|採用する| handoff
    handoff --> inspect --> ready
    ready -->|不足・矛盾あり| clarify --> interview
    ready -->|揃っている| build --> report --> use --> next
    next -->|要件を改善する・機能を追加する| interview
    next -->|採用済みの次タスクを進める| inspect
    next -->|ここまで| finish

    classDef human fill:#fff4d6,stroke:#a66c00,color:#332200;
    classDef planning fill:#e7f6ef,stroke:#23734d,color:#153d2b;
    classDef implementation fill:#eaf1ff,stroke:#3a63aa,color:#1c345b;
    class idea,review,handoff,use,next human;
    class interview,draft planning;
    class inspect,ready,clarify,build,report implementation;
```

黄色はあなたの判断・操作、緑はChatGPTでの整理、青はCodexでの確認・実装です。
会話履歴の自動共有を前提にせず、文書を引き継ぎの基準にします。

## Codexで回すテスト駆動のループ

```mermaid
flowchart TD
    task["対象タスク・受け入れ条件を確認"]
    test["必要なテストを先に作成・実行"]
    red{"意図した失敗を確認できた？"}
    examine["既存動作・テスト・環境を調査<br/>期待値は勝手に変更しない"]
    code["最小限のコードを実装"]
    run["検証コマンドを実行<br/>Node.js標準ランナーなら node --test"]
    green{"テスト成功？"}
    limit{"同じ問題を3回修正しても未解決？"}
    fix["原因分析 → 修正<br/>回数と結果を記録"]
    stop["依存する作業を停止<br/>原因・試した修正・再開条件を報告"]
    conditions["手動確認など残りの受け入れ条件を確認<br/>差分・未追跡ファイルも確認"]
    complete{"今回の完了条件を満たした？"}
    record["tasks.mdへ結果・残課題・次の作業を記録"]
    pending["未完了・未検証を明記<br/>必要な確認や対応を整理"]

    task --> test --> red
    red -->|いいえ| examine
    examine -->|調査結果に応じて再確認| test
    red -->|はい| code --> run --> green
    green -->|失敗| limit
    limit -->|いいえ| fix --> run
    limit -->|はい| stop
    green -->|成功| conditions --> complete
    complete -->|はい| record
    complete -->|いいえ| pending --> record
```

修正回数は最初の失敗後に数え、同じ問題への修正・再実行は最大3回です。
準備段階での環境不備も放置せず、同じ問題を3回修正しても解消しなければ停止・報告します。
文書だけの変更では、テストを形式的に作らず、内容・リンク・差分などを確認します。

## 基本セットの役割

| 文書・ディレクトリ | ChatGPTで準備するもの | Codexで確認・実施すること |
| --- | --- | --- |
| requirements.md | 目的、対象範囲、要件ID、受け入れ条件 | 要件を基準に実装・検証。実装中は勝手に変更しない |
| design.md | アーキテクチャ、データ構造、設計案と理由 | 既存コードと照合し、実装に応じて設計を更新 |
| tasks.md | 要件に対応する小さなタスクと未決事項 | 進捗、実際の検証結果、残課題、次の作業を記録 |
| AGENTS.md | 共通ルールを維持し、プロジェクト固有の案を整理 | 作業ルールに従い、実際の検証コマンドを確認・設定 |
| tests/ | tests/README.mdにテスト計画を整理 | 自動テストを実装・実行し、要件との対応を管理 |

## 引き継ぐもの

- 採用する文書の版と、対象アプリ・作業ディレクトリ。
- 採用済みの決定事項、未採用の提案、未決事項とその影響。
- 最初に実装するタスクID・範囲と、実装開始の指示。
- 既存アプリなら最新のコードと文書。ChatGPTへは必要な資料を添付し、Codexには作業リポジトリを指定。

実装を終えたら、更新した設計と進捗を次のChatGPTでの整理へ戻します。
コミット・push・デプロイは、必要なときに別途指示します。

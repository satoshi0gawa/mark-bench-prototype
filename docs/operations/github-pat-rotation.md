# microCMS Webhook用GitHub PAT運用手順

2026年10月25日時点の、MARK BENCHにおけるFine-grained Personal Access Token（PAT）の確認・交換手順です。

このPATは、microCMSの更新を契機にGitHub Actionsへ`repository_dispatch`を送信するためだけに使用します。トークン値そのものは、このリポジトリ、GitHub Actions Secrets、チャット、スクリーンショットへ記録しません。

## 対象設定

- GitHubアカウント：`satoshi0gawa`
- 対象リポジトリ：`satoshi0gawa/mark-bench-prototype`
- 現行トークン名：`microcms-mark-bench-webhook`
- microCMS API：`BUILD LOGS`（`build-logs`）
- Webhook識別名：`GitHub Pages deploy`
- トリガーイベント名：`microcms_build_logs_update`
- GitHub Actions：`Build and deploy GitHub Pages`

### PATの必要権限

- Resource owner：`satoshi0gawa`
- Repository access：`Only select repositories`
- 選択リポジトリ：`mark-bench-prototype`のみ
- Repository permissions：
  - `Contents: Read and write`
  - `Metadata: Read-only`（GitHubが必須で付与）
- Account permissions：追加しない

`Contents: Read and write`は、GitHubの`repository_dispatch` APIを呼び出すために必要です。権限範囲を抑えるため、対象リポジトリは必ず1件だけに限定します。

## 有効期限の確認

1. GitHubの[Fine-grained personal access tokens](https://github.com/settings/personal-access-tokens)を開く。
2. `microcms-mark-bench-webhook`を選択する。
3. 次の項目を確認する。
   - `Expires`：有効期限
   - `Last used`：最終使用日時
   - Repository access：`mark-bench-prototype`のみ
   - Permissions：`Contents: Read and write`
4. 有効期限の14日前と7日前を、カレンダーなどへ登録する。

現在のPATを2026年10月25日に`90 days`で発行している場合、期限の目安は2027年1月23日です。正確な期限はGitHubに表示される`Expires`を正とします。

期限到達後のPATは復元できません。GitHub上で既存のトークン値を再表示することもできないため、新しいPATを発行して交換します。

## 通常の交換手順

### 1. 旧PATの状態を確認する

- 旧PATがまだ有効期限内であることを確認する。
- 交換が完了するまで、旧PATを削除しない。
- GitHub Actionsに進行中のデプロイがないことを確認する。

### 2. 新しいPATを発行する

1. GitHubの[New fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)を開く。
2. 次の内容を設定する。
   - Token name：`microcms-mark-bench-webhook-YYYY-MM`
   - Expiration：原則`90 days`
   - Description：`Trigger GitHub Pages build from microCMS`
   - Resource owner：`satoshi0gawa`
   - Repository access：`Only select repositories`
   - Repository：`mark-bench-prototype`
   - `Contents`：`Read and write`
   - Account permissions：追加しない
3. `Generate token`を押す。
4. 表示された新しいトークンを、その場で安全な保管先へコピーする。

### 3. microCMSのPATを差し替える

1. microCMSで`BUILD LOGS`を開く。
2. `API設定 > Webhook`を開く。
3. `GitHub Pages deploy`の右端にある矢印を開き、設定を編集する。
4. `GitHubトークン`だけを新しいPATへ差し替える。
5. 次の値が変わっていないことを確認する。
   - リポジトリのユーザー名：`satoshi0gawa`
   - リポジトリ名：`mark-bench-prototype`
   - トリガーイベント名：`microcms_build_logs_update`
   - 通知タイミング：公開・更新、公開終了、公開中コンテンツの削除
6. 設定を保存する。

### 4. Webhookを動作確認する

公開サイトの表示を実質的に変えずに検証するため、予定記事の表示順を一時的に変更します。

1. 予定記事「clamp()で流動的な値を設計する」を開く。
2. `plannedOrder`を`2`から`3`へ変更して公開する。
3. GitHub Actionsの[Build and deploy GitHub Pages](https://github.com/satoshi0gawa/mark-bench-prototype/actions/workflows/pages.yml)を開く。
4. 最新実行が次の状態になることを確認する。
   - Event：`repository_dispatch`
   - `build`：成功
   - `deploy`：成功
   - Conclusion：`Success`
5. [公開BUILD LOGS](https://satoshi0gawa.github.io/mark-bench-prototype/build-logs/)が表示できることを確認する。
6. microCMSへ戻り、`plannedOrder`を`3`から`2`へ戻して公開する。
7. 復元操作による2回目のGitHub Actionsも`Success`になることを確認する。

### 5. 旧PATを削除する

新PATによる2回の自動デプロイが成功した後に実施します。

1. GitHubの[Fine-grained personal access tokens](https://github.com/settings/personal-access-tokens)を開く。
2. 旧PATの名前と有効期限を確認する。
3. 旧PATの`Delete`を実行する。
4. 新PATだけが残っていることを確認する。

削除したPATは復元できません。新PATの動作確認前には削除しないでください。

## 期限切れ後に気付いた場合

PATが期限切れになっても、すでに公開済みのGitHub Pagesはそのまま表示されます。ただし、microCMS更新時の自動デプロイは実行されません。

1. 新しいPATを発行する。
2. microCMSの`GitHub Pages deploy`へ新PATを登録する。
3. GitHub Actionsの`Build and deploy GitHub Pages`を開く。
4. `Run workflow`から手動実行する。
5. 実行結果が`Success`であることを確認する。
6. 以降のWebhook自動実行を、通常の交換手順と同じ方法で確認する。

microCMSのWebhookは失敗時に自動再送されません。期限切れ中に行った更新内容は、PAT交換後の手動実行でmicroCMSから再取得して公開します。

## 漏えいが疑われる場合

1. GitHub上で該当PATを直ちに削除する。
2. 新しいPATを、通常の交換手順と同じ最小権限で発行する。
3. microCMSのWebhookへ新PATを登録する。
4. GitHub Actionsを手動実行し、最新のmicroCMS内容を公開する。
5. GitHubのSecurity logとActions実行履歴に不審な操作がないか確認する。

## 交換完了チェックリスト

- [ ] 新PATは`mark-bench-prototype`だけへアクセスできる
- [ ] `Contents: Read and write`以外の追加権限を付けていない
- [ ] microCMSへ新PATを登録した
- [ ] `repository_dispatch`による自動実行が成功した
- [ ] テスト用`plannedOrder`を`2`へ戻した
- [ ] 復元後の自動実行も成功した
- [ ] 公開BUILD LOGSを確認した
- [ ] 旧PATを削除した
- [ ] 次回期限の14日前と7日前を記録した

## 公式資料

- [GitHub：Managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub：Token expiration and revocation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation)
- [GitHub：Create a repository dispatch event](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event)
- [microCMS：コンテンツのWebhookを設定](https://document.microcms.io/manual/webhook-setting)
- [microCMS：GitHub Actionsの設定方法](https://help.microcms.io/ja/knowledge/webhook-github-actions-settings)

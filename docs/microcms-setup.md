# microCMS / GitHub Pages setup

MARK BENCHのBUILD LOGSをmicroCMSから取得し、GitHub Actionsで静的HTMLへ変換するための設定です。

## 1. microCMS API

リスト形式APIを作成します。

- API名：`BUILD LOGS`
- エンドポイント：`build-logs`

### APIフィールド

| フィールドID | 種類 | 必須 | 設定・用途 |
| --- | --- | --- | --- |
| `displayStatus` | セレクト | Yes | 単一選択：`published`、`planned` |
| `logNumber` | テキスト | Yes | 公開記事は`BUILD_LOG_000`、予定記事は`BUILD_NOTE_XXX` |
| `title` | テキスト | Yes | 一覧・詳細のタイトル |
| `slug` | テキスト | Yes | 小文字英数字とハイフンのみ |
| `summary` | テキストエリア | No | 公開記事では必須。リードとmeta descriptionに使用 |
| `category` | セレクト | Yes | 単一選択：`TEXT TOOLS`、`CODE TOOLS`、`CSS TOOLS`、`SITE` |
| `displayDate` | 日時 | No | 表示日を上書き。未指定時はmicroCMS標準の`publishedAt` |
| `readingTime` | 数値 | No | 公開記事では1以上の整数が必須 |
| `relatedToolId` | セレクト | No | 公開記事では必須。`tools/`のファイル名から`.html`を除いた値 |
| `ctaLabel` | テキスト | No | 公開記事では必須 |
| `ctaDescription` | テキストエリア | No | 公開記事では必須 |
| `ogImage` | 画像 | No | OGP画像 |
| `plannedOrder` | 数値 | No | 予定記事同士の並び順 |
| `sections` | 繰り返し | No | 公開記事では1件以上必須 |

`relatedToolId`の選択肢は、`scripts/config/tools.mjs`のキーと一致させます。

### カスタムフィールド

`buildLogSection`というカスタムフィールドを作成し、次のフィールドを設定します。

| フィールドID | 種類 | 必須 |
| --- | --- | --- |
| `sectionNumber` | テキスト | Yes |
| `sectionLabel` | テキスト | Yes |
| `heading` | テキスト | Yes |
| `body` | リッチエディタ | Yes |
| `calloutLabel` | テキスト | No |
| `calloutBody` | リッチエディタ | No |

`sections`の繰り返しフィールドでは`buildLogSection`だけを選択します。`body`ではH1・H2を使用せず、セクション見出しは`heading`へ入力します。コードブロック、リスト、表、画像は使用できます。

予定記事はmicroCMS上では公開し、`displayStatus`を`planned`にします。これにより、下書き取得権限を付けずに予定行を公開サイトへ表示できます。`planned`のコンテンツから詳細ページは生成されません。

## 2. microCMS APIキー

ビルド専用キーを作成します。

- デフォルト権限：権限なし
- 個別権限：`build-logs`のGETのみ
- 下書き全取得：OFF
- 公開終了コンテンツ取得：OFF
- POST / PUT / PATCH / DELETE：OFF

APIキーはGitHubのRepository Secret `MICROCMS_API_KEY`へ登録します。HTML、JavaScript、リポジトリ、Webhook設定へは記載しません。

## 3. GitHub Actions Variables / Secrets

GitHubリポジトリの`Settings > Secrets and variables > Actions`で設定します。

### Variables

- `MICROCMS_SERVICE_DOMAIN`：`example.microcms.io`またはサービスID`example`

### Secrets

- `MICROCMS_API_KEY`：GET専用APIキー

## 4. GitHub Pages

GitHubリポジトリの`Settings > Pages > Build and deployment`でSourceを`GitHub Actions`にします。

`.github/workflows/pages.yml`は次のイベントで実行されます。

- `main`へのpush
- `microcms_build_logs_update`の`repository_dispatch`
- Actions画面からの`workflow_dispatch`

## 5. microCMS Webhook

`BUILD LOGS > API設定 > Webhook`から`GitHub Actions`を追加します。

- リポジトリユーザー名：対象GitHubアカウント
- リポジトリ名：`mark-bench-prototype`
- トリガーイベント名：`microcms_build_logs_update`
- 通知タイミング：公開、公開中の更新、削除、非公開化に相当する項目

GitHubトークンには、対象リポジトリだけを選択した期限付きFine-grained PATを使用します。Repository permissionsは`Contents: Read and write`だけを付与します。このトークンはmicroCMS側へ登録し、GitHub Actions Secretsへは保存しません。

microCMS Webhookには失敗時の再送がないため、通知に失敗した場合はGitHub Actionsの`Build and deploy GitHub Pages`を手動実行します。

## 6. ローカル確認

fixtureで生成します。

```bash
npm run build
npm run check:dist
npm run preview
```

microCMSから取得する場合は、環境変数を設定して実行します。

```bash
MICROCMS_SERVICE_DOMAIN=example.microcms.io \
MICROCMS_API_KEY=your-read-only-key \
npm run build:cms
```

本番モードではAPI取得失敗時にfixtureへフォールバックしません。スキーマ不整合、重複slug、未知のツールID、APIエラーがある場合はデプロイ前にビルドを停止します。

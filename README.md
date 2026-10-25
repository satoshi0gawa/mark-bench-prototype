# MARK BENCH

Web制作で使用する小さなツールと、その設計・実装・検証過程を記録する静的サイトです。HTML、CSS、Vanilla JavaScriptで構成しています。

## 現在の構成

```text
mark-bench-prototype/
├── index.html
├── about.html
├── tools/
│   ├── index.html
│   └── 各ツール詳細ページ
├── build-logs/
│   ├── index.html
│   └── 各BUILD LOG詳細ページ
├── css/
│   ├── foundation.css
│   ├── components.css
│   └── pages.css
├── js/
│   ├── main.js
│   ├── tools.js
│   ├── tool.js
│   └── 各ツール固有スクリプト
├── scripts/
│   ├── dev-server.mjs
│   ├── build.mjs
│   └── 検証スクリプト
├── PROJECT-HANDOFF.md
└── package.json
```

`dist/`は`npm run build`で生成する公開用成果物です。正本ではないためGit管理対象外です。

## 実装済みツール

1. Text Case Converter
2. Directory Tree Generator
3. Markdown Preview Editor
4. BEM Class Builder
5. Fluid Scale Generator
6. HTML Table Builder
7. Color Format Converter
8. PX / REM Converter
9. Width Converter
10. Text Formatter
11. Character Counter
12. Unicode Inspector
13. Slug Generator
14. HTML Escape Converter
15. Numeric Character Reference Converter
16. JSON Formatter

## ローカル起動

Node.js 22.12以上を使用します。初回のみ依存関係をインストールしてください。

```bash
npm install
```

```bash
npm run dev
```

fixtureから`dist/`を生成し、`http://localhost:4173`で確認できます。

## 検証

全ページの基本構造とローカル参照を検証します。

```bash
npm run check
npm run test:build-logs
npm run build
npm run check:dist
```

ツール固有の検証は`package.json`の`check:*`スクリプトを使用します。すべて実行する場合は次のとおりです。

```bash
npm run check:counter
npm run check:slug
npm run check:json
npm run check:html
npm run check:px
npm run check:formatter
npm run check:unicode
npm run check:tree
npm run check:markdown
npm run check:table
npm run check:bem
npm run check:color
npm run check:numeric
npm run check:fluid
npm run check:width
npm run check:detail
```

## 静的ビルド

```bash
npm run build
```

ルートHTML、`css/`、`js/`、`tools/`を`dist/`へ複製し、BUILD LOGS一覧・詳細とHOMEの件数をfixtureから静的生成します。

microCMSから生成する場合は、`MICROCMS_SERVICE_DOMAIN`と`MICROCMS_API_KEY`を環境変数へ設定します。

```bash
npm run build:cms
```

## 編集責務

- サイト共通トークン・基礎スタイル：`css/foundation.css`
- ヘッダー、ナビゲーション、ボタンなど：`css/components.css`
- 各ページ・各ツール固有レイアウト：`css/pages.css`
- 共通アニメーション・ナビゲーション：`js/main.js`
- TOOLS一覧のフィルター：`js/tools.js`
- TOOLS詳細の共通操作：`js/tool.js`
- 各ツールの処理：対応する`js/*.js`
- BUILD LOGテンプレート：`scripts/templates/build-log-pages.mjs`
- BUILD LOG取得・検証：`scripts/lib/build-log-content.mjs`
- ローカルfixture：`content/build-logs.fixture.mjs`
- 既存BUILD LOG HTML：`build-logs/`（移行確認用。公開成果物はビルド時に再生成）

## サイト共通仕様

- サイト名：MARK BENCH
- 英数字・UIフォント：Space Mono
- 日本語フォント：BIZ UDPGothic
- PC：メイン約70%、左右サイトレール各約15%
- Tablet以下：ヘッダーと主要ナビゲーションをメイン上部へ配置
- HOME：TOOLS、BUILD LOGS、ABOUTへ分岐するツリー構造
- 一覧名は`BUILD LOGS`、個別記事は`BUILD LOG`
- コピーライトはHOMEだけに表示
- 入力内容とツール処理はブラウザ内で完結
- `prefers-reduced-motion`に対応

## BUILD LOGSの公開構成

BUILD LOGSの投稿はmicroCMSで管理し、GitHub Actionsで静的HTMLを生成してGitHub Pagesへデプロイします。

```text
microCMS
  -> Webhook
GitHub Actions
  -> Content APIから投稿を取得
BUILD LOGS一覧・詳細を静的生成
  -> GitHub Pagesへデプロイ
```

ブラウザ側へmicroCMSのAPIキーを置かず、GitHub Actions Secretsで管理します。スキーマと外部サービスの設定手順は`docs/microcms-setup.md`を参照してください。

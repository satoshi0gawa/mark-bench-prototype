# MARK BENCH 引き継ぎ

## 新しいチャットへの依頼文

以下を新しいチャットの最初のメッセージとして使用してください。

> `mark-bench-prototype/`を対象に作業してください。最初に`README.md`と`PROJECT-HANDOFF.md`を最後まで読み、現行HTML、CSS、JavaScript、`package.json`、`scripts/build.mjs`を確認してください。既存のデザイン、レスポンシブ構造、命名、ツール機能を維持したまま、BUILD LOGSの投稿管理をmicroCMSへ移行し、GitHub Actionsで静的HTMLを生成してGitHub Pagesへ公開できる構成を実装したいです。まず現状を監査し、microCMSのAPIスキーマ、静的生成処理、Secrets、Webhook、GitHub Pagesデプロイの実装計画を提示してください。計画の合意前に既存ページを大規模変更しないでください。

## プロジェクト概要

- サイト名：MARK BENCH
- 構成：HTML、CSS、Vanilla JavaScript
- 目的：Web制作用ツールと、その設計・実装・検証を記録するBUILD LOG
- 公開予定：GitHub Pages
- 投稿管理予定：microCMS
- Node.js：22.12以上（CMS HTML無害化ライブラリの安全な最新版に合わせる）
- 外部npmパッケージ：`sanitize-html`（microCMSリッチエディタHTMLの無害化）

## 正本と生成物

- 正本：ルートHTML、`tools/`、`css/`、`js/`、BUILD LOG生成テンプレート
- BUILD LOGコンテンツ正本：本番はmicroCMS、ローカル検証は`content/build-logs.fixture.mjs`
- 開発・検証：`scripts/`
- 生成物：`dist/`（`npm run build`で再生成、Git管理対象外）
- 過去の参考実装やUI検証用ファイルはクリーンアップ済み

## 現行ページ

- HOME：`index.html`
- ABOUT：`about.html`
- TOOLS一覧：`tools/index.html`
- TOOLS詳細：`tools/*.html`
- 既存BUILD LOGS一覧：`build-logs/index.html`（移行確認用）
- 既存BUILD LOG詳細（移行確認用）：
  - `build-logs/case-style-guide.html`
  - `build-logs/px-rem-converter.html`

## 実装済みツールと表示順

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

各ツールの処理は対応する`js/*.js`、共通操作は`js/tool.js`、一覧フィルターは`js/tools.js`が担当します。

## デザイン・UI仕様

- 英数字・UI：Space Mono
- 日本語：BIZ UDPGothic
- ネイビーを主色、黄色をアクセントに使用
- PCはメイン約70%、左右サイトレール各約15%
- Tablet以下はヘッダーと主要ナビゲーションを上部配置
- 左レール：ツリー型パンくず
- 右レール：TOOLS、BUILD LOGS、ABOUT
- HOME：ツリー型サイトマップを上下中央配置
- TOOLS／BUILD LOGS一覧：項目を段階的にフェードアップ
- BUILD LOG詳細：ページヘッダー、目次、本文を段階的にフェードアップ
- `prefers-reduced-motion`対応を維持
- コピー・ダウンロード・リセットの状態通知は共通パターンを使用

## 命名

- 一覧：BUILD LOGS
- 個別記事：BUILD LOG
- 予定記事ID：`BUILD_NOTE_XXX`
- 実装済み記事IDは既存HTMLの値を維持

## BUILD LOG詳細の構造

```text
ページヘッダー
  -> aside.article-toc
  -> 本文（見出し階層、本文、コード、コールアウト）
  -> CTA（tool／link。noneの場合は非表示）
```

- CTA通常時：ネイビー背景・黄色テキスト
- CTAホバー時：黄色背景・ネイビーテキスト、矢印スライド
- 記事本文、コード、コールアウトはメイン幅を使用
- 詳細下部の関連投稿セクションは設けない

## microCMS移行方針

ブラウザからContent APIを直接呼び出さず、ビルド時に投稿を取得して静的HTMLを生成します。

```text
microCMSで公開・更新・削除
  -> GitHub Actions Webhook
  -> Node.jsビルドがContent APIを実行
  -> BUILD LOGS一覧とBUILD LOG詳細を生成
  -> GitHub Pagesへデプロイ
```

実装済みのmicroCMSフィールド：

- `displayStatus`：`published`または`planned`
- `logNumber`：記事番号
- `title`：タイトル
- `slug`：URL
- `summary`：リード文
- `category`：カテゴリー
- `displayDate`：移行記事の日付上書き
- `ctaType`：`tool`、`link`、`none`。既存投稿は関連ツールIDから補完
- `relatedToolId`：`tool`で使用する関連ツール識別子
- `sections`：構造化された本文セクション
- `ctaLabel`：`tool`または`link`のCTA文言
- `ctaDescription`：`tool`または`link`のCTA説明
- `ctaUrl`：`link`で使用するHTTPS URL
- `readingTime`：所要時間
- `plannedOrder`：予定記事の表示順
- `ogImage`：OGP画像
- microCMS標準の公開日・更新日

APIキーはGitHub Actions Secretsで管理し、ブラウザ向けHTMLやJavaScriptへ出力しません。Webhook失敗に備え、`workflow_dispatch`による手動デプロイも用意します。

公開記事のCTA規則：

- `TEXT TOOLS`、`CODE TOOLS`、`CSS TOOLS`は`tool`必須
- `SITE`は`tool`、`link`、`none`から選択可能
- `none`では最終セクションにCTAを生成しない
- `link`のURLはHTTPSだけを許可

実装済みファイル：

- `scripts/lib/build-log-content.mjs`：fixture／Content API取得、検証、無害化
- `scripts/templates/build-log-pages.mjs`：一覧・詳細HTML生成
- `content/build-logs.fixture.mjs`：既存2記事と予定2件
- `.github/workflows/pages.yml`：microCMS取得とGitHub Pagesデプロイ
- `.github/workflows/check.yml`：Pull Request用fixture検証
- `docs/microcms-setup.md`：microCMS、Secrets、Webhook、Pages設定

外部設定は未実施です。GitHubリポジトリ作成後、`docs/microcms-setup.md`に従ってユーザーがmicroCMSとGitHubの管理画面を設定します。

## 推奨実装順

1. 既存2記事からBUILD LOG共通テンプレートを抽出
2. microCMSのAPIスキーマを確定
3. ローカルfixtureで一覧・詳細の静的生成を実装
4. Content API接続を追加
5. GitHub Actions Secretsとビルド処理を追加
6. GitHub Pagesデプロイを追加
7. microCMS Webhookと手動実行を追加
8. 削除・非公開・API障害時の挙動を検証
9. 下書きプレビューは公開フロー安定後に追加

## 必須検証

```bash
npm run check
npm run check:detail
npm run test:build-logs
npm run build
npm run check:dist
```

ツールを変更した場合は、対応する`npm run check:*`も実行してください。

確認事項：

- ローカルリンク切れがない
- 1ページにつき`main`と`h1`が1つ
- PC／Tablet／SPのレイアウトが維持される
- JavaScript無効時でも生成済みBUILD LOG本文を読める
- GitHub Pagesのリポジトリ配下URLでも相対リンクが解決する
- microCMSのAPIキーが生成物へ含まれない
- 日付降順と予定記事表記の既存仕様が維持される

## 注意点

- CSS正本は`foundation.css`、`components.css`、`pages.css`の3ファイル
- 動的に付与されるクラスや`data-*`属性があるため、CSSセレクターを参照文字列だけで一括削除しない
- 現行ツールはブラウザ内で処理し、入力内容を外部送信しない
- microCMS移行対象はまずBUILD LOGSに限定し、TOOLSのデータ化は別判断とする
- GitHub Pages用のベースパスを考慮し、ルート絶対パスへの置換を避ける

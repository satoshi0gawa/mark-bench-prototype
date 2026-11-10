# MARK BENCH 引き継ぎ

この文書は、新しいチャットや作業環境で再開する際の入口です。詳細仕様は重複して管理せず、[サイト仕様・開発運用](docs/SITE-SPEC.md)を正本とします。

## 最初に確認するもの

1. `README.md`
2. `docs/SITE-SPEC.md`
3. `git status --short`
4. 変更対象のHTML、CSS、JavaScript、ビルドスクリプト

microCMS関連の作業では、あわせて`microcms/README.md`を確認してください。導入時の判断経緯は`MICROCMS-INTEGRATION-MEMO.md`、旧Git履歴とGitHub Pages移行時の監査結果は`docs/github-pages-migration-audit.md`に残しています。

## 現在の状態

- 公開先：<https://satoshi0gawa.github.io/mark-bench-prototype/>
- 構成：HTML / CSS / Vanilla JavaScript / Node.js
- 公開処理：GitHub ActionsからGitHub Pagesへデプロイ
- `NOTE to SELF`：microCMSを正本としてビルド時に静的HTMLを生成
- `CODING NOTE`：個別の静的HTMLとして管理
- microCMS Webhook：`repository_dispatch`の`microcms_blog_update`で自動再ビルド
- `dist/`：ビルド生成物であり、直接編集しない
- WEB PARTSのFEEDBACK・MOTIONは各6パターンを実装済み。NAVIGATIONの準備中カード・CATEGORY項目は除去した。分類と模擬動作の範囲は`docs/SITE-SPEC.md`、最新件数は`web-parts/index.html`を参照する
- 上記2ページは1440px・1024px・390pxでデモの収まりと横溢れ、全デモ操作、KEYWORDS、全コードのCOPY、キーボード操作とコンソールエラーを確認済み。掲載コードだけの独立ページでも動作確認し、動きを抑える分岐は検証用に`matchMedia`の戻り値を再現して確認した。iPhone実機での確認は別途行う

- WEB PARTSのBREADCRUMBはCSSのみの8パターン。参照元の5種に、SPで親階層へ戻る・中間階層を省略／展開・長い現在地名を独立行に表示する実務向け3種を追加。分類と参照元は`docs/SITE-SPEC.md`、最新件数は`web-parts/index.html`を参照する
- WEB PARTSのPAGINATIONはVanilla JavaScriptで操作できる6パターン。設計・調査元・サンプル動作の範囲は`docs/web-parts-pagination.md`、最新件数は`web-parts/index.html`を参照する
- WEB PARTS一覧は実務上の汎用性・有用性を基準に並べ替え済み。CATEGORYとカードは同順とし、追加時の配置基準は`docs/SITE-SPEC.md`のWEB PARTS節を参照する
- HOMEのWEB PARTSカテゴリ件数は一覧カードからビルド時と開発サーバー配信時に自動生成する。HOMEの数値は手動更新不要。仕様は`docs/SITE-SPEC.md`、回帰検証は`npm run check:parts-count`（`check`にも含む）を参照する
- TEXT-EFFECTの一度だけ再生する6種は各デモの初回画面内表示で開始し、クリック・REPLAYでも再生可能。掲載コードにも同じ処理を含める。仕様は`docs/SITE-SPEC.md`、回帰検証は`npm run check:text-effect`（`check`にも含む）を参照する

## 編集時の原則

- サイト共通トークンと基礎スタイルは`css/foundation.css`
- 共通コンポーネントは`css/components.css`
- ページ固有レイアウトは`css/pages.css`
- 共通ナビゲーションとアニメーションは`js/main.js`
- TOOLS一覧は`js/tools.js`、詳細共通処理は`js/tool.js`
- GitHub Pagesのリポジトリ配下URLを考慮し、ルート絶対パスへの一括置換を避ける
- 動的クラスや`data-*`属性を参照しているため、検索結果だけを根拠にCSSやJavaScriptを一括削除しない
- microCMS管理対象を`NOTE to SELF`以外へ広げる場合は、既存方針とは別の変更として合意する

### 「共通ルール」を受け取ったときの記録

- 依頼に「共通ルール」「今後のルール」「サイト内共通」など、継続適用を示す文言がある場合は、当該作業だけの指示として処理せず、プロジェクト内へ恒久的に残す必要があるかを作業中に必ず判断する
- 恒久化する場合は、対象領域の正本へルールを追加する。サイト仕様は`docs/SITE-SPEC.md`、microCMSの記事執筆・公開運用は`microcms/README.md`、再開時の作業手順は本書を使用する
- 執筆内容に関するルールは、可能な限り作成時の入力ルールと公開前の検証項目の両方へ反映する
- 既存ルールと重複または矛盾する場合は、黙って追記せず、正本を確認して統合方針を決める
- 恒久化しない場合は、その理由と適用範囲を作業報告で明示する。会話履歴だけを継続ルールの保存先にしない
- 記事作成・改訂に着手する前に、`microcms/README.md`を含む対象領域の最新ルールを確認する

## 作業完了前の確認

```bash
npm ci
npm run check
npm run check:detail
npm run build
```

HTMLの追加、`title`やdescriptionの変更、公開URL情報の変更を含む場合は、検証前に次を実行します。

```bash
npm run sync:head
npm run check:seo
```

ツール処理を変更した場合は、`package.json`に定義された対応する`check:*`も実行します。microCMS生成を確認する場合は、`microcms/README.md`の環境変数と検証手順に従います。

## Git操作

変更前後の差分を確認し、目的に関係するファイルだけをコミットします。

```bash
git status --short
git diff
git add <変更したファイル>
git diff --cached
git commit -m "docs: update project documentation"
git push
```

`main`へのpush後は、GitHub Actionsの`Validate`と`Deploy GitHub Pages`が成功したことを確認します。microCMSの記事更新はWebhookから同じデプロイ処理を起動します。

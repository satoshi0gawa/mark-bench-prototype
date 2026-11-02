# MARK BENCH 引き継ぎ

## 新しいチャットへの依頼文

以下を新しいチャットの最初のメッセージとして使用してください。

> `mark-bench-prototype/`を対象に作業してください。最初に`README.md`と`PROJECT-HANDOFF.md`を最後まで読み、現行HTML、CSS、JavaScript、`package.json`、`scripts/build.mjs`を確認してください。既存のデザイン、レスポンシブ構造、命名、ツール機能を維持したまま、NOTE to SELFの投稿管理だけをmicroCMSへ移行し、GitHub Actionsで静的HTMLを生成してGitHub Pagesへ公開できる構成を実装したいです。CODING NOTEは個別静的ページとして管理し、CMS生成対象へ含めません。まず現状を監査し、microCMSのAPIスキーマ、静的生成処理、Secrets、Webhook、GitHub Pagesデプロイの実装計画を提示してください。計画の合意前に既存ページを大規模変更しないでください。

## プロジェクト概要

- サイト名：MARK BENCH
- 構成：HTML、CSS、Vanilla JavaScript
- 目的：Web制作用ツール、再利用するUIパーツ、サイト実装記録・日々の作業メモを掲載する
- 公開予定：GitHub Pages
- NOTE to SELF投稿管理予定：microCMS
- CODING NOTE：個別静的ページ
- Node.js：22.12以上
- 外部npmパッケージ：現時点ではなし

## 正本と生成物

- 正本：ルートHTML、`tools/`、`web-parts/`、`build-notes/`、`css/`、`js/`
- 開発・検証：`scripts/`
- 生成物：`dist/`（`npm run build`で再生成、Git管理対象外）
- 過去の参考実装やUI検証用ファイルはクリーンアップ済み

## 現行ページ

- HOME：`index.html`
- ABOUT：`about.html`
- TOOLS一覧：`tools/index.html`
- TOOLS詳細：`tools/*.html`
- WEB PARTS一覧：`web-parts/index.html`
- WEB PARTS詳細：`web-parts/{slug}.html`（一覧ページと同階層へ配置し、個別サブディレクトリは作成しない）
- WEB PARTS / HEADING詳細：`web-parts/heading.html`（16パターン、キーワード絞り込み・コードコピー・PC 2列表示対応）
- WEB PARTS / BUTTON詳細：`web-parts/button.html`（16パターン、参照元12件に破壊的操作・非活性状態・処理中状態・アクショングループを独自追加）
- WEB PARTS / MODAL詳細：`web-parts/modal.html`（12パターン、Vanilla JavaScriptによる操作デモ、HTML・CSS・JSコード掲載）
- WEB PARTS / GLASS詳細：`web-parts/glass.html`（4パターン、グラスモーフィズム表現のみを掲載）
- WEB PARTS / BOX SHADOW詳細：`web-parts/box-shadow.html`（10パターン、box-shadow表現のみを掲載）
- WEB PARTS / BACKGROUND PATTERN詳細：`web-parts/background-pattern.html`（16パターン、参照元12件にハーフトーン・アイソメトリックグリッド・キューブモザイク・メッシュグラデーションを独自追加）
- WEB PARTS / BACKGROUND-EFFECT詳細：`web-parts/background-effect.html`（12パターン、参照元全件を粒子、自然現象、空、ポインター追従、環境光、デジタル、祝祭の系統順で掲載）
- WEB PARTS / BADGE詳細：`web-parts/badge.html`（14パターン、基本ラベル・状態通知・商品装飾の系統順で掲載）
- WEB PARTS / LOADING詳細：`web-parts/loading.html`（14パターン、参照元12件にボタン内ローダーとパネルオーバーレイを独自追加し、基本・進捗・コンテンツ待機・応用・表現系の順で掲載）
- WEB PARTS / FORM詳細：`web-parts/form.html`（14パターン、参照元12件にメールアドレス一致チェックと規約同意による送信制御を独自追加し、入力補助・検証・選択制御・送信フロー・状態保持の系統順で掲載）
- WEB PARTS / TABLE詳細：`web-parts/table.html`（12パターン、参照元全件を基本、見出し、表面、操作、密度、比較、集計の系統順で掲載）
- WEB PARTS / SLIDER詳細：`web-parts/slider.html`（12パターン、参照元全件を基本操作から自動・時間表現、ポインター、ギャラリー、比較、方向、継続閲覧の順で掲載）
- WEB PARTS / ACCORDION詳細：`web-parts/accordion.html`（12パターン、参照元全件を基本、操作制御、状態表現、検索、階層、リンク連動の順で掲載）
- WEB PARTS / UTILITY SCRIPT詳細：`web-parts/utility-script.html`（12パターン、参照元全件を表示設定、コンテンツ制御、検索・並び替え、表示変換、移動・保守・出力の順で掲載）
- WEB PARTS / LIST詳細：`web-parts/list.html`（16パターン、参照元12件に区切り線・リンク・説明・ステータスの実務向け4件を追加）
- WEB PARTS / ALERT詳細：`web-parts/alert.html`（14パターン、参照元12件にアクションリンク付き通知と複数項目のエラー概要を実務向けに独自追加）
- WEB PARTS / CLIPBOARD詳細：`web-parts/clipboard.html`（14パターン、基本コピー・構造化データ・共有と引用の系統順で掲載）
- WEB PARTS共通スタイル：一覧ページ下部に基本カラートークンを集約
- WEB PARTS命名規則：掲載コンポーネントは`c-`接頭辞とBEM形式で統一し、一覧ページの共通スタイルに掲載
- BUILD NOTES入口：`build-notes/index.html`
- CODING NOTE一覧：`build-notes/coding-note/index.html`
- CODING NOTEテスト詳細：
  - `build-notes/coding-note/test-codingnote-00.html`
  - `build-notes/coding-note/test-codingnote-01.html`
- NOTE to SELF一覧：`build-notes/note-to-self/index.html`
- NOTE to SELF詳細：
  - `build-notes/note-to-self/test-notetoself-00.html`（投稿型確認用テスト記事）
  - `build-notes/note-to-self/test-notetoself-01.html`（GitHub Pages用語のテスト記事）
  - `build-notes/note-to-self/test-notetoself-02.html`（GitHub Pagesトラブル確認のテスト記事）

## 実装済みツールと表示順

1. Text Case Converter
2. Text Diff Viewer
3. Regex Tester & Replacer
4. URL / Query String Builder
5. Meta Tags & OGP Builder
6. CSS Specificity Calculator
7. Image Format Converter & Resizer
8. Responsive Image Markup Builder
9. Base64 / Data URL Converter
10. CSS Custom Property Builder
11. Directory Tree Generator
12. Markdown Preview Editor
13. BEM Class Builder
14. Fluid Scale Generator
15. HTML Table Builder
16. Color Format Converter
17. PX / REM Converter
18. Width Converter
19. Text Formatter
20. Character Counter
21. Unicode Inspector
22. Slug Generator
23. HTML Escape Converter
24. Numeric Character Reference Converter
25. JSON Formatter

各ツールの処理は対応する`js/*.js`、共通操作は`js/tool.js`、一覧フィルターは`js/tools.js`が担当します。

## デザイン・UI仕様

- 英数字・UI：Space Mono
- 日本語：BIZ UDPGothic
- ネイビーを主色、黄色をアクセントに使用
- PCはメイン約70%、左右サイトレール各約15%
- Tablet以下はヘッダーと主要ナビゲーションを上部配置
- 左レール：ツリー型パンくず
- 右レール：TOOLS、WEB PARTS、BUILD NOTES、ABOUT
- HOME：ツリー型サイトマップを上下中央配置
- TOOLS／BUILD NOTES各一覧：項目を段階的にフェードアップ
- WEB PARTS：33カテゴリをカテゴリボタンとキーワード検索で絞り込み、詳細ページは1パーツにつきプレビューと再利用コードをまとめる
- WEB PARTS詳細は、参照元の全パターンを先に列挙して網羅性を確認し、機能・操作・表現・用途の近いものを系統別に分類する。カードの掲載順は参照元の順序をそのまま写さず、基本、派生、複合、特殊・応用の順を目安に理解・比較しやすく再構成し、その分類をKEYWORDSと検索語へ反映する
- WEB PARTS詳細のコードは参照元を転載せず、機能を保ったままMARK BENCHのカラートークン、`c-`接頭辞、アクセシビリティ要件へ移植する
- パーツ全体の基礎CSSは各カードへ重複掲載せず、詳細ページ最下部の「共通スタイル」へ集約する。ページヘッダーには同セクションへのページ内リンクを設ける
- JavaScriptありの各パターンはカード内のHTML・CSS・JavaScriptの3ブロック、JavaScriptなしはHTML・CSSの2ブロックを掲載し、ページ末尾の共通CSSがある場合はそれを加えたコードだけで単独動作させる
- コードブロック内で`...`や「共通処理を使用」などによる実装省略をせず、未掲載関数、ページ固有のグローバル変数、外部の初期化処理へ依存させない。同一ページの「共通スタイル」だけを明示的な共通依存として許可する
- JavaScriptが参照する関数、変数、DOMフックは同じコードセット内で定義し、HTMLの`aria-*`、`id`、`data-*`と一致させる
- CSSのMARK BENCHカラートークンにはフォールバック値を併記し、サイト共通CSSがなくても表示と操作状態を判別できるようにする
- 掲載前に空の最小HTMLへ対象カードのコードとページ末尾の共通スタイルを貼り付け、初期表示、全操作、外側クリック、Esc・矢印キーなど対象UIに必要なキーボード操作、ARIA状態同期を確認する
- BUILD NOTES入口：`CODING NOTE`、`NOTE to SELF`の順で縦積み
- CODING NOTE：BUILD NOTES入口では記事2枚＋`VIEW ALL`の3列、個別一覧では記事を2列、SPでは1列で表示
- CODING NOTEカード：共通4行グリッドで補足・見出し・概要・アクションを整列し、左右余白はページガターへ合わせる
- CODING NOTEカードとNOTE to SELF一覧：見出し・概要・補足情報の文字サイズ基準を共有
- NOTE to SELF：BUILD NOTES入口では最新5件まで、個別一覧では全件を表示
- サイト共通リンク：背景色・文字色・罫線色のホバー切り替えは180ms easeでフェードし、`prefers-reduced-motion`へ配慮
- サイト共通リンク矢印：ホバー／フォーカス時の右移動量を`--link-arrow-shift`で統一
- NOTE詳細：ページヘッダー、目次、本文を段階的にフェードアップ
- `prefers-reduced-motion`対応を維持
- コピー・ダウンロード・リセットの状態通知は共通パターンを使用

## BUILD NOTESの分類と命名

- 入口：`BUILD NOTES`
- 制作したサイトの実装メモ：`CODING NOTE`（1サイトにつき1ページ）
- 日々の作業メモ・自分用の備忘録：`NOTE to SELF`
- 予定記事ID：`BUILD_NOTE_XXX`
- 実装済み記事IDは既存HTMLの値を維持

## NOTE詳細の構造

```text
ページヘッダー
  -> aside.article-toc（CONTENTS、必要に応じてREFERENCES）
  -> 本文（見出し階層、本文、リスト、コード、表、コールアウト）
  -> 関連ツールへのCTA
  -> 共通ページフッター（一覧へ戻る、ページトップへ戻る）
```

- CTA通常時：ネイビー背景・黄色テキスト
- CTAホバー時：黄色背景・ネイビーテキスト、矢印スライド
- 記事本文、コード、コールアウトはメイン幅を使用
- NOTE to SELF本文は「である調」で統一する
- 参考リンクは目次下部の`REFERENCES`にリスト形式で配置する
- CONTENTSとREFERENCESの区切り線は点線とする
- TOOLS詳細、BUILD NOTES詳細、ABOUTには共通`page-footer`を配置する
- 共通ページフッターは背景色と中央罫線を設けず、左に親一覧またはHOME、右にページトップへのテキストリンクを配置する
- 記事詳細のSP表示は本文14pxを基準とし、記事タイトルは28px、セクション見出しは20pxを基準に字間・行間を調整する
- BUILD NOTES詳細の`note-meta`は投稿日だけを表示し、読了時間と公開状態は表示しない
- BUILD NOTES詳細のページヘッダー`section-index`は記事IDやページカテゴリを含めず、記事テーマだけを表示する
- BUILD NOTES詳細のSPパンくずは2段固定とし、上段に親階層、下段に現在の記事名を最大2行で表示する
- 表は横幅が不足する画面で横スクロールさせ、ページ全体の横溢れを防ぐ
- 参考資料がある記事は本文を転載せず、要点を再構成したうえで末尾に参照元を示す
- 詳細下部の関連投稿セクションは設けない

## microCMS移行方針

ブラウザからContent APIを直接呼び出さず、ビルド時に投稿を取得して静的HTMLを生成します。

```text
microCMSで公開・更新・削除
  -> GitHub Actions Webhook
  -> Node.jsビルドがContent APIを実行
  -> NOTE to SELFの一覧と詳細、BUILD NOTES入口の最新記事領域を生成
  -> GitHub Pagesへデプロイ
```

想定するmicroCMSフィールド：

- `title`：タイトル
- `slug`：URL
- `summary`：リード文
- `themeLabel`：記事テーマ
- `category`：カテゴリー
- `sections`：構造化された本文セクション
- `references`：任意の参照リンク
- `relatedTool`：任意の関連ツールCTA
- `seo`：任意のSEOタイトル、概要、OGP画像
- microCMS標準の公開日・更新日

APIキーはGitHub Actions Secretsで管理し、ブラウザ向けHTMLやJavaScriptへ出力しません。リッチエディタHTMLは`sanitize-html@2.18.1`の許可リストで無害化し、ビルド時に`dist/`への資格情報混入も検査します。Webhook失敗に備え、`workflow_dispatch`による手動デプロイも用意します。

## 推奨実装順

1. `test-notetoself-00.html`を基準にNOTE to SELFの詳細テンプレートを抽出する
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
npm run check:sanitize
npm run check:secrets
npm run check:detail
npm run build
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
- microCMS移行対象はNOTE to SELFだけとし、CODING NOTE、TOOLSのデータ化は別判断とする
- GitHub Pages用のベースパスを考慮し、ルート絶対パスへの置換を避ける

## 2026-11-02 Head・SEO・GitHub Pages公開設定

- 公開URLは`https://satoshi0gawa.github.io/mark-bench-prototype/`を正本とし、`site.config.mjs`で一元管理する
- 全68 HTMLページへ、ページ固有の`title`・`description`を維持したままcanonical、Open Graph、X Card、favicon、Webフォント読込、JSON-LDを同期した
- HOMEは`WebSite`、下層ページは`BreadcrumbList`のJSON-LDを出力する
- BUILD NOTES詳細は`og:type=article`、それ以外は`website`として扱う
- `test-`で始まる5ページは`noindex,follow`とし、サイトマップから除外する
- 公開対象は63ページで、ビルド時に`sitemap.xml`、`robots.txt`、`.nojekyll`を生成する
- faviconはSVG、32px PNG、Apple Touch Iconを用意し、OGP共通画像は1200×630px PNGを使用する
- Google Fontsの`@import`は廃止し、全ページの`head`からpreconnect付きで読み込む
- `npm run sync:head`は冪等であり、HTML追加・タイトル変更後に実行する
- `npm run check:seo`はcanonical、OG/X、favicon、フォント、robots、JSON-LD、タイトル・description重複、アセット存在を検証する
- `npm run check`は上記SEO検証に加え、ローカル参照、ページ内アンカー、外部リンクの`noopener noreferrer`も検証する
- `npm run build`はSEO検証に失敗した場合は停止し、成功時のみ`dist/`を生成する

再生成・検証手順：

```bash
npm run sync:head
npm run check:seo
npm run check
npm run check:detail
npm run build
```

今回の確認結果：全68ページの検証に成功し、63ページを検索対象としてビルドした。HOME、TOOLS詳細、WEB PARTS詳細、BUILD NOTES詳細をPC・Tablet・SP幅で確認し、横あふれ、ブラウザコンソールエラー、フォント未読込は発生していない。

GitHub PagesのActionsデプロイ設定と独自ドメイン設定は今回の対象外であり、公開方式を確定した段階で別途追加する。

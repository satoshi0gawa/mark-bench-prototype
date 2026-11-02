# MARK BENCH

Web制作で使用する小さなツール、再利用するUIパーツ、その設計・実装・検証過程を記録する静的サイトです。HTML、CSS、Vanilla JavaScriptで構成しています。

## 現在の構成

```text
mark-bench-prototype/
├── index.html
├── about.html
├── tools/
│   ├── index.html
│   └── 各ツール詳細ページ
├── web-parts/
│   ├── index.html
│   ├── heading.html
│   ├── button.html
│   ├── card.html
│   ├── modal.html
│   ├── tab.html
│   ├── dropdown.html
│   ├── css-text-effect.html
│   ├── text-effect.html
│   ├── divider.html
│   ├── hover.html
│   ├── glass.html
│   ├── box-shadow.html
│   ├── badge.html
│   ├── loading.html
│   ├── clipboard.html
│   ├── toast.html
│   └── scroll-reveal.html
├── build-notes/
│   ├── index.html
│   ├── coding-note/
│   │   ├── index.html
│   │   └── 各CODING NOTE詳細ページ
│   └── note-to-self/
│       ├── index.html
│       └── 各NOTE詳細ページ
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

## ローカル起動

Node.js 22.12以上を使用します。初回または`package-lock.json`更新後は`npm ci`で固定済み依存をインストールしてください。

```bash
npm run dev
```

`http://localhost:4173`で確認できます。

## 検証

全ページの基本構造とローカル参照を検証します。

```bash
npm run check
```

ツール固有の検証は`package.json`の`check:*`スクリプトを使用します。すべて実行する場合は次のとおりです。

```bash
npm run check:counter
npm run check:slug
npm run check:json
npm run check:html
npm run check:px
npm run check:formatter
npm run check:diff
npm run check:regex
npm run check:url
npm run check:meta
npm run check:specificity
npm run check:image
npm run check:responsive-image
npm run check:base64
npm run check:custom-property
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

`npm run build`と`npm run build:fixture`はローカルfixtureを使用します。ルートHTML、`css/`、`js/`、`tools/`、`web-parts/`、`build-notes/`を`dist/`へ複製した後、NOTE to SELFの一覧・詳細を静的生成します。

NOTE to SELFのリッチエディタHTMLは、固定バージョンの`sanitize-html`による許可リストで無害化します。ビルド後は`dist/`内のテキスト生成物を走査し、microCMS APIキーの値や資格情報ヘッダー名を検出した場合に公開処理を停止します。

microCMS接続後は、GET専用APIキーを環境変数へ設定して次を実行します。

```bash
MICROCMS_SERVICE_DOMAIN=your-service-id \
MICROCMS_API_KEY=your-get-only-api-key \
npm run build:cms
```

ローカル用の変数名は`.env.example`を参照してください。`.env`は自動読込せず、Git管理対象にも含めません。

個別検証は次を使用できます。

```bash
npm run check:sanitize
npm run check:secrets
```

## 編集責務

- サイト共通トークン・基礎スタイル：`css/foundation.css`
- ヘッダー、ナビゲーション、ボタンなど：`css/components.css`
- 各ページ・各ツール固有レイアウト：`css/pages.css`
- 共通アニメーション・ナビゲーション：`js/main.js`
- TOOLS一覧のフィルター：`js/tools.js`
- TOOLS詳細の共通操作：`js/tool.js`
- 各ツールの処理：対応する`js/*.js`
- BUILD NOTES入口：`build-notes/`
- 再利用するUIパーツ事例集：`web-parts/`（表示名：`WEB PARTS`）
- HEADING詳細：`web-parts/heading.html`（カラートークン対応のCSS見出し16パターン）
- BUTTON詳細：`web-parts/button.html`（参照元12件と実務向け独自4件を、主要・補助・状態・複数操作に展開したCSSボタン16パターン）
- MODAL詳細：`web-parts/modal.html`（Vanilla JavaScript対応のモーダル・ドロワー12パターン）
- GLASS詳細：`web-parts/glass.html`（グラスモーフィズムに限定したCSS表現4パターン）
- BOX SHADOW詳細：`web-parts/box-shadow.html`（box-shadow表現に限定したCSS影10パターン）
- BACKGROUND PATTERN詳細：`web-parts/background-pattern.html`（参照元12件にハーフトーン・アイソメトリックグリッド・キューブモザイク・メッシュグラデーションを独自追加したCSS背景16パターン）
- BACKGROUND-EFFECT詳細：`web-parts/background-effect.html`（参照元全12件を粒子、自然現象、空、ポインター追従、環境光、デジタル、祝祭に再分類したVanilla JavaScript対応の動的背景）
- BADGE詳細：`web-parts/badge.html`（基本ラベル、状態・通知、商品装飾に分類したCSSバッジ14パターン）
- LOADING詳細：`web-parts/loading.html`（参照元12件と実務向け独自2件を、基本・進捗・コンテンツ待機・応用・表現系に分類したCSSローディング14パターン）
- FORM詳細：`web-parts/form.html`（参照元12件と実務向け独自2件を、入力補助・検証・選択制御・送信フロー・状態保持に分類したVanilla JavaScript対応14パターン）
- CSS FORM詳細：`web-parts/css-form.html`（参照元12件に単位付き入力・日付入力・成功／エラー状態・ファイル選択を実務向けに追加したJavaScript不要のCSSフォーム16パターン）
- TABLE詳細：`web-parts/table.html`（参照元全12件を基本、見出し、表面、操作、密度、比較、集計に再分類したJavaScript不要のCSSテーブル）
- SLIDER詳細：`web-parts/slider.html`（参照元全12件を操作、自動再生、ポインター、ギャラリー、比較、方向、継続閲覧に再分類したVanilla JavaScriptスライダー）
- ACCORDION詳細：`web-parts/accordion.html`（参照元全12件を基本、操作制御、状態表現、検索、階層、リンク連動に再分類したVanilla JavaScriptアコーディオン）
- UTILITY SCRIPT詳細：`web-parts/utility-script.html`（参照元全12件を表示設定、コンテンツ制御、検索・並び替え、表示変換、移動・保守・出力に再分類したVanilla JavaScript実用スクリプト）
- TOOL TIP詳細：`web-parts/tool-tip.html`（方向別吹き出し、形状表現、会話、操作ヒント、通知の12パターンに、ヘルプ、入力エラー、無効理由、省略全文、リンクプレビュー、ホットスポットの実務追加6パターンを加えたJavaScript不要のCSS吹き出し・ツールチップ全18パターン）
- LIST詳細：`web-parts/list.html`（参照元12件に区切り線、リンク、説明、ステータスの実務向け4件を追加したJavaScript不要のCSSリスト16パターン）
- ALERT詳細：`web-parts/alert.html`（参照元12件にアクションリンク付き通知と複数項目のエラー概要を実務向けに追加したJavaScript不要のCSSアラート14パターン）
- COUNTER詳細：`web-parts/counter.html`（数値、進捗、時間、テキスト、自動計算、保存に分類したVanilla JavaScript対応のカウンター12パターン）
- CLICK EFFECTS詳細：`web-parts/click-effects.html`（参照元12件にコピー完了、二段階削除確認、再送クールダウン、保存ステータス、カート追加、取り消し可能な削除を実務向けに追加したVanilla JavaScript対応のクリック演出18パターン）
- CSS-TEXT-EFFECT詳細：`web-parts/css-text-effect.html`（光、色、奥行き、強調、文字単位の動きをCSSだけで表現する12パターン。旧`text-effect.html`から名称とスラッグを変更）
- TEXT-EFFECT詳細：`web-parts/text-effect.html`（参照元12件に文字数可変タイプライターと行クリップリビールを実務向けに追加し、文字分割、置換、単語切替、幅計測、ポインター反応に分類したVanilla JavaScript対応のテキスト演出14パターン）
- CLIPBOARD詳細：`web-parts/clipboard.html`（基本コピー、構造化データ、共有・引用に分類したVanilla JavaScript対応14パターン）
- サイト単位の実装メモ：`build-notes/coding-note/`（表示名：`CODING NOTE`）
- 日々の作業メモ：`build-notes/note-to-self/`（表示名：`NOTE to SELF`）
- NOTE to SELF投稿型のテスト記事：`build-notes/note-to-self/test-notetoself-00.html`〜`test-notetoself-02.html`
- CODING NOTE投稿型のテスト記事：`build-notes/coding-note/test-codingnote-00.html`〜`test-codingnote-01.html`

## サイト共通仕様

- サイト名：MARK BENCH
- 英数字・UIフォント：Space Mono
- 日本語フォント：BIZ UDPGothic
- PC：メイン約70%、左右サイトレール各約15%
- Tablet以下：ヘッダーと主要ナビゲーションをメイン上部へ配置
- HOME：TOOLS、WEB PARTS、BUILD NOTES、ABOUTへ分岐するツリー構造
- WEB PARTS：見出し、ボタン、モーダル、タブなど、使い回すUIのカテゴリと実装記録を管理する
- WEB PARTS一覧は33カテゴリをカテゴリボタンとキーワード検索で絞り込み、各詳細はプレビュー、コード、コピー、バリエーション、アクセシビリティ、実装メモを基本単位とする
- WEB PARTS詳細は`web-parts/{slug}.html`として一覧ページと同じ階層へ配置し、パーツごとのサブディレクトリは作成しない
- WEB PARTS詳細は、参照元に掲載された全パターンを列挙して取りこぼしがないことを確認したうえで、機能・操作・表現・用途の近いものを系統別に分類する。掲載順は参照元の並びを機械的に踏襲せず、基本、派生、複合、特殊・応用のように理解・比較しやすい順へ再構成し、KEYWORDSと各カードの検索語にも分類結果を反映する
- WEB PARTS詳細の各コードブロックは、参照元の機能をMARK BENCHのカラートークンと`c-`接頭辞へ置き換えた、移植可能な完成コードとする
- パーツ全体で共有する基礎CSSは各カードへ重複掲載せず、詳細ページ最下部の「共通スタイル」セクションへ集約し、ページヘッダーからページ内リンクで移動できるようにする
- JavaScriptありのパターンはカード内のHTML・CSS・JavaScriptの3ブロック、JavaScriptなしはHTML・CSSの2ブロックを掲載する。共通スタイルがある場合は、ページ末尾の共通CSSと対象カードのコードだけで単独動作する一式とする
- コードブロックでは省略記号、未掲載の共通関数、ページ本体だけに存在する変数・初期化処理へ依存しない。共通依存は同一ページの「共通スタイル」に全量を掲載し、JavaScriptが参照するDOMフックと識別子は対象カードのHTMLまたはJavaScript内で定義する
- CSSカスタムプロパティには、MARK BENCH外へ移植しても判読・操作できるフォールバック値を設定する
- 掲載前に最小HTMLへ対象カードのコードとページ末尾の共通スタイルを貼り付け、表示、マウス・タッチ操作、キーボード操作、状態同期を確認する
- BUILD NOTESは`CODING NOTE`と`NOTE to SELF`の2系統へ分岐
- BUILD NOTES入口では`CODING NOTE`、`NOTE to SELF`の順に各一覧を縦積みで展開
- `CODING NOTE`は制作したサイトの実装メモを1サイトにつき1ページでまとめる
- BUILD NOTES入口の`CODING NOTE`は記事2枚と`VIEW ALL`カードを3列で表示し、個別一覧では記事カードを2列で表示する
- CODING NOTEカードは共通の4行グリッドで補足・見出し・概要・アクション位置を揃え、`VIEW ALL`カードでは概要を表示しない
- CODING NOTEカードとNOTE to SELF一覧は、見出し・概要・補足情報の文字サイズ基準を共有する
- `NOTE to SELF`は日々の作業メモを残す自分用の備忘録
- BUILD NOTES入口の`NOTE to SELF`には最新5件までを表示し、個別一覧では全件を表示する
- NOTE to SELF詳細は、記事ヘッダー、目次、本文セクション、共通ページフッターを基本とし、内容に応じて手順リスト、コード、表、コールアウト、参考リンクを組み合わせる
- NOTE to SELF詳細の本文は、自分用の備忘録として「である調」で統一する
- 参考資料がある場合は、目次下部の`REFERENCES`へリスト形式で表示する
- TOOLS詳細、BUILD NOTES詳細、ABOUTの最下部に共通`page-footer`を配置する
- 共通ページフッターには親一覧またはHOMEへ戻るリンクとページトップリンクを配置する
- 記事詳細のSP表示は本文14pxを基準とし、タイトルとセクション見出しの字間・行間を広げる
- BUILD NOTES詳細の`note-meta`には投稿日だけを表示する
- BUILD NOTES詳細のページヘッダーラベルは記事テーマだけを表示する
- BUILD NOTES詳細のSPパンくずは、親階層を上段、現在の記事名を下段に最大2行で表示する
- 背景色が変わるリンクのホバーは`--transition-fast`（180ms ease）でフェードし、`prefers-reduced-motion`時は切り替えを即時にする
- リンク末尾の矢印は`--link-arrow-shift`分だけ右へ移動し、背景色と同じ`--transition-fast`でアニメーションする
- コピーライトはHOMEだけに表示
- 入力内容とツール処理はブラウザ内で完結
- `prefers-reduced-motion`に対応

## 次期構成

NOTE to SELFの投稿管理をmicroCMSへ移行し、GitHub Actionsで静的HTMLを生成してGitHub Pagesへデプロイする予定です。CODING NOTEは個別静的ページとして管理します。

```text
microCMS
  -> Webhook
GitHub Actions
  -> Content APIから投稿を取得
NOTE to SELF一覧・詳細とBUILD NOTES入口の最新記事領域を静的生成
  -> GitHub Pagesへデプロイ
```

ブラウザ側へmicroCMSのAPIキーを置かず、GitHub Actions Secretsで管理します。詳細は`PROJECT-HANDOFF.md`を参照してください。

## Head・SEO・GitHub Pages公開設定

サイト共通の公開情報は`site.config.mjs`で管理します。

- 本番URL：`https://satoshi0gawa.github.io/mark-bench-prototype/`
- サイト名：`MARK BENCH`
- OGP：`assets/og/og-default.png`
- favicon：`assets/icons/`
- `test-*`記事：`noindex,follow`
- 公開ページ：robots metaを付けず、`robots.txt`でクロールを許可

各HTMLの固有`title`とdescriptionを正本とし、canonical、OGP、X Card、favicon、Google Fonts、JSON-LDは同期スクリプトで管理します。

```bash
npm run sync:head
npm run check:seo
npm run check
npm run build
```

`npm run build`はSEO検証後に`dist/`を生成し、`robots.txt`、`sitemap.xml`、`.nojekyll`を出力します。本番URLに仮値が残っている場合や、必須meta・画像・faviconが欠落している場合は検証を失敗させます。

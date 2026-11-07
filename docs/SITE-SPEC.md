# MARK BENCH サイト仕様・開発運用

この文書は、MARK BENCHの現行実装と開発・公開手順の正本です。公開READMEには概要だけを残し、変わりやすい技術仕様と運用情報をここで管理します。

## 1. サイト概要

- サイト名：MARK BENCH
- 公開URL：<https://satoshi0gawa.github.io/mark-bench-prototype/>
- 目的：Web制作で使うツール、再利用可能なUIパーツ、制作・運用メモの集約
- フロントエンド：HTML / CSS / Vanilla JavaScript
- 静的生成：Node.js
- ホスティング：GitHub Pages

## 2. コンテンツと管理元

| セクション | 管理方法 | 主な配置 |
| --- | --- | --- |
| TOOLS | Git上の静的HTML・JavaScript | `tools/` |
| WEB PARTS | Git上の静的HTML・CSS・JavaScript | `web-parts/` |
| CODING NOTE | 個別の静的HTML | `build-notes/coding-note/` |
| NOTE to SELF | microCMSを正本として静的生成 | `build-notes/note-to-self/` |
| ABOUT | Git上の静的HTML | `about.html` |

microCMSの管理対象は`NOTE to SELF`だけです。CODING NOTE、TOOLS、WEB PARTS、ABOUTはGit側で管理します。`dist/`はビルド生成物のため直接編集しません。

## 3. ディレクトリと編集責務

```text
/
├── assets/                         画像、アイコン、OG画像
├── build-notes/
│   ├── coding-note/                静的な実装メモ
│   └── note-to-self/               microCMS生成記事
├── css/
│   ├── foundation.css              トークン、リセット、基礎スタイル
│   ├── components.css              共通UIコンポーネント
│   ├── pages.css                   ページ固有レイアウト
│   ├── tools.css                   TOOLS固有スタイル
│   └── web-parts.css               WEB PARTS固有スタイル
├── docs/                            現行仕様と監査記録
├── js/
│   ├── main.js                     共通ナビゲーション、表示制御
│   ├── tools.js                    TOOLS一覧
│   └── tool.js                     TOOLS詳細共通処理
├── microcms/                       スキーマ例、Fixture、運用資料
├── scripts/                        検証、head同期、静的生成
├── tools/                          ツール一覧・詳細ページ
├── web-parts/                      UIパーツ一覧・詳細ページ
├── site.config.mjs                 URL、SEO、favicon等の共通設定
└── package.json                    実行スクリプトと依存関係
```

### 編集時の基本方針

- 色、フォント、余白などの共通値は`css/foundation.css`のトークンを優先する
- 複数ページで使うUIは`css/components.css`へ置く
- ページ固有の構造調整は`css/pages.css`または専用CSSへ置く
- GitHub Pagesのリポジトリ配下URLを考慮し、ルート絶対パスへの一括置換を避ける
- 動的クラスや`data-*`属性をJavaScriptが参照しているため、未使用判定だけで一括削除しない

## 4. サイト共通デザイン・UI

### タイポグラフィ

- UI・英数字：Space Mono
- 日本語：BIZ UDPGothic
- フォントはGoogle Fontsから読み込む

### カラー

- 主色：ネイビー
- アクセント：黄色
- 背景、境界線、テキスト、状態色は共通トークンから参照する
- 一覧ページのアイテムグリッドは、区切り面に`--color-item-grid-background`、通常アイテムに`--color-item-background`、補助アイテムに`--color-item-background-muted`を使用する
- 通常文字と背景のコントラストを確保し、色だけに依存した状態表現を避ける

### レイアウト

- PC：左側パンくずレール、中央メインエリア、右側サイトナビゲーション
- Tablet以下：上部パンくずと横並びナビゲーションへ切り替え
- 最小表示幅：320px
- コードやテーブルなど幅を持つ要素は、ページ全体ではなく要素内で横スクロールさせる。ただしWEB PARTSのSPコード表示は、下記の折り返し・縦スクロール仕様を適用する

### インタラクションとアクセシビリティ

- キーボードだけで主要操作を完了できる状態を保つ
- フォーカス表示を消さない
- リンクとボタンは役割に応じたHTML要素を使う
- ホバー時の色変更と矢印移動は共通トランジションを使う
- `prefers-reduced-motion`では不要なアニメーションを省略する

## 5. ページ別仕様

### TOOLS

- 一覧はカテゴリとキーワードで絞り込める
- ツール処理は原則ブラウザ内で完結し、入力内容を外部送信しない
- 詳細ページはツール本体、使い方、仕様、共通フッターで構成する
- ツール追加時は一覧カード、件数、対応する検証スクリプトも更新する

### WEB PARTS

- 一覧でカテゴリ、パターン数、状態を管理する
- 一覧の初期順は、案件をまたいだ採用場面の広さ、主要操作・情報理解への寄与、再利用のしやすさから判断する実務優先順とする。アクセス解析等の実測順位ではなく編集上の推定とし、基礎的な情報表示・入力、ナビゲーション・開閉、状態表示、実用補助・スライダー、レイアウト・操作表現、任意の装飾・演出の順を目安にする。上位はHEADING・BUTTON・CARD・LIST・CSS-FORM・FORM・TABLEとする
- CATEGORYと一覧カードは同じDOM順に揃え、視覚表示・キーボード移動・読み上げの順を一致させる。正確な並び順は`web-parts/index.html`を正本とし、新規パーツも用途と優先度に応じた位置へ追加する。絞り込み後も元の優先順を維持する
- 詳細ページの掲載コードは`c-`接頭辞とBEM形式で統一する
- JSなしページはHTML・CSS、JSありページはHTML・CSS・JavaScriptを掲載する
- コード領域は固定高とし、641px以上では内容が収まらない場合だけ領域内で縦横スクロールする。SP（640px以下）はHTML・CSS・JavaScriptと共通スタイルを含む全コードブロックを折り返し表示し、縦スクロールのみとする。改行・インデントは保ち、長いURLや識別子も必要に応じて折り返す。COPYは表示上の折り返しを含めず、元のコードをコピーする
- PCは2列、1279px以下は1列表示を基本とする
- 詳細ページ追加時は`web-parts/index.html`のカテゴリ、総パターン数、READY / PLANNED、一覧下部件数を同時に更新する。一覧を正本とし、引き継ぎ文書へ固定件数を重複記載しない
- 外部ライブラリを使う詳細ページは、ヘッダーの`DEPENDENCY`へ名称と固定バージョンを表示し、CDN URLも同じバージョンへ固定する
- `FEEDBACK`（`web-parts/feedback.html`）は状態の理解と次の操作に特化する。空状態、権限制限、利用上限、複数工程、部分失敗の再試行、満足度評価の6パターンを収録し、ALERT・TOASTの通知表現やLOADINGの待機表現と区分する。権限・処理・回答はブラウザ内の模擬動作であり、実際の認可・外部送信は行わない
- `MOTION`（`web-parts/motion.html`）は配置と内容の変化を伝える動きに特化する。並び替え、高さ補間、共有要素遷移、絞り込み時の入退場と再配置、SVGライン描画、経路移動の6パターンを収録する。SCROLL-REVEALのスクロール出現やCLICK-EFFECTSの操作反応と区分し、動きを減らす設定では最終状態を即時表示する
- 広義の`NAVIGATION`準備中カテゴリは除去済み。HAMBURGER MENUやDROPDOWNは個別用途のカテゴリとして維持し、パンくず・ページネーション等を追加する場合も用途別に分類する
- `BREADCRUMB`（`web-parts/breadcrumb.html`）は、スラッシュ・線の矢印・塗りつぶし矢印の区切り3種と、淡色・濃色の矢印帯2種を収録する。[CSS Stockの参照例](https://pote-chil.com/css-stock/ja/breadcrumb)をもとに、MARK BENCHの配色とテキストラベルで構成する。追加の独自パターンは`PRACTICAL`として、SPで親階層へ戻る（640px以下）・中間階層を`details`で省略／展開・長い現在地名を独立行に表示する3種を収録する。省略／展開のデモは実在するHOME→WEB PARTS→BREADCRUMBの階層で示し、中間リンクを増やしても展開領域が自然に伸びる構造にする。デモはHTMLとCSSで動作し、祖先リンクと現在地をセマンティックに区別する。KEYWORDS・検索・COPYは詳細共通スクリプトで処理する
- FEEDBACK・MOTIONの掲載HTML・CSS・JavaScriptは実際のデモと同じ一式を維持する。各CSSブロックは単独利用に必要な基礎設定を含み、共通スタイルセクションは基礎設定の参照用とする
- BREADCRUMBのプレビュー・コード領域の高さは詳細ページ共通設定に揃える。プレビューはPC・小型ノートPCで`13rem`、SPで`11rem`。内容に応じた高さの拡張は「中間階層を省略・展開」のプレビューだけに適用する
- `PAGINATION`（`web-parts/pagination.html`）は番号リンク、中間省略、前後＋現在位置、先頭・末尾移動、表示範囲＋総件数、記事タイトル付き前後リンクの6パターン。分類・調査元・検証方針は[ページネーションの設計](web-parts-pagination.md)を参照する。デモはVanilla JavaScriptでサンプルのページ情報を切り替え、パターン別のURLクエリとブラウザ履歴を同期する。現在ページには`aria-current="page"`、移動できない前後リンクにはリンクを持たない`span`と`aria-disabled="true"`を使用する。KEYWORDS・検索・COPYは詳細共通スクリプトを使い、掲載HTML・CSS・JavaScriptは各パターンだけで動作する一式にする

### BUILD NOTES

- 一覧はCODING NOTE、NOTE to SELFの順に表示する
- CODING NOTEはGit上の静的ページとして追加する
- NOTE to SELFはmicroCMSから一覧と詳細ページを生成する
- 記事本文のテーブルは小さい画面で要素内横スクロールを許可する
- 参照リンクは記事データに存在する場合だけ表示する

#### CODING NOTE詳細

- `build-notes/coding-note/coding-note-mark-bench.html`を詳細ページの参照実装とする
- 記事のリード文・本文・リスト・表内の説明は、原則として句点「。」で文を区切り、同じ段落・項目内に次の文が続く場合は`<br />`で表示上も改行する。段落・項目の末尾には不要な改行を追加しない。タイトル、メタ情報、コード内の文字列は対象外とする
- 基本構成は、制作概要、目的と要件、担当範囲、サイト構成、技術構成、主要実装、レスポンシブとアクセシビリティ、課題と解決、検証と公開、関連リンクの順とする
- ヘッダーの制作情報は`.article-project-meta`を使い、TYPE、ROLE、STACK、STATUSを掲載内容に合わせて設定する
- 「課題と解決」は`.article-process-flow`を使い、課題、原因、解決、結果を4段階のフローとして順番に表示する。結果は最後の段階へ統合し、同内容のコールアウトを重複表示しない
- ポートフォリオ、完成サイト、Figma、ソースコードなどのCTAは`.article-project-links`へ配置し、存在するリンクだけを表示する
- ポートフォリオは制作物の概要、CODING NOTEは設計・実装の詳細、完成サイトは動作確認先としてリンクの役割を分ける
- 記事追加時はCODING NOTE一覧カード、表示件数、パンくずと一覧へ戻る導線をあわせて確認する

## 6. ローカル起動

推奨環境はNode.js 22.12以上です。

```bash
npm ci
npm run dev
```

表示先は`http://localhost:4173/`です。終了は実行中のターミナルで`Ctrl+C`を使用します。別ポートを使う場合は`PORT`環境変数で指定します。

## 7. 検証

基本の検証は次の順で実行します。

```bash
npm run check
npm run check:detail
npm run build
```

用途別の主なコマンドは次のとおりです。

| コマンド | 対象 |
| --- | --- |
| `npm run check` | HTMLとローカル参照 |
| `npm run check:seo` | head、canonical、OGP、favicon、構造化データ |
| `npm run check:detail` | TOOLS詳細ページの構成 |
| `npm run check:content` | microCMS記事データ |
| `npm run check:sanitize` | CMS本文のサニタイズ |
| `npm run check:secrets` | 公開成果物への秘密情報混入 |
| `npm run check:note-build` | NOTE to SELFのFixture生成 |

ツール固有処理を変更した場合は、`package.json`に定義された対応する`check:*`も実行します。

## 8. 静的ビルド

通常のローカル確認ではFixture記事を使う静的ビルドを実行します。

```bash
npm run build
```

`npm run build`は`npm run build:fixture`と同じ処理です。生成先は`dist/`で、既存の静的ファイルとFixtureから生成したNOTE to SELFを配置します。

microCMSの実データを明示的に使う場合は次を実行します。

```bash
MICROCMS_SERVICE_DOMAIN=your-service-id \
MICROCMS_API_KEY=your-get-only-api-key \
npm run build:cms
```

ローカル確認用の値をGit管理ファイルへ保存しないでください。

## 9. microCMS

- APIエンドポイント：`blog`
- 管理対象：`NOTE to SELF`のみ
- APIキー：GET専用
- GitHub Actions Variable：`MICROCMS_SERVICE_DOMAIN`
- GitHub Actions Secret：`MICROCMS_API_KEY`
- Webhook：GitHub Actionsの`repository_dispatch`
- イベント名：`microcms_blog_update`

スキーマ、入力ルール、Fixture、生成先の詳細は[`microcms/README.md`](../microcms/README.md)を参照してください。導入時の検討履歴は[`MICROCMS-INTEGRATION-MEMO.md`](../MICROCMS-INTEGRATION-MEMO.md)に残します。

## 10. GitHub Actions・GitHub Pages

- `Validate`：pull request、`main`へのpush、手動実行で検証する
- `Deploy GitHub Pages`：`main`へのpush、手動実行、microCMS Webhookで静的生成して公開する
- 公開元はGitHub Actionsを使用する
- APIキーなどの機密値はRepository Secretsに保存する
- microCMS Webhook用のGitHubトークンは対象リポジトリだけに限定し、必要最小限の権限を付与する

`main`へpushした後は、両ワークフローの成功と公開URLの表示を確認します。

## 11. Head・SEO・公開URL

共通設定は`site.config.mjs`で管理します。HTMLの追加やタイトル、description、公開URL、favicon、OG画像の変更時は次を実行します。

```bash
npm run sync:head
npm run check:seo
```

主な方針は次のとおりです。

- 公開URLは`siteConfig.baseUrl`を正本とする
- 各ページへ一意の`title`とdescriptionを付ける
- canonical、Open Graph、Twitter Card、favicon、テーマカラーを全ページで整合させる
- 記事詳細ではArticle構造化データを生成する
- `test-`で始まる検証ページはnoindexとする
- 生成済みHTMLを手編集せず、設定・テンプレート・生成元を修正する

## 12. Git運用

変更前後で差分を確認し、目的に関係するファイルだけをステージングします。

```bash
git status --short
git diff
git add <変更したファイル>
git diff --cached
git commit -m "type: concise summary"
git push
```

コミット例：

- `docs: update public project documentation`
- `fix: improve article table contrast`
- `feat: add a new web tool`

毎回同じ`Add initial website`を使わず、変更内容が分かるメッセージにします。

## 13. ドキュメントの役割

| ファイル | 役割 |
| --- | --- |
| `README.md` | 公開向けの短い概要 |
| `docs/SITE-SPEC.md` | 現行仕様と開発・公開手順の正本 |
| `PROJECT-HANDOFF.md` | 新しいチャット・作業環境向けの再開手順 |
| `microcms/README.md` | microCMSスキーマと記事運用 |
| `MICROCMS-INTEGRATION-MEMO.md` | microCMS導入時の設計判断・検討履歴 |
| `docs/github-pages-migration-audit.md` | 旧Git履歴と公開移行の監査記録 |

仕様変更時はまずこの文書を更新し、READMEや引き継ぎ文書へ同じ詳細を重複させない方針とします。

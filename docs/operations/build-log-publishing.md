# 新規BUILD LOG詳細ページ作成・公開手順

2026年10月25日時点の、MARK BENCHに新しいBUILD LOG詳細ページを追加するための運用手順です。

BUILD LOGの原稿はmicroCMSで管理します。リポジトリ内の`build-logs/*.html`を複製・編集したり、生成先の`dist/`を直接編集したりする必要はありません。

```text
microCMSで投稿を公開
  -> Webhookがrepository_dispatchを送信
GitHub ActionsがmicroCMS Content APIから全投稿を取得
  -> dist/build-logs/{slug}.htmlを静的生成
GitHub Pagesへデプロイ
```

## 静的ページ制作を含む運用フロー

従来は、関連ツールを調査したうえで`build-logs/{slug}.html`を手作業し、`build-logs/index.html`へ記事行を追加していました。現在は調査・構成・執筆の品質基準を維持しつつ、ページHTMLと一覧を共通テンプレートから自動生成します。

### フェーズ1：関連ツールを調査する

記事制作担当者は、対象ツールに関係する次のファイルを実際に確認します。

- ツール詳細ページのHTML
- ツール固有のCSSと共通CSS
- ツール固有のJavaScript
- 関連する検証スクリプト
- README、仕様、既知の制約、参考URL

確認する内容：

- ツールを作った目的と解決する課題
- 入力値、出力値、データ構造、主要な処理順
- 採用した設計と検討した選択肢
- バリデーション、例外処理、空状態
- キーボード操作、読み上げ、フォーカスなどのアクセシビリティ
- PC、Tablet、SPでのレイアウト
- 実際に検証済みの入力値と操作

一般論から推測して執筆せず、コードと検証結果から確認できる内容だけを記事へ使用します。

### フェーズ2：記事構成と原稿を作成する

調査結果を、microCMSのフィールドと`buildLogSection`へ分解します。

1. 記事タイトルとリード文を決める。
2. 未使用の`logNumber`と`slug`を決める。
3. 記事の流れを6〜8セクション程度で設計する。
4. 各セクションへラベル、見出し、本文を作成する。
5. 理解に必要な範囲だけコードブロック、表、リスト、calloutを追加する。
6. 実際の検証結果と実装から得た判断で締める。
7. 記事カテゴリーに応じて、関連ツールCTA、任意URL CTA、CTAなしのいずれかを決める。

旧記事の品質基準として、次の公開ページを参照できます。

- [テキストケース変換の仕組みを整理する](https://satoshi0gawa.github.io/mark-bench-prototype/build-logs/case-style-guide.html)
- [pxとremの換算基準を整理する](https://satoshi0gawa.github.io/mark-bench-prototype/build-logs/px-rem-converter.html)

### フェーズ3：microCMSへ構造化入力する

- 1件ずつ作成する場合：本書のフィールド表に従って管理画面へ入力する。
- 複数件をまとめて登録する場合：microCMSの入力形式に合わせたCSVを作成し、インポート後に全フィールドを確認する。
- 公開前にレビューする場合：microCMSでは下書きとして保存し、内容を確認する。

現行のAPIキーは下書きを取得しないため、下書き状態の詳細ページをGitHub Pages上でプレビューする機能はありません。公開前の実ページプレビューが必要な場合は、draftKeyを使用する専用プレビュー経路を別途設計します。

### フェーズ4：静的HTMLを自動生成する

microCMSで公開すると、GitHub Actionsが次を自動実行します。

1. microCMSから公開中の全BUILD LOGを取得する。
2. 必須項目、形式、重複、CTA種別、関連先を検証する。
3. リッチエディタHTMLを無害化する。
4. `dist/build-logs/index.html`を再生成する。
5. `published`の記事ごとに`dist/build-logs/{slug}.html`を生成する。
6. 一覧件数、表示順、詳細リンク、目次、CTA、秘密情報の混入を検証する。
7. `dist/`全体をGitHub Pagesへデプロイする。

記事ごとに次のHTML構造を手作業する必要はありません。`scripts/templates/build-log-pages.mjs`が共通生成します。

- `header.article-header`
- `aside.article-toc`
- `div.article-body`
- 各`section.article-section`
- 目次のアンカーと`aria-labelledby`
- 最終セクションのCTA（`none`の場合は生成しない）

### フェーズ5：共通UIと表示を確認する

CTA、Reveal、レスポンシブ構造は共通CSS・JavaScriptで管理します。新しい記事を追加するたびに再実装しません。

共通実装で提供される内容：

- ページヘッダー、目次、各本文セクションの順次表示
- セクション内要素の約80ms間隔の段階表示
- 各セクション単位のIntersection Observer監視
- `prefers-reduced-motion`でのアニメーション無効化
- Intersection Observer未対応時の通常表示
- ネイビー背景・黄色文字のCTA
- CTAのホバー／フォーカス配色と矢印アニメーション
- 既存のヘッダー、パンくず、左右サイトレール
- PC、Tablet、SPの共通レイアウト

記事固有の要件が既存のリッチエディタ、callout、コード、表、画像で表現できない場合だけ、共通テンプレート、CSS、JavaScriptの変更を検討します。全記事へ影響するため、大きな変更は実装前に影響範囲を確認します。

### フェーズ6：ローカル変更を必要な場合だけGitHubへ反映する

記事の原稿だけをmicroCMSで作成・修正し、リポジトリ内のファイルを変更していない場合は、Git操作を行いません。フェーズ5の公開確認で作業完了です。

記事制作と同時に運用資料、テンプレート、CSS、JavaScript、検証コードなどを変更した場合だけ、公開ページの確認後に次の手順を実施します。

1. `git status --short`でローカル変更を一覧にする。
2. `git diff`と未追跡ファイルの内容を確認し、今回の作業に属する変更と既存の別作業を分ける。
3. APIキー、PAT、Secret、個人情報、生成物が差分へ含まれていないことを確認する。
4. 変更内容に応じた検証を実行する。
5. 反映対象ファイル、検証結果、コミットメッセージ案、push先ブランチをユーザーへ提示する。
6. コミットについて明示的な承認を得る。ユーザーが「コミット変更」「コミットして反映」などを承認した場合は、ローカル限定の指定がない限り、承認されたpush先へのpushまでを一連の作業として扱う。
7. 承認されたファイルだけを個別にステージし、コミットする。
8. 承認されたブランチへpushする。
9. pushを契機に開始されたGitHub Actionsで`build`と`deploy`が`Success`になることを確認する。
10. 公開ページを再確認し、`git status --short`で作業ツリーの状態を報告する。

ステージには`git add .`や`git add -A`を使わず、対象ファイルを明示します。

```bash
git add docs/operations/build-log-publishing.md \
  docs/operations/build-log-implementation-request-template.md
```

コミットメッセージの例：

```text
docs: document build log publishing workflow
```

ドキュメントだけを変更した場合は、少なくとも差分確認と`git diff --check`を実行します。スキーマ、生成処理、テンプレート、CSS、JavaScript、Workflowを変更した場合は、次を実行します。

```bash
npm run check
npm run check:detail
npm run test:build-logs
npm run build
npm run check:dist
```

`dist/`と記事ごとの`build-logs/*.html`は手作業でステージしません。`main`へのpushは`.github/workflows/pages.yml`の`push`条件によりPagesデプロイをもう一度起動します。この実行は、microCMS公開時の`repository_dispatch`とは別の実行として確認します。

### 旧フローから変更された作業

| 従来の作業 | 現在の作業 |
| --- | --- |
| `build-logs/{slug}.html`を複製・編集 | microCMSの投稿フィールドと本文セクションを作成 |
| 記事ごとにヘッダー、目次、CTAを実装 | 共通テンプレートが自動生成 |
| `build-logs/index.html`へ行を追加 | 全投稿から一覧を自動生成 |
| 一覧件数と表示順を手修正 | ビルド時に件数集計と並び替え |
| `BUILD_LOG_XXX`を公開前識別子に使用 | 予定記事は`BUILD_NOTE_XXX`を使用 |
| `dist/`を更新してソースと比較 | GitHub Actionsが`dist/`を生成し`check:dist`で検証 |
| 記事公開のたびにリポジトリへコミット | ローカルファイルを変更した場合だけ、承認後に対象ファイルをコミット・push |

再利用できる制作依頼文は`build-log-implementation-request-template.md`を使用します。

## 作成前の確認

### 1. 公開記事番号を決める

公開記事の`logNumber`は、既存記事と重複しない`BUILD_LOG_###`形式にします。

例：

```text
BUILD_LOG_005
```

- 数字は必ず3桁にする。
- 既存の公開記事番号と重複させない。
- 予定記事では`BUILD_NOTE_XXX`を使用する。

### 2. slugを決める

`slug`は公開URLとHTMLファイル名になります。

```text
slug: example-build-log
URL:  /build-logs/example-build-log.html
```

- 使用できる文字：小文字英字、数字、ハイフン
- 先頭・末尾や連続したハイフンは使用しない。
- `.html`は入力しない。
- 既存のBUILD LOGと重複させない。
- 公開後のslug変更はURL変更になるため、原則として避ける。

### 3. CTA種別と関連先を確認する

`TEXT TOOLS`、`CODE TOOLS`、`CSS TOOLS`の公開記事では、関連ツールCTAが必須です。`SITE`の公開記事だけは、記事内容に応じて次の3種類から選択できます。

| `ctaType` | 用途 | 必須入力 |
| --- | --- | --- |
| `tool` | MARK BENCHのツールを案内 | `relatedToolId`、`ctaLabel`、`ctaDescription` |
| `link` | 関連する任意のWebページを案内 | `ctaUrl`、`ctaLabel`、`ctaDescription` |
| `none` | CTAを表示しない | CTA関連項目はすべて空欄 |

`SITE`以外の公開記事では`tool`だけを使用します。`SITE`で`link`を使用する場合、`ctaUrl`には`https://`から始まる完全なURLを入力します。`none`では、以前の入力が残らないように関連ツール、ラベル、説明、URLをすべて空欄にします。

既存記事で`ctaType`が空欄でも、`relatedToolId`が入力されていれば`tool`として扱われます。既存記事の一括修正は不要です。

`tool`を選択する場合は、microCMSの「関連ツール」から記事末尾のCTAで案内するツールを選択します。

現在使用できるID：

| relatedToolId | ツール |
| --- | --- |
| `text-case-converter` | Text Case Converter |
| `directory-tree-generator` | Directory Tree Generator |
| `markdown-preview-editor` | Markdown Preview Editor |
| `bem-class-builder` | BEM Class Builder |
| `fluid-scale-generator` | Fluid Scale Generator |
| `html-table-builder` | HTML Table Builder |
| `color-format-converter` | Color Format Converter |
| `px-rem-converter` | PX / REM Converter |
| `width-converter` | Width Converter |
| `text-formatter` | Text Formatter |
| `character-counter` | Character Counter |
| `unicode-inspector` | Unicode Inspector |
| `slug-generator` | Slug Generator |
| `html-escape-converter` | HTML Escape Converter |
| `numeric-character-reference-converter` | Numeric Character Reference Converter |
| `json-formatter` | JSON Formatter |

この一覧は`scripts/config/tools.mjs`が正本です。新しいツールを関連付ける場合は、先にツールページとカタログ設定をリポジトリへ追加・公開してから、microCMSの選択肢へ同じIDを追加します。

## microCMSで新規投稿を作成する

1. microCMSで`BUILD LOGS`を開く。
2. 右上の「追加」を押す。
3. 次のフィールドを入力する。

### 公開記事の入力項目

| フィールド | 入力ルール | ページでの用途 |
| --- | --- | --- |
| `displayStatus` | `published` | 詳細ページ生成の判定 |
| `logNumber` | 重複しない`BUILD_LOG_###` | ヘッダーと一覧 |
| `title` | 必須 | H1、一覧、title要素 |
| `slug` | 小文字英数字とハイフン | ファイル名とURL |
| `summary` | 必須 | リード文、meta description |
| `category` | 既定の4種類から選択 | 記事ヘッダー |
| `displayDate` | 任意 | 表示日。空欄ならmicroCMSの公開日時 |
| `readingTime` | 1以上の整数 | `MIN READ`表示 |
| `ctaType` | `tool`、`link`、`none` | CTAの生成方法 |
| `relatedToolId` | `tool`の場合だけ選択 | ツールCTAのリンク先 |
| `ctaLabel` | `tool`または`link`の場合は必須 | CTAボタン文言 |
| `ctaDescription` | `tool`または`link`の場合は必須 | CTA説明文 |
| `ctaUrl` | `link`の場合だけ必須 | 任意URL CTAのリンク先 |
| `ogImage` | 任意 | OGP画像 |
| `plannedOrder` | 公開記事では空欄でよい | 予定記事の並び順専用 |
| `sections` | 1件以上 | 目次と本文 |

### 各フィールドの入力方法

フィールド値だけでなく、microCMS上では次の入力方法を使います。

| フィールド | microCMSでの操作 | 入力時の注意 |
| --- | --- | --- |
| `displayStatus` | セレクト欄から1件選択 | 表示名を手入力せず、`published`または`planned`を選ぶ |
| `logNumber` | 1行テキスト欄へ入力 | バッククォートや引用符を付けず、`BUILD_LOG_005`のような値だけを入力する |
| `title` | 1行テキスト欄へ入力 | Markdownの`#`やHTMLタグを付けない |
| `slug` | 1行テキスト欄へ入力 | `.html`を付けず、小文字英数字とハイフンだけを入力する |
| `summary` | 複数行テキスト欄へ入力 | HTMLタグを付けず、本文だけを入力する |
| `category` | セレクト欄から1件選択 | 定義済みの表記をそのまま選ぶ |
| `displayDate` | 日時欄で指定 | microCMSの公開日時を使う場合は空欄にする |
| `readingTime` | 数値欄へ入力 | `10 MIN READ`ではなく、半角数字の`10`だけを入力する |
| `ctaType` | セレクト欄から1件選択 | 新規記事では`tool`、`link`、`none`のいずれかを明示する |
| `relatedToolId` | セレクト欄から1件選択 | `tool`の場合だけ、`color-format-converter`のようなカタログIDを選ぶ |
| `ctaLabel` | 1行テキスト欄へ入力 | `tool`または`link`の場合だけ、ボタン文言を入力する |
| `ctaDescription` | 複数行テキスト欄へ入力 | `tool`または`link`の場合だけ、HTMLタグなしで説明を入力する |
| `ctaUrl` | 1行テキスト欄へ入力 | `link`の場合だけ、`https://`から始まる完全なURLを入力する |
| `ogImage` | 画像欄から選択 | 使用しない場合は空欄のままにする |
| `plannedOrder` | 数値欄へ入力 | 公開記事では空欄にする |
| `sections` | 「フィールドを追加」から必要件数を追加 | 1セクションにつき1件のカスタムフィールドを使う |

`category`は次のいずれかを選択します。

- `TEXT TOOLS`
- `CODE TOOLS`
- `CSS TOOLS`
- `SITE`

## 本文セクションを作成する

`sections`の「フィールドを追加」から`buildLogSection`を追加します。

1. 記事構成で決めたセクション数だけ「フィールドを追加」を押す。
2. 1件目に`01`、2件目に`02`のように、1セクションずつ分けて入力する。
3. すべて入力したあと、左側のドラッグハンドルで`01`から昇順になっていることを確認する。
4. 複数セクションの本文を1件の`body`へまとめない。

各セクションの入力項目：

| フィールド | 入力ルール |
| --- | --- |
| `sectionNumber` | `01`、`02`のような重複しない2桁 |
| `sectionLabel` | `PURPOSE`、`PROCESS`などの短い英字ラベル |
| `heading` | セクションのH2見出し |
| `body` | 必須。本文をリッチエディタで入力 |
| `calloutLabel` | 任意。囲み表示のラベル |
| `calloutBody` | 任意。囲み表示の本文 |

### セクション内の各項目を入力する

#### `sectionNumber`：セクション番号

- 1行テキスト欄へ、`01`、`02`のようなゼロ付き2桁だけを入力する。
- `01 / PURPOSE`のように分類を一緒に入力しない。
- 記事内で同じ番号を使用しない。

#### `sectionLabel`：セクション分類

- 1行テキスト欄へ、`PURPOSE`、`CONVERSION`、`VALIDATION`のような短い英字ラベルを入力する。
- 番号、スラッシュ、Markdown、HTMLタグを付けない。
- ページ上では`sectionNumber / sectionLabel`の形にテンプレートが組み立てる。

#### `heading`：見出し

- 1行テキスト欄へ見出し本文だけを入力する。
- `## 見出し`、`<h2>見出し</h2>`のようなMarkdownやHTMLは入力しない。
- この値から共通テンプレートがH2と目次リンクを自動生成する。

#### `body`：本文

`body`はHTMLソース入力欄ではなく、microCMSのリッチエディタです。次の手順で入力します。

1. 左上の書式が「段落」になっていることを確認する。
2. `<p>`や`</p>`を含まない本文だけを貼り付ける。
3. 段落を分ける位置では`Enter`を押す。
4. 同じ段落内で改行だけを入れる場合は`Shift + Enter`を押す。
5. 貼り付け後、`<p>`、`<code>`などのタグが文字として見えていないことを確認する。

次のようなHTML文字列を、そのまま本文欄へ貼り付けてはいけません。

```html
<p>本文です。</p><p>次の段落です。</p>
```

microCMSではタグを除いた次の内容を、通常の段落として入力します。

```text
本文です。

次の段落です。
```

HTMLタグが文字として表示された場合は、その内容を削除し、タグを除いた本文を貼り直します。HTMLをコードブロックへ変更して解決しようとしないでください。

#### 本文内の書式を設定する

| 表現 | microCMSでの操作 | 貼り付ける内容 |
| --- | --- | --- |
| 通常の段落 | 書式を「段落」にして入力 | 本文だけ。`<p>`タグは不要 |
| 段落内の短いコード | 対象文字を選択し、インラインコードのボタンを押す | `rgba`や`npm run check`など、コード文字列だけ |
| 複数行コード | 新しい空行を作り、「コードブロック」を選んでから貼り付ける | コード本体だけ。`<pre><code>`タグやMarkdownのバッククォートは不要 |
| 箇条書き | 項目を1行ずつ入力・選択し、箇条書きボタンを押す | 各項目の文章だけ。`<ul>`と`<li>`は不要 |
| 番号付きリスト | 項目を1行ずつ入力・選択し、番号付きリストボタンを押す | 各項目の文章だけ。`<ol>`と`<li>`は不要 |
| リンク | リンクにする文字を選択し、リンクボタンからURLを設定 | `<a>`タグは不要 |
| 表 | 表ボタンから行・列を作り、各セルへ入力 | `<table>`などのHTMLタグは不要 |
| 画像 | 画像ボタンからmicroCMSメディアを選択 | `<img>`タグや画像URLの直貼りは行わない |
| H3・H4 | 段落メニューから必要な見出しレベルを選ぶ | 見出し本文だけ。H1・H2は使用しない |

コードブロックの前後は通常の段落へ戻っていることを確認します。記事全体の本文をコードブロックにしないでください。

インラインコードとして指定された文字列は、すでに入力した本文内の該当箇所を選択して書式を設定します。書式対象の一覧を本文末尾へもう一度貼り付けないでください。例えば本文内に`rgb(74 111 165 / 0.5)`がある場合、その文字列を本文中で選択して「コード」を押します。別の行へ同じ文字列を追加する操作ではありません。

箇条書きは、前の段落やインラインコードと確実に分離してから作成します。

1. 前の段落の末尾へカーソルを置き、`Enter`を押して新しい段落を作る。
2. `Shift + Enter`は使用しない。
3. 空の新規段落で「リスト」ボタンを押す。
4. 1件目を入力し、`Enter`で次のリスト項目を作る。
5. 最後の項目まで同じ操作を繰り返す。
6. リスト終了後は空の項目で`Enter`をもう一度押し、通常の段落へ戻す。

既存の複数行を選択してリスト化すると、改行方法によって直前の段落まで同じリスト項目になる場合があります。手動入力では空の新規段落をリストへ変更してから、項目を1件ずつ入力する方法を優先します。

#### `calloutLabel`と`calloutBody`：補足表示

- 補足が不要なセクションは両方とも空欄にする。
- 補足が必要な場合、`calloutLabel`へ`PROCESS`、`SCOPE`などの短いラベルを入力する。
- `calloutBody`は`body`と同じリッチエディタ操作で、HTMLタグを付けずに本文を入力する。
- 片方だけを入力するとビルドエラーになるため、必ず両方をセットで入力する。
- CTAは共通テンプレートが最終セクションへ追加するため、calloutとして手入力しない。

### 本文作成時の注意

- `body`ではH1・H2を使用しない。セクション見出しは`heading`へ入力する。
- `sectionNumber`は記事内で重複させない。
- `calloutLabel`と`calloutBody`は、両方入力するか両方空欄にする。
- コードブロック、リスト、表、引用、画像、H3・H4は使用できる。
- 本文画像はHTTPSのURLを使用する。
- 記事末尾のCTAは自動生成されるため、最後の本文へ重複して追加しない。
- AIや資料から受け取った原稿にHTMLタグが付いている場合は、リッチエディタ用の本文とHTMLデータを区別する。
- 手動入力時は必ず「貼り付ける本文」と「エディタ上で設定する書式」の両方を確認する。

既存記事に合わせる場合は、次の6セクション構成を目安にします。内容に応じて増減できます。

1. `01 / PURPOSE`：作る理由、解決したい課題
2. `02`：設計方針、入力や基準
3. `03`：主要ロジック、処理の流れ
4. `04`：表示、精度、操作設計
5. `05 / VALIDATION`：境界値、エラー、アクセシビリティ検証
6. `06 / RESULT`：実装結果、判断、今後の課題

## 公開前チェック

- [ ] `displayStatus`が`published`
- [ ] `logNumber`が`BUILD_LOG_###`形式で重複していない
- [ ] `slug`が小文字英数字とハイフンだけで重複していない
- [ ] `title`、`summary`、`category`を入力した
- [ ] `readingTime`が1以上の整数
- [ ] `ctaType`が記事カテゴリーに適した値になっている
- [ ] `tool`の場合は`relatedToolId`、`ctaLabel`、`ctaDescription`を入力した
- [ ] `link`の場合はHTTPSの`ctaUrl`、`ctaLabel`、`ctaDescription`を入力した
- [ ] `none`の場合はCTA関連項目をすべて空欄にした
- [ ] `sections`が1件以上ある
- [ ] 各`sectionNumber`が2桁で重複していない
- [ ] 各セクションに`sectionLabel`、`heading`、`body`がある
- [ ] calloutはラベルと本文をセットで入力した
- [ ] 本文内にH1・H2を作っていない
- [ ] 本文や補足欄に`<p>`、`<code>`などのHTMLタグが文字として表示されていない
- [ ] コード本体だけがコードブロックになっており、段落全体がコードブロックになっていない
- [ ] リスト、リンク、表、画像をリッチエディタの各機能で設定した
- [ ] セクションの並び順が`01`から昇順になっている
- [ ] OGP画像を設定する場合は内容と表示を確認した

## 公開と自動デプロイ

### ブラウザ操作と確認ダイアログの担当

microCMSの公開、公開中コンテンツの更新、公開終了、削除をブラウザで行う場合は、操作担当を画面の状態から推測させず、チャット上で次のいずれかを明示します。

| 状態表示 | 操作担当 | ユーザーが行うこと |
| --- | --- | --- |
| `確認待ち` | ユーザーはチャットで承認 | 対象と影響を確認し、実行可否を返信する。画面上のボタンは押さない |
| `実行中` | 作業担当者 | 画面操作は不要。完了報告を待つ |
| `ユーザー操作待ち` | ユーザー | 指定された画面上のボタンを1回だけ押し、完了したことを返信する |

公開や削除の直前確認が必要な場合は、対象、実行内容、復元可否を提示して承認を得ます。承認後は`実行中／画面操作は不要`と明記し、作業担当者が確認ダイアログを確定します。自動操作で確定できない場合だけ、`ユーザー操作待ち`へ切り替え、押すボタン名と回数を具体的に伝えます。

#### タイムアウト時の打ち切り条件

1. 確認ダイアログでタイムアウトしても、元の「公開」または「削除」は連打しない。
2. ダイアログが残っているかを1回だけ確認する。
3. 残っている場合は、確定操作を1回だけ再試行する。
4. 同じダイアログ操作が2回連続で失敗するか、60秒間進展しない場合は自動操作を打ち切る。
5. 打ち切り時は、対象タブをそのまま残し、`ユーザー操作待ち／表示中の「OK」を1回押してください`と明示して引き継ぐ。
6. ユーザー操作と自動操作が競合しないように、引き継ぎ後は完了連絡を受けるまで追加クリックを行わない。

#### 再試行と検証の上限

- microCMSの編集には同じ管理画面タブを再利用し、確認ダイアログ回避のための重複タブを作らない。
- 保存確認は、対象記事の再読み込み後に変更フィールドを1回確認する。
- 削除確認は、コンテンツ一覧で件数と対象タイトルの不在を1回確認する。削除済みURLを繰り返し開かない。
- 複数記事を連続変更する場合、GitHub Actionsと公開ページは各記事ごとではなく、最後のmicroCMS操作後にまとめて確認する。
- GitHub Actionsは最新の`repository_dispatch`について`build`と`deploy`を1回確認する。成功後に同じ実行を別画面で重複確認しない。
- 公開一覧で件数、識別子、タイトル、リンクが確認できる場合は、その情報を正式な確認結果とする。slugや本文を変更していない記事の詳細ページをすべて開き直さない。
- ブラウザ情報は対象のボタン、フィールド、一覧行に絞って取得し、記事本文を含む画面全体の情報を繰り返し取得しない。

このルールにより、確認ダイアログが不安定な場合でも、無制限な再試行、二重操作、重複タブ、過剰な再検証を防ぎます。

1. microCMS右上の「公開」を押す。
2. WebhookがGitHubへ`microcms_build_logs_update`を送信する。
3. GitHub Actionsの[Build and deploy GitHub Pages](https://github.com/satoshi0gawa/mark-bench-prototype/actions/workflows/pages.yml)を開く。
4. 最新実行が`repository_dispatch`で開始されたことを確認する。
5. 次のジョブが両方`Success`になるまで待つ。
   - `build`
   - `deploy`

ビルドでは、microCMSの全BUILD LOGを取得し、入力値の検証、リッチテキストの無害化、一覧・詳細HTMLの生成、リンク検証を行います。条件を満たさない投稿が1件でもある場合は、公開前に処理を停止します。

## 公開ページを確認する

### 一覧

[https://satoshi0gawa.github.io/mark-bench-prototype/build-logs/](https://satoshi0gawa.github.io/mark-bench-prototype/build-logs/)

確認項目：

- 新しい記事が公開記事の一覧に表示される。
- `logNumber`、タイトル、表示日が正しい。
- 公開記事は日付の新しい順になっている。
- 一覧下部に`MICROCMS DATA`と表示されている。

### 詳細

```text
https://satoshi0gawa.github.io/mark-bench-prototype/build-logs/{slug}.html
```

確認項目：

- ページタイトル、概要、日付、読了時間、カテゴリーが正しい。
- 目次と本文セクションが一致する。
- コード、リスト、表、画像、calloutが崩れていない。
- `tool`または`link`では、最終セクションにCTAが表示され、正しいリンク先へ移動できる。
- `none`では、最終セクションにCTAが表示されない。
- PC、Tablet、SP幅で既存レイアウトを維持している。

### 公開確認後の分岐

- リポジトリ内の変更がない：記事公開作業を完了する。空コミットや不要なpushは行わない。
- リポジトリ内の変更がある：フェーズ6へ進み、差分と検証結果を確認してから、承認された変更だけをコミット・pushする。
- 変更が今回の記事制作と無関係：既存変更をステージ、修正、破棄せず、そのまま残して報告する。

## 予定記事を先に登録する場合

詳細ページをまだ公開せず、一覧へ`PLANNED`として表示したい場合は、microCMS上ではコンテンツを公開したうえで次を設定します。

- `displayStatus`：`planned`
- `logNumber`：`BUILD_NOTE_XXX`
- `title`：必須
- `slug`：必須かつ重複不可
- `category`：必須
- `plannedOrder`：予定記事同士の表示順

`planned`からは詳細HTMLを生成しません。`summary`、`readingTime`、CTA、本文セクションは未入力でも構いません。

### 予定記事を公開記事へ変更する

既存の予定記事を新規作成し直さず、同じコンテンツを編集します。

1. `displayStatus`を`planned`から`published`へ変更する。
2. `logNumber`を未使用の`BUILD_LOG_###`へ変更する。
3. `summary`と`readingTime`を入力する。
4. カテゴリーに応じて`ctaType`と必要なCTA項目を入力する。
5. `sections`を1件以上追加する。
6. `plannedOrder`は空欄にしてよい。
7. 公開前チェックを実施して公開する。
8. GitHub Actionsと公開ページを確認する。

同じ`slug`を維持すれば、公開後の詳細URLは予定登録時に決めた値をそのまま使用できます。

## 公開後に修正する場合

1. microCMSの対象コンテンツを編集する。
2. `slug`以外の必要項目を修正する。
3. 「公開」を押す。
4. WebhookによるGitHub Actionsの成功を確認する。
5. 公開ページを再読み込みして反映を確認する。

`slug`を変更すると詳細ページのURLも変わり、以前のURLは次回デプロイ後に存在しなくなります。URL変更が必要な場合は、リンク元やリダイレクト方針を先に検討します。

## 失敗時の確認順

### GitHub Actionsが起動しない

1. microCMSの`API設定 > Webhook`で`GitHub Pages deploy`が有効か確認する。
2. Fine-grained PATの有効期限を確認する。
3. Webhook設定のユーザー名、リポジトリ名、トリガーイベント名を確認する。
4. 必要に応じてGitHub Actionsの`Run workflow`を手動実行する。

PATの交換方法は`github-pat-rotation.md`を参照してください。

### `Build from microCMS`が失敗する

Actionsログに表示されたコンテンツIDとエラー項目を確認し、microCMSの投稿を修正します。

主な原因：

- 必須項目が空欄
- CTA種別とカテゴリーの組み合わせが不正
- `tool`で`relatedToolId`が未選択、またはカタログに存在しない
- `link`で`ctaUrl`が空欄、HTTPSではない、またはURLとして不正
- `none`で関連ツール、CTA文言、説明、URLのいずれかが残っている
- `logNumber`、`slug`、`sectionNumber`の形式が不正
- `logNumber`または`slug`が別記事と重複
- calloutのラベルと本文が片方だけ入力されている
- `readingTime`が整数ではない、または1未満

修正して公開するとWebhookが再実行されます。Webhookが実行されない場合は、GitHub Actionsから`Re-run failed jobs`または`Run workflow`を実行します。

### デプロイ成功後に表示が古い

1. Actionsの最新実行が`Success`か確認する。
2. ブラウザを再読み込みする。
3. URLの`slug`がmicroCMSと一致しているか確認する。
4. BUILD LOGS一覧下部が`MICROCMS DATA`になっているか確認する。

## 運用上の注意

- BUILD LOG原稿の正本はmicroCMSとする。
- `build-logs/*.html`を新しい記事の原稿として追加しない。
- `dist/`は生成物なので直接編集しない。
- APIキーやPATを本文、リポジトリ、スクリーンショットへ記載しない。
- 新しい`relatedToolId`を追加する場合だけ、先にリポジトリ側のツールカタログ変更が必要。
- `SITE`以外の公開記事はツールCTAを必須とし、一般記事のために無関係なツールを指定しない。
- 公開終了または削除後はWebhookの成功と、公開サイトから対象ページが消えたことを確認する。
- ブラウザ操作では、`確認待ち`、`実行中`、`ユーザー操作待ち`のいずれかと操作担当を必ず明示する。
- 確認ダイアログの自動操作は最大2回、または進展のない状態で最大60秒までとし、超過時はユーザー操作へ明示的に引き継ぐ。
- ローカル変更のコミット・pushは自動実行せず、対象差分と検証結果を提示して承認を得る。コミットが承認された場合は、ローカル限定の指定がない限りpushまで完了する。
- 今回の作業に属さない既存変更は、ステージ、修正、破棄しない。

## 関連資料

- `../microcms-setup.md`：microCMSスキーマとGitHub Pages初期設定
- `build-log-implementation-request-template.md`：関連ツール調査から公開確認までの再利用可能な依頼文
- `github-pat-rotation.md`：Webhook用GitHub PATの期限確認・交換
- `../../scripts/lib/build-log-content.mjs`：入力値の検証と並び順
- `../../scripts/templates/build-log-pages.mjs`：一覧・詳細HTMLテンプレート
- `../../scripts/config/tools.mjs`：関連ツールIDの正本
- `../../.github/workflows/pages.yml`：ビルドとGitHub Pagesデプロイ

# BUILD LOG「[記事タイトル]」制作・公開準備依頼

共有ディレクトリ内のMARK BENCHプロジェクトを確認し、関連ツールまたはサイト機能の実装内容に基づいたBUILD LOG記事を作成してください。

記事はmicroCMSを原稿の正本とし、GitHub Actionsで静的HTMLへ生成します。`build-logs/*.html`、`build-logs/index.html`、`dist/`を記事ごとに手作業で更新しないでください。

## 基本情報

- 記事タイトル：[記事タイトル]
- slug：[例：tool-design-guide]
- 関連ツール：[ツール名。SITEで関連ツールがない場合は「なし」]
- 関連ツールID：[例：tool-name。該当しない場合は空欄]
- 関連ツールURL：[例：../tools/tool-name.html。該当しない場合は空欄]
- カテゴリ：[TEXT TOOLS / CODE TOOLS / CSS TOOLS / SITE]
- 表示日：[YYYY.MM.DD、またはmicroCMS公開日時を使用]
- 想定読了時間：[例：7]
- 記事の目的：[設計・実装・検証のうち、この記事で整理する内容]
- 公開区分：[published / planned]
- CTA種別：[tool / link / none。SITE以外はtool]
- CTAリンク先：[関連ツールID、任意のHTTPS URL、またはなし]
- 参考資料：
  - [関連ファイル、仕様、URL、検証結果など]

## 最初に確認するもの

次を最後まで確認してください。

- `README.md`
- `PROJECT-HANDOFF.md`
- `docs/operations/build-log-publishing.md`
- `scripts/lib/build-log-content.mjs`
- `scripts/templates/build-log-pages.mjs`
- `scripts/config/tools.mjs`
- 対象ツールまたはサイト機能のHTML、CSS、JavaScript
- 対象ツールまたはサイト機能に対応する検証スクリプト

既存記事の構造と品質は、次の公開ページを基準にしてください。

- `https://satoshi0gawa.github.io/mark-bench-prototype/build-logs/case-style-guide.html`
- `https://satoshi0gawa.github.io/mark-bench-prototype/build-logs/px-rem-converter.html`

## 調査方針

関連ツールまたはサイト機能のHTML、CSS、JavaScriptと検証コードを実際に確認し、実装内容に基づいた読み物として構成してください。

次の内容を具体的に整理してください。

- 制作・検証した理由
- 解決する要件と課題
- 採用した設計と、必要に応じて検討した選択肢
- 処理方法またはデータ構造
- UI、バリデーション、例外処理
- アクセシビリティ上の対応
- 実際に検証した入力値と操作
- 実装から得た判断と残る制約

一般論だけの記事や、実装と一致しない処理・検証結果は記載しないでください。コードブロックは理解に必要な範囲だけを掲載してください。

重大な判断事項がなければ構成案だけで停止せず、microCMSへ入力できる完成原稿と公開前チェックまで作成してください。

## 命名規則

- 一覧ページ：`BUILD LOGS`
- 個別記事：`BUILD LOG`
- 一覧ページラベル：`LOG_ARCHIVE`
- 公開記事識別子：重複しない`BUILD_LOG_###`
- 予定記事識別子：`BUILD_NOTE_XXX`
- slug：小文字英数字とハイフンのみ。`.html`は含めない

新しい公開記事番号は、既存のmicroCMS投稿と重複しないことを確認して確定してください。

## 記事構成

内容に合わせて調整できますが、基本的には次の流れで構成してください。

1. 制作・検証した理由
2. 要件と課題
3. 採用した設計
4. 処理方法またはデータ構造
5. UI、バリデーション、例外処理
6. 検証した入力値と操作
7. 実装から得た判断
8. 関連先へのCTA（`none`の場合は不要）

各本文セクションについて、次を用意してください。

- `sectionNumber`：`01`から始まる重複しない2桁
- `sectionLabel`：短い英字ラベル
- `heading`：セクション見出し
- `body`：microCMSリッチエディタへ入力する完成本文
- `calloutLabel`と`calloutBody`：必要な場合のみ両方

本文内ではH1・H2を使用しないでください。H1はページタイトル、H2は`heading`から共通テンプレートが生成します。

### microCMSへの入力方法も項目別に提示する

完成原稿を提示するときは、値だけを列挙せず、microCMSでの入力操作を次の粒度で明記してください。

- トップレベルの各フィールドについて、入力欄の種類、入力値、空欄にする項目を示す。
- `sections`は追加する件数と順番を示す。
- 各セクションについて、`sectionNumber`、`sectionLabel`、`heading`を別々に示す。
- `body`はmicroCMSリッチエディタへ貼り付けるタグなしの本文を、段落単位で示す。
- 段落、インラインコード、コードブロック、リスト、リンク、表、画像について、どの範囲を貼り付け、どのツールバーボタンで書式を付けるかを示す。
- インラインコード対象は本文中の既存文字列を選択する操作であり、対象文字列を別行へ重複して貼り付けないことを明記する。
- リストは前の段落で`Enter`を押して新規段落を作り、先にリストボタンを押してから項目を1件ずつ入力する手順を示す。リスト作成時に`Shift + Enter`を使わせない。
- コードブロックはコード本体だけを提示し、`<pre><code>`やMarkdownのバッククォートを貼り付けないよう明記する。
- `calloutLabel`と`calloutBody`は、入力する場合と空欄にする場合を明示する。
- HTML形式の機械入力データを併記する場合は、リッチエディタへそのまま貼り付けるデータではないことを明記する。

ユーザーがHTML、Markdown、リッチエディタの違いを理解している前提にしないでください。手動入力用の原稿では、`<p>`、`<code>`、`<ul>`などのHTMLタグを本文として貼り付けさせず、microCMSのリッチエディタで対応する書式を設定する手順まで案内してください。

## microCMS入力データ

公開記事の場合は、次のフィールドをすべて確定してください。

- `displayStatus: published`
- `logNumber`
- `title`
- `slug`
- `summary`
- `category`
- `displayDate`
- `readingTime`
- `ctaType`
- `relatedToolId`
- `ctaLabel`
- `ctaDescription`
- `ctaUrl`
- `ogImage`（任意）
- `sections`

予定記事の場合は、次を最低限確定してください。

- `displayStatus: planned`
- `logNumber: BUILD_NOTE_XXX`
- `title`
- `slug`
- `category`
- `plannedOrder`

`relatedToolId`は`scripts/config/tools.mjs`に存在するキーだけを使用してください。存在しない場合は、記事公開より先にツールページとカタログ追加が必要であることを報告してください。

`TEXT TOOLS`、`CODE TOOLS`、`CSS TOOLS`は`ctaType: tool`を必須とします。`SITE`では次から選択してください。

- `tool`：登録済みツールを案内する。
- `link`：`ctaUrl`に指定したHTTPSページを案内する。
- `none`：CTAを表示せず、CTA関連項目をすべて空欄にする。

## 静的ページの共通仕様

次の構造と挙動は共通テンプレート、CSS、JavaScriptが生成・提供します。記事ごとにHTMLへ再実装しないでください。

- `header.article-header`
- `aside.article-toc`
- `div.article-body`
- セクションの`aria-labelledby`と一意なID
- 目次から各セクションへのアンカー
- 最終セクションのCTA（`none`の場合は生成しない）
- ページヘッダー、目次、各セクションのReveal
- セクション内要素の約80ms間隔の段階表示
- `prefers-reduced-motion`対応
- PC、Tablet、SPのレイアウト
- 既存のヘッダー、パンくず、左右サイトレール

既存のリッチエディタ要素で表現できない新しいUIが必要な場合だけ、テンプレート、CSS、JavaScriptの変更案と全記事への影響を説明してください。重大な影響がなければ、必要な実装と検証まで進めてください。

## CTA

最終セクションのCTAが必要な場合は、次の値を作成してください。

- `ctaType`：`tool`、`link`、`none`のいずれか
- `relatedToolId`：リンク先を決定するツールID
- `ctaUrl`：`link`の場合のHTTPS URL
- `ctaLabel`：ボタン文言
- `ctaDescription`：ツールまたはリンク先の内容を簡潔に説明する文章

`tool`では`relatedToolId`を使用し、`link`では`ctaUrl`を使用します。`none`ではCTAを生成しません。配色、ホバー／フォーカス、矢印アニメーションは共通実装を使用します。ページ最下部の関連投稿セクションは追加しません。

## 公開作業

microCMSへの入力または認証操作がユーザーに必要な場合は、完成したフィールド値、タグなしの本文、リッチエディタ上で設定する書式、セクション追加順を提示して操作を依頼してください。APIキーやPATをチャット、ファイル、スクリーンショットへ記載しないでください。

公開後は次を確認してください。

1. WebhookからGitHub Actionsが`repository_dispatch`で起動した。
2. `build`と`deploy`が`Success`になった。
3. BUILD LOGS一覧に記事が正しい順序と件数で表示された。
4. `/build-logs/{slug}.html`が表示された。
5. 目次と各セクションが正常に動作し、CTAがある場合はリンク、`none`の場合は非表示を確認した。

一覧HTMLや件数はビルド時に自動生成されます。`build-logs/index.html`や`dist/`を手作業で更新しないでください。

## 公開後のローカル変更とGitHub反映

公開ページの確認後、`git status --short`でリポジトリ内の変更を確認してください。

- microCMSの投稿だけを変更し、ローカルファイルの変更がない場合は、コミット・pushを行わず、その旨を報告してください。
- 運用資料、テンプレート、CSS、JavaScript、検証コードなどを変更した場合は、今回の作業に属するファイルだけを特定してください。
- APIキー、PAT、Secret、個人情報、`dist/`、記事ごとの手書きHTMLが差分へ含まれていないことを確認してください。
- 今回の作業に属さない既存変更は、ステージ、修正、破棄しないでください。

ドキュメントだけを変更した場合は、少なくとも差分確認と`git diff --check`を実行してください。コード、テンプレート、スキーマ、Workflowを変更した場合は、本依頼の検証コマンド一式を実行してください。

コミット・pushが必要な場合は、実行前に次を提示してください。

1. 反映対象ファイル
2. 変更内容の要約
3. 検証結果
4. コミットメッセージ案
5. push先ブランチ

ユーザーの明示的な承認後、対象ファイルを個別にステージしてコミット・pushしてください。`git add .`や`git add -A`は使用しないでください。

`main`へpushすると、Pages用GitHub Actionsが`push`イベントで再実行されます。microCMS公開時の`repository_dispatch`とは別に、push後の`build`と`deploy`が`Success`になり、公開ページに退行がないことまで確認してください。

## 検証項目

- 調査内容が実際の実装と一致している
- 記事番号とslugが重複していない
- 公開記事の必須フィールドをすべて入力した
- 目次と本文セクションが一致している
- コード、リスト、表、画像、calloutが必要な範囲で表示される
- 各セクションへの直接アクセスで本文が表示される
- `tool`のCTAが正しいTOOLS詳細ページへ移動する
- `link`のCTAが正しいHTTPSページへ移動する
- `none`ではCTAが表示されない
- 見出し階層と読み上げ順が正しい
- PC、Tablet、SPで横スクロールや欠落がない
- `prefers-reduced-motion`で本文が非表示にならない
- コンソールエラーがない
- BUILD LOGS一覧の表示順、リンク、件数が正しい
- 一覧下部が`MICROCMS DATA`になっている

テンプレートやコードを変更した場合は、少なくとも次を実行してください。

```bash
npm run check
npm run check:detail
npm run test:build-logs
npm run build
npm run check:dist
```

## 最終報告

最後に次を報告してください。

- 確認した関連ツールの実装ファイル
- 採用した記事構成
- 作成したmicroCMSフィールド値と本文セクション
- コード変更の有無と変更ファイル
- GitHub Actionsと公開ページの検証結果
- リポジトリ反映状況（不要／承認待ち／コミット・push完了）
- 反映した場合はコミットSHA、push先、push後のGitHub Actions結果
- 残課題または未確認事項

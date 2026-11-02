# microCMS導入 仕様設計・検討メモ

## 1. この文書の位置づけ

MARK BENCHの`NOTE to SELF`をmicroCMSで管理し、静的HTMLとしてGitHub Pagesへ公開するための仕様設計・検討メモである。

初期導入では`NOTE to SELF`だけを`blog` APIで管理する。現行の`build-notes/note-to-self/test-notetoself-00.html`を詳細ページの基準とする。`CODING NOTE`はmicroCMS管理の対象外とし、サイトごとに個別の静的HTMLを作成する。

本書では、以下を区別して記載する。

- **確定**：現時点の実装方針として採用する
- **暫定**：fixture検証後に確定する
- **将来対応**：初期導入の対象外とする

## 2. 目的

- 記事本文、目次、参照リンクをmicroCMSから管理できるようにする
- 現行のNOTE to SELF詳細ページのデザインとHTML構造を維持する
- 記事ごとにREFERENCESの有無を管理できるようにする
- SP表示幅でテーブルだけを左右スクロール可能にする
- ブラウザへmicroCMSのAPIキーを公開しない
- JavaScriptが無効でも本文を読める静的HTMLを生成する
- 更新・削除・非公開を一覧と詳細ページへ正しく反映する

## 3. 対象範囲

### 初期導入の対象

- `build-notes/note-to-self/`の記事詳細
- `build-notes/note-to-self/index.html`の記事一覧
- `build-notes/index.html`内のNOTE to SELF最新記事一覧
- microCMS Content APIからの取得
- ローカルfixtureによる生成確認
- GitHub Actionsによる静的生成とGitHub Pagesへのデプロイ
- microCMS Webhookによる更新起動
- `workflow_dispatch`による手動再生成

### 初期導入の対象外

- TOOLSのmicroCMS管理
- ABOUTのmicroCMS管理
- CODING NOTEの記事詳細・一覧（個別静的ページとして管理）
- ブラウザからのContent API直接取得
- サイト内検索
- コメント、会員機能
- 関連記事の自動推薦
- 下書きプレビュー専用画面

## 4. 全体構成

**確定**：microCMSのデータはビルド時に取得し、公開物は静的HTMLとする。

```text
microCMSで記事を公開・更新・削除
  -> Webhook
GitHub Actionsを起動
  -> SecretsからAPI情報を取得
  -> Content APIから全公開記事を取得
  -> データを検証・正規化
  -> 一覧・詳細HTMLをdist/へ生成
  -> ローカルリンクとHTML構造を検証
GitHub Pagesへデプロイ
```

APIキーはGitHub Actions Secretsで管理し、HTML、クライアントJavaScript、ログへ出力しない。

## 5. BUILD NOTESの記事モデル

### API形式

**確定**：ブログ、ニュースのように複数記事を管理する「リスト形式API」を使用する。

API名・エンドポイント：`blog`

### 記事フィールド

| フィールドID | 表示名 | microCMSの型 | 必須 | 用途・生成規則 |
| --- | --- | --- | --- | --- |
| `title` | タイトル | テキストフィールド | 必須 | `h1`、`title`、パンくずへ使用 |
| `slug` | スラッグ | テキストフィールド | 必須 | 詳細ページのファイル名。半角小文字、数字、ハイフンのみ許可 |
| `themeLabel` | テーマラベル | テキストフィールド | 必須 | ページヘッダーの`p.section-index`へ表示。例：`GITHUB PAGES` |
| `summary` | 概要 | テキストエリア | 必須 | meta description、一覧概要、記事リードへ使用 |
| `category` | カテゴリー | テキストフィールド | 必須 | 記事の分類ラベル |
| `sections` | 本文セクション | 繰り返しフィールド | 必須 | 1件以上。後述の`articleSection`を順番に保持 |
| `references` | 参照リンク | 繰り返しフィールド | 任意 | 0件ならREFERENCES全体を出力しない |
| `relatedTool` | 関連ツール | カスタムフィールド | 任意 | 関連ツールCTA。未登録ならCTAを出力しない |
| `relatedWebPart` | 関連WEB PARTS | カスタムフィールド | 任意 | 関連WEB PARTS CTA。未登録ならCTAを出力しない |
| `seo` | SEO設定 | カスタムフィールド | 任意 | SEOタイトル、SEO概要、OGP画像。未登録項目は通常フィールドと共通画像へフォールバック |

公開日の表示にはmicroCMS標準の`publishedAt`を使用する。`createdAt`は投稿日として使用しない。`updatedAt`は初期表示に含めない。

現在の`note-meta`は投稿日だけを表示するため、`readingTime`と公開状態の専用フィールドは設けない。

### 本文セクション用カスタムフィールド

カスタムフィールド名：`articleSection`

| フィールドID | 表示名 | 型 | 必須 | 用途 |
| --- | --- | --- | --- | --- |
| `label` | セクションラベル | テキストフィールド | 任意 | `OVERVIEW`、`REPOSITORY`など |
| `heading` | セクション見出し | テキストフィールド | 必須 | `h2`と目次リンク文言へ使用 |
| `body` | 本文 | リッチエディタ | 必須 | 段落、リンク、リスト、コード、テーブルを入力 |
| `calloutLabel` | 補足ラベル | テキストフィールド | 任意 | 補足本文とセットで入力 |
| `calloutBody` | 補足本文 | リッチエディタ | 任意 | 補足ラベルとセットで入力 |

表示番号はCMSへ入力せず、`sections`の配列順から`01`、`02`の形式で自動生成する。`label`が空の場合は番号だけを表示する。

初期実装のセクションIDは`section-1`、`section-2`のように自動生成し、CMSへアンカーを重複入力しない。

### 参照リンク用カスタムフィールド

カスタムフィールド名：`referenceLink`

| フィールドID | 表示名 | 型 | 必須 | 用途 |
| --- | --- | --- | --- | --- |
| `label` | リンク名 | テキストフィールド | 必須 | REFERENCESのリンクテキスト |
| `url` | URL | テキストフィールド | 必須 | `http:`または`https:`のみ許可 |

`references`は`referenceLink`を選択する繰り返しフィールドとする。別途`showReferences`のような表示スイッチは設けない。

### 関連ツール用カスタムフィールド

**暫定**：TOOLSはmicroCMS管理の対象外であるため、コンテンツ参照ではなくローカルページへリンクするカスタムフィールドとして開始する。

カスタムフィールド名：`relatedTool`

| フィールドID | 表示名 | 型 | 必須 | 用途 |
| --- | --- | --- | --- | --- |
| `toolId` | ツールID | テキストフィールド | 必須 | `tools/{toolId}.html`の識別子 |
| `label` | CTA文言 | テキストフィールド | 必須 | CTAの表示テキスト |
| `description` | CTA概要 | テキストエリア | 必須 | CTAの説明文 |

TOOLSも将来microCMSへ移行する場合は、コンテンツ参照への変更ではなく新フィールドを作成して移行する。microCMSでは既存フィールドの種類を後から変更できないためである。

### 関連WEB PARTS用カスタムフィールド

WEB PARTSはGit側の静的ページとして管理するため、関連ツールと同様にローカルページへリンクするカスタムフィールドとする。

カスタムフィールド名：`relatedWebPart`

| フィールドID | 表示名 | 型 | 必須 | 用途 |
| --- | --- | --- | --- | --- |
| `partId` | WEB PARTS ID | テキストフィールド | 必須 | `web-parts/{partId}.html`の識別子 |
| `label` | CTA文言 | テキストフィールド | 必須 | CTAの表示テキスト |
| `description` | CTA概要 | テキストエリア | 必須 | CTAの説明文 |

記事には`relatedTool`または`relatedWebPart`のどちらか一方だけを登録する。両方が入力された場合は、CTAの重複を避けるためビルドエラーとして扱う。

## 6. 生成後のHTML構造

基準ファイル：`build-notes/note-to-self/test-notetoself-00.html`

```text
article.article-layout
  header.article-header
    p.section-index                 <- themeLabel
    h1                              <- title
    p.article-header__lead          <- summary
    div.note-meta                   <- publishedAt
  aside.article-toc
    CONTENTS
    ol                              <- sectionsから自動生成
    div.article-toc__references     <- referencesがある場合だけ生成
  div.article-body
    section.article-section         <- sectionsを順番に生成
  footer.page-footer                <- テンプレート固定
```

パンくず、主要ナビゲーション、共通ページフッターはCMSで管理せず、テンプレート側で生成する。

NOTE to SELFの本文は自分用の備忘録として「である調」で統一する。機械的な語尾変換は行わず、公開前の編集ルールとして管理する。

## 7. 条件表示

### REFERENCES

**確定**：`references`が1件以上の場合だけ`div.article-toc__references`を生成する。

```js
if (article.references?.length > 0) {
  // REFERENCES見出しとリンクリストを生成する
}
```

0件の場合は、空の見出し、空のリスト、区切り線を残さない。リンクの表示順はmicroCMSの繰り返しフィールドの順番を使用する。

### 関連ツールCTA

`relatedTool`が有効な場合だけCTAを生成する。入力が不完全な場合はビルドエラーとして扱い、リンク切れのCTAを公開しない。

### 関連WEB PARTS CTA

`relatedWebPart`が有効な場合だけ最終セクションの末尾へCTAを生成する。リンク先は`web-parts/{partId}.html`とし、入力が不完全な場合、対象ファイルが存在しない場合、`relatedTool`と同時入力された場合はビルドエラーとして扱う。

### OGP画像

`seo.ogImage`がある場合は記事固有画像を使用し、ない場合はサイト共通画像へフォールバックする。

## 8. CONTENTSの生成

**確定**：CONTENTSをCMSへ重複入力せず、`sections`から自動生成する。

- 目次の順番：`sections`の配列順
- リンク文言：`heading`
- リンク先：生成したセクションID
- 空の`heading`：スキーマ上必須とし、取得後の検証でもエラーにする
- セクション0件：公開可能な記事として扱わない

この方法により、目次と本文見出しの不一致を防ぐ。

## 9. リッチエディタ本文の扱い

microCMSのリッチエディタから返るHTMLは、ページテンプレートへ挿入する前に以下を処理する。

1. 値が文字列であることを検証する
2. 許可する要素と属性を確認する
3. 外部リンクのURLスキームを確認する
4. テーブルへスクロール用ラッパーを付ける
5. 見出し階層が記事テンプレートと衝突しないことを確認する

`h1`はページタイトル、`h2`はセクション見出しとしてテンプレートが生成する。リッチエディタ本文では原則として段落、`h3`以下、リスト、コード、リンク、テーブルを使用する。

**実装済み**：`sanitize-html@2.18.1`を固定依存として採用し、許可する要素・属性・CSSクラス・URLスキームを`sanitize-rich-text.mjs`で一元管理する。`h1`、`h2`、スクリプト系要素、イベント属性、`javascript:`・`data:` URLは記事モデルの検証でも拒否する。外部リンクで`target="_blank"`を使う場合は`rel="noopener noreferrer"`を強制し、画像URLはHTTPSだけを許可する。

## 10. テーブルのSP対応

**確定**：ページ全体ではなく、各テーブルだけを左右スクロール可能にする。

生成時に、リッチエディタ内の各`table`を以下の構造へ変換する。

```html
<div class="article-table-wrap" tabindex="0" role="region" aria-label="表を横にスクロールできます">
  <table>
    ...
  </table>
</div>
```

既存CSSには以下が実装済みである。

```css
.article-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.article-body table {
  width: 100%;
  min-width: 34rem;
}
```

追加候補：

```css
.article-table-wrap {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-inline: contain;
}
```

### テーブル入力ルール

- 1行目は内容に応じて見出しセルに設定する
- 行見出しが必要な場合は1列目も見出しセルに設定する
- セルへ長いURLを直接表示しない
- 表の内容を理解するために題名が必要な場合は、直前の本文で説明する
- SP幅では横スクロールを許容し、列を無理に縦積みへ変換しない
- 横スクロール領域にはキーボードフォーカス時の視認可能な表示を用意する

`caption`を編集画面から確実に管理する必要が生じた場合は、リッチエディタ内のテーブルだけで対応せず、専用の表ブロックを追加する案を再検討する。

## 11. 入力値の検証

ビルド前に最低限、以下を検証する。

### 記事単位

- `title`、`slug`、`themeLabel`、`summary`が空でない
- `slug`が`^[a-z0-9]+(?:-[a-z0-9]+)*$`に一致する
- `slug`が記事間で重複していない
- `sections`が1件以上ある
- 公開済み記事に`publishedAt`がある

### セクション単位

- `heading`と`body`が空でない
- 生成したセクションIDと目次リンクが一致している
- 本文内に`h1`がない
- 危険なURLスキームや意図しない埋め込みがない

### 参照リンク単位

- `label`と`url`がそろっている
- URLが`http:`または`https:`である
- 同一記事内で同じURLが重複していない

検証エラー時は該当記事の出力だけを黙って省略せず、ビルド全体を失敗させて記事ID、フィールド名、理由をログへ表示する。ただし本文やAPIキーはログへ出力しない。

## 12. 日付と並び順

- 表示日：`publishedAt`
- 表示形式：`YYYY.MM.DD`
- タイムゾーン：`Asia/Tokyo`
- 一覧の並び順：`publishedAt`降順
- `build-notes/index.html`：最新5件まで
- `build-notes/note-to-self/index.html`：公開済み記事を全件表示
- `build-notes/index.html`：NOTE to SELFの最新5件を生成し、静的なCODING NOTE領域は維持する

同一時刻の記事がある場合に出力順が不安定にならないよう、第二ソートキーとして`id`を使用する。

## 13. ファイル生成方針

**確定**：CMSから生成したHTMLを正本ディレクトリへ直接書き戻さず、`dist/`へ生成する。

想定する構成：

```text
scripts/
  build.mjs
  content/
    fetch-microcms.mjs
    blog-model.mjs
    render-blog.mjs
content/
  blog.fixture.mjs
microcms/
  blog-schema.json
templates/
  blog-detail.html
```

現在の`build.mjs`は静的ファイルを`dist/`へ複製している。移行時は次の順序へ変更する。

1. `dist/`を初期化
2. 共通HTML、CSS、JavaScript、TOOLSを複製
3. fixtureまたはmicroCMSからデータを取得
4. NOTE to SELFの一覧と詳細、およびBUILD NOTES入口のNOTE to SELF領域を`dist/`へ生成
5. 生成対象ディレクトリ内に古い記事が残っていないことを確認
6. 検証を実行

CMSで削除・非公開にした記事が公開先へ残らないよう、前回生成物への上書きだけで済ませず、毎回クリーンな`dist/`を作る。

## 14. ローカルfixture

Content API接続前に、microCMSのレスポンスを模したJSON fixtureで生成処理を完成させる。

fixtureには最低限、以下の3記事を用意する。

1. REFERENCESあり、テーブルあり、関連ツールあり
2. REFERENCESなし、テーブルなし、関連WEB PARTSあり
3. REFERENCESなし、テーブルなし、CTAなし
3. 長い見出し、参照リンクあり

確認項目：

- REFERENCESが0件のとき余白や点線が残らない
- 表だけがSP幅で横スクロールする
- 目次と本文のアンカーが一致する
- 長いタイトルでもPC、Tablet、SPで崩れない
- 相対リンクがGitHub Pagesのリポジトリ配下URLでも解決する
- JavaScript無効時でも本文を読める

## 15. GitHub ActionsとSecrets

使用するVariable・Secret：

- Variable：`MICROCMS_SERVICE_DOMAIN`
- Secret：`MICROCMS_API_KEY`

ワークフローの起動方法：

- `push`：テンプレート、CSS、生成処理の変更時
- `repository_dispatch`または指定されたWebhook連携：microCMS更新時
- `workflow_dispatch`：障害時の手動再実行

Content API取得失敗、検証失敗、HTML生成失敗、リンク検証失敗のいずれかが発生した場合はデプロイしない。

APIキーを含むHTTPヘッダー、完全なレスポンス、Secretsをデバッグログへ出力しない。

**実装済み**：`.github/workflows/check.yml`はfixtureによるソース検証と静的ビルドを行う。`.github/workflows/pages.yml`は`MICROCMS_SERVICE_DOMAIN`と`MICROCMS_API_KEY`が揃った場合だけ本番ビルドへ進み、片方だけの場合は失敗する。Actionは確認済みの完全コミットSHAへ固定し、権限はジョブごとに必要最小限へ限定する。microCMS更新イベント名は`microcms_blog_update`とする。

## 16. API取得時の考慮事項

- 1回100件で`totalCount`に達するまで全ページを取得する
- `orders=-publishedAt,-updatedAt,slug`を指定し、生成側でも`publishedAt`降順へ正規化する
- 1リクエスト15秒でタイムアウトする
- 429、5xx、通信失敗、タイムアウト、JSON解析失敗だけを最大3回まで指数バックオフで再試行する
- 認証・権限・URLなど429以外の4xxは再試行せず失敗させる
- `contents`、`totalCount`、ページ間の`totalCount`一致、取得件数、ID重複を検証する
- 非公開記事や下書きを公開ビルドへ含めない

## 17. セキュリティと公開上の注意

- Content APIはGitHub Actions内だけで呼び出す
- APIキーをクライアントJavaScriptへ埋め込まない
- CMS本文は信頼済み編集者の入力であっても構造とURLを検証する
- `javascript:`、`data:`など意図しないリンクスキームを拒否する
- リッチエディタHTMLを文字列連結する箇所では、CMS由来の通常テキストをHTMLエスケープする
- 画像URL、代替テキスト、外部リンクをそれぞれ検証する
- ビルドログへ記事本文やSecretsを出力しない

## 18. 下書きとプレビュー

**将来対応**：初期導入では公開済みコンテンツの静的生成を優先する。

下書きプレビューを追加する場合は、公開サイトから参照できない専用ワークフローまたは一時成果物を使用する。draftKeyやプレビュー用情報を公開HTMLのURL、クライアントJavaScript、GitHub Pagesへ含めない。

## 19. 検証コマンド

既存検証：

```bash
npm run check
npm run check:content
npm run check:sanitize
npm run check:cms-fetch
npm run check:secrets
npm run check:detail
npm run build
```

移行実装では、以下の専用検証を使用する。

```text
check:content          CMSレスポンス、fixture、microCMSスキーマの構造検証
check:sanitize         許可要素・属性・URLスキームと危険HTML除去の検証
check:cms-fetch        ページネーション、再試行、資格情報、異常レスポンスの検証
check:note-build       生成済み一覧・詳細、条件表示、アンカー、テーブルの検証
check:generated-links  dist内のローカルリンク検証
check:secrets          生成物にAPIキーやサービス情報がないことの検証
```

## 20. 導入手順

1. 本書のフィールド名と必須条件を最終確認する
2. fixtureと正規化後の内部データ形式を作成する
3. NOTE to SELFのテスト記事から詳細テンプレートを抽出する
4. fixtureから詳細ページを生成する
5. 目次、REFERENCES条件表示、テーブル変換を実装する
6. NOTE to SELF一覧とBUILD NOTES入口のNOTE to SELF領域を生成する
7. 検証スクリプトを追加する
8. microCMSでAPIとカスタムフィールドを作成する
9. Content API取得処理とSecretsを追加する
10. GitHub Actionsでビルド・デプロイする
11. Webhookと手動再実行を設定する
12. 更新、削除、非公開、API障害を検証する

## 21. 現時点の確定事項

- microCMSの`blog` APIではNOTE to SELFだけを管理する
- CODING NOTEはmicroCMS管理から分離し、個別静的ページとして作成する
- NOTE to SELFのテスト記事を詳細テンプレートの基準とする
- 1記事を複数の構造化セクションとして管理する
- CONTENTSはセクションから自動生成する
- REFERENCESは任意の繰り返しフィールドとし、0件なら全体を非表示にする
- REFERENCES専用の表示スイッチは設けない
- テーブルはリッチエディタで入力し、生成時にスクロール用ラッパーを付ける
- SP幅ではテーブル部分だけを左右スクロールさせる
- 投稿日は`publishedAt`を使用する
- 共通ナビゲーションとページフッターはテンプレートで管理する
- API取得とHTML生成はビルド時に行う
- 公開物は`dist/`へ生成し、APIキーをブラウザへ公開しない

## 22. 実装後に残る判断事項

- microCMS WebhookからGitHub Actionsを起動する具体的な方式
- API障害時の通知先
- 下書きプレビューを追加する時期

## 23. 参考資料

- [microCMS：APIの作成](https://document.microcms.io/manual/create-api)
- [microCMS：APIスキーマ設定](https://document.microcms.io/manual/api-model-settings)
- [microCMS：カスタムフィールド](https://document.microcms.io/manual/custom-field)
- [microCMS：繰り返しフィールド](https://document.microcms.io/manual/repeat-field)
- [microCMS：リッチエディタ](https://document.microcms.io/manual/rich-editor-usage)
- [microCMS：APIスキーマのエクスポート・インポート](https://document.microcms.io/manual/export-and-import-api-schema)

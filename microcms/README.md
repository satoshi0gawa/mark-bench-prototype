# microCMS `blog` API設定

## 作成するAPI

- API名：`Blog`
- エンドポイント：`blog`
- APIの型：リスト形式

API作成画面で基本情報とリスト形式を選択した後、`blog-schema.json`をインポートする。

## 設計方針

- `blog` APIはNOTE to SELF記事だけを管理する
- CODING NOTEはmicroCMSへ登録せず、`build-notes/coding-note/`へ個別静的ページを作成する
- `sections`の配列順からセクション番号とCONTENTSを生成する
- `references`が0件の場合はREFERENCES全体を出力しない
- `relatedTool`が未登録の場合はCTAを出力しない
- `relatedWebPart`が未登録の場合はWEB PARTS CTAを出力しない
- `relatedTool`と`relatedWebPart`は同時に登録しない
- SEOタイトル、SEO概要、OGP画像は任意とし、未登録時は記事の通常フィールドとサイト共通画像を使用する
- 投稿日はmicroCMS標準の`publishedAt`を使用する
- 公開状態や予定状態を独自フィールドで重複管理しない
- slugは公開後に変更しない

## 本文入力ルール

- ページの`h1`とセクションの`h2`はテンプレート側で生成する
- リッチエディタ本文では`h3`以下を使用する
- 補足ラベルと補足本文は必ずセットで入力する
- 外部リンクはHTTPまたはHTTPSを使用する
- NOTE to SELFは「である調」で統一する

取得したリッチエディタHTMLは`sanitize-html@2.18.1`の許可リストを通してからテンプレートへ挿入する。`h1`、`h2`、スクリプト系要素、イベント属性、危険なURLは検証時に拒否し、許可されていない要素・属性は生成前に除去する。

## APIキー

接続工程で、Content APIの`blog`に対するGETだけを許可したAPIキーを作成する。キーは`.env`、GitHub Secrets以外へ保存せず、HTML、JavaScript、ビルドログへ出力しない。

使用する環境変数：

```text
MICROCMS_SERVICE_DOMAIN=サービスIDまたはサービスドメイン
MICROCMS_API_KEY=GET専用APIキー
```

ローカルの`.env`は自動読込しない。シェルまたはCIから環境変数として渡す。

## ローカル検証

```bash
npm run check:content
npm run check:sanitize
npm run check:cms-fetch
npm run build:fixture
npm run check:secrets
```

実APIを使用する場合：

```bash
MICROCMS_SERVICE_DOMAIN=your-service-id \
MICROCMS_API_KEY=your-get-only-api-key \
npm run build:cms
```

API未接続でも、`content/blog.fixture.mjs`を使って内部モデル、スキーマ、生成HTMLを検証できる。

## GitHub Actions設定

リポジトリのSettingsから次を登録する。

- Actions variable：`MICROCMS_SERVICE_DOMAIN`
- Actions secret：`MICROCMS_API_KEY`

`.github/workflows/pages.yml`は両方が未登録の間はデプロイをスキップし、片方だけ登録された場合は失敗する。両方を登録した後、Actionsの`Deploy GitHub Pages`から手動実行してContent API取得と初回デプロイを確認する。

記事更新用イベント名は`microcms_blog_update`とする。Webhook連携は初回デプロイ確認後に設定する。

## 参考

- [APIスキーマのエクスポート／インポート](https://document.microcms.io/manual/export-and-import-api-schema)
- [APIスキーマ設定](https://document.microcms.io/manual/api-model-settings)
- [繰り返しフィールド](https://document.microcms.io/manual/repeat-field)

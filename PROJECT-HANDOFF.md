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

## 編集時の原則

- サイト共通トークンと基礎スタイルは`css/foundation.css`
- 共通コンポーネントは`css/components.css`
- ページ固有レイアウトは`css/pages.css`
- 共通ナビゲーションとアニメーションは`js/main.js`
- TOOLS一覧は`js/tools.js`、詳細共通処理は`js/tool.js`
- GitHub Pagesのリポジトリ配下URLを考慮し、ルート絶対パスへの一括置換を避ける
- 動的クラスや`data-*`属性を参照しているため、検索結果だけを根拠にCSSやJavaScriptを一括削除しない
- microCMS管理対象を`NOTE to SELF`以外へ広げる場合は、既存方針とは別の変更として合意する

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

# GitHub Pages公開準備：Git履歴復元・統合監査

更新日：2026-11-02

## 目的

Git管理されていなかった現行`mark-bench-prototype`へ、旧ローカルリポジトリの履歴を安全に復元し、GitHub Pages・microCMS公開実装へ進むための差分を整理する。

## 復元結果

- 履歴の取得元：`../mark-bench/mark-bench-prototype--00`
- 復元した基準コミット：`e3b9aa8347aba3e812a7d520ca764a1b26ea7d00`
- 復元した履歴：6コミット
- 基準ブランチ：`main`（変更なし）
- 統合作業ブランチ：`migration/current-site`
- `origin`：`https://github.com/satoshi0gawa/mark-bench-prototype.git`
- 現時点ではGitHub側のリポジトリを参照できないため、`origin`は再作成後のpush先候補として保持する

旧リポジトリと現行ディレクトリを直接上書きせず、一時クローンへ現行ツリーを反映して検証した後、Git管理情報だけを現行ディレクトリへ復元した。現行ソースは巻き戻していない。

## 統合時点の検証

```text
npm run check  : 68 HTMLページ成功
npm run build  : 63 indexable pages生成成功
```

現行ツリーの主要ファイル数：

| 種別 | 件数 |
| --- | ---: |
| HTML | 68 |
| CSS | 27 |
| JavaScript | 49 |
| 検証スクリプト | 28 |

履歴復元時点（microCMSモデル追加前）の旧基準コミットとの差分：

| 状態 | 件数 |
| --- | ---: |
| 変更 | 38 |
| 削除 | 16 |
| 新規 | 120 |

## 現行側を正本として採用する構成

- `build-notes/`：`CODING NOTE`と`NOTE to SELF`の現行ページ構造
- `web-parts/`、`css/web-parts-*.css`、`js/web-parts-*.js`
- 現行25種のTOOLSと対応する検証スクリプト
- `site.config.mjs`
- `scripts/site-pages.mjs`
- `scripts/sync-head.mjs`
- `scripts/check-seo.mjs`
- `assets/icons/`と`assets/og/`
- 現行のhead、canonical、OGP、JSON-LD、sitemap、robots生成仕様

## 旧構成として削除を維持するもの

- `build-logs/`：旧名称・旧URL構成
- `content/build-logs.fixture.mjs`：旧スキーマのfixture
- `scripts/templates/build-log-pages.mjs`：旧BUILD LOGS専用テンプレート
- `scripts/test-build-logs.mjs`、`scripts/check-build-output.mjs`：旧出力を前提とする検証
- `scripts/config/tools.mjs`：現行TOOLS構成と未同期のカタログ
- 旧`.github/workflows/`：旧ビルドと旧CMSエンドポイントを前提とするため、そのまま復活させない
- 旧`package-lock.json`は復元せず、`sanitize-html@2.18.1`を固定した現行ロックファイルを新規生成した

## 旧履歴から設計を再利用するもの

次の処理は旧ファイルを復元せず、現行`NOTE to SELF`と`blog` API向けに再実装する。CODING NOTEはこの生成処理へ含めない。

- microCMS全件取得のページネーション
- タイムアウト、限定再試行、レスポンス形式検証
- リッチエディタHTMLの無害化
- fixtureとmicroCMSを切り替えるビルドモード
- CMS記事から一覧・詳細を生成する処理
- APIキーが`dist/`へ混入していないことの検証
- CIとGitHub Pagesデプロイを分離するワークフロー

## 統合時の注意点

- 現在の変更は未コミットであり、`main`は旧基準コミットを保持している
- `origin/main`はローカル参照であり、GitHub上の存在を保証しない
- 旧ローカルリポジトリにある未追跡ファイルは今回の履歴へ取り込んでいない
- CMS生成処理が完成するまでは旧ワークフローを復活させない
- `test-*`記事はテンプレート・fixtureの基準として保持するが、本番`dist/`からは除外する
- GitHubリポジトリ作成、Secrets登録、microCMS管理画面操作は別工程とする

## 次工程

完了：

1. 現行差分を統合基準コミットとして確定できる状態へ整理
2. fixture用の内部記事モデルと`blog` APIスキーマを定義
3. fixture・スキーマ・関連TOOLS参照の検証を既存の`npm run check`へ統合
4. NOTE to SELFの詳細、一覧、BUILD NOTES入口をfixtureから`dist/`へ生成
5. 生成HTMLの目次、REFERENCES条件表示、関連TOOLS、テーブルラッパーを検証
6. 公開`dist/`からNOTE to SELFの`test-*`ページを除外し、CODING NOTE静的領域を維持
7. microCMS Content APIの全件取得、15秒タイムアウト、限定再試行を実装
8. `fixture`／`microcms`ビルドモードとAPI取得のモック検証を追加
9. `sanitize-html@2.18.1`による許可リスト型のリッチHTML無害化を追加
10. `dist/`へのAPIキー値・資格情報マーカー混入検査をビルドへ統合

次の実装：

1. GitHubリポジトリを再作成し、履歴付きでpushする
2. GitHub Pages用の検証・デプロイワークフローとSecretsを追加する
3. microCMS Webhookと手動再実行を追加する

# MARK BENCH

Web制作で使う小さなツール、再利用可能なUIパーツ、制作・運用メモをまとめた静的サイトです。

[MARK BENCHを開く](https://satoshi0gawa.github.io/mark-bench-prototype/)

## コンテンツ

| セクション | 内容 |
| --- | --- |
| TOOLS | ブラウザ内で処理が完結するWeb制作用ユーティリティ |
| WEB PARTS | 再利用を前提に整理したUIパターンと実装コード |
| BUILD NOTES | サイト単位の実装メモと日々の作業記録 |
| ABOUT | サイトの目的と運用方針 |

BUILD NOTESは、個別の静的ページとして管理する`CODING NOTE`と、microCMSから静的生成する`NOTE to SELF`の2系統で構成しています。

## 主な特徴

- HTML、CSS、Vanilla JavaScriptを基盤とした静的サイト
- ツールへの入力内容は原則としてブラウザ内だけで処理
- WEB PARTSの掲載コードは`c-`接頭辞とBEM形式で統一
- キーボード操作、フォーカス表示、色のコントラスト、`prefers-reduced-motion`に配慮
- Node.jsとGitHub Actionsによる検証・静的生成・GitHub Pages公開

## 技術構成

- フロントエンド：HTML / CSS / Vanilla JavaScript
- 静的生成：Node.js
- 記事管理：microCMS（`NOTE to SELF`のみ）
- CI/CD：GitHub Actions
- ホスティング：GitHub Pages

## サイト共通仕様

- UI・英数字にはSpace Mono、日本語にはBIZ UDPGothicを使用
- ネイビーを主色、黄色をアクセントとする共通カラートークンを使用
- PCでは左右レール、Tablet以下では上部ナビゲーションへ切り替わるレスポンシブ構成
- 共通コンポーネントとページ固有スタイルを分離し、再利用性と保守性を確保
- APIキーなどの機密情報はブラウザや公開成果物へ含めず、GitHub Actions Secretsで管理

## ドキュメント

- [サイト仕様・開発運用](docs/SITE-SPEC.md)
- [microCMS運用・スキーマ](microcms/README.md)
- [microCMS導入の設計・検討記録](MICROCMS-INTEGRATION-MEMO.md)
- [作業引き継ぎ](PROJECT-HANDOFF.md)
- [GitHub Pages移行監査記録](docs/github-pages-migration-audit.md)

公開READMEはサイトの概要に限定しています。ローカル起動、検証、ビルド、編集責務、SEO、公開設定の詳細は[サイト仕様・開発運用](docs/SITE-SPEC.md)を参照してください。

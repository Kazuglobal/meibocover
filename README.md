# 名簿表紙デザインシステム

卒業アルバムの表紙デザインを効率化するWebアプリケーションです。

## 🚀 機能

### フェーズ1（実装済み）
- ✅ 表紙プレビュー画面
- ✅ 用紙選択（レザック各種、プレスコート）
- ✅ 題字入力（9種類の書体）
- ✅ 校章・ロゴアップロード（背景自動削除）
- ✅ 箔押しオプション（金・銀）
- ✅ リアルタイムプレビュー
- ✅ 途中保存機能

### フェーズ2-4（実装予定）
- 原稿管理機能
- ワークフロー機能
- データ出力機能

## 🛠️ 技術スタック

**フロントエンド**
- React + TypeScript
- Vite
- React Router
- React Query
- Axios

**バックエンド**
- Node.js + Express
- PostgreSQL
- Redis
- Multer（ファイルアップロード）

## 📦 セットアップ

### 前提条件
- Node.js 18以上
- Docker Desktop
- Git

### インストール手順

1. リポジトリのクローン
```bash
git clone [repository-url]
cd coverpreview
```

2. バックエンドのセットアップ
```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定

# データベースの起動
docker-compose up -d

# サーバーの起動
npm run dev
```

3. フロントエンドのセットアップ
```bash
cd coverpreview-app
npm install
npm run dev
```

## 🌐 アクセスURL

- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3001

## 📝 使い方

1. プロジェクトを作成（APIで実行）
2. 生成されたURLにアクセス
   - 顧客用: `/edit/{customer-url}`
   - 営業用: `/view/{sales-url}`
   - 製作部用: `/download/{production-url}`
3. 表紙デザインを作成・保存

## 🔧 開発コマンド

```bash
# バックエンド開発サーバー
npm run dev

# フロントエンド開発サーバー
cd coverpreview-app && npm run dev

# TypeScriptビルド
npm run build

# データベース管理
docker-compose up    # 起動
docker-compose down  # 停止
```

## 📄 ライセンス

Private 
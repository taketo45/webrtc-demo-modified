# WebRTC配信テストアプリ

このアプリケーションは、Cloudflare StreamのWHIP（WebRTC-HTTP Ingestion Protocol）とWHEP（WebRTC-HTTP Egress Protocol）を利用した簡易的なビデオ配信・視聴システムです。ブラウザだけでライブストリーミングのテストが可能です。

## セットアップ手順

### 1. 前提条件
- Cloudflareアカウント
- Cloudflare Streamへのアクセス権
- 最新のWebブラウザ（Chrome, Firefox, Edgeなど）

### 2. ファイル構成
```
├── broadcaster.html      # 配信側ページ
├── broadcaster.js        # 配信側スクリプト
├── viewer.html           # 視聴側ページ
├── viewer.js             # 視聴側スクリプト
├── stream-styles.css     # スタイルシート
├── WHIPClient.js         # WHIP実装（配信プロトコル）
├── WHEPClient.js         # WHEP実装（視聴プロトコル）
└── negotiateConnectionWithClientOffer.js # WebRTC接続処理
```

### 3. CloudflareでのURL取得

1. Cloudflareダッシュボードにログイン
2. Stream > ライブ入力 に移動
3. 新しいライブ入力を作成
4. 「WebRTC」タブでWHIPエンドポイントURLを取得（配信用）
https://customer-8s5fon3rk66g16ih.cloudflarestream.com/ad215ae3c2262856e29a2f61ad1e9584k04e20ce8fb0315ffaad55d108ba29581/webRTC/publish

broadcaster.htmlのWHIPエンドポイントURLのvalueを取得したURLで更新

5. 「ライブ再生と録音」を有効化
6. WebRTC再生URLを取得（WebRTC (WHEP) 再生 URL）
https://customer-8s5fon3rk66g16ih.cloudflarestream.com/04e20ce8fb0315ffaad55d108ba29581/webRTC/play

viewer.htmlのWHEPエンドポイントURLのvalueを取得したURLで更新

7. wrangler.tomlファイルを作成し、下記項目を記載する。

#### wrangler.toml　設定項目
```
name = "webrtc-demo"
account_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
workers_dev = true
compatibility_date = "2022-02-27"  
```
#### 設定項目の解説
1. name = "webrtc-demo"
役割: Cloudflare Workers のプロジェクト識別名

影響:
- デプロイメント識別: Workers ダッシュボードでの表示名
- サブドメイン生成: webrtc-demo.your-subdomain.workers.dev の形式
- ログ識別: デプロイメントログやエラーログでの識別子
- CLI操作: wrangler コマンドでの操作対象指定
このプロジェクトでの重要性: WebRTCシグナリングサーバーとして動作するため、クライアントアプリケーションが接続するエンドポイントのURLに直接影響します。

2. workers_dev = true
役割: 開発用ドメインでの公開を有効化

影響:

- 自動URL生成: *.workers.dev ドメインで自動的にアクセス可能
- 即座の公開: カスタムドメイン設定不要で即座にテスト可能
- 開発効率: 迅速なプロトタイピングと検証が可能
- このプロジェクトでの重要性: WebRTCデモの場合、複数のクライアント間でのリアルタイム通信テストが必要なため、すぐにアクセス可能なURLが重要です。

3. account_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
役割: Cloudflareアカウントの一意識別子

確認方法：
- CloudFlareにログインしStream-ビデオ‐アカウントIDから取得

影響:
- リソース所有権: どのCloudflareアカウントにWorkerが属するかを指定
- 課金対象: 使用量とコストがこのアカウントに計上
- 権限管理: このアカウントの権限でのみデプロイ・管理可能
- チーム連携: 複数開発者間でのプロジェクト共有時の重要な識別子

4. compatibility_date：
役割：API の動作を、YYYY年M月D日時点のWorkers APIの仕様に準拠させる

取りうる日付例
"2022-02-27"
"2024-01-01"

影響：
- WebSocket API: シグナリングサーバーの実装で使用
- Fetch API: HTTP リクエストの処理
- Request/Response オブジェクト: クライアント-サーバー間通信
- URL パターンマッチング: ルーティング機能

### 4. アプリの開始

#### サーバー起動方法
- 簡易的なWebサーバーでファイルを提供します
- Node.jsがインストールされている場合: `npx http-server`
- Python 3がインストールされている場合: `python -m http.server 8080`

#### ローカル開発環境の場合
1. `npm install` で依存パッケージをインストール
2. `npm run dev` で開発サーバーを起動

## 使用方法

### 配信側（broadcaster.html）
1. ページにアクセスするとカメラとマイクの許可を求められます
2. WHIPエンドポイントURLを入力（Cloudflareから取得したもの）
3. 「配信開始」ボタンをクリックして配信を開始
4. 配信情報が表示され、配信状態を確認できます
5. 「配信停止」ボタンで配信を終了できます

### 視聴側（viewer.html）
1. WHEPエンドポイントURLを入力（Cloudflareから取得したもの）
2. 「視聴開始」ボタンをクリックして配信の視聴を開始
3. 視聴情報が表示され、接続状態を確認できます
4. 「視聴停止」ボタンで視聴を終了できます

## 注意事項

- WHIPとWHEPのエンドポイントURLには秘密キーが含まれています。公開リポジトリにコミットしないでください。
- カメラとマイクへのアクセス許可が必要です。
- WebRTC接続にはSTUNサーバーを使用しています（Cloudflare提供のものを利用）。
- 同一ネットワーク内でも、配信と視聴は別々のブラウザまたはタブで行うことをお勧めします。
- ネットワーク環境によって配信品質や遅延が変わることがあります。

## トラブルシューティング

1. **カメラ/マイクにアクセスできない**
   - ブラウザの権限設定を確認してください
   - デバイスが正しく接続されているか確認してください

2. **接続エラーが発生する**
   - WHIPおよびWHEPのURLが正しいか確認してください
   - Cloudflareアカウントで適切な権限があるか確認してください
   - ネットワークのファイアウォール設定を確認してください

3. **視聴側で映像が表示されない**
   - 配信が正常に開始されているか確認してください
   - Cloudflareダッシュボードで「ライブ再生とレコーディング」が有効になっているか確認してください

4. **映像品質が悪い**
   - ネットワーク帯域幅を確認してください
   - カメラの解像度設定を確認してください

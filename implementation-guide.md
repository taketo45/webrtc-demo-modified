# WebRTC配信テストアプリの実装解説

## 技術概要

このアプリケーションは、WebRTCを使用したブラウザベースのライブストリーミングシステムです。主に以下の技術とプロトコルを使用しています：

1. **WebRTC** - ブラウザ間のリアルタイム通信のための技術
2. **WHIP** (WebRTC-HTTP Ingestion Protocol) - 配信側のプロトコル
3. **WHEP** (WebRTC-HTTP Egress Protocol) - 視聴側のプロトコル
4. **Cloudflare Stream** - メディアサーバーとして機能

## 主要コンポーネントの解説

### WHIPClient クラス

```javascript
// WHIPClient.js
// 配信側のクライアント実装
```

このクラスは配信機能を担当します：

- `RTCPeerConnection` の初期化
- カメラとマイクからのメディアストリームの取得
- STUNサーバーを使用したICE接続の確立
- WHIPプロトコルによるシグナリング

### WHEPClient クラス

```javascript
// WHEPClient.js
// 視聴側のクライアント実装
```

このクラスは視聴機能を担当します：

- `RTCPeerConnection` の初期化（受信専用）
- WHEPプロトコルによるシグナリング
- 受信したメディアストリームの処理と表示

### 接続ネゴシエーション

```javascript
// negotiateConnectionWithClientOffer.js
```

このモジュールは、WebRTCの接続確立に必要なSDP（Session Description Protocol）の交換を担当します：

- クライアント側のオファーの作成
- ICE候補の収集
- サーバーとのSDP交換
- 接続の確立と維持

## ユーザーインターフェースの設計

### 配信側UI（broadcaster.html）

- カメラプレビュー表示
- 配信開始/停止ボタン
- 接続状態表示
- 配信情報（解像度、ビットレート、経過時間）

### 視聴側UI（viewer.html）

- 受信映像表示
- 視聴開始/停止ボタン
- 接続状態表示
- 視聴情報（解像度、接続品質、視聴時間）

## 拡張アイデア

このアプリケーションは基本的な機能を提供していますが、以下のような拡張が可能です：

1. **複数解像度対応**
   - 配信側で複数の解像度オプションを提供
   - 視聴側で自動的に最適な解像度を選択

2. **チャット機能の追加**
   - WebSocketやData Channelを使用したリアルタイムチャット
   - 視聴者数の表示

3. **画面共有機能**
   - `getDisplayMedia()` APIを使用したスクリーンシェアリング
   - カメラ映像と画面共有の切り替え

4. **録画機能**
   - MediaRecorder APIを使用したローカル録画
   - サーバー側での録画とダウンロード機能

5. **帯域幅適応**
   - ネットワーク状況に応じた品質調整
   - 統計情報の詳細表示

6. **マルチカメラサポート**
   - 複数のカメラの切り替え
   - PIP（ピクチャーインピクチャー）表示

## 実装上の注意点

### セキュリティ

- WHIPとWHEPのエンドポイントURLには秘密キーが含まれています
- 本番環境では適切な認証と認可が必要
- HTTPS接続が必須（WebRTCのセキュリティ要件）

### パフォーマンス

- 帯域幅の制限に注意
- モバイルデバイスでのバッテリー消費
- バックグラウンドタブでの動作考慮

### ブラウザ互換性

- WebRTC APIはブラウザによって実装の差異がある
- Safari、Firefox、Chromeでの動作確認が必要
- 古いブラウザでは機能制限やポリフィルが必要

## Cloudflare Stream固有の設定

### WHIP/WHEP URL形式

Cloudflare StreamのWHIP/WHEP URLは以下の形式になっています：

- WHIP: `https://customer-[ID].cloudflarestream.com/[SECRET]/[STREAM_ID]/webRTC/publish`
- WHEP: `https://customer-[ID].cloudflarestream.com/[STREAM_ID]/webRTC/play`

これらのURLを適切に管理し、必要に応じて環境変数やバックエンドAPIを通じて提供することを検討してください。

### Cloudflareダッシュボードでの設定

1. Stream > ライブ入力 > WebRTC設定
2. 新しいライブストリームの作成
3. 「ライブ再生とレコーディング」の有効化
4. 必要に応じてセキュリティ設定（ジオフェンシング、アクセス制限など）

import WHIPClient from './WHIPClient.js';

// DOM要素
const startStreamBtn = document.getElementById('start-stream');
const stopStreamBtn = document.getElementById('stop-stream');
const localVideo = document.getElementById('local-video');
const connectionStatus = document.getElementById('connection-status');
const whipUrlInput = document.getElementById('whip-url');
const overlayMessage = document.getElementById('overlay-message');
const resolutionDisplay = document.getElementById('resolution');
const bitrateDisplay = document.getElementById('bitrate');
const elapsedTimeDisplay = document.getElementById('elapsed-time');

// 変数
let whipClient = null;
let streamActive = false;
let startTime = null;
let elapsedTimeInterval = null;
let statsInterval = null;

// 配信開始ボタン
startStreamBtn.addEventListener('click', async () => {
    if (streamActive) return;
    
    const whipUrl = whipUrlInput.value.trim();
    if (!whipUrl) {
        alert('WHIPエンドポイントURLを入力してください');
        return;
    }
    
    try {
        // ステータス更新
        connectionStatus.textContent = '接続中...';
        connectionStatus.className = 'status connecting';
        overlayMessage.textContent = 'カメラへのアクセスを要求中...';
        
        // WHIPクライアント作成
        whipClient = new WHIPClient(whipUrl, localVideo);
        
        // 接続成功したらUIを更新
        setTimeout(() => {
            if (localVideo.srcObject) {
                streamActive = true;
                connectionStatus.textContent = 'オンライン';
                connectionStatus.className = 'status online';
                overlayMessage.style.display = 'none';
                
                // ボタン状態更新
                startStreamBtn.disabled = true;
                stopStreamBtn.disabled = false;
                
                // 計測開始
                startTimers();
            }
        }, 2000); // カメラアクセスと接続に少し時間がかかるため
    } catch (error) {
        console.error('配信開始エラー:', error);
        alert(`配信の開始に失敗しました: ${error.message}`);
        
        // 失敗時にリセット
        resetStream();
    }
});

// 配信停止ボタン
stopStreamBtn.addEventListener('click', async () => {
    if (!streamActive || !whipClient) return;
    
    try {
        // 接続終了
        await whipClient.disconnectStream();
        resetStream();
    } catch (error) {
        console.error('配信停止エラー:', error);
        alert(`配信の停止に失敗しました: ${error.message}`);
    }
});

// 配信状態のリセット
function resetStream() {
    streamActive = false;
    whipClient = null;
    
    // UI更新
    connectionStatus.textContent = 'オフライン';
    connectionStatus.className = 'status offline';
    overlayMessage.textContent = 'カメラへのアクセスを許可してください';
    overlayMessage.style.display = 'flex';
    
    // ボタン状態更新
    startStreamBtn.disabled = false;
    stopStreamBtn.disabled = true;
    
    // タイマー停止
    stopTimers();
    
    // 表示リセット
    resolutionDisplay.textContent = '-';
    bitrateDisplay.textContent = '-';
    elapsedTimeDisplay.textContent = '00:00:00';
    
    // ビデオストリームのクリーンアップ
    if (localVideo.srcObject) {
        const tracks = localVideo.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        localVideo.srcObject = null;
    }
}

// 経過時間とメディア統計情報の更新開始
function startTimers() {
    startTime = new Date();
    
    // 経過時間の更新
    elapsedTimeInterval = setInterval(updateElapsedTime, 1000);
    
    // メディア統計の更新
    statsInterval = setInterval(updateMediaStats, 2000);
}

// タイマーの停止
function stopTimers() {
    if (elapsedTimeInterval) {
        clearInterval(elapsedTimeInterval);
        elapsedTimeInterval = null;
    }
    
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
}

// 経過時間の更新
function updateElapsedTime() {
    if (!startTime) return;
    
    const now = new Date();
    const diff = now - startTime;
    
    const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    
    elapsedTimeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

// メディア統計情報の更新
async function updateMediaStats() {
    if (!whipClient || !whipClient.peerConnection) return;
    
    try {
        // ビデオトラックの取得
        const videoTrack = localVideo.srcObject?.getVideoTracks()[0];
        if (videoTrack) {
            // 解像度情報
            const settings = videoTrack.getSettings();
            if (settings.width && settings.height) {
                resolutionDisplay.textContent = `${settings.width}x${settings.height}`;
            }
            
            // ビットレート情報（擬似的な表示）
            const stats = await whipClient.peerConnection.getStats();
            let outboundRtpStats = null;
            
            stats.forEach(stat => {
                if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
                    outboundRtpStats = stat;
                }
            });
            
            if (outboundRtpStats && outboundRtpStats.bytesSent) {
                // 簡易的なビットレート計算（正確ではない）
                const kbps = Math.round(outboundRtpStats.bytesSent * 8 / 1000);
                bitrateDisplay.textContent = `約 ${kbps} kbps`;
            }
        }
    } catch (error) {
        console.error('統計情報の取得エラー:', error);
    }
}

// ページロード時に初期表示を設定
document.addEventListener('DOMContentLoaded', () => {
    resetStream();
});

// ページ離脱時に配信停止
window.addEventListener('beforeunload', () => {
    if (streamActive && whipClient) {
        whipClient.disconnectStream().catch(console.error);
    }
});

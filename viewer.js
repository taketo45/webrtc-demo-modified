import WHEPClient from './WHEPClient.js';

// DOM要素
const startViewingBtn = document.getElementById('start-viewing');
const stopViewingBtn = document.getElementById('stop-viewing');
const remoteVideo = document.getElementById('remote-video');
const connectionStatus = document.getElementById('connection-status');
const whepUrlInput = document.getElementById('whep-url');
const overlayMessage = document.getElementById('overlay-message');
const resolutionDisplay = document.getElementById('resolution');
const connectionQualityDisplay = document.getElementById('connection-quality');
const viewingTimeDisplay = document.getElementById('viewing-time');

// 変数
let whepClient = null;
let viewingActive = false;
let startTime = null;
let viewingTimeInterval = null;
let statsInterval = null;
let connectionCheckInterval = null;

// 視聴開始ボタン
startViewingBtn.addEventListener('click', async () => {
    if (viewingActive) return;
    
    const whepUrl = whepUrlInput.value.trim();
    if (!whepUrl) {
        alert('WHEPエンドポイントURLを入力してください');
        return;
    }
    
    try {
        // ステータス更新
        connectionStatus.textContent = '接続中...';
        connectionStatus.className = 'status connecting';
        overlayMessage.textContent = '配信に接続中...';
        
        // WHEPクライアント作成
        whepClient = new WHEPClient(whepUrl, remoteVideo);
        
        // 接続状態をモニタリング
        startConnectionMonitoring();
        
    } catch (error) {
        console.error('視聴開始エラー:', error);
        alert(`視聴の開始に失敗しました: ${error.message}`);
        
        // 失敗時にリセット
        resetViewing();
    }
});

// 視聴停止ボタン
stopViewingBtn.addEventListener('click', () => {
    if (!viewingActive) return;
    resetViewing();
});

// 視聴状態のリセット
function resetViewing() {
    viewingActive = false;
    
    // 停止時の処理
    if (whepClient && whepClient.peerConnection) {
        whepClient.peerConnection.close();
    }
    whepClient = null;
    
    // UI更新
    connectionStatus.textContent = '未接続';
    connectionStatus.className = 'status offline';
    overlayMessage.textContent = '配信に接続していません';
    overlayMessage.style.display = 'flex';
    
    // ボタン状態更新
    startViewingBtn.disabled = false;
    stopViewingBtn.disabled = true;
    
    // タイマー停止
    stopTimers();
    
    // 表示リセット
    resolutionDisplay.textContent = '-';
    connectionQualityDisplay.textContent = '-';
    viewingTimeDisplay.textContent = '00:00:00';
    
    // ビデオリセット
    if (remoteVideo.srcObject) {
        const tracks = remoteVideo.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }
}

// 接続状態の監視を開始
function startConnectionMonitoring() {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }
    
    connectionCheckInterval = setInterval(() => {
        if (!whepClient || !whepClient.peerConnection) return;
        
        const state = whepClient.peerConnection.connectionState;
        
        if (state === 'connected') {
            if (!viewingActive) {
                viewingActive = true;
                connectionStatus.textContent = 'オンライン';
                connectionStatus.className = 'status online';
                overlayMessage.style.display = 'none';
                
                // ボタン状態更新
                startViewingBtn.disabled = true;
                stopViewingBtn.disabled = false;
                
                // 計測開始
                startTimers();
            }
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            resetViewing();
            alert('配信との接続が切断されました。');
            
            if (connectionCheckInterval) {
                clearInterval(connectionCheckInterval);
                connectionCheckInterval = null;
            }
        }
    }, 1000);
}

// 視聴時間とメディア統計情報の更新開始
function startTimers() {
    startTime = new Date();
    
    // 視聴時間の更新
    viewingTimeInterval = setInterval(updateViewingTime, 1000);
    
    // メディア統計の更新
    statsInterval = setInterval(updateMediaStats, 2000);
}

// タイマーの停止
function stopTimers() {
    if (viewingTimeInterval) {
        clearInterval(viewingTimeInterval);
        viewingTimeInterval = null;
    }
    
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
    
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
        connectionCheckInterval = null;
    }
}

// 視聴時間の更新
function updateViewingTime() {
    if (!startTime) return;
    
    const now = new Date();
    const diff = now - startTime;
    
    const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    
    viewingTimeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

// メディア統計情報の更新
async function updateMediaStats() {
    if (!whepClient || !whepClient.peerConnection) return;
    
    try {
        // ビデオトラックの取得
        const videoTrack = remoteVideo.srcObject?.getVideoTracks()[0];
        if (videoTrack) {
            // 解像度情報（受信側では限られた情報のみ取得可能）
            resolutionDisplay.textContent = '受信中';
            
            // 接続品質情報の取得
            const stats = await whepClient.peerConnection.getStats();
            let inboundRtpStats = null;
            let candidatePairStats = null;
            
            stats.forEach(stat => {
                if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
                    inboundRtpStats = stat;
                }
                if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                    candidatePairStats = stat;
                }
            });
            
            // 接続品質評価（簡易的）
            if (inboundRtpStats) {
                // パケットロス率による品質評価
                let quality = '良好';
                
                if (inboundRtpStats.packetsLost > 0) {
                    const lossRate = inboundRtpStats.packetsLost / 
                                    (inboundRtpStats.packetsLost + inboundRtpStats.packetsReceived);
                    
                    if (lossRate > 0.05) {
                        quality = '不安定';
                    } else if (lossRate > 0.02) {
                        quality = '普通';
                    }
                }
                
                connectionQualityDisplay.textContent = quality;
            }
        } else {
            // ビデオトラックがない場合
            resolutionDisplay.textContent = '-';
            connectionQualityDisplay.textContent = '接続中...';
        }
    } catch (error) {
        console.error('統計情報の取得エラー:', error);
    }
}

// ページロード時に初期表示を設定
document.addEventListener('DOMContentLoaded', () => {
    resetViewing();
});

// ページ離脱時の処理
window.addEventListener('beforeunload', () => {
    if (viewingActive && whepClient) {
        resetViewing();
    }
});
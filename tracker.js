
// Advanced Tracking System for Educational Purposes
class SecurityAnalyzer {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.collectedData = {};
        this.initializeTracking();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async initializeTracking() {
        // Collect comprehensive browser information
        await this.collectBrowserInfo();
        await this.collectNetworkInfo();
        await this.collectDeviceInfo();
        await this.collectBehaviorData();
        this.startRealtimeTracking();
    }

    async collectBrowserInfo() {
        this.collectedData.browser = {
            userAgent: navigator.userAgent,
            appVersion: navigator.appVersion,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            maxTouchPoints: navigator.maxTouchPoints,
            plugins: this.getPlugins(),
            mimeTypes: this.getMimeTypes(),
        };

        // WebGL Fingerprinting
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                this.collectedData.browser.webgl = {
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER),
                    version: gl.getParameter(gl.VERSION),
                };
            }
        } catch (e) {}

        // Canvas Fingerprinting
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Canvas Fingerprint', 2, 2);
            this.collectedData.browser.canvasFingerprint = canvas.toDataURL().substring(0, 100);
        } catch (e) {}

        // Audio Context Fingerprinting
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioContext = new AudioContext();
                this.collectedData.browser.audioContext = {
                    sampleRate: audioContext.sampleRate,
                    destination: audioContext.destination.channelCount,
                };
            }
        } catch (e) {}
    }

    getPlugins() {
        const plugins = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            plugins.push({
                name: navigator.plugins[i].name,
                description: navigator.plugins[i].description,
                filename: navigator.plugins[i].filename,
            });
        }
        return plugins;
    }

    getMimeTypes() {
        const mimeTypes = [];
        for (let i = 0; i < navigator.mimeTypes.length; i++) {
            mimeTypes.push({
                type: navigator.mimeTypes[i].type,
                description: navigator.mimeTypes[i].description,
            });
        }
        return mimeTypes;
    }

    async collectNetworkInfo() {
        this.collectedData.network = {
            // Connection Info
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData,
            } : null,

            // IP and Location via free API
            ipInfo: await this.getIPInfo(),

            // Timing Info
            timing: performance.timing ? {
                navigationStart: performance.timing.navigationStart,
                loadEventEnd: performance.timing.loadEventEnd,
                domComplete: performance.timing.domComplete,
            } : null,
        };
    }

    async getIPInfo() {
        try {
            // Using multiple APIs for redundancy
            const apis = [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://api.ip.sb/geoip',
            ];

            for (const api of apis) {
                try {
                    const response = await fetch(api);
                    if (response.ok) {
                        const data = await response.json();
                        return data;
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (e) {}
        return null;
    }

    async collectDeviceInfo() {
        this.collectedData.device = {
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                orientation: screen.orientation?.type,
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,
                screenX: window.screenX,
                screenY: window.screenY,
                devicePixelRatio: window.devicePixelRatio,
            },
            memory: navigator.deviceMemory,
            battery: await this.getBatteryInfo(),
            mediaDevices: await this.getMediaDevices(),
            permissions: await this.checkPermissions(),
        };

        // Timezone and Date Info
        this.collectedData.device.timezone = {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
        };

        // Storage Estimates
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                this.collectedData.device.storage = estimate;
            }
        } catch (e) {}
    }

    async getBatteryInfo() {
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                return {
                    charging: battery.charging,
                    level: battery.level,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime,
                };
            }
        } catch (e) {}
        return null;
    }

    async getMediaDevices() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                return devices.map(device => ({
                    kind: device.kind,
                    label: device.label || 'Unknown',
                    deviceId: device.deviceId ? device.deviceId.substring(0, 10) : null,
                }));
            }
        } catch (e) {}
        return [];
    }

    async checkPermissions() {
        const permissions = {};
        const permissionNames = ['camera', 'microphone', 'notifications', 'geolocation'];

        for (const name of permissionNames) {
            try {
                const result = await navigator.permissions.query({ name });
                permissions[name] = result.state;
            } catch (e) {
                permissions[name] = 'error';
            }
        }

        return permissions;
    }

    async collectBehaviorData() {
        this.collectedData.behavior = {
            referrer: document.referrer,
            previousURL: document.referrer,
            currentURL: window.location.href,
            title: document.title,
            historyLength: history.length,
            sessionStorage: this.getStorageInfo('sessionStorage'),
            localStorage: this.getStorageInfo('localStorage'),
            cookies: document.cookie,

            // Mouse and Touch capabilities
            mouseCapabilities: {
                hasMouseEvents: 'onmousemove' in window,
                hasTouchEvents: 'ontouchstart' in window,
            },

            // Installed fonts detection
            fonts: await this.detectFonts(),
        };
    }

    getStorageInfo(type) {
        try {
            const storage = window[type];
            return {
                length: storage.length,
                keys: Object.keys(storage),
            };
        } catch (e) {
            return null;
        }
    }

    async detectFonts() {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia'];
        const detected = [];

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        for (const font of testFonts) {
            let detected_font = false;
            for (const baseFont of baseFonts) {
                context.font = `72px ${baseFont}`;
                const baseWidth = context.measureText('mmmmmmmmmmlli').width;

                context.font = `72px ${font}, ${baseFont}`;
                const testWidth = context.measureText('mmmmmmmmmmlli').width;

                if (baseWidth !== testWidth) {
                    detected_font = true;
                    break;
                }
            }
            if (detected_font) {
                detected.push(font);
            }
        }

        return detected;
    }

    startRealtimeTracking() {
        // Track mouse movements
        let mouseMovements = [];
        document.addEventListener('mousemove', (e) => {
            mouseMovements.push({
                x: e.clientX,
                y: e.clientY,
                time: Date.now(),
            });

            // Keep only last 100 movements
            if (mouseMovements.length > 100) {
                mouseMovements.shift();
            }
        });

        // Track clicks
        document.addEventListener('click', (e) => {
            if (!this.collectedData.clicks) {
                this.collectedData.clicks = [];
            }
            this.collectedData.clicks.push({
                x: e.clientX,
                y: e.clientY,
                target: e.target.tagName,
                time: Date.now(),
            });
        });

        // Track keyboard activity (not the actual keys for privacy)
        let keyPressCount = 0;
        document.addEventListener('keypress', () => {
            keyPressCount++;
        });

        // Periodic data update
        setInterval(() => {
            this.collectedData.behavior.mouseActivity = mouseMovements.length;
            this.collectedData.behavior.keyPressCount = keyPressCount;
            this.collectedData.behavior.timeSpent = Date.now() - this.startTime;
            this.collectedData.behavior.currentScroll = {
                x: window.scrollX,
                y: window.scrollY,
            };
        }, 5000);

        // Page visibility tracking
        document.addEventListener('visibilitychange', () => {
            if (!this.collectedData.visibility) {
                this.collectedData.visibility = [];
            }
            this.collectedData.visibility.push({
                hidden: document.hidden,
                time: Date.now(),
            });
        });
    }

    async captureScreenshot() {
        // This requires screen capture permission
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { mediaSource: 'screen' }
                });

                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();

                const canvas = document.createElement('canvas');
                canvas.width = 1920;
                canvas.height = 1080;
                const ctx = canvas.getContext('2d');

                setTimeout(() => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const screenshot = canvas.toDataURL('image/jpeg', 0.5);

                    stream.getTracks().forEach(track => track.stop());

                    return screenshot;
                }, 100);
            }
        } catch (e) {
            console.log('Screenshot permission denied');
        }
        return null;
    }

    getData() {
        return {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            data: this.collectedData,
        };
    }
}

// Initialize tracker
const securityAnalyzer = new SecurityAnalyzer();
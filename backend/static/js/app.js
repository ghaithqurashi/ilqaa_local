// app.js - Main application logic for Ilqaa platform

// At the TOP of app.js, before everything else
(async function checkAuthentication() {
    console.log('🔐 Checking authentication...');

    // Skip auth check for non-coach pages
    if (!window.location.pathname.includes('/coach')) {
        console.log('📄 Not on coach page, skipping auth check');
        return;
    }

    // Wait for firebaseAuth to be loaded
    if (!window.firebaseAuth) {
        console.error('❌ Firebase Auth not loaded!');
        // Wait and retry
        setTimeout(checkAuthentication, 500);
        return;
    }

    try {
        // Wait for auth state
        const user = await firebaseAuth.waitForAuth();

        if (!user) {
            console.log('❌ No user found, redirecting to login');
            window.location.href = '/login';
            return;
        }

        console.log('✅ User authenticated:', user.email);

        // Optional: Verify with backend
        const verification = await firebaseAuth.verifyUserWithBackend();
        if (!verification.allowed) {
            console.warn('❌ User not allowed by backend, redirecting to login');
            await firebaseAuth.logout();
            window.location.href = '/login';
            return;
        }

        console.log('✅ User verified by backend');

        // Store user info
        window.currentUser = user;

    } catch (error) {
        console.error('❌ Auth check error:', error);
        window.location.href = '/login';
    }
})();

if (!window.appConfig) {
    console.error('❌ AppConfig not loaded! Make sure config.js is loaded before app.js');
    // You can still proceed with defaults
    window.appConfig = {
        getWebSocketUrl: function (path, params) {
            const isProduction = window.location.hostname !== 'localhost';
            const protocol = isProduction ? 'wss' : 'ws';
            const base = isProduction ? window.location.origin : 'http://localhost:8000';
            const url = base.replace(/^http/, protocol) + path;
            if (params) {
                const query = new URLSearchParams(params).toString();
                return url + '?' + query;
            }
            return url;
        }
    };
}

// Configuration
const CONFIG = {
    defaultLanguage: 'ar',
    supportedLanguages: ['en', 'ar'],
    resources: {},
    currentTopic: 'lecture',
    transcriptionService: 'speechmatics', // Always use Speechmatics
    metrics: {
        // Default metrics structure that matches our 4 speech metrics
        pace: { value: 0, percentage: 0, color: 'data-amber' },
        fillerWords: { value: 0, color: 'data-amber' },
        sentiment: { value: 'Neutral', color: 'data-amber' },
        vocabDiversity: { value: 0, percentage: 0, color: 'data-amber' },
        // Visual analysis metrics
        eyeContact: { value: 0, color: 'data-amber' },
        handGestures: { value: 0, unit: '', percentage: 0, color: 'data-amber' }
    }
};

// Global state variables
let socket = null;
let audioContext = null;
let isRecording = false;
let sessionStartTime = null;
let selectedLanguage = 'ar'; // Default to Arabic

// Webcam state
let webcamStream = null;
let webcamVideo = null;
let webcamCanvas = null;
let webcamPlaceholder = null;

// Video analysis WebSocket
let videoSocket = null;
let frameInterval = null;
let videoMetrics = {};
let overlayEnabled = false;
let overlayCanvas = null;
let overlayCtx = null;

// Final summaries
let audioFinalSummary = null;
let videoFinalSummary = null;
let isWaitingForSummaries = false;
let summaryTimeout = null;

// Guidance WebSocket state
let guidanceSocket = null;
let guidanceState = {
    enabled: false,
    lastTranscriptionUpdate: '',
    feedbackTimer: null,
    guidanceTimer: null,
    feedbackProgressInterval: null,
    guidanceProgressInterval: null,
    feedbackRefreshInterval: null,
    guidanceRefreshInterval: null,
    transcriptionChunkSize: 4
};

// Sentiments WebSocket state
let sentimentsSocket = null;
let sentimentsState = {
    enabled: false,
    lastTranscriptionUpdate: '',
    hasResult: false,
    lastResult: null
};

// Speechmatics real-time transcription state
let speechmaticsState = {
    currentText: '',
    lastSentToGuidance: '',
    isFirstTranscription: true,
    accumulatedText: '',
    lastProcessedText: '',
    currentPartial: ''
};

// Alert system state
let currentAlert = null;
let alertTimeout = null;
let alertDisplaying = false; // Track if alert is currently showing
const ALERT_DISPLAY_MS = 1500; // Show alert for 1.5 seconds

// Recording timer
let recordingTimer = null;

// Metrics update throttling
let lastMetricsUpdateTime = 0;
let metricsUpdateCount = 0;
const METRICS_UPDATE_INTERVAL = 5000; // 5 seconds in milliseconds

// Load resources and initialize
async function initializeApp() {
    try {
        console.log('🚀 Initializing app...');

        // Load translations from translations.json
        const [translations, metrics] = await Promise.all([
            fetch('/data/translations.json').then(async r => {
                if (!r.ok) throw new Error(`Failed to load translations.json: ${r.status}`);
                const data = await r.json();
                console.log('📦 Translations loaded');
                return data;
            }),
            fetch('/data/metrics-config.json').then(async r => {
                if (!r.ok) {
                    console.warn('Metrics config not found, using defaults');
                    return null;
                }
                const data = await r.json();
                console.log('📦 Metrics config loaded');
                return data;
            })
        ]);

        console.log('✅ Resources loaded successfully');

        // Store coach resources in CONFIG mapping (to maintain compatibility)
        if (translations && translations.coach) {
            CONFIG.resources = {
                en: translations.coach.en,
                ar: translations.coach.ar
            };
            console.log('🔍 CONFIG.resources mapped from translations.coach');
        }

        if (metrics) {
            CONFIG.metrics = { ...CONFIG.metrics, ...metrics };
            console.log('✅ Metrics config merged');
        }

        // Now that resources are loaded, set up coach-specific language
        const browserLang = navigator.language.split('-')[0];
        const htmlLang = document.documentElement?.lang;
        const initialLang = (htmlLang && CONFIG.supportedLanguages.includes(htmlLang))
            ? htmlLang
            : (CONFIG.supportedLanguages.includes(browserLang) ? browserLang : CONFIG.defaultLanguage);

        console.log(`🌐 Coach: Setting language to: ${initialLang}`);

        // Use LanguageSwitcher for basic language setup
        if (window.LanguageSwitcher) {
            window.LanguageSwitcher.setLanguage(initialLang);
        } else {
            // Fallback: apply basic language attributes
            document.documentElement.lang = initialLang;
            document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
        }

        // Load coach-specific resources and update UI
        loadCoachLanguageResources(initialLang);

        // Setup event listeners - wait a bit for DOM to be ready
        setTimeout(() => {
            setupEventListeners();
            createResultsButton();
        }, 100);

        console.log('✅ App initialization complete');

    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        console.error('❌ Error stack:', error.stack);

        // Even if there's an error, try to set up the UI with defaults
        console.log('⚠️  Using default language due to error');
        // setLanguage not defined globally here, assuming standard init flow
        setTimeout(() => {
            // Fallback minimal init
            loadCoachLanguageResources('ar');
            setupEventListeners();
            createResultsButton();
        }, 500);
    }

    // Listen for language changes from LanguageSwitcher
    window.addEventListener('languageChanged', function (event) {
        const lang = event.detail.language;
        console.log(`🔄 Coach: Language changed to ${lang}`);
        loadCoachLanguageResources(lang);
    });
}

function loadCoachLanguageResources(lang) {
    console.log(`📚 Loading coach resources for: ${lang}`);

    if (!CONFIG.resources || !CONFIG.resources[lang]) {
        console.warn(`⚠️ Coach resources for ${lang} not loaded yet`);
        return;
    }

    const resources = CONFIG.resources[lang];

    // Update coach-specific UI elements manually if not covered by data-i18n
    try {
        const startSessionText = document.getElementById('start-session-text');
        if (startSessionText && resources.startSession) {
            if (!isRecording) startSessionText.textContent = resources.startSession;
        }

        // Update Topic Name in Badge
        const topicNameEl = document.getElementById('topic-name');
        if (topicNameEl) {
            topicNameEl.textContent = CONFIG.currentTopic === 'lecture' ? (resources.lecture || 'محاضرة') : (resources.khutba || 'خطبة');
        }

        // Fix 3: Update View Results Button Text if it exists
        const viewResultsText = document.querySelector('#view-results-btn span:last-child');
        if (viewResultsText && resources.viewResults) {
            viewResultsText.textContent = resources.viewResults;
        }

        console.log(`✅ Coach UI updated for ${lang}`);
    } catch (error) {
        console.error('❌ Error updating coach UI:', error);
    }
}

function setupEventListeners() {
    // Attach session button listener initially
    attachSessionButtonListener();
    setupLanguageRestriction();
}

function setupLanguageRestriction() {
    // 1. Block the desktop language menu toggle
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', (e) => {
            if (isRecording) {
                e.preventDefault();
                e.stopPropagation();
                showSessionActiveWarning();
            }
        }, { capture: true }); // Use capture to intercept before other listeners
    }

    // 2. Block all specific language selection buttons (Desktop & Mobile)
    // This catches clicks on the flags/buttons themselves
    const langButtons = document.querySelectorAll('button[data-lang]');
    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isRecording) {
                e.preventDefault();
                e.stopImmediatePropagation(); // Stop other listeners (like LanguageSwitcher)
                showSessionActiveWarning();

                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-actions-menu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        }, { capture: true });
    });
}

// Update setupSettingsModal function to prevent changes during active session
function setupSettingsModal() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const topicOption = document.getElementById('topic-option');

    // Topic modal elements
    const topicModal = document.getElementById('topic-modal');
    const closeTopicModal = document.getElementById('close-topic-modal');
    const cancelTopic = document.getElementById('cancel-topic');
    const saveTopic = document.getElementById('save-topic');
    const topicRadios = document.querySelectorAll('input[name="speech-topic"]');

    // Toggle settings menu
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Check if session is active
        if (isRecording) {
            showSessionActiveWarning();
            return;
        }

        const isHidden = settingsMenu.classList.contains('hidden');
        if (isHidden) {
            settingsMenu.classList.remove('hidden');
        } else {
            settingsMenu.classList.add('hidden');
        }
    });

    // Topic option click
    topicOption.addEventListener('click', () => {
        // Check if session is active
        if (isRecording) {
            showSessionActiveWarning();
            settingsMenu.classList.add('hidden');
            return;
        }

        settingsMenu.classList.add('hidden');

        // Set current topic selection
        topicRadios.forEach(radio => {
            radio.checked = radio.value === CONFIG.currentTopic;
        });

        topicModal.classList.remove('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#settings-dropdown')) {
            settingsMenu.classList.add('hidden');
        }
    });

    // Topic modal functions
    const closeTopicModalFunc = () => topicModal.classList.add('hidden');
    closeTopicModal.addEventListener('click', closeTopicModalFunc);
    cancelTopic.addEventListener('click', closeTopicModalFunc);

    // Close modals on backdrop click
    topicModal.addEventListener('click', (e) => {
        if (e.target === topicModal) closeTopicModalFunc();
    });

    // Save topic selection
    saveTopic.addEventListener('click', () => {
        // Double-check session is not active (in case modal was opened before session started)
        if (isRecording) {
            showSessionActiveWarning();
            closeTopicModalFunc();
            return;
        }

        const selectedTopic = document.querySelector('input[name="speech-topic"]:checked').value;
        CONFIG.currentTopic = selectedTopic;


        // Show notification
        showTopicChangeNotification(selectedTopic);

        // Update Topic Badge in UI
        const resources = CONFIG.resources[document.documentElement.lang] || {};
        const topicNameEl = document.getElementById('topic-name');
        if (topicNameEl) {
            topicNameEl.textContent = selectedTopic === 'lecture' ? (resources.lecture || 'محاضرة') : (resources.khutba || 'خطبة');
        }

        closeTopicModalFunc();
    });

    function showTopicChangeNotification(topic) {
        // ✅ FIX: Safe access to resources
        const lang = document.documentElement.lang;
        const resources = (CONFIG.resources && CONFIG.resources[lang]) ? CONFIG.resources[lang] : {};

        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 z-50 bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg transition-all duration-300`;

        // ✅ FIX: Fallback values if resources are missing
        const topicName = topic === 'lecture' ? (resources.lecture || 'محاضرة') : (resources.khutba || 'خطبة');
        const topicDesc = topic === 'lecture' ? 'Lecture' : 'Khutba';
        const msg = resources.notifications?.topicChanged || 'تم تغيير نوع الخطاب';

        notification.innerHTML = `
        <div class="flex items-center space-x-3 space-x-reverse">
            <span class="material-icons-outlined text-data-green">check_circle</span>
            <div>
                <p class="text-text-light dark:text-text-dark font-medium">${msg}</p>
                <p class="text-muted-light dark:text-muted-dark text-sm">${topicName} (${topicDesc})</p>
            </div>
        </div>
    `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add this new function to show session active warning
function showSessionActiveWarning() {
    const resources = CONFIG.resources[document.documentElement.lang] || {};
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 bg-amber-500 border border-amber-600 rounded-lg p-4 shadow-lg transition-all duration-300`;

    const title = resources.notifications?.settingsLocked || 'لا يمكن تعديل الإعدادات';
    const subtitle = resources.notifications?.stopSessionFirst || 'يجب إنهاء الجلسة النشطة أولاً';

    notification.innerHTML = `
        <div class="flex items-center space-x-3 space-x-reverse">
            <span class="material-icons-outlined text-white">warning</span>
            <div>
                <p class="text-white font-medium">${title}</p>
                <p class="text-white/80 text-sm">${subtitle}</p>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function attachSessionButtonListener() {
    const startSessionBtn = document.getElementById('start-session-btn');
    if (startSessionBtn) {
        // Remove any existing listeners and add new one
        startSessionBtn.replaceWith(startSessionBtn.cloneNode(true));
        document.getElementById('start-session-btn').addEventListener('click', toggleSession);
    }
}

function toggleSession() {
    console.log('Session button clicked, isRecording:', isRecording);
    if (isRecording) {
        stopSession();
    } else {
        startSession();
    }
}

function stopSession() {
    console.log('Stopping session...');
    isRecording = false;
    isWaitingForSummaries = true;

    // Reset final summaries
    audioFinalSummary = null;
    videoFinalSummary = null;

    // ✅ FIX: Remove blinking cursor for Speechmatics when session stops
    if (CONFIG.currentTranscriptionService === 'speechmatics') {
        const transcriptionDisplay = document.getElementById('transcription-display');
        if (transcriptionDisplay) {
            const realtimeElement = transcriptionDisplay.querySelector('.realtime-transcription');
            if (realtimeElement) {
                // Remove blinking cursor but keep the text
                const currentText = speechmaticsState.currentText;
                if (currentText) {
                    realtimeElement.innerHTML = `
                        <div class="text-text-light dark:text-text-dark text-sm leading-relaxed">
                            ${currentText}
                        </div>
                    `;
                }
            }
        }
    }

    // Show loading indicator
    const loadingIndicator = document.getElementById('results-loading');
    const resultsBtn = document.getElementById('view-results-btn');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (resultsBtn) resultsBtn.classList.add('hidden');

    // Stop video analysis
    stopVideoAnalysis();

    // Stop audio capture
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    // Stop webcam
    stopWebcam();

    // Send stop signal to audio WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: 'stop' }));
        console.log('✓ Stop signal sent to audio WebSocket');
    } else {
        // If audio WebSocket is not available, use fallback
        audioFinalSummary = getFallbackAudioSummary();
    }

    // Update UI to show stopping state
    updateSessionUI(false);
    stopRecordingTimer();
    // Stop guidance WebSocket
    stopGuidanceWebSocket();
    // Stop sentiments WebSocket
    stopSentimentsWebSocket();

    // Reset audio level indicator
    const audioLevelFill = document.getElementById('audio-level-fill');
    const audioLevelText = document.getElementById('audio-level-text');
    if (audioLevelFill) audioLevelFill.style.width = '0%';
    if (audioLevelText) audioLevelText.textContent = '0%';

    // Setup timeout for summaries
    setupSummaryTimeout();

    console.log('✓ Session stopped, waiting for final summaries...');
}

function updateSessionUI(recording) {
    const startSessionBtn = document.getElementById('start-session-btn');
    const startSessionText = document.getElementById('start-session-text');
    const recordingIndicator = document.getElementById('recording-indicator');
    const topicBadge = document.getElementById('topic-badge');
    const resources = CONFIG.resources[document.documentElement.lang] || {};

    // Get the icon element
    const sessionIcon = startSessionBtn.querySelector('.material-icons-outlined');

    if (recording) {
        startSessionBtn.classList.remove('bg-primary', 'hover:bg-blue-700');
        startSessionBtn.classList.add('bg-data-red', 'hover:bg-red-700');
        startSessionText.textContent = resources.stopSession || 'إيقاف الجلسة';
        if (sessionIcon) sessionIcon.textContent = 'stop';
        if (recordingIndicator) recordingIndicator.classList.remove('hidden');
        if (topicBadge) topicBadge.classList.remove('hidden');
        isRecording = true;
    } else {
        startSessionBtn.classList.remove('bg-data-red', 'hover:bg-red-700');
        startSessionBtn.classList.add('bg-primary', 'hover:bg-blue-700');
        startSessionText.textContent = resources.startSession || 'ابدأ الجلسة';
        if (sessionIcon) sessionIcon.textContent = 'play_circle';
        if (recordingIndicator) recordingIndicator.classList.add('hidden');
        if (topicBadge) topicBadge.classList.add('hidden');
        isRecording = false;
    }
}

function updateSpeechMetricsListening(data) {
    if (data.metrics) {
        updateSpeechMetrics(data.metrics);
    } else {
        // Reset to initial state
        const resources = CONFIG.resources[document.documentElement.lang] || {};
        const paceStatus = document.getElementById('pace-status');
        const paceInstruction = document.getElementById('pace-instruction');

        if (paceStatus) {
            paceStatus.textContent = '-';
            paceStatus.className = `text-muted-light dark:text-muted-dark text-base font-bold leading-tight`;
        }
        if (paceInstruction) {
            paceInstruction.textContent = resources.speechAnalysis?.paceInitial || 'ابدأ التحدث لرؤية تحليل السرعة';
        }
    }
}

function displayFinalSummary(summary) {
    console.log('Session completed with summary:', summary);
}

// Recording timer
function startRecordingTimer() {
    let seconds = 0;
    recordingTimer = setInterval(() => {
        seconds++;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const timerText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const recordingTimer = document.getElementById('recording-timer');
        if (recordingTimer) {
            recordingTimer.textContent = timerText;
        }
    }, 1000);
}

function stopRecordingTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}

// Audio capture functionality
async function startAudioCapture() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: false,
                autoGainControl: false
            },
            video: false
        });

        audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = function (e) {
            if (!isRecording || !socket || socket.readyState !== WebSocket.OPEN) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const audioData = new Float32Array(inputData);

            // Calculate audio level (RMS)
            let sum = 0;
            for (let i = 0; i < audioData.length; i++) {
                sum += audioData[i] * audioData[i];
            }
            const rms = Math.sqrt(sum / audioData.length);
            const level = Math.min(100, rms * 1000); // Scale to 0-100%

            // Update audio level indicator
            const audioLevelFill = document.getElementById('audio-level-fill');
            const audioLevelText = document.getElementById('audio-level-text');
            if (audioLevelFill) audioLevelFill.style.width = level + '%';
            if (audioLevelText) audioLevelText.textContent = Math.round(level) + '%';

            try {
                socket.send(audioData.buffer);
            } catch (error) {
                console.error('Error sending audio:', error);
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        console.log('✓ Audio capture started');

    } catch (error) {
        console.error('Microphone error:', error);

        // Show microphone error
        const audioLevelFill = document.getElementById('audio-level-fill');
        const audioLevelText = document.getElementById('audio-level-text');
        if (audioLevelFill) {
            audioLevelFill.style.width = '0%';
            audioLevelFill.classList.add('bg-data-red');
        }
        if (audioLevelText) {
            audioLevelText.textContent = 'خطأ';
            audioLevelText.classList.add('text-data-red');
        }

        stopSession();
    }
}

// Webcam functionality
async function startWebcam() {
    const resources = CONFIG.resources[document.documentElement.lang] || {};
    try {
        console.log('Starting webcam...');

        // Get DOM elements
        webcamVideo = document.getElementById('webcam-feed');
        webcamCanvas = document.getElementById('webcam-canvas');
        webcamPlaceholder = document.getElementById('webcam-placeholder');
        const webcamStatus = document.getElementById('webcam-status');

        // Hide placeholder and show status
        if (webcamPlaceholder) webcamPlaceholder.classList.add('hidden');
        if (webcamStatus) webcamStatus.classList.remove('hidden');

        // Request webcam access
        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        });

        // Set up video element
        if (webcamVideo) {
            webcamVideo.srcObject = webcamStream;
            webcamVideo.classList.remove('hidden');

            // Wait for video to load
            webcamVideo.onloadedmetadata = function () {
                console.log('Webcam video loaded');
                if (webcamStatus) webcamStatus.classList.add('hidden');
            };

            webcamVideo.play();
        }

        console.log('✓ Webcam started successfully');

    } catch (error) {
        console.error('Webcam error:', error);

        // Show error state
        const webcamStatus = document.getElementById('webcam-status');
        if (webcamStatus) {
            webcamStatus.classList.remove('hidden');
            const errorTitle = resources.cameraError || 'خطأ في الكاميرا';
            const errorSub = resources.checkPermissions || 'تحقق من الأذونات وحاول مرة أخرى';

            webcamStatus.innerHTML = `
                    <div class="text-center text-white">
                        <span class="material-icons-outlined text-4xl mb-2 text-data-red">error</span>
                        <p class="text-lg font-semibold">${errorTitle}</p>
                        <p class="text-sm text-white/60">${error.message}</p>
                        <p class="text-xs text-white/40 mt-2">${errorSub}</p>
                    </div>
                `;
        }
    }
}

function stopWebcam() {
    console.log('Stopping webcam...');

    // Stop all video tracks
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => {
            track.stop();
        });
        webcamStream = null;
    }

    // Reset DOM elements
    if (webcamVideo) {
        webcamVideo.srcObject = null;
        webcamVideo.classList.add('hidden');
    }

    if (webcamCanvas) {
        webcamCanvas.classList.add('hidden');
    }

    // Show placeholder again
    if (webcamPlaceholder) {
        webcamPlaceholder.classList.remove('hidden');
    }

    // Hide webcam status
    const webcamStatus = document.getElementById('webcam-status');
    if (webcamStatus) {
        webcamStatus.classList.add('hidden');
    }

    console.log('✓ Webcam stopped');
}

function updateFillerWords(fillerBreakdown, totalFillers, resources) {
    const fillerGrid = document.getElementById('filler-words-grid');
    const fillerDescription = document.getElementById('filler-description');
    const fillerWarningIcon = document.getElementById('filler-warning-icon');

    if (!fillerGrid) return;

    // Clear existing content
    fillerGrid.innerHTML = '';

    if (fillerBreakdown && Object.keys(fillerBreakdown).length > 0) {
        // Create filler word badges
        Object.entries(fillerBreakdown).forEach(([word, count]) => {
            const badge = document.createElement('div');
            // ✅ FIX 1: Updated badge styling - centering with flex, adjusted padding, font-weight, subtle border
            badge.className = 'bg-data-red/10 text-data-red text-xs font-medium px-2 py-2 rounded-lg flex items-center justify-center text-center truncate border border-data-red/20';
            badge.title = `${word}: ${count} times`;
            badge.textContent = `${word}: ${count}`;
            fillerGrid.appendChild(badge);
        });

        // Update description based on filler frequency
        const totalWords = Object.values(fillerBreakdown).reduce((sum, count) => sum + count, 0);

        // SHOW the warning icon since we have filler words
        if (fillerWarningIcon) {
            fillerWarningIcon.classList.remove('hidden');
        }

        if (totalWords > 10) {
            fillerDescription.textContent = resources.speechAnalysis?.fillerWordsFrequent || 'استخدام عالي للكلمات الحشوية';
            if (fillerWarningIcon) fillerWarningIcon.className = 'material-icons-outlined text-data-red';
        } else if (totalWords > 5) {
            fillerDescription.textContent = resources.speechAnalysis?.fillerWordsModerate || 'استخدام معتدل للكلمات الحشوية';
            if (fillerWarningIcon) fillerWarningIcon.className = 'material-icons-outlined text-data-amber';
        } else {
            fillerDescription.textContent = resources.speechAnalysis?.fillerWordsMinimal || 'استخدام محدود للكلمات الحشوية';
            if (fillerWarningIcon) fillerWarningIcon.className = 'material-icons-outlined text-data-green';
        }
    } else {
        // No filler words detected - HIDE the warning icon
        if (fillerWarningIcon) {
            fillerWarningIcon.classList.add('hidden');
        }

        const placeholder = document.createElement('div');
        // Adjusted placeholder to span all columns
        placeholder.className = 'text-muted-light dark:text-muted-dark text-xs col-span-3 xl:col-span-4 text-center py-1';
        placeholder.textContent = resources.speechAnalysis?.fillerWordsNone || 'لم يتم اكتشاف كلمات حشوية';
        fillerGrid.appendChild(placeholder);

        fillerDescription.textContent = resources.speechAnalysis?.fillerWordsDescription || 'استخدام محدود للكلمات الحشوية';
    }
}

// ===== POSE ANALYSIS INTEGRATION =====

function updateVisualMetrics(metrics) {
    if (!metrics) return;

    // Update badge overlays on video (mirrored for logic consistency)
    const badgeEyeContact = document.getElementById('badge-eye-contact');
    const badgePosture = document.getElementById('badge-posture');
    const badgeGestures = document.getElementById('badge-gestures');

    if (badgeEyeContact && metrics.eye_contact_percentage !== undefined) {
        const val = metrics.eye_contact_percentage;
        badgeEyeContact.textContent = `${val}%`;
        // Color coding
        badgeEyeContact.className = val > 70 ? 'text-sm font-bold text-data-green' :
            val > 50 ? 'text-sm font-bold text-data-amber' :
                'text-sm font-bold text-data-red';
    }

    if (badgePosture && metrics.posture_quality !== undefined) {
        const val = metrics.posture_quality;
        badgePosture.textContent = `${val}%`;
        // Color coding
        badgePosture.className = val > 80 ? 'text-sm font-bold text-data-green' :
            val > 60 ? 'text-sm font-bold text-data-amber' :
                'text-sm font-bold text-data-red';
    }

    if (badgeGestures && metrics.hand_gesture_count !== undefined) {
        const val = metrics.hand_gesture_count;
        badgeGestures.textContent = val;
        // Color coding
        badgeGestures.className = val > 20 ? 'text-sm font-bold text-data-green' :
            val > 10 ? 'text-sm font-bold text-blue-400' :
                'text-sm font-bold text-data-amber';
    }

    // Update eye contact rate
    const eyeContactEl = document.getElementById('eye-contact-rate');
    if (eyeContactEl && metrics.eye_contact_percentage !== undefined) {
        const eyeVal = Math.round(metrics.eye_contact_percentage);
        eyeContactEl.textContent = eyeVal + '%';

        // Color coding for eye contact
        let eyeColor = 'data-green';
        if (eyeVal > 70) {
            eyeColor = 'data-green';
        } else if (eyeVal > 50) {
            eyeColor = 'data-amber';
        } else {
            eyeColor = 'data-red';
        }
        eyeContactEl.className = `text-sm font-bold text-${eyeColor}`;

        // Update eye contact bar
        const eyeBar = document.getElementById('eye-contact-bar');
        if (eyeBar) {
            eyeBar.style.width = eyeVal + '%';
            eyeBar.className = `bg-${eyeColor} h-1.5 rounded-full transition-all duration-300`;
        }
    }

    // Update detection rates
    const poseDetectionEl = document.getElementById('pose-detection-rate');
    if (poseDetectionEl && metrics.pose_detection_rate !== undefined) {
        const val = Math.round(metrics.pose_detection_rate);
        poseDetectionEl.textContent = val + '%';

        // Color coding
        let poseColor = 'data-green';
        if (val > 80) {
            poseColor = 'data-green';
        } else if (val > 50) {
            poseColor = 'data-amber';
        } else {
            poseColor = 'data-red';
        }
        poseDetectionEl.className = `text-sm font-bold text-${poseColor}`;

        // Update pose detection bar
        const poseBar = document.getElementById('pose-detection-bar');
        if (poseBar) {
            poseBar.style.width = val + '%';
            poseBar.className = `bg-${poseColor} h-1.5 rounded-full transition-all duration-300`;
        }
    }

    const handDetectionEl = document.getElementById('hand-detection-rate');
    if (handDetectionEl && metrics.hand_detection_rate !== undefined) {
        const val = Math.round(metrics.hand_detection_rate);
        handDetectionEl.textContent = val + '%';

        // Color coding
        let handColor = 'data-green';
        if (val > 70) {
            handColor = 'data-green';
        } else if (val > 40) {
            handColor = 'data-amber';
        } else {
            handColor = 'data-red';
        }
        handDetectionEl.className = `text-sm font-bold text-${handColor}`;

        // Update hand detection bar
        const handBar = document.getElementById('hand-detection-bar');
        if (handBar) {
            handBar.style.width = val + '%';
            handBar.className = `bg-${handColor} h-1.5 rounded-full transition-all duration-300`;
        }
    }

    // Update FPS
    const fpsEl = document.getElementById('video-fps');
    if (fpsEl && metrics.fps !== undefined) {
        const fpsVal = Math.round(metrics.fps);
        fpsEl.textContent = fpsVal;

        // Update FPS bar (scaled to show 0-30 FPS as 0-100%)
        const fpsBar = document.getElementById('fps-bar');
        if (fpsBar) {
            const fpsPercent = Math.min(100, (fpsVal / 30) * 100);
            fpsBar.style.width = fpsPercent + '%';
        }
    }
}

// In the startVideoAnalysis function, modify the videoSocket setup:
function startVideoAnalysis() {
    console.log('🎥 Starting Pose Analysis...');

    // Connect to pose analysis WebSocket
    const wsUrl = window.appConfig.getWebSocketUrl('/ws/video');
    console.log('🎥 Connecting to video WebSocket:', wsUrl);
    videoSocket = new WebSocket(wsUrl);

    videoSocket.onopen = function () {
        console.log('✓ Video Analysis connected');
        startSendingFrames();
    };

    videoSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        if (data.status === 'connected') {
            // Show overlay toggle button when connected
            const overlayBtn = document.getElementById('overlay-toggle-btn');
            if (overlayBtn) {
                overlayBtn.classList.remove('hidden');
            }

            // Show metric badges
            const metricBadges = document.getElementById('metric-badges');
            if (metricBadges) {
                metricBadges.classList.remove('hidden');
            }

            // Initialize overlay canvas
            overlayCanvas = document.getElementById('overlay-canvas');
            if (overlayCanvas) {
                overlayCanvas.width = overlayCanvas.offsetWidth;
                overlayCanvas.height = overlayCanvas.offsetHeight;
                overlayCtx = overlayCanvas.getContext('2d');
            }
        }
        else if (data.status === 'overlay_toggled') {
            console.log('🎨 Overlay toggled:', data.overlay_enabled);
        }
        else if (data.status === 'session_complete') {
            console.log('✓ Video final summary received:', data.metrics);
            videoFinalSummary = data.metrics;
            mapVideoMetrics();
            checkAndShowResultsButton();
        }
        else if (data.status === 'success' || data.status === 'no_pose') {
            updateVideoFeedback(data.feedback);
            updateVisualMetrics(data.metrics);

            // Display overlay frame if available
            if (data.overlay_frame && overlayEnabled && overlayCtx && overlayCanvas) {
                const img = new Image();
                img.onload = function () {
                    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                    overlayCtx.drawImage(img, 0, 0, overlayCanvas.width, overlayCanvas.height);
                };
                img.src = 'data:image/jpeg;base64,' + data.overlay_frame;
            } else if (!overlayEnabled && overlayCtx && overlayCanvas) {
                overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            }
        }
    };

    videoSocket.onclose = function (event) {
        console.log('✓ Pose Analysis disconnected', event.code, event.reason);

        if (frameInterval) {
            clearInterval(frameInterval);
            frameInterval = null;
        }
        videoSocket = null;
    };

    videoSocket.onerror = function (error) {
        console.error('❌ Pose Analysis error:', error);
    };
}

function startSendingFrames() {
    const webcamVideo = document.getElementById('webcam-feed');
    if (!webcamVideo) {
        console.error('🎥 ERROR - webcam-feed element not found!');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let framesSent = 0;

    // Send frames at 10 FPS
    frameInterval = setInterval(() => {
        if (!videoSocket || videoSocket.readyState !== WebSocket.OPEN) {
            return;
        }

        // Draw video frame to canvas
        ctx.drawImage(webcamVideo, 0, 0, canvas.width, canvas.height);

        // Convert to JPEG and send
        canvas.toBlob((blob) => {
            if (blob && videoSocket.readyState === WebSocket.OPEN) {
                blob.arrayBuffer().then(buffer => {
                    videoSocket.send(buffer);
                    framesSent++;
                });
            }
        }, 'image/jpeg', 0.7);

    }, 100);
}

function toggleOverlay() {
    if (window.AppConfig?.isProduction) {
        return;
    }

    overlayEnabled = !overlayEnabled;
    const icon = document.getElementById('overlay-icon');
    const btn = document.getElementById('overlay-toggle-btn');
    const canvas = document.getElementById('overlay-canvas');
    const metricBadges = document.getElementById('metric-badges');

    if (overlayEnabled) {
        icon.textContent = 'visibility';
        btn.classList.add('bg-primary');
        btn.classList.remove('bg-black/50');
        if (canvas) {
            canvas.classList.remove('hidden');
            const videoElement = document.getElementById('webcam-feed');
            if (videoElement && videoElement.videoWidth > 0) {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
            }
            overlayCanvas = canvas;
            overlayCtx = canvas.getContext('2d');
        }
        // Hide badges when showing raw pipe overlay to avoid clutter? 
        // Or keep them. Usually users want one or the other.
        // Keeping badges visible per request to restore functionality.
    } else {
        icon.textContent = 'visibility_off';
        btn.classList.remove('bg-primary');
        btn.classList.add('bg-black/50');
        if (canvas) {
            canvas.classList.add('hidden');
            if (overlayCtx) {
                overlayCtx.clearRect(0, 0, canvas.width, canvas.height);
            }
            overlayCtx = null;
        }
    }

    // Send toggle command to backend
    if (videoSocket && videoSocket.readyState === WebSocket.OPEN) {
        videoSocket.send(JSON.stringify({
            action: 'toggle_overlay',
            show: overlayEnabled
        }));
    }
}

function stopVideoAnalysis() {
    console.log('🛑 Stopping Pose Analysis...');

    // Stop sending frames
    if (frameInterval) {
        clearInterval(frameInterval);
        frameInterval = null;
    }

    // Send stop command and close WebSocket
    if (videoSocket && videoSocket.readyState === WebSocket.OPEN) {
        try {
            videoSocket.send(JSON.stringify({ action: 'stop' }));
            console.log('✓ Stop signal sent to video WebSocket');

            // Close the WebSocket after a brief delay to receive final message
            setTimeout(() => {
                if (videoSocket) {
                    videoSocket.close(1000, 'Session stopped by user');
                    videoSocket = null;
                }
            }, 500);
        } catch (e) {
            console.error('Error stopping video analysis:', e);
            videoSocket = null;
        }
    } else {
        // If video WebSocket is not available, use fallback
        videoFinalSummary = getFallbackVideoSummary();
        mapVideoMetrics();
        checkAndShowResultsButton();
    }

    // Hide overlay button and metric badges
    const overlayBtn = document.getElementById('overlay-toggle-btn');
    if (overlayBtn) overlayBtn.classList.add('hidden');

    const metricBadges = document.getElementById('metric-badges');
    if (metricBadges) metricBadges.classList.add('hidden');

    // Hide alert banner
    hideAlertBanner();

    overlayEnabled = false;
}

function updateVideoFeedback(feedbackList) {
    if (!feedbackList || feedbackList.length === 0) {
        if (!alertDisplaying) {
            hideAlertBanner();
        }
        return;
    }

    const priorityOrder = { 'critical': 4, 'warning': 3, 'good': 2, 'excellent': 1 };

    let highestPriorityAlert = feedbackList.reduce((highest, current) => {
        const currentPriority = priorityOrder[current.level] || 0;
        const highestPriority = priorityOrder[highest?.level] || 0;
        return currentPriority > highestPriority ? current : highest;
    }, null);

    if (highestPriorityAlert && highestPriorityAlert.message !== currentAlert?.message) {
        showAlertBanner(highestPriorityAlert);
    }
}

function showAlertBanner(alert) {
    const banner = document.getElementById('alert-banner');
    const content = document.getElementById('alert-content');
    const icon = document.getElementById('alert-icon');
    const message = document.getElementById('alert-message');

    if (!banner || !content) return;

    if (alertTimeout) {
        clearTimeout(alertTimeout);
    }

    let bgColor, iconEmoji, animationClass;
    switch (alert.level) {
        case 'critical':
            bgColor = 'bg-red-600/90';
            iconEmoji = '❗';
            animationClass = 'alert-pulse';
            break;
        case 'warning':
            bgColor = 'bg-amber-500/90';
            iconEmoji = '⚠️';
            animationClass = 'alert-glow';
            break;
        case 'good':
            bgColor = 'bg-blue-500/90';
            iconEmoji = '👍';
            animationClass = '';
            break;
        case 'excellent':
            bgColor = 'bg-green-600/90';
            iconEmoji = '✓';
            animationClass = '';
            break;
        default:
            bgColor = 'bg-gray-600/90';
            iconEmoji = '•';
            animationClass = '';
    }

    content.className = `rounded-lg backdrop-blur-md p-3 flex items-center gap-3 ${bgColor} ${animationClass}`;
    icon.textContent = iconEmoji;
    message.textContent = alert.message;

    banner.classList.remove('hidden', 'alert-slide-out');
    banner.classList.add('alert-slide-in');

    currentAlert = alert;
    alertDisplaying = true;

    alertTimeout = setTimeout(() => {
        hideAlertBanner();
    }, ALERT_DISPLAY_MS);
}

function hideAlertBanner() {
    const banner = document.getElementById('alert-banner');
    if (!banner || banner.classList.contains('hidden')) return;

    banner.classList.remove('alert-slide-in');
    banner.classList.add('alert-slide-out');

    setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('alert-slide-out');
        currentAlert = null;
        alertDisplaying = false;
    }, 300);
}

// ===== RESULTS MANAGEMENT FUNCTIONS =====

function createResultsButton() {
    if (!window.location.pathname.includes('/coach')) {
        return;
    }

    const resources = CONFIG.resources[document.documentElement.lang] || CONFIG.resources.ar || {};

    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'results-loading';
    loadingIndicator.className = 'hidden flex items-center justify-center gap-2 rounded-2xl bg-gray-400 px-4 py-2 text-white text-sm font-bold';
    loadingIndicator.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>${resources.processingResults || 'جاري المعالجة...'}</span>
    `;

    // Create results button
    const resultsButton = document.createElement('button');
    resultsButton.id = 'view-results-btn';
    resultsButton.className = 'hidden flex items-center justify-center gap-2 rounded-2xl bg-data-green px-4 py-2 text-white text-sm font-bold transition-colors hover:bg-green-700';

    // ✅ FIX 3: Localized Button with data-i18n
    resultsButton.innerHTML = `
        <span class="material-icons-outlined text-lg">analytics</span>
        <span data-i18n="coach.viewResults">${resources.viewResults || 'النتائج'}</span>
    `;
    resultsButton.onclick = redirectToResults;

    const header = document.querySelector('header .container');
    if (!header) {
        setTimeout(createResultsButton, 500);
        return;
    }

    const headerDiv = header.querySelector('.flex.items-center.justify-between');
    if (!headerDiv) {
        setTimeout(createResultsButton, 500);
        return;
    }

    const startSessionBtn = document.getElementById('start-session-btn');
    if (!startSessionBtn) {
        setTimeout(createResultsButton, 500);
        return;
    }

    if (document.documentElement.dir === 'rtl') {
        const rightSideContainer = startSessionBtn.parentElement;
        if (rightSideContainer) {
            rightSideContainer.insertBefore(resultsButton, startSessionBtn);
            rightSideContainer.insertBefore(loadingIndicator, startSessionBtn);
        } else {
            headerDiv.insertBefore(resultsButton, startSessionBtn);
            headerDiv.insertBefore(loadingIndicator, startSessionBtn);
        }
    } else {
        const rightSideContainer = startSessionBtn.parentElement;
        if (rightSideContainer) {
            rightSideContainer.insertBefore(loadingIndicator, startSessionBtn.nextSibling);
            rightSideContainer.insertBefore(resultsButton, startSessionBtn.nextSibling);
        } else {
            headerDiv.insertBefore(loadingIndicator, startSessionBtn.nextSibling);
            headerDiv.insertBefore(resultsButton, startSessionBtn.nextSibling);
        }
    }
}

function setupSummaryTimeout() {
    if (summaryTimeout) {
        clearTimeout(summaryTimeout);
    }

    summaryTimeout = setTimeout(() => {
        if (isWaitingForSummaries) {
            console.warn('⚠️ Summary timeout - proceeding with available data');

            if (!audioFinalSummary) {
                audioFinalSummary = getFallbackAudioSummary();
            }

            if (!videoFinalSummary) {
                videoFinalSummary = getFallbackVideoSummary();
            }

            checkAndShowResultsButton();
        }
    }, 10000);
}

function getFallbackAudioSummary() {
    return {
        overall_wpm: 0,
        total_words: 0,
        total_fillers: 0,
        vocab_diversity: 0,
        sentiment: 'neutral',
        sentiment_score: 0,
        speaking_duration: 0,
        total_duration: 0,
        language: document.documentElement.lang,
        transcription_service: 'speechmatics',
        wpm_category: 'slow',
        filler_category: 'low',
        speaking_percentage: 0,
        segment_count: 0
    };
}

function getFallbackVideoSummary() {
    return {
        eye_contact_percentage: 0,
        posture_quality: 0,
        hand_gesture_count: 0,
        facial_expression_score: 0,
        raw_metrics: {}
    };
}

function mapVideoMetrics() {
    if (!videoFinalSummary) return;

    const mappedMetrics = {
        eye_contact_percentage: videoFinalSummary.pose_detection_rate || 0,
        posture_quality: Math.max(0, 100 - (videoFinalSummary.slouch_percentage || 0)),
        hand_gesture_count: videoFinalSummary.hand_detection_rate || 0,
        facial_expression_score: Math.max(0, 100 - (videoFinalSummary.frozen_percentage || 0)),
        raw_metrics: videoFinalSummary
    };

    videoFinalSummary = mappedMetrics;
}

function checkAndShowResultsButton() {
    if (audioFinalSummary && videoFinalSummary && isWaitingForSummaries) {
        if (summaryTimeout) {
            clearTimeout(summaryTimeout);
            summaryTimeout = null;
        }

        const loadingIndicator = document.getElementById('results-loading');
        const resultsBtn = document.getElementById('view-results-btn');

        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (resultsBtn) resultsBtn.classList.remove('hidden');

        resetStartSessionButton();

        isWaitingForSummaries = false;
    }
}

function resetStartSessionButton() {
    const startSessionBtn = document.getElementById('start-session-btn');
    const startSessionText = document.getElementById('start-session-text');
    const sessionIcon = startSessionBtn.querySelector('.material-icons-outlined');
    const resources = CONFIG.resources[document.documentElement.lang] || {};

    startSessionBtn.classList.remove('bg-data-red', 'hover:bg-red-700');
    startSessionBtn.classList.add('bg-primary', 'hover:bg-blue-700');
    startSessionText.textContent = resources.startSession || 'ابدأ الجلسة';
    if (sessionIcon) sessionIcon.textContent = 'play_circle';
    startSessionBtn.onclick = toggleSession;
}

function redirectToResults() {
    window.location.href = '/results';
}

// Guidance WebSocket state

// Initialize guidance WebSocket when session starts
function initializeGuidanceWebSocket() {
    const selectedLanguage = document.documentElement.lang;
    const selectedTopic = CONFIG.currentTopic;

    const wsUrl = window.appConfig.getWebSocketUrl('/ws/guidance', {
        language: selectedLanguage,
        topic: selectedTopic
    });

    guidanceSocket = new WebSocket(wsUrl);

    guidanceSocket.onopen = function (event) {
        guidanceState.enabled = true;
        startGuidanceRefreshTimers();
    };

    guidanceSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        if (data.type === 'feedback') {
            updateFeedbackContent(data.content, data.error);
        } else if (data.type === 'guidance') {
            updateGuidanceContent(data.content, data.error);
        } else if (data.status === 'connected') {
            if (data.feedback_refresh_interval !== undefined) {
                guidanceState.feedbackRefreshInterval = data.feedback_refresh_interval * 1000;
            }
            if (data.guidance_refresh_interval !== undefined) {
                guidanceState.guidanceRefreshInterval = data.guidance_refresh_interval * 1000;
            }
            if (data.transcription_chunk_size !== undefined) {
                guidanceState.transcriptionChunkSize = data.transcription_chunk_size;
            }

            startGuidanceRefreshTimers();
        }
    };

    guidanceSocket.onclose = function (event) {
        guidanceState.enabled = false;
        stopGuidanceRefreshTimers();
        hideGuidanceRefreshIndicators();
        resetProgressBars();
    };

    guidanceSocket.onerror = function (error) {
        console.error('🧠 Guidance WebSocket error:', error);
        guidanceState.enabled = false;
    };
}

// Reset progress bars to initial state
function resetProgressBars() {
    const feedbackProgress = document.getElementById('feedback-progress-bar');
    const guidanceProgress = document.getElementById('guidance-progress-bar');

    if (feedbackProgress) feedbackProgress.style.width = '0%';
    if (guidanceProgress) guidanceProgress.style.width = '0%';
}

// Stop guidance WebSocket when session ends
function stopGuidanceWebSocket() {
    guidanceState.enabled = false;

    if (guidanceSocket && guidanceSocket.readyState === WebSocket.OPEN) {
        guidanceSocket.send(JSON.stringify({ action: 'stop' }));
        guidanceSocket.close(1000, 'Session ended');
    }

    guidanceSocket = null;
    stopGuidanceRefreshTimers();
    hideGuidanceRefreshIndicators();

    guidanceState.feedbackRefreshInterval = null;
    guidanceState.guidanceRefreshInterval = null;
    resetGuidanceContent();
}

// Sentiments WebSocket functions

function initializeSentimentsWebSocket() {
    const selectedLanguage = document.documentElement.lang;
    const selectedTopic = CONFIG.currentTopic;

    const wsUrl = window.appConfig.getWebSocketUrl('/ws/sentiments', {
        language: selectedLanguage,
        topic: selectedTopic
    });

    sentimentsSocket = new WebSocket(wsUrl);

    sentimentsSocket.onopen = function () {
        sentimentsState.enabled = true;
        sentimentsState.hasResult = false;
    };

    sentimentsSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        if (data.type === 'sentiment') {
            const content = data.content;
            sentimentsState.hasResult = true;
            sentimentsState.lastResult = content;
            updateSentimentDisplay(content);
        } else if (data.status === 'connected') {
            console.log('💬 Sentiments WebSocket connected');
        }
    };

    sentimentsSocket.onclose = function () {
        sentimentsState.enabled = false;
    };

    sentimentsSocket.onerror = function (error) {
        console.error('💬 Sentiments WebSocket error:', error);
        sentimentsState.enabled = false;
    };
}

function stopSentimentsWebSocket() {
    sentimentsState.enabled = false;

    if (sentimentsSocket && sentimentsSocket.readyState === WebSocket.OPEN) {
        sentimentsSocket.send(JSON.stringify({ action: 'stop' }));
        sentimentsSocket.close(1000, 'Session ended');
    }

    sentimentsSocket = null;
    sentimentsState.hasResult = false;
    sentimentsState.lastResult = null;
}

function sendTranscriptionToSentiments() {
    if (!sentimentsState.enabled || !sentimentsSocket || sentimentsSocket.readyState !== WebSocket.OPEN) {
        return;
    }

    const transcription = getRecentTranscriptionForSentiments();

    if (transcription && transcription.trim() && transcription !== sentimentsState.lastTranscriptionUpdate) {
        sentimentsSocket.send(JSON.stringify({
            action: 'update_transcription',
            transcription: transcription
        }));
        sentimentsState.lastTranscriptionUpdate = transcription;
    }
}

function getRecentTranscriptionForSentiments() {
    const transcriptionDisplay = document.getElementById('transcription-display');
    if (!transcriptionDisplay) return '';

    if (speechmaticsState.currentText && speechmaticsState.currentText.trim()) {
        return speechmaticsState.currentText.trim();
    }

    return '';
}

// Send transcription updates to guidance WebSocket
function sendTranscriptionToGuidance() {
    if (!guidanceState.enabled || !guidanceSocket || guidanceSocket.readyState !== WebSocket.OPEN) {
        return;
    }

    const recentTranscription = getRecentTranscriptionForGuidance();

    if (recentTranscription && recentTranscription.trim() && recentTranscription !== guidanceState.lastTranscriptionUpdate) {
        guidanceSocket.send(JSON.stringify({
            action: 'update_transcription',
            transcription: recentTranscription
        }));
        guidanceState.lastTranscriptionUpdate = recentTranscription;
    }
}

function getRecentTranscriptionForGuidance() {
    const transcriptionDisplay = document.getElementById('transcription-display');
    if (!transcriptionDisplay) return '';

    if (speechmaticsState.currentText && speechmaticsState.currentText.trim()) {
        const text = speechmaticsState.currentText.trim();
        return text;
    }

    return '';
}

// Update feedback content
function updateFeedbackContent(content, isError = false) {
    const feedbackElement = document.getElementById('ai-feedback-content');
    if (!feedbackElement) return;

    const resources = CONFIG.resources[document.documentElement.lang] || {};
    const updatingText = resources.updatingAnalysis || 'جاري تحديث التحليل...';

    // Show loading state briefly when new content is being processed
    feedbackElement.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-muted-light dark:text-muted-dark">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
            <p class="italic text-sm">${updatingText}</p>
        </div>
    `;

    // Brief delay to show loading, then display content
    setTimeout(() => {
        const contentClass = isError ? 'text-muted-light dark:text-muted-dark italic' : 'text-text-light dark:text-text-dark';
        feedbackElement.innerHTML = `<p class="${contentClass} text-sm leading-relaxed">${content}</p>`;

        restartRefreshTimer('feedback');
    }, 800);
}

// Update guidance content with loading state only when new content is coming
function updateGuidanceContent(content, isError = false) {
    const guidanceElement = document.getElementById('speaking-guidance-content');
    if (!guidanceElement) return;

    const resources = CONFIG.resources[document.documentElement.lang] || {};
    const updatingText = resources.updatingGuidance || 'جاري تحديث التوجيهات...';

    guidanceElement.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-muted-light dark:text-muted-dark">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
            <p class="italic text-sm">${updatingText}</p>
        </div>
    `;

    setTimeout(() => {
        const contentClass = isError ? 'text-muted-light dark:text-muted-dark italic' : 'text-text-light dark:text-text-dark';
        guidanceElement.innerHTML = `<p class="${contentClass} text-sm leading-relaxed">${content}</p>`;

        restartRefreshTimer('guidance');
    }, 800);
}

// Reset to initial state
function resetGuidanceContent() {
    const feedbackElement = document.getElementById('ai-feedback-content');
    const guidanceElement = document.getElementById('speaking-guidance-content');
    const resources = CONFIG.resources[document.documentElement.lang] || {};

    if (feedbackElement) {
        feedbackElement.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-muted-light dark:text-muted-dark">
                <p class="italic text-center">${resources.contentPlaceholder || 'سيظهر تحليل المحتوى هنا...'}</p>
            </div>
        `;
    }

    if (guidanceElement) {
        guidanceElement.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-muted-light dark:text-muted-dark">
                <p class="italic text-center">${resources.guidancePlaceholder || 'ستظهر التوجيهات هنا...'}</p>
            </div>
        `;
    }
}

// Start refresh timers with the actual intervals from config
function startGuidanceRefreshTimers() {
    const feedbackRefresh = document.getElementById('ai-feedback-refresh');
    const guidanceRefresh = document.getElementById('speaking-guidance-refresh');

    if (feedbackRefresh) feedbackRefresh.classList.remove('hidden');
    if (guidanceRefresh) guidanceRefresh.classList.remove('hidden');

    if (guidanceState.feedbackRefreshInterval) {
        restartRefreshTimer('feedback');
    }
    if (guidanceState.guidanceRefreshInterval) {
        restartRefreshTimer('guidance');
    }
}

// Restart individual refresh timer with progress bar
function restartRefreshTimer(type) {
    const timerElement = document.getElementById(`${type}-refresh-timer`);
    const progressBar = document.getElementById(`${type}-progress-bar`);
    if (!timerElement || !progressBar) return;

    const intervalMs = type === 'feedback' ?
        guidanceState.feedbackRefreshInterval :
        guidanceState.guidanceRefreshInterval;

    if (!intervalMs) {
        return;
    }

    let seconds = Math.round(intervalMs / 1000);
    const totalSeconds = seconds;

    progressBar.style.width = '100%';

    const countdown = setInterval(() => {
        seconds--;
        timerElement.textContent = seconds;

        const progressPercent = (seconds / totalSeconds) * 100;
        progressBar.style.width = `${progressPercent}%`;

        if (seconds <= 0) {
            clearInterval(countdown);
            timerElement.textContent = '0';
            progressBar.style.width = '0%';
        }
    }, 1000);

    if (type === 'feedback') {
        if (guidanceState.feedbackTimer) {
            clearInterval(guidanceState.feedbackTimer);
        }
        guidanceState.feedbackTimer = countdown;
    } else {
        if (guidanceState.guidanceTimer) {
            clearInterval(guidanceState.guidanceTimer);
        }
        guidanceState.guidanceTimer = countdown;
    }
}

// Stop refresh timers and progress bars
function stopGuidanceRefreshTimers() {
    if (guidanceState.feedbackTimer) {
        clearInterval(guidanceState.feedbackTimer);
        guidanceState.feedbackTimer = null;
    }
    if (guidanceState.guidanceTimer) {
        clearInterval(guidanceState.guidanceTimer);
        guidanceState.guidanceTimer = null;
    }
}

// Hide refresh indicators
function hideGuidanceRefreshIndicators() {
    const feedbackRefresh = document.getElementById('ai-feedback-refresh');
    const guidanceRefresh = document.getElementById('speaking-guidance-refresh');

    if (feedbackRefresh) feedbackRefresh.classList.add('hidden');
    if (guidanceRefresh) guidanceRefresh.classList.add('hidden');
}

function updateSpeechmaticsTranscription(transcription, chunkMetrics) {
    const transcriptionDisplay = document.getElementById('transcription-display');
    if (!transcriptionDisplay) return;

    if (speechmaticsState.isFirstTranscription && transcription.trim()) {
        const placeholder = transcriptionDisplay.querySelector('.text-muted-light');
        if (placeholder && placeholder.classList.contains('italic')) {
            placeholder.remove();
        }
        speechmaticsState.isFirstTranscription = false;
    }

    if (!transcription.trim()) {
        return;
    }

    speechmaticsState.currentText = transcription;
    updateRealtimeTranscriptionDisplay(speechmaticsState.currentText, chunkMetrics);
    sendTranscriptionToGuidance();
    sendTranscriptionToSentiments();
}

function updateRealtimeTranscriptionDisplay(text, chunkMetrics) {
    const transcriptionDisplay = document.getElementById('transcription-display');
    if (!transcriptionDisplay) return;

    let realtimeElement = transcriptionDisplay.querySelector('.realtime-transcription');

    if (!realtimeElement) {
        realtimeElement = document.createElement('div');
        realtimeElement.className = 'realtime-transcription';
        transcriptionDisplay.appendChild(realtimeElement);
    }

    const isFinal = chunkMetrics && chunkMetrics.is_final;
    const isPartial = chunkMetrics && chunkMetrics.is_partial;

    if (isFinal) {
        realtimeElement.innerHTML = `
            <div class="text-text-light dark:text-text-dark text-sm leading-relaxed">
                ${text}
            </div>
        `;
    } else if (isPartial) {
        realtimeElement.innerHTML = `
            <div class="text-text-light dark:text-text-dark text-sm leading-relaxed">
                ${text}<span class="blinking-cursor text-primary">▊</span>
            </div>
        `;
    } else {
        realtimeElement.innerHTML = `
            <div class="text-text-light dark:text-text-dark text-lg leading-relaxed">
                ${text}
            </div>
        `;
    }

    const scrollContainer = transcriptionDisplay.parentElement;
    if (scrollContainer) {
        requestAnimationFrame(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM loaded, starting initialization...');

    // Initialize theme UI immediately
    if (window.initializeThemeUI) {
        window.initializeThemeUI();
    }

    setTimeout(() => {
        console.log('⏰ Initializing app components...');
        initializeApp();
        setupSettingsModal();
    }, 300);
});

function resetMetricsDisplay() {
    const resources = CONFIG.resources[document.documentElement.lang] || {};

    const paceValue = document.getElementById('pace-value');
    const paceStatus = document.getElementById('pace-status');
    const paceInstruction = document.getElementById('pace-instruction');

    if (paceValue) paceValue.textContent = '0';
    if (paceStatus) {
        paceStatus.textContent = '-';
        paceStatus.className = `text-muted-light dark:text-muted-dark text-base font-bold leading-tight`;
    }
    if (paceInstruction && resources?.speechAnalysis?.paceInitial) {
        paceInstruction.textContent = resources.speechAnalysis.paceInitial;
    }

    const fillerValue = document.getElementById('filler-words-value');
    if (fillerValue) {
        fillerValue.textContent = '0';
        fillerValue.className = `text-data-amber tracking-light text-3xl font-bold leading-tight`;
    }

    const sentimentValue = document.getElementById('sentiment-value');
    if (sentimentValue) { sentimentValue.textContent = '-'; sentimentValue.className = 'text-data-amber text-xs font-bold truncate leading-snug mt-0.5'; }
    const intentEl = document.getElementById('intent-value');
    if (intentEl) intentEl.textContent = '-';

    const intensityFill = document.getElementById('intensity-fill');
    if (intensityFill) { intensityFill.style.width = '0%'; intensityFill.className = 'h-full rounded-full transition-all duration-300'; }

    updateUrgencyButtons(null);

    sentimentsState.hasResult = false;
    sentimentsState.lastResult = null;

    const vocabValue = document.getElementById('vocab-diversity-value');
    if (vocabValue) vocabValue.textContent = '0%';
}

function startSession() {
    lastMetricsUpdateTime = 0;
    metricsUpdateCount = 0;

    const resources = CONFIG.resources[document.documentElement.lang] || {};
    const oldTimestamp = document.getElementById('metrics-timestamp');
    if (oldTimestamp) {
        oldTimestamp.remove();
    }

    const selectedLanguage = document.documentElement.lang;
    const selectedTopic = CONFIG.currentTopic;
    const selectedService = 'speechmatics';

    const wsUrl = window.appConfig.getWebSocketUrl('/ws/audio', {
        language: selectedLanguage,
        service: selectedService,
        topic: selectedTopic
    });

    if (socket) {
        socket.close();
    }

    socket = new WebSocket(wsUrl);

    speechmaticsState = {
        currentText: '',
        isFirstTranscription: true
    };

    const transcriptionDisplay = document.getElementById('transcription-display');
    if (transcriptionDisplay) {
        transcriptionDisplay.innerHTML = `
            <p class="text-muted-light dark:text-muted-dark italic">
                ${resources.transcriptionStatus?.connecting || 'جاري الاتصال بخدمة النسخ الفوري...'}
            </p>
        `;
    }

    resetMetricsDisplay();

    socket.onopen = function (event) {
        sessionStartTime = Date.now();
        startAudioCapture();
        startWebcam();
        updateSessionUI(true);
        startRecordingTimer();
        startVideoAnalysis();
        initializeGuidanceWebSocket();
        initializeSentimentsWebSocket();

        if (selectedService === 'speechmatics') {
            const transcriptionDisplay = document.getElementById('transcription-display');
            if (transcriptionDisplay) {
                transcriptionDisplay.innerHTML = `
                    <p class="text-muted-light dark:text-muted-dark italic">
                        ${resources.transcriptionStatus?.started || 'جاري النسخ الفوري... ابدأ بالتحدث'}
                    </p>
                `;
            }
        }
    };

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        switch (data.status) {
            case 'connected':
                break;

            case 'transcription':
                updateSpeechmaticsTranscription(data.transcription, {
                    is_final: data.is_final || true,
                    is_partial: data.is_partial || false,
                    segment_start: data.segment_start,
                    segment_end: data.segment_end
                });
                sendTranscriptionToGuidance();
                break;

            case 'metrics':
                const currentTime = Date.now();
                const METRICS_UPDATE_INTERVAL = 5000;

                const shouldUpdateMetrics = (
                    currentTime - lastMetricsUpdateTime >= METRICS_UPDATE_INTERVAL ||
                    lastMetricsUpdateTime === 0 ||
                    data.force_update === true
                );

                if (shouldUpdateMetrics) {
                    updateSpeechMetrics(data.metrics);
                    lastMetricsUpdateTime = currentTime;
                }
                break;

            case 'session_complete':
                audioFinalSummary = data.summary;

                if (data.summary) {
                    const sessionData = {
                        audio: {
                            summary: data.summary,
                            detailed_metrics: {
                                wpm: data.summary.overall_wpm || 0,
                                total_words: data.summary.total_words || 0,
                                total_fillers: data.summary.total_fillers || 0,
                                vocab_diversity: data.summary.vocab_diversity || 0,
                                sentiment: data.summary.sentiment_score || 0,
                                sentiment_label: data.summary.sentiment || 'neutral'
                            }
                        },
                        visual: {
                            summary: videoFinalSummary || getFallbackVideoSummary(),
                            detailed_metrics: {
                                eye_contact: videoFinalSummary?.eye_contact_percentage || 0,
                                posture_quality: videoFinalSummary?.posture_quality || 0,
                                hand_gestures: videoFinalSummary?.hand_gesture_count || 0,
                                facial_expression: videoFinalSummary?.facial_expression_score || 0,
                                raw_metrics: videoFinalSummary?.raw_metrics || {}
                            }
                        },
                        timestamp: new Date().toISOString(),
                        duration: data.summary.total_duration || 0,
                        language: document.documentElement.lang,
                        transcription_service: 'speechmatics'
                    };

                    sessionStorage.setItem('sessionResults', JSON.stringify(sessionData));
                }

                checkAndShowResultsButton();
                break;

            case 'warning':
                showNotification(data.warning, 'warning');
                break;

            case 'error':
                showNotification(data.error, 'error');
                break;

            case 'listening':
                const listeningCurrentTime = Date.now();
                const LISTENING_UPDATE_INTERVAL = 10000;

                if (listeningCurrentTime - lastMetricsUpdateTime >= LISTENING_UPDATE_INTERVAL) {
                    updateSpeechMetricsListening(data);
                    lastMetricsUpdateTime = listeningCurrentTime;
                }
                break;
        }
    };
}

function updateSpeechMetrics(metrics, isFinal = false) {
    const resources = CONFIG.resources[document.documentElement.lang] || {};

    const paceValue = document.getElementById('pace-value');
    const paceStatus = document.getElementById('pace-status');
    const paceInstruction = document.getElementById('pace-instruction');

    if (paceValue && metrics.wpm !== undefined) {
        let wpmValue = parseFloat(metrics.wpm) || 0;

        if (isFinal && paceInstruction) {
            paceInstruction.textContent = 'معدل نهائي';
        }

        if (isNaN(wpmValue)) {
            wpmValue = 0;
        }

        paceValue.textContent = wpmValue.toFixed(1);

        const pacePercentage = Math.min(100, (wpmValue / 200) * 100);
        const paceRing = document.querySelector('.progress-ring-circle.text-data-amber');
        if (paceRing) {
            paceRing.style.strokeDasharray = `${pacePercentage}, 100`;
        }

        if (paceStatus && resources?.speechAnalysis?.wpmStatus) {
            let statusKey = 'good';
            let statusText = resources.speechAnalysis.wpmStatus.good || 'Good';
            let statusColor = 'data-green';

            if (wpmValue < 80) {
                statusKey = 'very_slow';
                statusText = resources.speechAnalysis.wpmStatus.very_slow || 'Very Slow';
                statusColor = 'data-red';
            } else if (wpmValue < 120) {
                statusKey = 'good';
                statusText = resources.speechAnalysis.wpmStatus.good || 'Good';
                statusColor = 'data-green';
            } else if (wpmValue < 180) {
                statusKey = 'fast';
                statusText = resources.speechAnalysis.wpmStatus.fast || 'Fast';
                statusColor = 'data-amber';
            } else {
                statusKey = 'very_fast';
                statusText = resources.speechAnalysis.wpmStatus.very_fast || 'Very Fast';
                statusColor = 'data-red';
            }

            paceStatus.textContent = statusText;
            paceStatus.className = `text-${statusColor} text-base font-bold leading-tight`;

            if (paceInstruction && resources.speechAnalysis?.wpmInstruction) {
                paceInstruction.textContent = resources.speechAnalysis.wpmInstruction[statusKey] ||
                    resources.speechAnalysis.paceDescription ||
                    'كلمات في الدقيقة';
            }
        }
    }

    const fillerValue = document.getElementById('filler-words-value');
    if (fillerValue && metrics.total_fillers !== undefined && metrics.total_fillers !== null) {
        let fillerCount;
        if (typeof metrics.total_fillers === 'string') {
            fillerCount = parseInt(metrics.total_fillers, 10);
        } else if (typeof metrics.total_fillers === 'number') {
            fillerCount = Math.floor(metrics.total_fillers);
        } else {
            fillerCount = 0;
        }

        if (isNaN(fillerCount)) {
            fillerCount = 0;
        }

        fillerValue.textContent = fillerCount;

        const totalWords = parseInt(metrics.total_words) || 1;
        const fillerRatio = fillerCount / totalWords;
        let fillerColor = 'data-green';

        if (fillerRatio > 0.1) {
            fillerColor = 'data-red';
        } else if (fillerRatio > 0.05) {
            fillerColor = 'data-amber';
        }

        fillerValue.className = `text-${fillerColor} tracking-light text-3xl font-bold leading-tight`;

        if (metrics.filler_breakdown && typeof metrics.filler_breakdown === 'object') {
            updateFillerWords(metrics.filler_breakdown, fillerCount, resources);
        }
    }

    const sentimentValue = document.getElementById('sentiment-value');
    if (sentimentValue && metrics.sentiment !== undefined && metrics.sentiment !== null) {
        if (!sentimentsState.hasResult) {
            updateSentimentDisplay({ sentiment: metrics.sentiment, sentiment_score: metrics.sentiment_score });
        }
    }

    const vocabValue = document.getElementById('vocab-diversity-value');

    if (vocabValue && metrics.vocab_diversity !== undefined && metrics.vocab_diversity !== null) {
        let diversityPercent;
        if (typeof metrics.vocab_diversity === 'string') {
            diversityPercent = parseFloat(metrics.vocab_diversity) * 100;
        } else if (typeof metrics.vocab_diversity === 'number') {
            diversityPercent = metrics.vocab_diversity * 100;
        } else {
            diversityPercent = 0;
        }

        if (isNaN(diversityPercent)) {
            diversityPercent = 0;
        }

        vocabValue.textContent = diversityPercent.toFixed(1) + '%';

        let vocabColor = 'data-amber';
        if (diversityPercent > 60) {
            vocabColor = 'data-green';
        } else if (diversityPercent < 30) {
            vocabColor = 'data-red';
        }

        vocabValue.className = `text-${vocabColor} text-xl font-bold`;
    }

    trackMetricsUpdate(metrics, 'updateSpeechMetrics');
}

function updateSentimentDisplay(data) {
    if (!data) return;

    const resources = CONFIG.resources[document.documentElement.lang] || {};
    const sentiment = data.sentiment || data;
    const sentimentStr = String(sentiment).toLowerCase();
    let displayText = sentiment;
    let sentimentColor = 'data-amber';

    if (typeof sentiment === 'string' && resources?.speechAnalysis?.sentimentStatus) {
        if (sentimentStr.includes('positive') || sentimentStr === 'positive') {
            displayText = resources.speechAnalysis.sentimentStatus.positive || 'Positive';
            sentimentColor = 'data-green';
        } else if (sentimentStr.includes('negative') || sentimentStr === 'negative') {
            displayText = resources.speechAnalysis.sentimentStatus.negative || 'Negative';
            sentimentColor = 'data-red';
        } else {
            displayText = resources.speechAnalysis.sentimentStatus.neutral || 'Neutral';
        }
    }

    const sentimentEl = document.getElementById('sentiment-value');
    if (sentimentEl) {
        sentimentEl.textContent = displayText;
        sentimentEl.className = `text-${sentimentColor} text-xs font-bold truncate leading-snug mt-0.5`;
    }

    if (typeof data !== 'object' || data === null) return;

    const intentEl = document.getElementById('intent-value');
    if (intentEl) intentEl.textContent = data.intent || '-';

    updateIntensityBar(data.intensity);
    updateUrgencyButtons(data.urgency);
}

function updateIntensityBar(intensity) {
    const fill = document.getElementById('intensity-fill');
    if (!fill) return;

    const levels = { 'منخفض': 33, 'متوسط': 66, 'عالي': 100 };
    const colors = { 'منخفض': 'bg-data-green', 'متوسط': 'bg-data-amber', 'عالي': 'bg-data-red' };
    const pct = levels[intensity] || 0;
    fill.style.width = pct + '%';
    fill.className = `h-full rounded-full transition-all duration-300 ${colors[intensity] || 'bg-gray-400 dark:bg-gray-500'}`;
}

function updateUrgencyButtons(urgency) {
    const buttons = document.querySelectorAll('#urgency-buttons .urgency-btn');
    buttons.forEach(function (btn) {
        const val = btn.getAttribute('data-value');
        if (val === urgency) {
            btn.className = 'urgency-btn px-2 py-0.5 text-[10px] leading-tight rounded-md border transition-colors bg-primary text-white border-primary';
        } else {
            btn.className = 'urgency-btn px-2 py-0.5 text-[10px] leading-tight rounded-md border transition-colors bg-transparent text-muted-light dark:text-muted-dark border-gray-300 dark:border-gray-600';
        }
    });
}

function storeSessionSummary(summary) {
    if (!summary) return;

    const sessionData = {
        audio: {
            summary: summary,
            detailed_metrics: {
                wpm: summary.overall_wpm || summary.wpm || 0,
                total_words: summary.total_words || 0,
                total_fillers: summary.total_fillers || 0,
                vocab_diversity: summary.vocab_diversity || 0,
                sentiment: summary.sentiment_score || 0,
                sentiment_label: summary.sentiment || 'neutral'
            }
        },
        visual: {
            summary: videoFinalSummary || getFallbackVideoSummary(),
            detailed_metrics: {
                eye_contact: videoFinalSummary?.eye_contact_percentage || 0,
                posture_quality: videoFinalSummary?.posture_quality || 0,
                hand_gestures: videoFinalSummary?.hand_gesture_count || 0,
                facial_expression: videoFinalSummary?.facial_expression_score || 0,
                raw_metrics: videoFinalSummary?.raw_metrics || {}
            }
        },
        timestamp: new Date().toISOString(),
        duration: summary.total_duration || 0,
        language: document.documentElement.lang,
        transcription_service: 'speechmatics'
    };

    sessionStorage.setItem('sessionResults', JSON.stringify(sessionData));
}

let metricsHistory = [];

function trackMetricsUpdate(metrics, source) {
    const entry = {
        timestamp: new Date().toISOString(),
        source: source,
        metrics: metrics,
        uiState: {
            wpm: document.getElementById('pace-value')?.textContent,
            fillers: document.getElementById('filler-words-value')?.textContent,
            sentiment: document.getElementById('sentiment-value')?.textContent
        }
    };

    metricsHistory.push(entry);

    if (metricsHistory.length > 10) {
        metricsHistory = metricsHistory.slice(-10);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-amber-500 text-white' :
            'bg-primary text-white'
        }`;

    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="material-icons-outlined">
                ${type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}
            </span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function toggleTheme() {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.contains('dark');
    const themeIcon = document.querySelector('#theme-toggle .material-icons-outlined');

    if (isDark) {
        htmlElement.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
        localStorage.setItem('theme', 'light');
    } else {
        htmlElement.classList.add('dark');
        if (themeIcon) themeIcon.textContent = 'light_mode';
        localStorage.setItem('theme', 'dark');
    }
}
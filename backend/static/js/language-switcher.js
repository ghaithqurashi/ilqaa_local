// language-switcher.js - Universal Version
(function() {
    let translations = {};
    let currentLang = 'ar';
    const defaultLang = 'ar';
    const supportedLangs = ['ar', 'en'];

    // Load translations
    async function loadTranslations() {
        try {
            const response = await fetch('/data/translations.json');
            translations = await response.json();
            console.log('✅ Translations loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load translations:', error);
            return false;
        }
    }

    // Get translation using dot notation (e.g. "login.pageTitle")
    function getTranslation(key, lang = currentLang) {
        if (!translations || !key) return null;
        
        const parts = key.split('.');
        const section = parts[0]; // e.g., 'common', 'index', 'login'
        
        // Ensure the section exists in translations
        if (!translations[section]) return null;
        
        // Get the language-specific branch (e.g., translations['login']['ar'])
        let current = translations[section][lang];
        if (!current) return null;
        
        // Traverse the rest of the keys (e.g., 'pageTitle' or 'nav.home')
        for (let i = 1; i < parts.length; i++) {
            if (current[parts[i]] !== undefined) {
                current = current[parts[i]];
            } else {
                return null;
            }
        }
        
        return current;
    }

    // Update all elements with data-i18n
    function updatePage() {
        if (!translations) return;
        
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            const text = getTranslation(key);
            
            if (text) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = text;
                } else if (el.tagName === 'IMG' && el.getAttribute('data-i18n-src')) {
                    // Special handling for images
                    // The element should have data-i18n="alt_text_key" and data-i18n-src="src_key"
                     const srcKey = el.getAttribute('data-i18n-src');
                     const srcText = getTranslation(srcKey);
                     if(srcText) el.src = srcText;
                     el.alt = text; // applies the data-i18n value to alt
                } else if (el.hasAttribute('data-i18n-html')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            }
        });
        
        // Helper to update specific attribute if needed (e.g. for image sources in index)
        document.querySelectorAll('[data-i18n-src]').forEach((el) => {
             const key = el.getAttribute('data-i18n-src');
             const text = getTranslation(key);
             if (text) el.src = text;
        });
    }

    // Set language
    async function setLanguage(lang) {
        if (!supportedLangs.includes(lang)) return;
        
        console.log(`🌐 Switching to language: ${lang}`);
        
        currentLang = lang;
        localStorage.setItem('ilqaa_language', lang);
        
        // Update HTML attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        
        // Update page title if defined
        // We look for a data-i18n on the title tag, or a specific meta tag, 
        // but often the title tag is outside body. We can try to fetch a specific key if known.
        // For login, it's login.pageTitle. For index, index.pageTitle.
        // We can just try to update based on what page we are on, or rely on updatePage finding the <title> if it has data-i18n
        const titleEl = document.querySelector('title[data-i18n]');
        if(titleEl) {
             const titleKey = titleEl.getAttribute('data-i18n');
             const titleText = getTranslation(titleKey);
             if(titleText) document.title = titleText;
        }
        
        // Update page content
        updatePage();
        
        // Update active button state
        updateLanguageMenu(lang);
        
        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang, direction: lang === 'ar' ? 'rtl' : 'ltr' }
        }));
    }

    // Update language menu buttons
    function updateLanguageMenu(lang) {
        document.querySelectorAll('[data-lang]').forEach(btn => {
            const btnLang = btn.getAttribute('data-lang');
            const isActive = btnLang === lang;
            
            btn.setAttribute('aria-pressed', isActive);
            btn.classList.toggle('bg-gray-100', isActive);
            btn.classList.toggle('dark:bg-gray-700', isActive);
            btn.classList.toggle('font-semibold', isActive);
        });
    }

    // Get saved language
    function getSavedLanguage() {
        const saved = localStorage.getItem('ilqaa_language');
        if (saved && supportedLangs.includes(saved)) return saved;
        
        const browserLang = navigator.language.split('-')[0];
        if (supportedLangs.includes(browserLang)) return browserLang;
        
        return defaultLang;
    }

    // Setup language switcher event listeners
    function setupLanguageSwitcher() {
        const languageToggle = document.getElementById('language-toggle');
        const languageMenu = document.getElementById('language-menu');
        
        if (languageToggle && languageMenu) {
            // Toggle menu on button click
            languageToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                languageMenu.classList.toggle('hidden');
            });
            
            // Language selection buttons (desktop)
            document.querySelectorAll('#language-menu [data-lang]').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const lang = this.getAttribute('data-lang');
                    setLanguage(lang);
                    languageMenu.classList.add('hidden');
                });
            });
            
            // Close menu when clicking outside (desktop only)
            document.addEventListener('click', function(e) {
                const languageSwitcher = document.getElementById('language-switcher');
                if (languageSwitcher && !languageSwitcher.contains(e.target)) {
                    if (!languageMenu.classList.contains('hidden')) {
                        languageMenu.classList.add('hidden');
                    }
                }
            });
            
            // Prevent clicks inside menu from closing it
            languageMenu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        // Mobile language buttons are handled by mobile-nav.js usually, 
        // but we can add a listener here just in case if specific IDs exist
    }

    // Initialize
    async function init() {
        console.log('🚀 Initializing language switcher...');
        
        const loaded = await loadTranslations();
        if (!loaded) return;
        
        const savedLang = getSavedLanguage();
        await setLanguage(savedLang);
        
        setupLanguageSwitcher();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    window.LanguageSwitcher = {
        setLanguage,
        getTranslation: (key) => getTranslation(key, currentLang),
        getCurrentLanguage: () => currentLang,
        translateKey: (key, lang = currentLang) => getTranslation(key, lang)
    };
})();
// mobile-nav.js - Mobile menu functionality for all pages
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Initializing mobile menu...');
    
    // Toggle mobile actions menu
    const mobileActionsToggle = document.getElementById('mobile-actions-toggle');
    const mobileActionsMenu = document.getElementById('mobile-actions-menu');
    
    if (mobileActionsToggle && mobileActionsMenu) {
        console.log('✅ Found mobile menu elements');
        
        // Set up click event for mobile actions toggle
        mobileActionsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('📱 Toggling mobile menu');
            mobileActionsMenu.classList.toggle('hidden');
        });
        
        // Close mobile actions menu when clicking outside
        document.addEventListener('click', (e) => {
            if (mobileActionsMenu && !mobileActionsMenu.contains(e.target) && 
                mobileActionsToggle && !mobileActionsToggle.contains(e.target)) {
                console.log('📱 Clicked outside, closing mobile menu');
                mobileActionsMenu.classList.add('hidden');
            }
        });
        
        // Handle mobile language selection
        const mobileLangButtons = mobileActionsMenu.querySelectorAll('[data-lang]');
        mobileLangButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = e.currentTarget.getAttribute('data-lang');
                console.log(`📱 Mobile language selected: ${lang}`);
                
                // Use LanguageSwitcher if available
                if (window.LanguageSwitcher) {
                    window.LanguageSwitcher.setLanguage(lang);
                } else {
                    // Fallback basic language switch
                    document.documentElement.lang = lang;
                    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
                }
                
                mobileActionsMenu.classList.add('hidden');
            });
        });
        
        // Handle mobile theme toggle
        const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
        if (mobileThemeToggle) {
            mobileThemeToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('📱 Mobile theme toggle clicked');
                
                // Use global toggleTheme function if available
                if (typeof window.toggleTheme === 'function') {
                    window.toggleTheme();
                }
                
                mobileActionsMenu.classList.add('hidden');
            });
        }
        
        // Handle mobile logout - ONLY ICON, NO TEXT
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('📱 Mobile logout clicked');
                
                // Use global logout function if available
                if (typeof window.logout === 'function') {
                    window.logout();
                }
                
                mobileActionsMenu.classList.add('hidden');
            });
        }
        
        // Handle mobile topic option (coach page only)
        const mobileTopicOption = document.getElementById('mobile-topic-option');
        if (mobileTopicOption) {
            mobileTopicOption.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('📱 Mobile topic option clicked');
                
                // Trigger the desktop topic option click if it exists
                const topicOption = document.getElementById('topic-option');
                if (topicOption) {
                    topicOption.click();
                }
                
                mobileActionsMenu.classList.add('hidden');
            });
        }
        
        console.log('✅ Mobile menu initialized');
    } else {
        console.warn('📱 Mobile menu elements not found:', {
            toggleExists: !!mobileActionsToggle,
            menuExists: !!mobileActionsMenu,
            isDesktopView: window.innerWidth >= 1024
        });
    }
});
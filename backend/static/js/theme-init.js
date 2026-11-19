// theme-init.js - Must be loaded in HEAD before any content

// Theme initialization - runs immediately when loaded
(function() {
    console.log('🎨 Theme initialization starting...');
    
    try {
        // 1. Get current theme preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        console.log('🔍 Theme check:', { savedTheme, prefersDark });
        
        // 2. Determine if we should use light theme
        // Rules:
        // - If user explicitly chose "light", use light
        // - If no saved preference AND system prefers light, use light
        // - Otherwise, use dark (default)
        const shouldBeLight = savedTheme === 'light' || (!savedTheme && !prefersDark);
        
        console.log('🤔 Should be light?', shouldBeLight);
        
        // 3. Apply theme to HTML element immediately
        const htmlElement = document.documentElement;
        
        if (shouldBeLight) {
            htmlElement.classList.remove('dark');
            console.log('✅ Applied: Light theme');
        } else {
            htmlElement.classList.add('dark');
            console.log('✅ Applied: Dark theme');
        }
        
        // 4. Ensure localStorage has a value for future visits
        if (!savedTheme) {
            const defaultTheme = shouldBeLight ? 'light' : 'dark';
            localStorage.setItem('theme', defaultTheme);
            console.log('💾 Set default theme in localStorage:', defaultTheme);
        }
        
        // 5. Store in window for debugging
        window.initialTheme = shouldBeLight ? 'light' : 'dark';
        
    } catch (error) {
        console.warn('⚠️ Theme initialization failed, using dark as fallback:', error);
        // Fallback to dark theme if anything goes wrong
        document.documentElement.classList.add('dark');
    }
    
    console.log('🎉 Theme initialization complete');
})();

// Theme toggle function for global use
window.toggleTheme = function() {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.contains('dark');
    const themeIcon = document.querySelector('#theme-toggle .material-icons-outlined');
    
    console.log('🔄 Toggling theme, currently dark?', isDark);
    
    if (isDark) {
        htmlElement.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
        localStorage.setItem('theme', 'light');
        console.log('✅ Switched to: Light theme');
    } else {
        htmlElement.classList.add('dark');
        if (themeIcon) themeIcon.textContent = 'light_mode';
        localStorage.setItem('theme', 'dark');
        console.log('✅ Switched to: Dark theme');
    }
};

// Initialize theme button icon (call this after DOM loads)
window.initializeThemeUI = function() {
    const themeIcon = document.querySelector('#theme-toggle .material-icons-outlined');
    if (themeIcon) {
        const isDark = document.documentElement.classList.contains('dark');
        themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
        console.log('🎨 Theme button initialized:', isDark ? 'dark' : 'light');
    }
};
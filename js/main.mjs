/**
 * Main application entry point
 * Imports and initializes all modules
 */

import { themeManager } from './modules/theme.js';
import { navigationManager } from './modules/navigation.js';
import { skillsManager } from './modules/skills.js';
import { portfolioManager } from './modules/portfolio.js';
import { pwaManager } from './modules/pwa.js';

// Initialize all modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('🚀 Initializing Portfolio Application...');

    // Initialize theme management
    themeManager.init();
    console.log('✅ Theme manager initialized');

    // Initialize navigation
    navigationManager.init();
    console.log('✅ Navigation manager initialized');

    // Initialize skills animation
    skillsManager.init();
    console.log('✅ Skills manager initialized');

    // Initialize portfolio functionality
    portfolioManager.init();
    console.log('✅ Portfolio manager initialized');

    // Initialize PWA features
    pwaManager.init();
    console.log('✅ PWA manager initialized');

    console.log('🎉 Portfolio Application fully loaded!');

  } catch (error) {
    console.error('❌ Error initializing application:', error);
  }
});

// Global error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// Expose global functions for lightbox controls
window.nextItem = () => portfolioManager.nextItem();
window.prevItem = () => portfolioManager.prevItem();

// Export for potential future use
export { themeManager, navigationManager, skillsManager, portfolioManager, pwaManager };

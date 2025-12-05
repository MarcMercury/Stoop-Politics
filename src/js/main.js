/**
 * TAG - Trusted Adult Games
 * Main JavaScript file
 */

(function() {
    'use strict';

    // DOM Elements
    const ageVerification = document.getElementById('age-verification');
    const mainContent = document.getElementById('main-content');
    const ageConfirmBtn = document.getElementById('age-confirm');
    const ageDenyBtn = document.getElementById('age-deny');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Storage key for age verification
    const AGE_VERIFIED_KEY = 'tag_age_verified';

    /**
     * Initialize the application
     */
    function init() {
        checkAgeVerification();
        setupEventListeners();
    }

    /**
     * Check if user has already verified their age
     */
    function checkAgeVerification() {
        const isVerified = sessionStorage.getItem(AGE_VERIFIED_KEY);
        
        if (isVerified === 'true') {
            showMainContent();
        }
    }

    /**
     * Show the main content and hide age verification
     */
    function showMainContent() {
        if (ageVerification) {
            ageVerification.classList.add('hidden');
            ageVerification.setAttribute('aria-hidden', 'true');
        }
        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.setAttribute('aria-hidden', 'false');
        }
    }

    /**
     * Handle age confirmation
     */
    function handleAgeConfirm() {
        sessionStorage.setItem(AGE_VERIFIED_KEY, 'true');
        showMainContent();
        
        // Focus on main content for accessibility
        const main = document.getElementById('main');
        if (main) {
            main.focus();
        }
    }

    /**
     * Handle age denial - redirect away from site
     */
    function handleAgeDeny() {
        // Redirect to a safe, neutral site
        window.location.href = 'https://www.google.com';
    }

    /**
     * Toggle mobile navigation
     */
    function toggleMobileNav() {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('active');
    }

    /**
     * Close mobile nav when clicking outside
     */
    function handleOutsideClick(event) {
        if (navMenu && navMenu.classList.contains('active')) {
            if (navToggle && !navMenu.contains(event.target) && !navToggle.contains(event.target)) {
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        }
    }

    /**
     * Handle keyboard navigation in modal
     */
    function handleModalKeyboard(event) {
        if (!ageVerification || ageVerification.classList.contains('hidden')) {
            return;
        }

        // Trap focus within modal
        const focusableElements = ageVerification.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (event.key === 'Tab') {
            if (event.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    event.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    event.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    }

    /**
     * Smooth scroll to section when clicking nav links
     */
    function handleNavClick(event) {
        const target = event.target;
        if (target.matches('.nav-link') && target.hash) {
            const section = document.querySelector(target.hash);
            if (section) {
                event.preventDefault();
                section.scrollIntoView({ behavior: 'smooth' });
                
                // Close mobile nav if open
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            }
        }
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Age verification buttons
        if (ageConfirmBtn) {
            ageConfirmBtn.addEventListener('click', handleAgeConfirm);
        }
        if (ageDenyBtn) {
            ageDenyBtn.addEventListener('click', handleAgeDeny);
        }

        // Mobile navigation toggle
        if (navToggle) {
            navToggle.addEventListener('click', toggleMobileNav);
        }

        // Close mobile nav on outside click
        document.addEventListener('click', handleOutsideClick);

        // Keyboard navigation
        document.addEventListener('keydown', handleModalKeyboard);

        // Navigation smooth scroll
        document.addEventListener('click', handleNavClick);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

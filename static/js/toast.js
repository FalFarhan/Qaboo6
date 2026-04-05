/**
 * QABOOT Toast Notifications System
 * Professional toast notifications for trading actions
 * 
 * Usage:
 *   showToast('success', 'Order Executed', 'Buy 0.5 BTC @ $69,000');
 *   showToast('error', 'Order Failed', 'Insufficient balance');
 *   showToast('warning', 'Price Alert', 'BTC dropped 5% in 1h');
 *   showToast('info', 'Market Update', 'New high detected');
 */

(function() {
    'use strict';
    
    // Create toast container if not exists
    function createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }
    
    // Get icon based on type
    function getToastIcon(type) {
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        return icons[type] || 'info';
    }
    
    // Show toast notification
    window.showToast = function(type, title, message, duration = 5000) {
        const container = createToastContainer();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `qaboot-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <span class="material-symbols-outlined">${getToastIcon(type)}</span>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="closeToast(this)">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
        `;
        
        // Add to container
        container.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            closeToastElement(toast);
        }, duration);
        
        // Return toast element
        return toast;
    };
    
    // Close toast by button
    window.closeToast = function(button) {
        const toast = button.closest('.qaboot-toast');
        if (toast) {
            closeToastElement(toast);
        }
    };
    
    // Close toast element
    function closeToastElement(toast) {
        toast.classList.add('toast-exit');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
    
    // Predefined toast helpers
    window.toastSuccess = function(title, message, duration) {
        return showToast('success', title, message, duration);
    };
    
    window.toastError = function(title, message, duration) {
        return showToast('error', title, message, duration);
    };
    
    window.toastWarning = function(title, message, duration) {
        return showToast('warning', title, message, duration);
    };
    
    window.toastInfo = function(title, message, duration) {
        return showToast('info', title, message, duration);
    };
    
    // Trading-specific toast helpers
    window.toastOrderExecuted = function(pair, side, amount, price) {
        const formattedPrice = typeof price === 'number' ? price.toLocaleString('en-US') : price;
        return showToast('success', 
            `${side.toUpperCase()} Order Executed`, 
            `${side.toUpperCase()} ${amount} ${pair} @ $${formattedPrice}`,
            6000
        );
    };
    
    window.toastOrderFailed = function(reason) {
        return showToast('error', 
            'Order Failed', 
            reason || 'Unable to execute order. Please try again.',
            6000
        );
    };
    
    window.toastPriceAlert = function(coin, change, direction) {
        const arrow = direction === 'up' ? '↑' : '↓';
        const color = direction === 'up' ? 'green' : 'red';
        return showToast('warning', 
            `${coin} Price Alert`, 
            `${arrow} ${change}% in 1h`,
            8000
        );
    };
    
    window.toastSignalGenerated = function(coin, signal, confidence) {
        return showToast('info', 
            `New Signal: ${coin}`, 
            `${signal} signal detected (${confidence}% confidence)`,
            7000
        );
    };
    
    window.toastWalletConnected = function(walletType) {
        return showToast('success', 
            'Wallet Connected', 
            `Successfully connected ${walletType || 'wallet'}.`,
            5000
        );
    };
    
    window.toastSettingsSaved = function() {
        return showToast('success', 
            'Settings Saved', 
            'Your changes have been saved successfully.',
            4000
        );
    };
    
    window.toastAnalysisComplete = function(result) {
        return showToast('success', 
            'Analysis Complete', 
            result || 'Market analysis finished. Check signals tab.',
            6000
        );
    };
    
    console.log('✅ QABOOT Toast System loaded');
})();

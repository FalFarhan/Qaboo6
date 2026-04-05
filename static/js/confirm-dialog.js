/**
 * QABOOT Confirm Dialog System
 * Professional confirmation dialogs for sensitive actions
 * 
 * Usage:
 *   showConfirm('delete', 'Delete Asset?', 'Are you sure you want to delete BTC from your portfolio?', () => { ... });
 *   showConfirm('warning', 'Stop Strategy?', 'This will stop the active strategy.', () => { ... });
 *   showConfirm('info', 'Execute Trade?', 'Buy 0.5 BTC @ $69,000', () => { ... });
 */

(function() {
    'use strict';
    
    // Create dialog container if not exists
    function createDialogContainer() {
        let container = document.getElementById('qaboot-dialog-overlay');
        if (!container) {
            container = document.createElement('div');
            container.id = 'qaboot-dialog-overlay';
            container.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }
    
    // Get icon based on type
    function getDialogIcon(type) {
        const icons = {
            delete: 'delete_forever',
            warning: 'warning',
            info: 'info',
            confirm: 'help',
            danger: 'report_problem',
            trade: 'swap_horiz',
            save: 'save'
        };
        return icons[type] || 'help';
    }
    
    // Get colors based on type
    function getDialogColors(type) {
        const colors = {
            delete: { icon: '#ff716c', bg: 'rgba(255, 113, 108, 0.15)' },
            warning: { icon: '#ffc107', bg: 'rgba(255, 193, 7, 0.15)' },
            info: { icon: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
            confirm: { icon: '#3fff8b', bg: 'rgba(63, 255, 139, 0.15)' },
            danger: { icon: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
            trade: { icon: '#3fff8b', bg: 'rgba(63, 255, 139, 0.15)' },
            save: { icon: '#3fff8b', bg: 'rgba(63, 255, 139, 0.15)' }
        };
        return colors[type] || colors.confirm;
    }
    
    // Show confirmation dialog
    window.showConfirm = function(type, title, message, onConfirm, onCancel) {
        const container = createDialogContainer();
        const colors = getDialogColors(type);
        const icon = getDialogIcon(type);
        
        const confirmBtnText = type === 'delete' ? 'Delete' : 
                               type === 'trade' ? 'Execute' : 
                               type === 'save' ? 'Save' : 'Confirm';
        
        const confirmBtnClass = type === 'delete' || type === 'danger' ? 'btn-danger' : 'btn-primary';
        
        container.innerHTML = `
            <div class="qaboot-dialog" style="
                background: rgba(28, 31, 43, 0.95);
                border: 1px solid rgba(115, 117, 128, 0.2);
                border-radius: 16px;
                padding: 28px 32px;
                max-width: 420px;
                width: 100%;
                animation: dialogSlideIn 0.3s ease-out;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            ">
                <div style="
                    width: 56px;
                    height: 56px;
                    border-radius: 14px;
                    background: ${colors.bg};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    border: 1px solid ${colors.icon}40;
                ">
                    <span class="material-symbols-outlined" style="
                        font-size: 28px;
                        color: ${colors.icon};
                    ">${icon}</span>
                </div>
                
                <h3 style="
                    font-size: 18px;
                    font-weight: 700;
                    color: #f0f0fd;
                    margin-bottom: 8px;
                ">${title}</h3>
                
                <p style="
                    font-size: 14px;
                    color: #737580;
                    line-height: 1.6;
                    margin-bottom: 24px;
                ">${message}</p>
                
                <div style="
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                ">
                    <button class="qaboot-dialog-btn btn-secondary" style="
                        padding: 10px 20px;
                        border-radius: 10px;
                        border: 1px solid rgba(115, 117, 128, 0.3);
                        background: transparent;
                        color: #737580;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">Cancel</button>
                    
                    <button class="qaboot-dialog-btn ${confirmBtnClass}" style="
                        padding: 10px 20px;
                        border-radius: 10px;
                        border: none;
                        background: ${type === 'delete' || type === 'danger' ? '#ef4444' : '#3fff8b'};
                        color: ${type === 'delete' || type === 'danger' ? '#fff' : '#0c0e17'};
                        font-size: 13px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">${confirmBtnText}</button>
                </div>
            </div>
            
            <style>
                @keyframes dialogSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes dialogSlideOut {
                    from {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                }
                
                .qaboot-dialog.exiting {
                    animation: dialogSlideOut 0.2s ease-in forwards;
                }
                
                .qaboot-dialog-btn:hover {
                    transform: translateY(-1px);
                }
                
                .qaboot-dialog-btn.btn-secondary:hover {
                    background: rgba(115, 117, 128, 0.1);
                    color: #f0f0fd;
                }
                
                .qaboot-dialog-btn.btn-primary:hover {
                    filter: brightness(1.1);
                }
                
                .qaboot-dialog-btn.btn-danger:hover {
                    filter: brightness(1.2);
                }
                
                html:not(.dark) .qaboot-dialog {
                    background: rgba(255, 255, 255, 0.98);
                    border-color: rgba(0, 0, 0, 0.1);
                }
                
                html:not(.dark) .qaboot-dialog h3 {
                    color: #1a1a1a;
                }
                
                html:not(.dark) .qaboot-dialog p {
                    color: #6b7280;
                }
                
                html:not(.dark) .qaboot-dialog-btn.btn-secondary {
                    border-color: rgba(0, 0, 0, 0.1);
                    color: #6b7280;
                }
                
                html:not(.dark) .qaboot-dialog-btn.btn-secondary:hover {
                    background: rgba(0, 0, 0, 0.05);
                    color: #1a1a1a;
                }
            </style>
        `;
        
        // Show dialog
        container.style.display = 'flex';
        
        // Handle buttons
        const secondaryBtn = container.querySelector('.btn-secondary');
        const primaryBtn = container.querySelector('.btn-primary, .btn-danger');
        const dialog = container.querySelector('.qaboot-dialog');
        
        function closeDialog(confirmed) {
            dialog.classList.add('exiting');
            setTimeout(() => {
                container.style.display = 'none';
                if (confirmed && onConfirm) onConfirm();
                if (!confirmed && onCancel) onCancel();
            }, 200);
        }
        
        secondaryBtn.addEventListener('click', () => closeDialog(false));
        primaryBtn.addEventListener('click', () => closeDialog(true));
        
        // Close on overlay click
        container.addEventListener('click', (e) => {
            if (e.target === container) closeDialog(false);
        });
        
        // Close on Escape key
        function handleEscape(e) {
            if (e.key === 'Escape') {
                closeDialog(false);
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);
        
        return container;
    };
    
    // Quick helper functions
    window.confirmDelete = function(itemName, onConfirm, onCancel) {
        return showConfirm('delete', 'Delete ' + itemName + '?', 
            'This action cannot be undone. The item will be permanently removed from your portfolio.', 
            onConfirm, onCancel);
    };
    
    window.confirmTrade = function(side, amount, coin, price, onConfirm, onCancel) {
        const action = side === 'buy' ? 'Buy' : 'Sell';
        const color = side === 'buy' ? '#3fff8b' : '#ff716c';
        return showConfirm('trade', action + ' Order Confirmation', 
            `<div style="text-align: center; padding: 10px 0;">
                <div style="font-size: 24px; font-weight: 700; color: ${color}; margin-bottom: 8px;">
                    ${action} ${amount} ${coin}
                </div>
                <div style="font-size: 14px; color: #737580;">
                    @ $${parseFloat(price).toLocaleString()} / ${coin}
                </div>
            </div>`, 
            onConfirm, onCancel);
    };
    
    window.confirmSave = function(message, onConfirm, onCancel) {
        return showConfirm('save', 'Save Changes?', message || 'Do you want to save your changes?', onConfirm, onCancel);
    };
    
    window.confirmDanger = function(title, message, onConfirm, onCancel) {
        return showConfirm('danger', title, message, onConfirm, onCancel);
    };
    
    console.log('✅ QABOOT Confirm Dialog System loaded');
})();

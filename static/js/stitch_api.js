// QABOOT V4 PRO - Stitch UI API Integration
// Connects Stitch UI with Flask Backend

const API_BASE = '/api';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupNavigation();
});

// ========== DASHBOARD DATA ==========
async function initializeDashboard() {
    try {
        // Fetch real portfolio data from FAL Portfolio
        const portfolioData = await fetchAPI('/portfolio');
        updateDashboardStats(portfolioData);
        
        // Fetch real prices from Binance
        const pricesData = await fetchAPI('/prices');
        updatePricesTable(pricesData);
        
        // Fetch real signals
        const signalsData = await fetchAPI('/signals');
        updateSignals(signalsData);
        
        console.log('✅ Dashboard initialized with REAL DATA');
    } catch (error) {
        console.error('❌ Failed to initialize dashboard:', error);
        showError('Failed to load dashboard data from Binance');
    }
}

// ========== API FETCH ==========
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// ========== UPDATE DASHBOARD STATS ==========
function updateDashboardStats(data) {
    if (!data) return;
    
    // Update Total Value (by ID first, then by class)
    let totalValueEl = document.getElementById('total-value');
    if (!totalValueEl) {
        // Fallback: find by text content in parent
        const cards = document.querySelectorAll('.glass-card');
        for (const card of cards) {
            const label = card.querySelector('.text-xs.uppercase');
            if (label && label.textContent.includes('Total Value')) {
                totalValueEl = card.querySelector('h3');
                break;
            }
        }
    }
    if (totalValueEl && data.total_value) {
        totalValueEl.textContent = formatCurrency(data.total_value);
    }
    
    // Update P&L (by ID first, then by class)
    let pnlEl = document.getElementById('pnl');
    if (!pnlEl) {
        const cards = document.querySelectorAll('.glass-card');
        for (const card of cards) {
            const label = card.querySelector('.text-xs.uppercase');
            if (label && label.textContent.includes('P&L')) {
                pnlEl = card.querySelector('h3');
                break;
            }
        }
    }
    if (pnlEl && data.pnl_24h !== undefined) {
        const pnlValue = parseFloat(data.pnl_24h);
        pnlEl.textContent = (pnlValue >= 0 ? '+' : '') + formatCurrency(pnlValue);
        pnlEl.className = `text-2xl font-bold tracking-tight ${pnlValue >= 0 ? 'text-primary' : 'text-error'}`;
    }
    
    // Update Active Signals (by ID first, then by class)
    let activeSignalsEl = document.getElementById('active-signals');
    if (!activeSignalsEl) {
        const cards = document.querySelectorAll('.glass-card');
        for (const card of cards) {
            const label = card.querySelector('.text-xs.uppercase');
            if (label && label.textContent.includes('Active Signals')) {
                activeSignalsEl = card.querySelector('h3');
                break;
            }
        }
    }
    if (activeSignalsEl && data.active_signals) {
        activeSignalsEl.textContent = data.active_signals;
    }
    
    // Update Win Rate (by ID first, then by class)
    let winRateEl = document.getElementById('win-rate');
    if (!winRateEl) {
        const cards = document.querySelectorAll('.glass-card');
        for (const card of cards) {
            const label = card.querySelector('.text-xs.uppercase');
            if (label && label.textContent.includes('Win Rate')) {
                winRateEl = card.querySelector('h3');
                break;
            }
        }
    }
    if (!winRateEl) {
        winRateEl = document.querySelector('.glass-card:nth-child(4) h3');
    }
    if (winRateEl && data.win_rate) {
        winRateEl.textContent = data.win_rate + '%';
    }
    
    // Update Header Stats
    const headerTotal = document.getElementById('header-total');
    if (headerTotal && data.total_value) {
        headerTotal.textContent = formatCurrency(data.total_value);
    }
    
    const headerPnl = document.getElementById('header-pnl');
    if (headerPnl && data.pnl_24h !== undefined) {
        const pnlValue = parseFloat(data.pnl_24h);
        headerPnl.textContent = (pnlValue >= 0 ? '+' : '') + formatCurrency(pnlValue);
        headerPnl.className = `text-xs font-bold ${pnlValue >= 0 ? 'text-primary' : 'text-error'}`;
    }
    
    const headerSignals = document.getElementById('header-signals');
    if (headerSignals && data.active_signals) {
        headerSignals.textContent = data.active_signals;
    }
}

// ========== UPDATE PRICES TABLE ==========
function updatePricesTable(data) {
    if (!data || !data.prices) return;
    
    const tableBody = document.querySelector('#live-prices tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = data.prices.map(coin => `
        <tr class="hover:bg-white/5 transition">
            <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                    <img src="https://cryptoicons.org/api/icon/${coin.symbol.toLowerCase()}/32" 
                         alt="${coin.symbol}" 
                         class="w-8 h-8 rounded-full"
                         onerror="this.src='/static/img/coin-default.png'">
                    <div>
                        <p class="font-semibold">${coin.name}</p>
                        <p class="text-xs text-[#737580]">${coin.symbol}</p>
                    </div>
                </div>
            </td>
            <td class="py-4 px-4 text-right font-mono">${formatCurrency(coin.price)}</td>
            <td class="py-4 px-4 text-right">
                <span class="${coin.change_24h >= 0 ? 'text-[#3fff8b]' : 'text-[#ff716c]'}">
                    ${coin.change_24h >= 0 ? '+' : ''}${coin.change_24h.toFixed(2)}%
                </span>
            </td>
            <td class="py-4 px-4 text-right font-mono text-[#737580]">${formatVolume(coin.volume_24h)}</td>
            <td class="py-4 px-4 text-center">
                <button onclick="quickTrade('${coin.symbol}')" 
                        class="px-3 py-1 bg-[#3fff8b]/20 text-[#3fff8b] rounded-lg text-xs hover:bg-[#3fff8b]/30 transition">
                    Trade
                </button>
            </td>
        </tr>
    `).join('');
}

// ========== UPDATE SIGNALS ==========
function updateSignals(data) {
    if (!data || !data.signals) return;
    
    const signalsContainer = document.getElementById('signals-list');
    if (!signalsContainer) return;
    
    signalsContainer.innerHTML = data.signals.slice(0, 5).map(signal => `
        <div class="flex items-center justify-between p-4 glass-card rounded-xl mb-3">
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined ${signal.type === 'BUY' ? 'text-[#3fff8b]' : 'text-[#ff716c]'}">
                    ${signal.type === 'BUY' ? 'trending_up' : 'trending_down'}
                </span>
                <div>
                    <p class="font-semibold">${signal.coin}</p>
                    <p class="text-xs text-[#737580]">${signal.time}</p>
                </div>
            </div>
            <div class="text-right">
                <span class="px-2 py-1 rounded text-xs ${signal.type === 'BUY' ? 'bg-[#3fff8b]/20 text-[#3fff8b]' : 'bg-[#ff716c]/20 text-[#ff716c]'}">
                    ${signal.type}
                </span>
                <p class="text-xs text-[#737580] mt-1">${signal.confidence}% confidence</p>
            </div>
        </div>
    `).join('');
}

// ========== NAVIGATION ==========
function setupNavigation() {
    // Update active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard';
    document.querySelectorAll('.nav-button').forEach(btn => {
        const page = btn.getAttribute('data-page');
        if (page === currentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ========== UTILITIES ==========
function formatCurrency(value) {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatVolume(value) {
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toFixed(2);
}

function showError(message) {
    console.error('❌ Error:', message);
    // Could show a toast notification here
}

function quickTrade(symbol) {
    console.log('🔄 Quick trade:', symbol);
    window.location.href = `/trading?coin=${symbol}`;
}

// ========== AUTO REFRESH ==========
setInterval(() => {
    // Refresh prices every 30 seconds
    fetchAPI('/prices').then(updatePricesTable).catch(console.error);
}, 30000);

console.log('✅ Stitch API Integration loaded');
// Signals Page - Real Data from /api/signals
const API_BASE = '/api';

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return null;
    }
}

function formatCurrency(value) {
    if (!value || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: value < 1 ? 4 : 2
    }).format(value);
}

function formatPercent(value) {
    if (!value || isNaN(value)) return '0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

async function updateSignals() {
    console.log('🔄 Fetching signals data...');
    
    const [signals, prices] = await Promise.all([
        fetchAPI('/signals'),
        fetchAPI('/prices')
    ]);

    if (signals && signals.value) {
        console.log('✅ Signals:', signals.value.length);
        updateSignalsList(signals.value);
        updateSignalStats(signals.value);
    }

    if (prices) {
        console.log('✅ Prices loaded');
        updateSignalPrices(prices);
    }
}

function updateSignalsList(signals) {
    // Find signal cards container
    const container = document.querySelector('.signals-container, [class*="signal"]');
    if (!container) return;

    // Get top 3 signals
    const topSignals = signals.slice(0, 3);
    
    let html = '';
    topSignals.forEach((signal, index) => {
        const isBuy = signal.signal === 'BUY';
        const signalClass = isBuy ? 'bg-primary/20 text-primary' : 
                             signal.signal === 'SELL' ? 'bg-error/20 text-error' : 'bg-yellow-500/20 text-yellow-500';
        
        html += `
            <div class="signal-card p-4 glass-card rounded-xl mb-4 ${isBuy ? 'border-l-4 border-primary' : 'border-l-4 border-error'}">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                            ${signal.coin[0]}
                        </div>
                        <div>
                            <h3 class="font-bold text-on-surface">${signal.coin}</h3>
                            <p class="text-xs text-outline">${signal.coin} / USDT</p>
                        </div>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${signalClass}">
                        ${signal.signal} SIGNAL
                    </span>
                </div>
                <div class="mt-4 grid grid-cols-3 gap-4">
                    <div>
                        <p class="text-xs text-outline">Confidence</p>
                        <p class="font-bold ${signal.confidence >= 60 ? 'text-primary' : 'text-outline'}">${signal.confidence}%</p>
                    </div>
                    <div>
                        <p class="text-xs text-outline">Entry</p>
                        <p class="font-mono font-bold">${formatCurrency(signal.entry)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-outline">Target</p>
                        <p class="font-mono font-bold ${isBuy ? 'text-primary' : 'text-error'}">${formatCurrency(signal.take_profit)}</p>
                    </div>
                </div>
                <div class="mt-3 flex justify-between text-xs">
                    <span class="text-outline">Stop: ${formatCurrency(signal.stop_loss)}</span>
                    <span class="text-outline">Risk: ${signal.risk_reward}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function updateSignalStats(signals) {
    const buySignals = signals.filter(s => s.signal === 'BUY').length;
    const sellSignals = signals.filter(s => s.signal === 'SELL').length;
    const holdSignals = signals.filter(s => s.signal === 'HOLD').length;
    
    // Update stats if elements exist
    const stats = {
        'BUY': buySignals,
        'SELL': sellSignals,
        'HOLD': holdSignals
    };
    
    console.log('Signal Stats:', stats);
}

function updateSignalPrices(prices) {
    // Update prices if signal cards have price elements
    console.log('Prices updated for signals');
}

// Setup filter buttons
function setupSignalFilters() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (['All', 'Buy', 'Sell', 'Hold'].includes(text)) {
            btn.addEventListener('click', () => {
                // Remove active class from all
                buttons.forEach(b => b.classList.remove('bg-primary', 'active'));
                // Add active class to clicked
                btn.classList.add('bg-primary', 'active');
                
                // Filter signals
                filterSignals(text.toUpperCase());
            });
        }
    });
}

function filterSignals(type) {
    console.log('Filtering signals by:', type);
    // Implementation would filter displayed signals
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log('📡 Signals page loaded');
    updateSignals();
    setupSignalFilters();
    setInterval(updateSignals, 30000);
});

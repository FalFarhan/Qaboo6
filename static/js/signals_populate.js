/**
 * Signals Page Population - Real Market Signals
 * Populates Signals page with real-time signals and alerts
 */

// FAL Portfolio Holdings
const PORTFOLIO_HOLDINGS = [
    {symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', icon: '₿'},
    {symbol: 'SOL', name: 'Solana', color: '#14F195', icon: 'S'},
    {symbol: 'ETH', name: 'Ethereum', color: '#627EEA', icon: 'Ξ'},
    {symbol: 'XRP', name: 'XRP', color: '#23292F', icon: 'X'},
    {symbol: 'ADA', name: 'Cardano', color: '#0033AD', icon: 'A'},
    {symbol: 'AVAX', name: 'Avalanche', color: '#E84142', icon: 'A'},
    {symbol: 'FET', name: 'Artificial Superintelligence', color: '#1F5AF6', icon: 'F'},
    {symbol: 'KAS', name: 'Kaspa', color: '#00D4AA', icon: 'K'},
    {symbol: 'TAO', name: 'Bittensor', color: '#14F195', icon: 'τ'},
    {symbol: 'NEAR', name: 'NEAR Protocol', color: '#00C1DE', icon: 'N'}
];

// Format helpers
function formatPrice(price) {
    if (price >= 1000) return `$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
}

// Populate signals feed
async function populateSignals() {
    try {
        const response = await fetch('/api/signals');
        const signals = await response.json();
        
        const container = document.querySelector('.signals-feed');
        if (!container) return;
        
        let html = '';
        signals.slice(0, 10).forEach((signal, index) => {
            const coin = PORTFOLIO_HOLDINGS.find(c => c.symbol === signal.symbol) || {symbol: signal.symbol, name: signal.symbol, color: '#666', icon: signal.symbol[0]};
            const isBuy = signal.signal === 'BUY';
            const signalClass = isBuy ? 'bg-primary/10 border-primary/30' : 'bg-error/10 border-error/30';
            const signalIcon = isBuy ? 'arrow_upward' : 'arrow_downward';
            const signalColor = isBuy ? 'text-primary' : 'text-error';
            
            html += `
                <div class="glass-edge rounded-lg p-4 mb-3 ${signalClass} border-l-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold" 
                                 style="background-color: ${coin.color}20; color: ${coin.color}">
                                ${coin.icon}
                            </div>
                            <div>
                                <p class="text-sm font-bold text-on-surface">${coin.name}</p>
                                <p class="text-[10px] text-on-surface-variant">${coin.symbol}/USDT</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center gap-1 ${signalColor}">
                                <span class="material-symbols-outlined text-lg">${signalIcon}</span>
                                <span class="text-sm font-black">${signal.signal}</span>
                            </div>
                            <p class="text-[10px] text-on-surface-variant">${signal.time || 'Just now'}</p>
                        </div>
                    </div>
                    <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div class="bg-surface-container-low/50 rounded p-2">
                            <p class="text-on-surface-variant">Entry</p>
                            <p class="font-bold text-on-surface">${formatPrice(signal.entry)}</p>
                        </div>
                        <div class="bg-surface-container-low/50 rounded p-2">
                            <p class="text-on-surface-variant">Target</p>
                            <p class="font-bold text-primary">${formatPrice(signal.target)}</p>
                        </div>
                        <div class="bg-surface-container-low/50 rounded p-2">
                            <p class="text-on-surface-variant">Stop</p>
                            <p class="font-bold text-error">${formatPrice(signal.stop)}</p>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center justify-between">
                        <span class="text-[10px] text-on-surface-variant">Confidence: ${signal.confidence}% | Strategy: ${signal.strategy || 'ML Model'}</span>
                        <button class="px-3 py-1 rounded bg-primary text-on-primary text-xs font-bold">
                            Execute
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Update signals count
        const countEl = document.querySelector('.signals-count');
        if (countEl) countEl.textContent = signals.length;
        
        console.log('✅ Signals populated');
    } catch (error) {
        console.error('❌ Error populating signals:', error);
    }
}

// Populate active alerts
async function populateAlerts() {
    try {
        const response = await fetch('/api/signals');
        const signals = await response.json();
        
        const container = document.querySelector('.alerts-container');
        if (!container) return;
        
        let html = '';
        signals.slice(0, 5).forEach((signal, index) => {
            const coin = PORTFOLIO_HOLDINGS.find(c => c.symbol === signal.symbol) || {symbol: signal.symbol, name: signal.symbol, color: '#666', icon: signal.symbol[0]};
            
            html += `
                <div class="flex items-center gap-3 p-3 bg-surface-container-low/50 rounded-lg">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" 
                         style="background-color: ${coin.color}20; color: ${coin.color}">
                        ${coin.icon}
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-bold text-on-surface">${coin.name} ${signal.signal} Signal</p>
                        <p class="text-[10px] text-on-surface-variant">Target: ${formatPrice(signal.target)}</p>
                    </div>
                    <span class="material-symbols-outlined text-primary pulse-live">notifications_active</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error populating alerts:', error);
    }
}

// Initialize signals page
async function initializeSignals() {
    await populateSignals();
    await populateAlerts();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        populateSignals();
        populateAlerts();
    }, 30000);
    
    console.log('✅ Signals page initialized');
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializeSignals);

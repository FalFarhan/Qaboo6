/**
 * Settings Page Population - Portfolio Settings
 * Populates Settings page with real portfolio data
 */

// FAL Portfolio Holdings
const PORTFOLIO_HOLDINGS = [
    {symbol: 'BTC', name: 'Bitcoin', amount: 0.00133087, avgPrice: 65000, color: '#F7931A', icon: '₿'},
    {symbol: 'SOL', name: 'Solana', amount: 1.0886334, avgPrice: 120, color: '#14F195', icon: 'S'},
    {symbol: 'ETH', name: 'Ethereum', amount: 0.0259714, avgPrice: 3500, color: '#627EEA', icon: 'Ξ'},
    {symbol: 'XRP', name: 'XRP', amount: 16.8379, avgPrice: 0.55, color: '#23292F', icon: 'X'},
    {symbol: 'ADA', name: 'Cardano', amount: 80.692, avgPrice: 0.40, color: '#0033AD', icon: 'A'},
    {symbol: 'TAO', name: 'Bittensor', amount: 0.0720727, avgPrice: 320, color: '#14F195', icon: 'τ'},
    {symbol: 'NEAR', name: 'NEAR Protocol', amount: 14.0605, avgPrice: 2.5, color: '#00C1DE', icon: 'N'},
    {symbol: 'AVAX', name: 'Avalanche', amount: 1.54633, avgPrice: 28, color: '#E84142', icon: 'A'},
    {symbol: 'FET', name: 'Artificial Superintelligence', amount: 62.6917, avgPrice: 1.20, color: '#1F5AF6', icon: 'F'},
    {symbol: 'KAS', name: 'Kaspa', amount: 342.99, avgPrice: 0.08, color: '#00D4AA', icon: 'K'}
];

// Format helpers
function formatPrice(price) {
    if (price >= 1000) return `$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
}

function formatAmount(amount) {
    if (amount >= 1000) return amount.toLocaleString('en-US', {maximumFractionDigits: 2});
    if (amount >= 1) return amount.toFixed(4);
    return amount.toFixed(6);
}

// Update portfolio summary
async function updatePortfolioSummary() {
    try {
        const response = await fetch('/api/portfolio');
        const portfolio = await response.json();
        
        // Update total value
        const totalValueEl = document.querySelector('.portfolio-total-value');
        if (totalValueEl) {
            totalValueEl.textContent = formatPrice(portfolio.total_value || 0);
        }
        
        // Update total P&L
        const totalPnlEl = document.querySelector('.portfolio-total-pnl');
        if (totalPnlEl) {
            const pnl = portfolio.total_pnl || 0;
            totalPnlEl.textContent = (pnl >= 0 ? '+' : '-') + formatPrice(Math.abs(pnl));
            totalPnlEl.style.color = pnl >= 0 ? '#3fff8b' : '#ff716c';
        }
        
        // Update win rate
        const winRateEl = document.querySelector('.portfolio-win-rate');
        if (winRateEl) {
            winRateEl.textContent = (portfolio.win_rate || 0).toFixed(1) + '%';
        }
        
        // Update active signals
        const signalsEl = document.querySelector('.portfolio-active-signals');
        if (signalsEl) {
            signalsEl.textContent = portfolio.active_signals || 0;
        }
        
    } catch (error) {
        console.error('Error updating portfolio summary:', error);
    }
}

// Populate holdings table
async function populateHoldingsTable() {
    try {
        const response = await fetch('/api/prices');
        const prices = await response.json();
        
        const tbody = document.querySelector('.holdings-table tbody');
        if (!tbody) return;
        
        let html = '';
        PORTFOLIO_HOLDINGS.forEach(coin => {
            const priceData = prices[coin.symbol];
            const currentPrice = priceData ? priceData.price : coin.avgPrice;
            const value = coin.amount * currentPrice;
            const cost = coin.amount * coin.avgPrice;
            const pnl = value - cost;
            const pnlPercent = (pnl / cost) * 100;
            
            html += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" 
                                 style="background-color: ${coin.color}20; color: ${coin.color}">
                                ${coin.icon}
                            </div>
                            <div>
                                <p class="text-sm font-bold text-on-surface">${coin.name}</p>
                                <p class="text-[10px] text-on-surface-variant">${coin.symbol}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-right text-sm font-medium text-on-surface">${formatAmount(coin.amount)}</td>
                    <td class="px-6 py-4 text-right text-sm font-medium text-on-surface-variant">${formatPrice(coin.avgPrice)}</td>
                    <td class="px-6 py-4 text-right text-sm font-bold text-on-surface">${formatPrice(currentPrice)}</td>
                    <td class="px-6 py-4 text-right text-sm font-bold ${pnl >= 0 ? 'text-primary' : 'text-error'}">
                        ${pnl >= 0 ? '+' : ''}${formatPrice(Math.abs(pnl))} (${pnlPercent.toFixed(1)}%)
                    </td>
                    <td class="px-6 py-4 text-right">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" class="sr-only peer" checked>
                            <div class="w-9 h-5 bg-surface-container-lowest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Error populating holdings table:', error);
    }
}

// Initialize settings page
async function initializeSettings() {
    await updatePortfolioSummary();
    await populateHoldingsTable();
    
    console.log('✅ Settings page initialized');
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializeSettings);

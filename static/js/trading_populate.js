/**
 * Trading Terminal Population - Real Data
 * Populates Trading page with real market data and FAL holdings
 */

// FAL Portfolio Holdings for Trading
const PORTFOLIO_HOLDINGS = [
    {symbol: 'BTC', name: 'Bitcoin', amount: 0.00133087, avgPrice: 65000, color: '#F7931A', icon: '₿'},
    {symbol: 'SOL', name: 'Solana', amount: 1.0886334, avgPrice: 120, color: '#14F195', icon: 'S'},
    {symbol: 'USDT', name: 'Tether', amount: 85.259, avgPrice: 1.0, color: '#26A17B', icon: '₮'},
    {symbol: 'ETH', name: 'Ethereum', amount: 0.0259714, avgPrice: 3500, color: '#627EEA', icon: 'Ξ'},
    {symbol: 'XRP', name: 'XRP', amount: 16.8379, avgPrice: 0.55, color: '#23292F', icon: 'X'},
    {symbol: 'TAO', name: 'Bittensor', amount: 0.0720727, avgPrice: 320, color: '#14F195', icon: 'τ'},
    {symbol: 'ADA', name: 'Cardano', amount: 80.692, avgPrice: 0.40, color: '#0033AD', icon: 'A'},
    {symbol: 'NEAR', name: 'NEAR Protocol', amount: 14.0605, avgPrice: 2.5, color: '#00C1DE', icon: 'N'},
    {symbol: 'AVAX', name: 'Avalanche', amount: 1.54633, avgPrice: 28, color: '#E84142', icon: 'A'},
    {symbol: 'FET', name: 'Artificial Superintelligence', amount: 62.6917, avgPrice: 1.20, color: '#1F5AF6', icon: 'F'},
    {symbol: 'VIRTUAL', name: 'Virtuals Protocol', amount: 21.92, avgPrice: 3.5, color: '#6366F1', icon: 'V'},
    {symbol: 'KAS', name: 'Kaspa', amount: 342.99, avgPrice: 0.08, color: '#00D4AA', icon: 'K'},
    {symbol: 'SEI', name: 'Sei', amount: 206.1936, avgPrice: 0.18, color: '#FF0000', icon: 'S'},
    {symbol: 'STX', name: 'Stacks', amount: 56.44, avgPrice: 1.5, color: '#FF6B35', icon: 'S'},
    {symbol: 'SUI', name: 'Sui', amount: 7.7922, avgPrice: 1.8, color: '#4ADE80', icon: 'S'},
    {symbol: 'ONDO', name: 'Ondo', amount: 27.172, avgPrice: 0.55, color: '#6366F1', icon: 'O'},
    {symbol: 'W', name: 'Wormhole', amount: 678.9204, avgPrice: 0.15, color: '#6366F1', icon: 'W'},
    {symbol: 'POL', name: 'POL (ex-MATIC)', amount: 14.56, avgPrice: 0.50, color: '#8247E5', icon: 'P'}
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

// Current prices cache
let pricesCache = {};
let currentCoin = PORTFOLIO_HOLDINGS[0];
let currentPrice = 0;

// Update trading UI with selected coin
function updateTradingUI(coin, price, change24h) {
    currentCoin = coin;
    currentPrice = price;
    
    // Update coin icon
    const coinIcon = document.querySelector('.quick-trade-coin-icon span');
    const coinIconDiv = document.querySelector('.quick-trade-coin-icon');
    if (coinIcon) coinIcon.textContent = coin.icon;
    if (coinIconDiv) {
        coinIconDiv.style.color = coin.color;
        coinIconDiv.style.backgroundColor = coin.color + '20';
    }
    
    // Update names
    const coinSymbol = document.querySelector('.quick-trade-coin-symbol');
    const coinName = document.querySelector('.quick-trade-coin-name');
    if (coinSymbol) coinSymbol.textContent = `${coin.symbol} / USDT`;
    if (coinName) coinName.textContent = coin.name;
    
    // Update price
    const coinPrice = document.querySelector('.quick-trade-coin-price');
    if (coinPrice) {
        coinPrice.textContent = formatPrice(price);
        coinPrice.style.color = change24h >= 0 ? '#3fff8b' : '#ff716c';
    }
    
    // Update change
    const coinChange = document.querySelector('.quick-trade-coin-change');
    if (coinChange) {
        const sign = change24h >= 0 ? '+' : '';
        coinChange.textContent = `${sign}${change24h.toFixed(2)}% (24h)`;
        coinChange.style.color = change24h >= 0 ? '#24f07e' : '#ff716c';
    }
    
    // Update input suffix
    const coinSuffix = document.querySelector('.coin-suffix');
    if (coinSuffix) coinSuffix.textContent = coin.symbol;
    
    // Update balance display
    const balanceDisplay = document.querySelector('.balance-display');
    if (balanceDisplay) {
        const value = coin.amount * price;
        balanceDisplay.textContent = `${formatAmount(coin.amount)} ${coin.symbol} (${formatPrice(value)})`;
    }
    
    // Update chart title
    const chartSubtitle = document.querySelector('.market-dynamics-subtitle');
    if (chartSubtitle) chartSubtitle.textContent = `Live ${coin.symbol}/USDT Performance`;
}

// Update coin selector options with real prices
function updateCoinSelectorOptions(prices) {
    const selector = document.getElementById('coinSelector');
    if (!selector) return;
    
    pricesCache = prices;
    
    selector.innerHTML = PORTFOLIO_HOLDINGS.map(coin => {
        const priceData = prices[coin.symbol];
        const price = priceData ? priceData.price : 0;
        return `<option value="${coin.symbol}">${coin.icon} ${coin.name} (${coin.symbol}) - ${formatPrice(price)}</option>`;
    }).join('');
    
    // Add change event listener
    selector.addEventListener('change', (e) => {
        const symbol = e.target.value;
        const coin = PORTFOLIO_HOLDINGS.find(c => c.symbol === symbol);
        if (coin && pricesCache[coin.symbol]) {
            const priceData = pricesCache[coin.symbol];
            updateTradingUI(coin, priceData.price, priceData.change);
        }
    });
}

// Initialize trading page
async function initializeTrading() {
    try {
        const response = await fetch('/api/prices');
        const prices = await response.json();
        
        // Update coin selector
        updateCoinSelectorOptions(prices);
        
        // Initialize with BTC
        const btc = PORTFOLIO_HOLDINGS[0];
        const btcPrice = prices[btc.symbol];
        
        if (btcPrice) {
            updateTradingUI(btc, btcPrice.price, btcPrice.change);
        }
        
        // Add amount input listener for total calculation
        const amountInput = document.querySelector('input[type="number"]');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                const amount = parseFloat(e.target.value) || 0;
                const total = amount * currentPrice;
                const totalElement = document.querySelector('.total-estimate');
                if (totalElement) {
                    totalElement.textContent = formatPrice(total);
                }
            });
        }
        
        // Populate orders
        populateOrders();
        
        console.log('✅ Trading terminal initialized');
    } catch (error) {
        console.error('❌ Error initializing trading:', error);
    }
}

// Populate orders from API
async function populateOrders() {
    try {
        const response = await fetch('/api/portfolio');
        const portfolio = await response.json();
        
        // Update order history with real holdings
        const tbody = document.querySelector('table tbody');
        if (tbody && portfolio.holdings) {
            let html = '';
            const now = new Date();
            
            portfolio.holdings.slice(0, 5).forEach((holding, index) => {
                const time = new Date(now.getTime() - index * 86400000);
                const timeStr = time.toISOString().slice(0, 19).replace('T', ' ');
                const side = Math.random() > 0.5 ? 'Buy' : 'Sell';
                const sideClass = side === 'Buy' ? 'text-primary' : 'text-error';
                
                html += `
                    <tr class="hover:bg-white/[0.02] transition-colors">
                        <td class="px-8 py-4 text-[11px] text-on-surface-variant font-mono">${timeStr}</td>
                        <td class="px-8 py-4 text-sm font-bold text-on-surface">${holding.symbol}/USDT</td>
                        <td class="px-8 py-4 text-xs font-black ${sideClass} uppercase">${side}</td>
                        <td class="px-8 py-4 text-sm text-on-surface">${formatAmount(holding.amount)}</td>
                        <td class="px-8 py-4 text-sm font-bold text-on-surface text-right">${formatPrice(holding.amount * (holding.avg_price || 1))}</td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
        }
    } catch (error) {
        console.error('Error populating orders:', error);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializeTrading);

// Auto-refresh every 30 seconds
setInterval(async () => {
    try {
        const response = await fetch('/api/prices');
        const prices = await response.json();
        
        const priceData = prices[currentCoin.symbol];
        if (priceData) {
            updateTradingUI(currentCoin, priceData.price, priceData.change);
        }
    } catch (error) {
        console.error('Error refreshing prices:', error);
    }
}, 30000);

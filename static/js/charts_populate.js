/**
 * Charts Page Population - Real Market Data
 * Populates Charts page with real candlestick data
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
    {symbol: 'SEI', name: 'Sei', color: '#FF0000', icon: 'S'},
    {symbol: 'STX', name: 'Stacks', color: '#FF6B35', icon: 'S'}
];

// Format helpers
function formatPrice(price) {
    if (price >= 1000) return `$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
}

// Update coin selector
function updateCoinSelector(prices) {
    const selector = document.getElementById('coinSelector');
    if (!selector) return;
    
    selector.innerHTML = PORTFOLIO_HOLDINGS.map(coin => {
        const priceData = prices[coin.symbol];
        const price = priceData ? priceData.price : 0;
        return `<option value="${coin.symbol}">${coin.icon} ${coin.name} (${coin.symbol}) - ${formatPrice(price)}</option>`;
    }).join('');
}

// Update chart with real data
async function updateChart(symbol, timeframe) {
    try {
        const response = await fetch(`/api/candles/${symbol}/${timeframe}`);
        const candles = await response.json();
        
        if (!candles || candles.length === 0) return;
        
        // Update price displays
        const currentPrice = candles[candles.length - 1].close;
        const openPrice = candles[candles.length - 1].open;
        const change = ((currentPrice - openPrice) / openPrice) * 100;
        
        const currentPriceEl = document.querySelector('.current-price');
        const priceChangeEl = document.querySelector('.price-change');
        
        if (currentPriceEl) {
            currentPriceEl.textContent = formatPrice(currentPrice);
            currentPriceEl.style.color = change >= 0 ? '#3fff8b' : '#ff716c';
        }
        
        if (priceChangeEl) {
            const sign = change >= 0 ? '+' : '';
            priceChangeEl.textContent = `${sign}${change.toFixed(2)}%`;
            priceChangeEl.style.color = change >= 0 ? '#3fff8b' : '#ff716c';
        }
        
        // Update OHLC
        const high = Math.max(...candles.map(c => c.high));
        const low = Math.min(...candles.map(c => c.low));
        const volume = candles.reduce((sum, c) => sum + c.volume, 0);
        
        const ohlcEls = document.querySelectorAll('.ohlc-value');
        if (ohlcEls[0]) ohlcEls[0].textContent = formatPrice(openPrice);
        if (ohlcEls[1]) ohlcEls[1].textContent = formatPrice(high);
        if (ohlcEls[2]) ohlcEls[2].textContent = formatPrice(low);
        if (ohlcEls[3]) ohlcEls[3].textContent = (volume / 1000000).toFixed(2) + 'M';
        
        // Update order book
        updateOrderBook(currentPrice);
        
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Update order book with synthetic data based on current price
function updateOrderBook(currentPrice) {
    const sellOrdersContainer = document.querySelector('.sell-orders');
    const buyOrdersContainer = document.querySelector('.buy-orders');
    
    if (sellOrdersContainer) {
        let sellHtml = '';
        for (let i = 1; i <= 5; i++) {
            const price = currentPrice + (i * currentPrice * 0.0005);
            const size = (Math.random() * 2 + 0.1).toFixed(4);
            const total = (price * parseFloat(size)).toFixed(1);
            const width = Math.random() * 70 + 10;
            sellHtml += `
                <div class="relative grid grid-cols-3 px-4 py-0.5 text-xs">
                    <div class="absolute inset-y-0 right-0 bg-error/10 w-[${width}%]"></div>
                    <span class="text-tertiary font-medium relative">${formatPrice(price)}</span>
                    <span class="text-right text-on-surface relative">${size}</span>
                    <span class="text-right text-outline relative">${total}</span>
                </div>
            `;
        }
        sellOrdersContainer.innerHTML = sellHtml;
    }
    
    if (buyOrdersContainer) {
        let buyHtml = '';
        for (let i = 1; i <= 5; i++) {
            const price = currentPrice - (i * currentPrice * 0.0005);
            const size = (Math.random() * 2 + 0.1).toFixed(4);
            const total = (price * parseFloat(size)).toFixed(1);
            const width = Math.random() * 70 + 10;
            buyHtml += `
                <div class="relative grid grid-cols-3 px-4 py-0.5 text-xs">
                    <div class="absolute inset-y-0 right-0 bg-primary/10 w-[${width}%]"></div>
                    <span class="text-primary font-medium relative">${formatPrice(price)}</span>
                    <span class="text-right text-on-surface relative">${size}</span>
                    <span class="text-right text-outline relative">${total}</span>
                </div>
            `;
        }
        buyOrdersContainer.innerHTML = buyHtml;
    }
    
    // Update spread
    const spread = (currentPrice * 0.002).toFixed(2);
    const spreadEl = document.querySelector('.spread-value');
    if (spreadEl) spreadEl.textContent = `Spread: $${spread}`;
}

// Initialize charts page
async function initializeCharts() {
    try {
        const response = await fetch('/api/prices');
        const prices = await response.json();
        
        // Update coin selector
        updateCoinSelector(prices);
        
        // Load initial chart (BTC 1H)
        await updateChart('BTC', '1h');
        
        // Add event listeners
        const selector = document.getElementById('coinSelector');
        const timeframeBtns = document.querySelectorAll('.timeframe-btn');
        
        if (selector) {
            selector.addEventListener('change', (e) => {
                updateChart(e.target.value, '1h');
            });
        }
        
        timeframeBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const symbol = selector ? selector.value : 'BTC';
                const timeframe = btn.getAttribute('data-timeframe') || '1h';
                await updateChart(symbol, timeframe);
                
                // Update active state
                timeframeBtns.forEach(b => b.classList.remove('bg-secondary', 'text-on-secondary'));
                timeframeBtns.forEach(b => b.classList.add('bg-surface-container-lowest'));
                btn.classList.remove('bg-surface-container-lowest');
                btn.classList.add('bg-secondary', 'text-on-secondary');
            });
        });
        
        console.log('✅ Charts initialized');
    } catch (error) {
        console.error('❌ Error initializing charts:', error);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initializeCharts);

// Auto-refresh every 30 seconds
setInterval(() => {
    const selector = document.getElementById('coinSelector');
    if (selector) {
        updateChart(selector.value, '1h');
    }
}, 30000);

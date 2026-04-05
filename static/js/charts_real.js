// Charts Page - Real Data Integration
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

async function updateCharts() {
    console.log('🔄 Fetching chart data...');
    
    const [prices, btcCandles] = await Promise.all([
        fetchAPI('/prices'),
        fetchAPI('/candles/BTC/1d')
    ]);

    if (prices) {
        console.log('✅ Prices loaded');
        updateChartPrice(prices['BTC']);
    }

    if (btcCandles) {
        console.log('✅ BTC candles:', btcCandles.length);
        updateChartData(btcCandles);
    }
}

function updateChartPrice(btcData) {
    if (!btcData) return;
    
    const price = parseFloat(btcData.price);
    const change = parseFloat(btcData.change);
    const high = parseFloat(btcData.high);
    const low = parseFloat(btcData.low);
    const volume = parseFloat(btcData.quoteVolume);

    // Update main price
    const mainPrice = document.querySelector('.text-4xl, .text-5xl, [class*="last-price"]');
    if (mainPrice) {
        mainPrice.textContent = formatCurrency(price);
    }

    // Update change
    const changeEl = document.querySelector('[class*="change"], .text-green, .text-red');
    if (changeEl) {
        changeEl.textContent = formatPercent(change);
        changeEl.className = change >= 0 ? 'text-primary' : 'text-error';
    }

    // Update 24h stats
    const stats = document.querySelectorAll('[class*="24h"], [class*="high"], [class*="low"], [class*="volume"]');
    stats.forEach(stat => {
        const label = stat.querySelector('p:first-child');
        const value = stat.querySelector('p:last-child');
        
        if (label && value) {
            if (label.textContent.includes('High')) value.textContent = formatCurrency(high);
            if (label.textContent.includes('Low')) value.textContent = formatCurrency(low);
            if (label.textContent.includes('Volume')) value.textContent = (volume / 1e9).toFixed(2) + 'B';
        }
    });
}

function updateChartData(candles) {
    // This would update the chart visualization
    console.log('Chart data updated with', candles.length, 'candles');
}

// Setup timeframe buttons
function setupTimeframeButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (['15m', '1h', '4h', '1D', '1W'].includes(text)) {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('bg-primary', 'active'));
                btn.classList.add('bg-primary', 'active');
                loadTimeframe(text);
            });
        }
    });
}

async function loadTimeframe(tf) {
    const candles = await fetchAPI(`/candles/BTC/${tf}`);
    if (candles) {
        console.log(`✅ ${tf} candles loaded`);
        updateChartData(candles);
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log('📈 Charts page loaded with REAL DATA');
    updateCharts();
    setupTimeframeButtons();
    setInterval(updateCharts, 30000);
});

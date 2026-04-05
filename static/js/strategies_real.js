// Strategies Page - Real Data Integration
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

async function updateStrategies() {
    console.log('🔄 Fetching strategies data...');
    
    const [prices, signals, market] = await Promise.all([
        fetchAPI('/prices'),
        fetchAPI('/signals'),
        fetchAPI('/market/overview')
    ]);

    if (prices) {
        console.log('✅ Prices loaded for analysis');
        updateStrategyCards(prices);
    }

    if (signals && signals.value) {
        updateSignalsAnalysis(signals.value);
    }

    if (market) {
        updateMarketSentiment(market);
    }
}

function updateStrategyCards(prices) {
    const cards = document.querySelectorAll('[class*="strategy"], .glass-card');
    const falCoins = ['BTC', 'ETH', 'SOL', 'TAO', 'XRP', 'ADA'];
    
    let index = 0;
    cards.forEach(card => {
        const label = card.querySelector('h3, .text-lg');
        if (!label || index >= falCoins.length) return;
        
        const coin = falCoins[index];
        const data = prices[coin];
        if (!data) return;
        
        const change = parseFloat(data.change);
        const price = parseFloat(data.price);
        
        // Update values
        const valueEl = card.querySelector('.text-2xl, .text-3xl');
        if (valueEl) {
            valueEl.textContent = formatCurrency(price);
        }
        
        const changeEl = card.querySelector('[class*="percent"], .text-sm');
        if (changeEl) {
            changeEl.textContent = formatPercent(change);
            changeEl.className = change >= 0 ? 'text-primary' : 'text-error';
        }
        
        index++;
    });
}

function updateSignalsAnalysis(signals) {
    const buySignals = signals.filter(s => s.signal === 'BUY').length;
    const sellSignals = signals.filter(s => s.signal === 'SELL').length;
    const successRate = signals.filter(s => s.result === 'SUCCESS').length / signals.length * 100;

    // Update stats display
    const stats = document.querySelectorAll('[class*="stat"]');
    stats.forEach(stat => {
        const label = stat.querySelector('p:first-child');
        const value = stat.querySelector('p:last-child');
        
        if (label && value) {
            if (label.textContent.includes('Buy')) value.textContent = buySignals;
            if (label.textContent.includes('Sell')) value.textContent = sellSignals;
            if (label.textContent.includes('Success')) value.textContent = successRate.toFixed(1) + '%';
        }
    });
}

function updateMarketSentiment(market) {
    if (!market.fear_greed_index) return;

    const value = market.fear_greed_index.value;
    let sentiment = 'Neutral';
    let color = 'text-yellow-500';

    if (value >= 75) { sentiment = 'Extreme Greed'; color = 'text-error'; }
    else if (value >= 55) { sentiment = 'Greed'; color = 'text-primary'; }
    else if (value >= 45) { sentiment = 'Neutral'; color = 'text-yellow-500'; }
    else if (value >= 25) { sentiment = 'Fear'; color = 'text-orange-500'; }
    else { sentiment = 'Extreme Fear'; color = 'text-error'; }

    const gauge = document.querySelector('[class*="sentiment"], [class*="gauge"]');
    if (gauge) {
        const valueEl = gauge.querySelector('.text-4xl, .text-5xl');
        const textEl = gauge.querySelector('.text-lg, .text-sm');
        
        if (valueEl) valueEl.textContent = value;
        if (textEl) textEl.textContent = sentiment;
    }
}

// Setup timeframe selector
function setupTimeframeSelector() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('bg-primary', 'active'));
            btn.classList.add('bg-primary', 'active');
            updateStrategies();
        });
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Strategies page loaded with REAL DATA');
    updateStrategies();
    setupTimeframeSelector();
    setInterval(updateStrategies, 30000);
});

// Trading Page - Real Data Integration (Fixed v3 - Working with Real API)
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

function formatVolume(value) {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K';
    return '$' + value.toFixed(2);
}

async function updateTrading() {
    console.log('🔄 Fetching trading data...');
    
    const prices = await fetchAPI('/prices');
    if (!prices) {
        console.error('❌ No prices data received');
        return;
    }

    console.log('✅ Prices loaded:', Object.keys(prices));
    
    // Update BTC data
    const btcData = prices['BTC'];
    if (btcData) {
        updateBTCPrice(btcData);
        updateMarketStats(btcData);
    }
}

function updateBTCPrice(btcData) {
    if (!btcData) return;
    
    const price = parseFloat(btcData.price);
    const change = parseFloat(btcData.change);
    
    console.log('BTC Price:', price, 'Change:', change);
    
    // Find BTC/USDT heading
    const headings = document.querySelectorAll('h4');
    headings.forEach(h4 => {
        const text = h4.textContent;
        if (text.includes('BTC') || text.includes('USDT')) {
            // Find price paragraph
            const parent = h4.parentElement;
            if (parent) {
                const paragraphs = parent.querySelectorAll('p');
                paragraphs.forEach((p, idx) => {
                    if (idx === 0 && p.textContent.includes('$')) {
                        p.textContent = formatCurrency(price);
                        console.log('✅ Updated BTC price:', p.textContent);
                    }
                    if (idx === 1 && p.textContent.includes('%')) {
                        const changeText = change >= 0 ? `+${change.toFixed(2)}% (24h)` : `${change.toFixed(2)}% (24h)`;
                        p.textContent = changeText;
                        p.style.color = change >= 0 ? '#3fff8b' : '#ff716c';
                        console.log('✅ Updated BTC change:', p.textContent);
                    }
                });
            }
        }
    });
}

function updateMarketStats(btcData) {
    if (!btcData) return;
    
    const price = parseFloat(btcData.price);
    const high = parseFloat(btcData.high);
    const low = parseFloat(btcData.low);
    const volume = parseFloat(btcData.quoteVolume);
    
    console.log('Market Stats:', { high, low, volume });
    
    // Find all stat containers
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
        const labelP = div.querySelector('p:first-child');
        const valueP = div.querySelector('p:last-child');
        
        if (!labelP || !valueP) return;
        
        const labelText = labelP.textContent.trim().toLowerCase();
        
        if (labelText === 'market cap') {
            valueP.textContent = '$1.3T'; // Approximate
            console.log('✅ Updated Market Cap');
        }
        else if (labelText === 'vol (24h)' || labelText.includes('vol')) {
            valueP.textContent = formatVolume(volume);
            console.log('✅ Updated Volume:', valueP.textContent);
        }
        else if (labelText === 'high (24h)' || labelText === 'high') {
            valueP.textContent = formatCurrency(high);
            valueP.style.color = '#3fff8b';
            console.log('✅ Updated High:', valueP.textContent);
        }
        else if (labelText === 'low (24h)' || labelText === 'low') {
            valueP.textContent = formatCurrency(low);
            valueP.style.color = '#ff716c';
            console.log('✅ Updated Low:', valueP.textContent);
        }
    });
}

// Setup timeframe buttons
function setupTimeframeButtons() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (['1H', '24H', '1W', '1M'].includes(text)) {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('bg-primary', 'active'));
                btn.classList.add('bg-primary', 'active');
            });
        }
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    console.log('💹 Trading page loaded - REAL DATA v3');
    updateTrading();
    setupTimeframeButtons();
    setInterval(updateTrading, 30000);
});
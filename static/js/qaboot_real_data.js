// Dashboard - Real Data Integration v4 (Fill All Rows)
const API_BASE = '/api';

// All 25 coins with their full names
const COIN_INFO = {
    'BTC': { name: 'Bitcoin', color: '#F7931A', icon: '₿' },
    'ETH': { name: 'Ethereum', color: '#627EEA', icon: 'Ξ' },
    'SOL': { name: 'Solana', color: '#14F195', icon: 'S' },
    'USDT': { name: 'Tether', color: '#26A17B', icon: '₮' },
    'XRP': { name: 'XRP', color: '#23292F', icon: 'X' },
    'BNB': { name: 'BNB', color: '#F3BA2F', icon: 'B' },
    'DOGE': { name: 'Dogecoin', color: '#C2A633', icon: 'Ð' },
    'ADA': { name: 'Cardano', color: '#0033AD', icon: 'A' },
    'AVAX': { name: 'Avalanche', color: '#E84142', icon: 'A' },
    'DOT': { name: 'Polkadot', color: '#E6007A', icon: '●' },
    'LINK': { name: 'Chainlink', color: '#2A5ADA', icon: 'L' },
    'TRX': { name: 'TRON', color: '#FF060A', icon: 'T' },
    'MATIC': { name: 'Polygon', color: '#8247E5', icon: 'M' },
    'UNI': { name: 'Uniswap', color: '#FF007A', icon: 'U' },
    'LTC': { name: 'Litecoin', color: '#BFBBBB', icon: 'Ł' },
    'ATOM': { name: 'Cosmos', color: '#2E3148', icon: 'A' },
    'XLM': { name: 'Stellar', color: '#15B5E4', icon: 'X' },
    'ALGO': { name: 'Algorand', color: '#00A4E0', icon: 'A' },
    'VET': { name: 'VeChain', color: '#15BDF5', icon: 'V' },
    'FIL': { name: 'Filecoin', color: '#0090FF', icon: 'F' },
    'THETA': { name: 'Theta', color: '#2B57A3', icon: 'Θ' },
    'XTZ': { name: 'Tezos', color: '#0E61B5', icon: 'T' },
    'AAVE': { name: 'Aave', color: '#B6509E', icon: 'A' },
    'GRT': { name: 'The Graph', color: '#6747ED', icon: 'G' },
    'COMP': { name: 'Compound', color: '#00D395', icon: 'C' },
    'TAO': { name: 'Bittensor', color: '#14F195', icon: 'τ' },
    'NEAR': { name: 'NEAR Protocol', color: '#00C1DE', icon: 'N' },
    'FET': { name: 'Fetch.ai', color: '#1F5AF6', icon: 'F' }
};

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
    if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return '$' + value.toLocaleString();
    if (value < 0.01) return '$' + value.toFixed(6);
    if (value < 1) return '$' + value.toFixed(4);
    return '$' + value.toFixed(2);
}

function formatPercent(value) {
    if (!value || isNaN(value)) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatVolume(value) {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e12) return '$' + (value / 1e12).toFixed(1) + 'T';
    if (value >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
    if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
    return '$' + (value / 1e3).toFixed(1) + 'K';
}

async function updateDashboard() {
    console.log('🔄 Fetching dashboard data...');
    
    try {
        const [prices, portfolio, signals] = await Promise.all([
            fetchAPI('/prices'),
            fetchAPI('/portfolio'),
            fetchAPI('/signals')
        ]);
        
        if (prices) {
            console.log('✅ Prices loaded:', Object.keys(prices).length, 'coins');
            updateMarketTable(prices);
        }
        
        if (portfolio) {
            console.log('✅ Portfolio loaded:', portfolio.total_value);
            updateHeaderStats(portfolio);
            updateStatCards(portfolio);
        }
        
        if (signals) {
            console.log('✅ Signals loaded:', signals.length);
            updateSignalsCount(signals.length);
        }
    } catch (error) {
        console.error('❌ Dashboard update error:', error);
    }
}

function updateHeaderStats(portfolio) {
    const totalValueEl = document.getElementById('total-value');
    const pnlEl = document.getElementById('pnl');
    const signalsEl = document.getElementById('signals-count');
    
    if (totalValueEl) {
        totalValueEl.textContent = formatCurrency(portfolio.total_value);
    }
    
    if (pnlEl) {
        const pnlText = portfolio.total_pnl >= 0 ? `+${formatCurrency(portfolio.total_pnl)}` : formatCurrency(portfolio.total_pnl);
        pnlEl.textContent = pnlText;
        pnlEl.style.color = portfolio.total_pnl >= 0 ? '#3fff8b' : '#ff716c';
    }
    
    if (signalsEl) {
        signalsEl.textContent = portfolio.active_signals || 0;
    }
}

function updateStatCards(portfolio) {
    const cards = document.querySelectorAll('.glass-card');
    if (cards.length >= 4) {
        const totalValueCard = cards[0].querySelector('h3');
        if (totalValueCard) totalValueCard.textContent = formatCurrency(portfolio.total_value);
        
        const pnlCard = cards[1].querySelector('h3');
        if (pnlCard) {
            const pnlText = portfolio.total_pnl >= 0 ? `+${formatCurrency(portfolio.total_pnl)}` : formatCurrency(portfolio.total_pnl);
            pnlCard.textContent = pnlText;
        }
        
        const signalsCard = cards[2].querySelector('h3');
        if (signalsCard) signalsCard.textContent = portfolio.active_signals || 0;
        
        const winRateCard = cards[3].querySelector('h3');
        if (winRateCard) winRateCard.textContent = (portfolio.win_rate || 0).toFixed(1) + '%';
    }
}

function updateSignalsCount(count) {
    const signalsEl = document.getElementById('signals-count');
    if (signalsEl) {
        signalsEl.textContent = count;
    }
}

function updateMarketTable(prices) {
    // Find all rows with data-coin attribute
    const rows = document.querySelectorAll('tr[data-coin]');
    console.log(`Found ${rows.length} coin rows to update`);
    
    let updatedCount = 0;
    
    rows.forEach(row => {
        const coin = row.getAttribute('data-coin');
        if (!coin) return;
        
        const priceData = prices[coin];
        
        if (priceData) {
            const price = parseFloat(priceData.price);
            const change = parseFloat(priceData.change);
            const high = parseFloat(priceData.high);
            const low = parseFloat(priceData.low);
            const volume = parseFloat(priceData.quoteVolume);
            
            // Update cells by their data-field attribute
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                const field = cell.getAttribute('data-field');
                
                if (field === 'price') {
                    cell.textContent = formatCurrency(price);
                    cell.className = 'px-8 py-6 font-mono text-on-surface';
                } else if (field === 'change') {
                    const span = cell.querySelector('span');
                    if (span) {
                        span.textContent = formatPercent(change);
                        span.className = change >= 0 
                            ? 'bg-[#3fff8b]/10 text-[#3fff8b] px-2 py-1 rounded-lg'
                            : 'bg-[#ff716c]/10 text-[#ff716c] px-2 py-1 rounded-lg';
                    }
                    cell.className = `px-8 py-6 ${change >= 0 ? 'text-[#3fff8b]' : 'text-[#ff716c]'}`;
                } else if (field === 'high') {
                    cell.textContent = formatCurrency(high);
                    cell.className = 'px-8 py-6 text-outline';
                } else if (field === 'low') {
                    cell.textContent = formatCurrency(low);
                    cell.className = 'px-8 py-6 text-outline';
                } else if (field === 'volume') {
                    cell.textContent = formatVolume(volume);
                    cell.className = 'px-8 py-6 text-right text-on-surface-variant';
                }
            });
            
            updatedCount++;
            console.log(`✅ Updated ${coin}: ${formatCurrency(price)} (${formatPercent(change)})`);
        } else {
            console.warn(`⚠️ No price data for ${coin}`);
        }
    });
    
    console.log(`✅ Updated ${updatedCount}/${rows.length} rows`);
}

// Auto-refresh on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Dashboard loaded - REAL DATA v4');
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        updateDashboard();
    }, 100);
    
    // Auto-refresh every 30 seconds
    setInterval(updateDashboard, 30000);
});
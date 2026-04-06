/**
 * Market Table Population - Direct API to DOM
 * Populates ALL rows with real Binance data
 */

// Top 25 coins to display
const TOP_25_COINS = [
    {symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', icon: '₿'},
    {symbol: 'ETH', name: 'Ethereum', color: '#627EEA', icon: 'Ξ'},
    {symbol: 'SOL', name: 'Solana', color: '#14F195', icon: 'S'},
    {symbol: 'USDT', name: 'Tether', color: '#26A17B', icon: '₮'},
    {symbol: 'XRP', name: 'XRP', color: '#23292F', icon: 'X'},
    {symbol: 'BNB', name: 'BNB', color: '#F3BA2F', icon: 'B'},
    {symbol: 'DOGE', name: 'Dogecoin', color: '#C2A633', icon: 'Ð'},
    {symbol: 'ADA', name: 'Cardano', color: '#0033AD', icon: 'A'},
    {symbol: 'AVAX', name: 'Avalanche', color: '#E84142', icon: 'A'},
    {symbol: 'DOT', name: 'Polkadot', color: '#E6007A', icon: '●'},
    {symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA', icon: 'L'},
    {symbol: 'TRX', name: 'TRON', color: '#FF060A', icon: 'T'},
    {symbol: 'MATIC', name: 'Polygon', color: '#8247E5', icon: 'M'},
    {symbol: 'UNI', name: 'Uniswap', color: '#FF007A', icon: 'U'},
    {symbol: 'LTC', name: 'Litecoin', color: '#BFBBBB', icon: 'Ł'},
    {symbol: 'ATOM', name: 'Cosmos', color: '#2E3148', icon: 'A'},
    {symbol: 'XLM', name: 'Stellar', color: '#15B5E4', icon: 'X'},
    {symbol: 'ALGO', name: 'Algorand', color: '#00A4E0', icon: 'A'},
    {symbol: 'VET', name: 'VeChain', color: '#15BDF5', icon: 'V'},
    {symbol: 'FIL', name: 'Filecoin', color: '#0090FF', icon: 'F'},
    {symbol: 'THETA', name: 'Theta', color: '#2B57A3', icon: 'Θ'},
    {symbol: 'XTZ', name: 'Tezos', color: '#0E61B5', icon: 'T'},
    {symbol: 'AAVE', name: 'Aave', color: '#B6509E', icon: 'A'},
    {symbol: 'GRT', name: 'The Graph', color: '#6747ED', icon: 'G'},
    {symbol: 'COMP', name: 'Compound', color: '#00D395', icon: 'C'}
];

// Format helpers
function formatPrice(price) {
    if (price >= 1000) return `$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
}

function formatChange(change) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

function formatVolume(vol) {
    if (vol >= 1e9) return `$${(vol/1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `$${(vol/1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `$${(vol/1e3).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
}

// Create table row HTML
function createCoinRow(coin, data) {
    const changeClass = data.change >= 0 ? 'text-primary-dim' : 'text-error';
    const changeBg = data.change >= 0 ? 'bg-primary/10' : 'bg-error/10';
    
    return `
        <tr class="group hover:bg-white/5 transition-colors" data-coin="${coin.symbol}">
            <td class="px-8 py-6 flex items-center gap-4">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm" 
                     style="background-color: ${coin.color}20; color: ${coin.color}">
                    ${coin.icon}
                </div>
                <div>
                    <p class="text-on-surface font-bold">${coin.name}</p>
                    <p class="text-[10px] text-outline">${coin.symbol}</p>
                </div>
            </td>
            <td class="px-8 py-6 font-mono text-on-surface">${formatPrice(data.price)}</td>
            <td class="px-8 py-6 ${changeClass}">
                <span class="${changeBg} px-2 py-1 rounded-lg">${formatChange(data.change)}</span>
            </td>
            <td class="px-8 py-6 text-outline">${formatPrice(data.high)}</td>
            <td class="px-8 py-6 text-outline">${formatPrice(data.low)}</td>
            <td class="px-8 py-6 text-right text-on-surface-variant">${formatVolume(data.volume)}</td>
        </tr>
    `;
}

// Populate market table
async function populateMarketTable() {
    try {
        const response = await fetch('/api/prices');
        const prices = await response.json();
        
        const tbody = document.querySelector('table tbody');
        if (!tbody) {
            console.error('Table tbody not found');
            return;
        }
        
        // Clear existing content
        tbody.innerHTML = '';
        
        // Add all 25 coins
        for (const coin of TOP_25_COINS) {
            const data = prices[coin.symbol];
            if (data) {
                const rowHTML = createCoinRow(coin, {
                    price: data.price,
                    change: data.change,
                    high: data.high,
                    low: data.low,
                    volume: data.volume  // Fixed: was quoteVolume
                });
                tbody.insertAdjacentHTML('beforeend', rowHTML);
            }
        }
        
        console.log(`✅ Populated ${TOP_25_COINS.length} coins successfully`);
    } catch (error) {
        console.error('❌ Error populating market table:', error);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', populateMarketTable);

// Auto-refresh every 10 seconds
setInterval(populateMarketTable, 10000);

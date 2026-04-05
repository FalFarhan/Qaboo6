/**
 * Portfolio Population - FAL Real Holdings
 * Populates Portfolio with real wallet data
 */

// FAL Portfolio Holdings - REAL DATA
const PORTFOLIO_HOLDINGS = [
    {symbol: 'BTC', name: 'Bitcoin', amount: 0.00133087, avgPrice: 65000, color: '#F7931A', icon: '₿'},
    {symbol: 'SOL', name: 'Solana', amount: 1.0886334, avgPrice: 120, color: '#14F195', icon: 'S'},
    {symbol: 'USDT', name: 'Tether', amount: 85.259, avgPrice: 1.0, color: '#26A17B', icon: '₮'},
    {symbol: 'ETH', name: 'Ethereum', amount: 0.0259714, avgPrice: 3500, color: '#627EEA', icon: 'Ξ'},
    {symbol: 'XRP', name: 'XRP', amount: 16.8379, avgPrice: 0.55, color: '#23292F', icon: 'X'},
    {symbol: 'TAO', name: 'Bittensor', amount: 0.0720727, avgPrice: 320, color: '#14F195', icon: 'τ'},
    {symbol: 'ADA', name: 'Cardano', amount: 80.692, avgPrice: 0.40, color: '#0033AD', icon: 'A'},
    {symbol: 'NEAR', name: 'NEAR Protocol', amount: 14.0605, avgPrice: 2.5, color: '#00C1DE', icon: 'N'},
    {symbol: 'ATH', name: 'Aethir', amount: 2651, avgPrice: 0.035, color: '#FF6B00', icon: 'A'},
    {symbol: 'ZBT', name: 'ZEROBASE', amount: 147.9778, avgPrice: 0.15, color: '#00FF88', icon: 'Z'},
    {symbol: 'FET', name: 'Artificial Superintelligence', amount: 62.6917, avgPrice: 1.20, color: '#1F5AF6', icon: 'F'},
    {symbol: 'AVAX', name: 'Avalanche', amount: 1.54633, avgPrice: 28, color: '#E84142', icon: 'A'},
    {symbol: 'VIRTUAL', name: 'Virtuals Protocol', amount: 21.92, avgPrice: 3.5, color: '#6366F1', icon: 'V'},
    {symbol: 'STX', name: 'Stacks', amount: 56.44, avgPrice: 1.5, color: '#FF6B35', icon: 'S'},
    {symbol: 'ZETA', name: 'ZetaChain', amount: 222.1892, avgPrice: 0.25, color: '#6366F1', icon: 'Z'},
    {symbol: 'SEI', name: 'Sei', amount: 206.1936, avgPrice: 0.18, color: '#FF0000', icon: 'S'},
    {symbol: 'KAS', name: 'Kaspa', amount: 342.99, avgPrice: 0.08, color: '#00D4AA', icon: 'K'},
    {symbol: 'SYRUP', name: 'Maple Finance', amount: 51.448, avgPrice: 0.45, color: '#FFD700', icon: 'S'},
    {symbol: 'TRAC', name: 'OriginTrail', amount: 31, avgPrice: 0.65, color: '#FF6B00', icon: 'T'},
    {symbol: 'W', name: 'Wormhole', amount: 678.9204, avgPrice: 0.15, color: '#6366F1', icon: 'W'},
    {symbol: 'KTA', name: 'Keeta', amount: 44.5521, avgPrice: 0.25, color: '#00D4AA', icon: 'K'},
    {symbol: 'ONDO', name: 'Ondo', amount: 27.172, avgPrice: 0.55, color: '#6366F1', icon: 'O'},
    {symbol: 'SUI', name: 'Sui', amount: 7.7922, avgPrice: 1.8, color: '#4ADE80', icon: 'S'},
    {symbol: 'BIO', name: 'Bio Protocol', amount: 223.65, avgPrice: 0.12, color: '#22C55E', icon: 'B'},
    {symbol: 'KO', name: "Kyuzo's Friends", amount: 237.877, avgPrice: 0.08, color: '#F97316', icon: 'K'},
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
    if (amount >= 1) return amount.toFixed(2);
    return amount.toFixed(6);
}

function formatChange(change) {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}

// Create portfolio row HTML
function createPortfolioRow(holding, currentPrice, change24h) {
    const value = holding.amount * currentPrice;
    const cost = holding.amount * holding.avgPrice;
    const pnl = value - cost;
    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
    
    const pnlClass = pnl >= 0 ? 'text-primary' : 'text-error';
    const changeClass = change24h >= 0 ? 'text-primary' : 'text-error';
    
    return `
        <tr class="hover:bg-white/5 transition-colors">
            <td class="px-6 py-5 flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs" 
                     style="background-color: ${holding.color}20; color: ${holding.color}">
                    ${holding.icon}
                </div>
                <div>
                    <p class="text-sm font-bold">${holding.name}</p>
                    <p class="text-[10px] text-outline font-medium">${holding.symbol}</p>
                </div>
            </td>
            <td class="px-6 py-5 text-right font-medium text-sm">${formatAmount(holding.amount)} ${holding.symbol}</td>
            <td class="px-6 py-5 text-right font-bold text-sm">${formatPrice(value)}</td>
            <td class="px-6 py-5 text-right font-medium text-sm text-outline">${formatPrice(holding.avgPrice)}</td>
            <td class="px-6 py-5 text-right font-bold text-sm">${formatPrice(currentPrice)}</td>
            <td class="px-6 py-5 text-right ${pnlClass} font-bold text-sm">
                ${pnl >= 0 ? '+' : ''}${formatPrice(Math.abs(pnl))} 
                <span class="text-[10px] block opacity-70">(${pnl >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%)</span>
            </td>
            <td class="px-6 py-5 text-right ${changeClass} font-bold text-sm">${formatChange(change24h)}</td>
        </tr>
    `;
}

// Populate portfolio table
async function populatePortfolioTable() {
    try {
        const response = await fetch('/api/prices');
        const prices = await response.json();
        
        const tbody = document.querySelector('table tbody');
        if (!tbody) {
            console.error('Portfolio table tbody not found');
            return;
        }
        
        // Clear existing content
        tbody.innerHTML = '';
        
        let totalValue = 0;
        let totalCost = 0;
        
        // Add all holdings
        for (const holding of PORTFOLIO_HOLDINGS) {
            const priceData = prices[holding.symbol];
            const currentPrice = priceData ? priceData.price : holding.avgPrice;
            const change24h = priceData ? priceData.change : 0;
            
            const rowHTML = createPortfolioRow(holding, currentPrice, change24h);
            tbody.insertAdjacentHTML('beforeend', rowHTML);
            
            totalValue += holding.amount * currentPrice;
            totalCost += holding.amount * holding.avgPrice;
        }
        
        const totalPnl = totalValue - totalCost;
        const pnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
        
        console.log(`✅ Portfolio: ${PORTFOLIO_HOLDINGS.length} assets, Total: $${totalValue.toFixed(2)}, P&L: $${totalPnl.toFixed(2)}`);
        
        // Update summary cards if they exist
        updateSummaryCards(totalValue, totalPnl, pnlPercent);
        
    } catch (error) {
        console.error('❌ Error populating portfolio:', error);
    }
}

// Update summary cards
function updateSummaryCards(totalValue, totalPnl, pnlPercent) {
    // Find all h3 elements and update the ones that look like financial values
    const h3s = document.querySelectorAll('h3');
    h3s.forEach(h3 => {
        const text = h3.textContent;
        // Update Today's P&L card
        if (text.includes('$') && text.includes('+')) {
            h3.textContent = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`;
            h3.className = totalPnl >= 0 ? 'text-2xl font-bold text-primary' : 'text-2xl font-bold text-error';
        }
        // Update Total Equity in chart
        if (text.includes('452K') || text.includes('$')) {
            // Don't change the chart text
        }
    });
    
    // Update the Total Equity display in the donut chart
    const equitySpans = document.querySelectorAll('span');
    equitySpans.forEach(span => {
        if (span.textContent.includes('452K')) {
            if (totalValue >= 1000) {
                span.textContent = `$${(totalValue/1000).toFixed(1)}K`;
            } else {
                span.textContent = `$${totalValue.toFixed(2)}`;
            }
        }
    });
}

// Run on page load
document.addEventListener('DOMContentLoaded', populatePortfolioTable);

// Auto-refresh every 30 seconds
setInterval(populatePortfolioTable, 30000);

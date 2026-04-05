// QABOOT V4 WEB - JavaScript Application

// ============== STATE ==============
let currentPage = 'dashboard';
let pricesData = {};
let portfolioData = {
    // العملات الأساسية
    'BTC': 0.0013308772188179597,
    'SOL': 1.088633395652049,
    'USDT': 85.259,
    'ETH': 0.0259714,
    // العملات المتوسطة
    'TAO': 0.0720727,
    'XRP': 16.8379,
    'ADA': 80.692,
    'ATH': 2651,
    'NEAR': 14.0605,
    'FET': 62.6917,
    'ZBT': 147.9778,
    'VIRTUAL': 21.92,
    'AVAX': 1.54633,
    'STX': 56.44,
    'SEI': 206.1936,
    'KAS': 342.99,
    'SYRUP': 51.448,
    'ZETA': 222.1892,
    'W': 678.9204,
    'TRAC': 31,
    'KTA': 44.5521,
    'ONDO': 27.172,
    'SUI': 7.7922,
    'BIO': 223.65,
    'KO': 237.877,
    'POL': 14.56
};
let chartInstance = null;
let portfolioChartInstance = null;
let socket = null;

// ============== API ==============
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        return { error: error.message };
    }
}

// ============== UTILITIES ==============
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8">
            <div class="spinner-glass mb-4"></div>
            <p class="text-gray-400">Loading data...</p>
        </div>
    `;
}

function showSkeletonTable(tableId, rows = 5) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    let html = '';
    for (let i = 0; i < rows; i++) {
        html += `
            <tr>
                <td class="p-3"><div class="skeleton skeleton-text" style="width: 60px"></div></td>
                <td class="p-3"><div class="skeleton skeleton-text" style="width: 80px"></div></td>
                <td class="p-3"><div class="skeleton skeleton-text" style="width: 60px"></div></td>
                <td class="p-3"><div class="skeleton skeleton-text" style="width: 80px"></div></td>
                <td class="p-3"><div class="skeleton skeleton-text" style="width: 80px"></div></td>
                <td class="p-3"><div class="skeleton skeleton-text" style="width: 60px"></div></td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
}

// ============== PAPER TRADING ==============
let paperTrading = {
    enabled: localStorage.getItem('paper_trading') === 'true',
    balance: parseFloat(localStorage.getItem('paper_balance')) || 10000,
    trades: JSON.parse(localStorage.getItem('paper_trades')) || [],
    positions: JSON.parse(localStorage.getItem('paper_positions')) || {}
};

function initPaperTrading() {
    const saved = localStorage.getItem('paper_trading');
    if (saved === null) {
        // First time - ask user
        paperTrading.enabled = false;
        savePaperTrading();
    }
    updatePaperTradingUI();
}

function togglePaperTrading() {
    paperTrading.enabled = !paperTrading.enabled;
    savePaperTrading();
    updatePaperTradingUI();
    showNotification('Paper Trading', paperTrading.enabled ? 'Enabled' : 'Disabled');
}

function savePaperTrading() {
    localStorage.setItem('paper_trading', paperTrading.enabled);
    localStorage.setItem('paper_balance', paperTrading.balance);
    localStorage.setItem('paper_trades', JSON.stringify(paperTrading.trades));
    localStorage.setItem('paper_positions', JSON.stringify(paperTrading.positions));
}

function updatePaperTradingUI() {
    // Update balance display
    const balanceEl = document.getElementById('paper-balance');
    if (balanceEl) {
        balanceEl.textContent = `$${paperTrading.balance.toLocaleString()}`;
    }
    
    // Update toggle button
    const toggleEl = document.getElementById('paper-toggle');
    if (toggleEl) {
        toggleEl.textContent = paperTrading.enabled ? '● ON' : '○ OFF';
        toggleEl.className = paperTrading.enabled 
            ? 'px-3 py-1 rounded bg-green-600 text-sm'
            : 'px-3 py-1 rounded bg-gray-600 text-sm';
    }
    
    // Show/hide paper trading badge
    const badge = document.getElementById('paper-badge');
    if (badge) {
        badge.style.display = paperTrading.enabled ? 'inline-block' : 'none';
    }
}

async function paperTrade(coin, side, amount) {
    if (!paperTrading.enabled) {
        alert('Please enable Paper Trading first!');
        return;
    }
    
    const data = await fetchAPI('/api/prices');
    if (!data || !data[coin]) {
        showNotification('Error', 'Price data unavailable');
        return;
    }
    
    const price = data[coin].price;
    const total = amount * price;
    
    if (side === 'BUY') {
        if (total > paperTrading.balance) {
            showNotification('Error', 'Insufficient balance');
            return;
        }
        
        paperTrading.balance -= total;
        
        // Add to positions
        if (!paperTrading.positions[coin]) {
            paperTrading.positions[coin] = { amount: 0, avgPrice: 0 };
        }
        
        const oldAmount = paperTrading.positions[coin].amount;
        const newAmount = oldAmount + amount;
        const oldCost = oldAmount * paperTrading.positions[coin].avgPrice;
        const newCost = total;
        paperTrading.positions[coin].avgPrice = (oldCost + newCost) / newAmount;
        paperTrading.positions[coin].amount = newAmount;
        
    } else if (side === 'SELL') {
        if (!paperTrading.positions[coin] || paperTrading.positions[coin].amount < amount) {
            showNotification('Error', 'Insufficient position');
            return;
        }
        
        paperTrading.balance += total;
        paperTrading.positions[coin].amount -= amount;
        
        if (paperTrading.positions[coin].amount <= 0) {
            delete paperTrading.positions[coin];
        }
    }
    
    // Record trade
    const trade = {
        id: Date.now(),
        coin,
        side,
        amount,
        price,
        total,
        timestamp: new Date().toISOString(),
        pnl: side === 'SELL' ? calculatePnL(coin, price, amount) : 0
    };
    
    paperTrading.trades.unshift(trade);
    if (paperTrading.trades.length > 100) {
        paperTrading.trades = paperTrading.trades.slice(0, 100);
    }
    
    savePaperTrading();
    updatePaperTradingUI();
    renderPaperTradingHistory();
    
    showNotification('Trade Executed', `${side} ${amount} ${coin} at $${price}`);
}

function calculatePnL(coin, sellPrice, amount) {
    const position = paperTrading.positions[coin];
    if (!position) return 0;
    return (sellPrice - position.avgPrice) * amount;
}

function renderPaperTradingHistory() {
    const container = document.getElementById('paper-trades');
    if (!container) return;
    
    if (paperTrading.trades.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">No trades yet</p>';
        return;
    }
    
    let html = '<div class="space-y-2">';
    for (const trade of paperTrading.trades.slice(0, 10)) {
        const pnlClass = trade.pnl > 0 ? 'text-green-400' : trade.pnl < 0 ? 'text-red-400' : 'text-gray-400';
        const pnlText = trade.pnl !== 0 ? `($${trade.pnl.toFixed(2)})` : '';
        
        html += `
            <div class="flex justify-between items-center p-2 bg-gray-800 rounded">
                <div class="flex items-center gap-2">
                    <span class="font-bold">${trade.coin}</span>
                    <span class="${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}">${trade.side}</span>
                </div>
                <div class="text-right">
                    <p class="text-sm">${trade.amount} @ $${trade.price.toFixed(2)}</p>
                    <p class="text-xs ${pnlClass}">${pnlText}</p>
                </div>
            </div>
        `;
    }
    html += '</div>';
    container.innerHTML = html;
}

function getPaperPositions() {
    return Object.entries(paperTrading.positions).map(([coin, data]) => ({
        coin,
        amount: data.amount,
        avgPrice: data.avgPrice,
        currentPrice: pricesData[coin]?.price || data.avgPrice,
        pnl: (pricesData[coin]?.price || data.avgPrice - data.avgPrice) * data.amount
    }));
}

// ============== WEBSOCKET ==============
function initWebSocket() {
    socket = io();
    
    socket.on('connect', function() {
        console.log('Connected to WebSocket');
        document.getElementById('connection-status').textContent = 'Connected';
    });
    
    socket.on('prices_update', function(data) {
        pricesData = data;
        updatePricesDisplay();
        updateHeaderStats();
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from WebSocket');
        document.getElementById('connection-status').textContent = 'Disconnected';
    });
}

function updateHeaderStats() {
    let totalValue = 0;
    let totalPnl = 0;
    
    for (const [coin, amount] of Object.entries(portfolioData)) {
        if (pricesData[coin]) {
            const value = amount * pricesData[coin].price;
            const pnl = value * (pricesData[coin].change / 100);
            totalValue += value;
            totalPnl += pnl;
        }
    }
    
    document.getElementById('header-total').textContent = `$${totalValue.toLocaleString()}`;
    document.getElementById('header-pnl').textContent = `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString()}`;
    document.getElementById('header-pnl').className = `text-lg font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`;
}

function updatePricesDisplay() {
    const tableBody = document.getElementById('prices-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const sortedCoins = Object.entries(pricesData)
        .sort((a, b) => b[1].volume - a[1].volume)
        .slice(0, 20);
    
    for (const [coin, info] of sortedCoins) {
        const changeClass = info.change >= 0 ? 'text-green-400' : 'text-red-400';
        const changeIcon = info.change >= 0 ? '↑' : '↓';
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition-colors';
        row.innerHTML = `
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center text-xs font-bold">
                        ${coin[0]}
                    </div>
                    <span class="font-bold text-white">${coin}</span>
                </div>
            </td>
            <td class="p-4 text-right font-mono text-white">$${info.price.toLocaleString()}</td>
            <td class="p-4 text-right ${changeClass}">
                <span class="inline-flex items-center gap-1">
                    ${changeIcon} ${Math.abs(info.change).toFixed(2)}%
                </span>
            </td>
            <td class="p-4 text-right text-white/60 font-mono">$${info.high.toLocaleString()}</td>
            <td class="p-4 text-right text-white/60 font-mono">$${info.low.toLocaleString()}</td>
            <td class="p-4 text-right text-white/60">${(info.volume / 1000000).toFixed(2)}M</td>
            <td class="p-4 text-right">
                <button class="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-3 py-1 rounded text-xs font-medium transition-colors">
                    Trade
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    }
}

// ============== NAVIGATION ==============
function showPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
        p.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(page);
    if (selectedPage) {
        selectedPage.classList.remove('hidden');
        selectedPage.classList.add('active');
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-cyan-600', 'border-l-4', 'border-cyan-400');
        if (btn.dataset.page === page) {
            btn.classList.add('active', 'bg-cyan-600', 'border-l-4', 'border-cyan-400');
        }
    });
    
    currentPage = page;
    
    // Page-specific initialization with delay for smooth transition
    setTimeout(() => {
        if (page === 'dashboard') loadPrices();
        if (page === 'portfolio') loadPortfolio();
        if (page === 'signals') loadSignals();
        if (page === 'strategies') initStrategiesPage();
        if (page === 'backtest') initBacktestPage();
    }, 100);
}

// ============== API CALLS ==============
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(endpoint);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// ============== DASHBOARD ==============
async function loadPrices() {
    const data = await fetchAPI('/api/prices');
    if (!data) return;
    
    pricesData = data;
    
    const tableBody = document.getElementById('prices-table');
    tableBody.innerHTML = '';
    
    // Sort by volume
    const sortedCoins = Object.entries(data)
        .sort((a, b) => b[1].volume - a[1].volume)
        .slice(0, 20);
    
    let totalValue = 0;
    
    for (const [coin, info] of sortedCoins) {
        const changeClass = info.change >= 0 ? 'text-green-400' : 'text-red-400';
        const changeSymbol = info.change >= 0 ? '+' : '';
        
        // Calculate portfolio value
        if (portfolioData[coin]) {
            totalValue += portfolioData[coin] * info.price;
        }
        
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700/50';
        row.innerHTML = `
            <td class="p-3">
                <div class="flex items-center gap-3">
                    ${getCoinIcon(coin)}
                    <span class="font-bold">${coin}</span>
                </div>
            </td>
            <td class="p-3 text-right">$${formatPrice(info.price)}</td>
            <td class="p-3 text-right ${changeClass}">${changeSymbol}${info.change.toFixed(2)}%</td>
            <td class="p-3 text-right text-gray-400">$${formatPrice(info.high)}</td>
            <td class="p-3 text-right text-gray-400">$${formatPrice(info.low)}</td>
            <td class="p-3 text-right text-gray-400">${(info.volume / 1000000).toFixed(2)}M</td>
        `;
        tableBody.appendChild(row);
    }
    
    // Update total value
    document.getElementById('total-value').textContent = `$${totalValue.toLocaleString()}`;
    
    // Update header stats
    updateHeaderStats(data, totalValue);
}

function updateHeaderStats(data, portfolioValue) {
    // Calculate total portfolio value including all coins
    let totalPortfolio = 0;
    let totalChange = 0;
    let coinCount = 0;
    
    for (const [coin, amount] of Object.entries(portfolioData)) {
        if (data[coin]) {
            totalPortfolio += amount * data[coin].price;
            totalChange += data[coin].change;
            coinCount++;
        }
    }
    
    // Update Header Portfolio Value
    const headerValue = document.getElementById('header-portfolio');
    if (headerValue) {
        headerValue.textContent = `$${totalPortfolio.toLocaleString()}`;
    }
    
    // Update Header 24h Change
    const headerChange = document.getElementById('header-change');
    if (headerChange && coinCount > 0) {
        const avgChange = totalChange / coinCount;
        const symbol = avgChange >= 0 ? '+' : '';
        headerChange.textContent = `${symbol}${avgChange.toFixed(2)}%`;
        headerChange.className = `text-lg font-bold ${avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`;
    }
    
    // Update Active Signals
    const headerSignals = document.getElementById('header-signals');
    if (headerSignals) {
        // Count coins with significant movement
        const signals = Object.values(data).filter(d => Math.abs(d.change) > 3).length;
        headerSignals.textContent = signals;
    }
}

// ============== PORTFOLIO ==============
async function loadPortfolio() {
    const data = await fetchAPI('/api/prices');
    if (!data) return;
    
    pricesData = data;
    
    const tableBody = document.getElementById('portfolio-table');
    tableBody.innerHTML = '';
    
    let totalValue = 0;
    let totalCost = 0;
    
    for (const [coin, amount] of Object.entries(portfolioData)) {
        if (data[coin]) {
            const price = data[coin].price;
            const value = amount * price;
            const change = data[coin].change;
            const pnl = value * (change / 100);
            
            totalValue += value;
            
            const pnlClass = pnl >= 0 ? 'text-green-400' : 'text-red-400';
            const pnlSymbol = pnl >= 0 ? '+' : '';
            
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-700 hover:bg-gray-700/50';
            row.innerHTML = `
                <td class="p-3">
                    <div class="flex items-center gap-2">
                        <button onclick="viewCoinChart('${coin}')" 
                                class="font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                                title="View Chart">
                            <span>${coin}</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                            </svg>
                        </button>
                    </div>
                </td>
                <td class="p-3 text-right">${amount.toLocaleString()}</td>
                <td class="p-3 text-right">$${price.toLocaleString()}</td>
                <td class="p-3 text-right">$${value.toLocaleString()}</td>
                <td class="p-3 text-right ${change >= 0 ? 'text-green-400' : 'text-red-400'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</td>
                <td class="p-3 text-right ${pnlClass}">${pnlSymbol}$${pnl.toFixed(2)}</td>
                <td class="p-3 text-center">
                    <button onclick="removeFromPortfolio('${coin}')" 
                            class="text-red-400 hover:text-red-300 p-1"
                            title="Remove">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    }
    
    // Render portfolio chart
    renderPortfolioChart();
    
    // Render pie chart with values
    const portfolioValues = {};
    for (const [coin, amount] of Object.entries(portfolioData)) {
        if (pricesData[coin]) {
            portfolioValues[coin] = amount * pricesData[coin].price;
        }
    }
    renderPortfolioPie(portfolioValues);
    
    // Update PnL stats
    updatePnLStats();
}

function renderPortfolioChart() {
    const canvas = document.getElementById('portfolio-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 200;
    
    if (portfolioChartInstance) {
        portfolioChartInstance.destroy();
    }
    
    // Sample data
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [45000, 46200, 45800, 47100, 48500, 49000, 50200];
    
    portfolioChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: data,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#9ca3af',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
                }
            }
        }
    });
}

// ============== PORTFOLIO PIE CHART ==============
function renderPortfolioPie(portfolioValues) {
    const canvas = document.getElementById('portfolio-pie');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set size
    canvas.width = 250;
    canvas.height = 250;
    
    // Destroy old chart if exists
    if (window.portfolioPieChart) {
        window.portfolioPieChart.destroy();
    }
    
    // Prepare data
    const labels = Object.keys(portfolioValues);
    const values = Object.values(portfolioValues);
    const total = values.reduce((a, b) => a + b, 0);
    
    // Colors
    const colors = [
        '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
    ];
    
    window.portfolioPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#1f2937'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#9ca3af',
                        font: { size: 11 },
                        callback: function(label, index) {
                            const value = values[index];
                            const pct = ((value / total) * 100).toFixed(1);
                            return `${label}: ${pct}%`;
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const pct = ((value / total) * 100).toFixed(1);
                            return `${context.label}: $${value.toLocaleString()} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Update stats
    document.getElementById('stat-coins').textContent = labels.length;
    
    // Find top holding
    const maxValue = Math.max(...values);
    const topCoin = labels[values.indexOf(maxValue)];
    document.getElementById('stat-top').textContent = topCoin;
    
    // Update avg change
    let avgChange = 0;
    let count = 0;
    for (const coin of labels) {
        if (pricesData[coin]) {
            avgChange += pricesData[coin].change;
            count++;
        }
    }
    if (count > 0) {
        avgChange = avgChange / count;
        const changeEl = document.getElementById('stat-change');
        changeEl.textContent = `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`;
        changeEl.className = `text-xl font-bold ${avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`;
    }
}

// ============== PnL HISTORY ==============
let pnlChart = null;
let currentPnLPeriod = '1d';

function updatePnLStats() {
    // Get historical data from localStorage or generate sample
    const history = JSON.parse(localStorage.getItem('pnl_history')) || generateSamplePnL();
    
    const today = history[history.length - 1] || 0;
    const last7 = history.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const last30 = history.slice(-30).reduce((a, b) => a + b, 0) / 30;
    const allTime = history.reduce((a, b) => a + b, 0) / history.length;
    
    // Update display
    updatePnLDisplay('pnl-today', today);
    updatePnLDisplay('pnl-7day', last7);
    updatePnLDisplay('pnl-30day', last30);
    updatePnLDisplay('pnl-alltime', allTime);
    
    // Render chart
    renderPnLChart(history);
}

function updatePnLDisplay(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const isPositive = value >= 0;
    const symbol = isPositive ? '+' : '';
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    
    el.textContent = `${symbol}$${Math.abs(value).toFixed(2)}`;
    el.className = `text-2xl font-bold ${color}`;
}

function generateSamplePnL() {
    // Generate sample PnL data for demo
    const data = [];
    let value = 0;
    for (let i = 0; i < 30; i++) {
        // Random daily PnL between -50 and +100
        value = (Math.random() - 0.3) * 150;
        data.push(value);
    }
    return data;
}

function changePnLPeriod(period) {
    currentPnLPeriod = period;
    
    // Update button styles
    ['1d', '7d', '30d'].forEach(p => {
        const btn = document.getElementById(`pnl-${p}`);
        if (btn) {
            btn.className = p === period 
                ? 'px-3 py-1 rounded bg-cyan-600 text-sm'
                : 'px-3 py-1 rounded bg-gray-700 text-sm hover:bg-gray-600';
        }
    });
    
    updatePnLStats();
}

function renderPnLChart(data) {
    const canvas = document.getElementById('pnl-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 200;
    
    if (pnlChart) {
        pnlChart.destroy();
    }
    
    // Get period data
    let chartData = data;
    let labels = [];
    
    if (currentPnLPeriod === '1d') {
        chartData = data.slice(-1);
        labels = ['Today'];
    } else if (currentPnLPeriod === '7d') {
        chartData = data.slice(-7);
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else {
        chartData = data;
        labels = Array.from({length: 30}, (_, i) => `${i+1}d`);
    }
    
    pnlChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily P&L',
                data: chartData,
                backgroundColor: chartData.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#9ca3af',
                        callback: v => `$${v.toFixed(0)}`
                    },
                    grid: { color: '#374151' }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
                }
            }
        }
    });
}

// ============== ADD COIN MODAL ==============
let selectedCoin = null;

function openAddCoinModal() {
    document.getElementById('add-coin-modal').classList.remove('hidden');
    document.getElementById('coin-search').focus();
    document.getElementById('coin-search').value = '';
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('selected-coin-section').classList.add('hidden');
    selectedCoin = null;
}

function closeAddCoinModal() {
    document.getElementById('add-coin-modal').classList.add('hidden');
}

// قائمة عملات شائعة للبحث - جميع عملات محفظتك
const availableCoins = [
    // العملات الكبيرة
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
    { symbol: 'SOL', name: 'Solana', type: 'crypto' },
    { symbol: 'USDT', name: 'Tether', type: 'stable' },
    // العملات المتوسطة
    { symbol: 'TAO', name: 'Bittensor', type: 'crypto' },
    { symbol: 'XRP', name: 'XRP', type: 'crypto' },
    { symbol: 'ADA', name: 'Cardano', type: 'crypto' },
    { symbol: 'ATH', name: 'Aethir', type: 'crypto' },
    { symbol: 'NEAR', name: 'NEAR Protocol', type: 'crypto' },
    { symbol: 'FET', name: 'Artificial Superintelligence Alliance', type: 'crypto' },
    { symbol: 'ZBT', name: 'ZEROBASE', type: 'crypto' },
    { symbol: 'VIRTUAL', name: 'Virtuals Protocol', type: 'crypto' },
    { symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
    { symbol: 'STX', name: 'Stacks', type: 'crypto' },
    { symbol: 'SEI', name: 'Sei', type: 'crypto' },
    { symbol: 'KAS', name: 'Kaspa', type: 'crypto' },
    { symbol: 'SYRUP', name: 'Maple Finance', type: 'crypto' },
    { symbol: 'ZETA', name: 'ZetaChain', type: 'crypto' },
    { symbol: 'W', name: 'Wormhole', type: 'crypto' },
    { symbol: 'TRAC', name: 'OriginTrail', type: 'crypto' },
    { symbol: 'KTA', name: 'Keeta', type: 'crypto' },
    { symbol: 'ONDO', name: 'Ondo', type: 'crypto' },
    { symbol: 'SUI', name: 'Sui', type: 'crypto' },
    { symbol: 'BIO', name: 'Bio Protocol', type: 'crypto' },
    { symbol: 'KO', name: "Kyuzo's Friends", type: 'crypto' },
    { symbol: 'POL', name: 'POL (ex-MATIC)', type: 'crypto' },
    // عملات إضافية
    { symbol: 'BNB', name: 'BNB', type: 'crypto' },
    { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' },
    { symbol: 'DOT', name: 'Polkadot', type: 'crypto' },
    { symbol: 'LINK', name: 'Chainlink', type: 'crypto' },
    { symbol: 'UNI', name: 'Uniswap', type: 'crypto' },
    { symbol: 'LTC', name: 'Litecoin', type: 'crypto' },
    { symbol: 'ATOM', name: 'Cosmos', type: 'crypto' },
    { symbol: 'VET', name: 'VeChain', type: 'crypto' },
    { symbol: 'TRX', name: 'TRON', type: 'crypto' }
];

function searchCoins(query) {
    const resultsDiv = document.getElementById('search-results');
    
    if (!query || query.length < 1) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    const filtered = availableCoins.filter(coin => 
        coin.symbol.toLowerCase().includes(query.toLowerCase()) ||
        coin.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered.length === 0) {
        resultsDiv.innerHTML = `
            <div class="text-center text-gray-400 p-4">
                No coins found matching "${query}"
            </div>
        `;
        return;
    }
    
    resultsDiv.innerHTML = filtered.map(coin => `
        <div onclick="selectCoin('${coin.symbol}', '${coin.name}')" 
             class="flex items-center justify-between p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-cyan-400 text-sm">${coin.symbol[0]}</div>
                <div>
                    <div class="font-bold">${coin.symbol}</div>
                    <div class="text-sm text-gray-400">${coin.name}</div>
                </div>
            </div>
            <div class="text-green-400 text-sm">${coin.type}</div>
        </div>
    `).join('');
}

function selectCoin(symbol, name) {
    selectedCoin = { symbol, name };
    document.getElementById('selected-coin-icon').textContent = symbol[0];
    document.getElementById('selected-coin-name').textContent = `${name} (${symbol})`;
    
    // Fetch current price
    fetchAPI('/api/prices').then(data => {
        if (data && data[symbol]) {
            document.getElementById('selected-coin-price').textContent = 
                `Current: $${data[symbol].price.toLocaleString()}`;
        } else {
            document.getElementById('selected-coin-price').textContent = 'Price: --';
        }
    });
    
    document.getElementById('selected-coin-section').classList.remove('hidden');
    document.getElementById('new-coin-amount').focus();
}

function addCoinToPortfolio() {
    if (!selectedCoin) return;
    
    const amount = parseFloat(document.getElementById('new-coin-amount').value);
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Add to portfolio
    portfolioData[selectedCoin.symbol] = amount;
    
    // Save to localStorage
    localStorage.setItem('portfolio', JSON.stringify(portfolioData));
    
    // Refresh display
    loadPortfolio();
    
    // Close modal
    closeAddCoinModal();
    
    // Show success
    alert(`Added ${amount} ${selectedCoin.symbol} to portfolio!`);
}

function viewCoinChart(coin) {
    // Switch to charts page
    showPage('charts');
    
    // Set the coin
    const coinSelect = document.getElementById('chart-coin');
    if (coinSelect) {
        coinSelect.value = coin;
    }
    
    // Load the chart
    setTimeout(() => {
        loadCandlestickChart();
    }, 100);
}

function removeFromPortfolio(coin) {
    if (!confirm(`Remove ${coin} from portfolio?`)) return;
    
    delete portfolioData[coin];
    localStorage.setItem('portfolio', JSON.stringify(portfolioData));
    loadPortfolio();
    
    alert(`${coin} removed from portfolio`);
}

function editPortfolio() {
    alert('Edit: Click on any amount to edit directly!');
}

// ============== TRADING ==============
function placeOrder(type) {
    const coin = document.getElementById('trade-coin').value;
    const amount = document.getElementById('trade-amount').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const action = type === 'BUY' ? 'bought' : 'sold';
    alert(`Successfully ${action} ${amount} USDT worth of ${coin}`);
}

async function calculateRisk() {
    const balance = parseFloat(document.getElementById('calc-balance').value) || 10000;
    const risk = parseFloat(document.getElementById('calc-risk').value) || 2;
    const entry = parseFloat(document.getElementById('calc-entry').value) || 0;
    const stop = parseFloat(document.getElementById('calc-stop').value) || 0;
    
    if (entry === 0 || stop === 0) {
        alert('Please enter Entry Price and Stop Loss');
        return;
    }
    
    const data = await fetchAPI('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance, risk, entry, stop_loss: stop })
    });
    
    if (data) {
        const resultsDiv = document.getElementById('calc-results');
        resultsDiv.classList.remove('hidden');
        resultsDiv.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-gray-400 text-sm">Position Size</p>
                    <p class="text-xl font-bold">$${data.position_size?.toLocaleString() || '0'}</p>
                </div>
                <div>
                    <p class="text-gray-400 text-sm">Risk Amount</p>
                    <p class="text-xl font-bold">$${data.risk_amount?.toLocaleString() || '0'}</p>
                </div>
                <div>
                    <p class="text-gray-400 text-sm">Quantity</p>
                    <p class="text-xl font-bold">${data.quantity?.toFixed(6) || '0'}</p>
                </div>
                <div>
                    <p class="text-gray-400 text-sm">Risk/Reward</p>
                    <p class="text-xl font-bold text-cyan-400">${data.risk_reward || '0'}</p>
                </div>
            </div>
        `;
    }
}

// ============== CHARTS ==============
async function loadChart() {
    const coin = document.getElementById('chart-coin').value;
    const tf = document.getElementById('chart-tf').value;
    
    const candles = await fetchAPI(`/api/candles/${coin}/${tf}`);
    if (!candles || candles.length === 0) {
        alert('Failed to load chart data');
        return;
    }
    
    renderChart(candles, coin);
}

function renderChart(candles, coin) {
    const ctx = document.getElementById('main-chart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const labels = candles.map(c => {
        const date = new Date(c.timestamp);
        return date.toLocaleTimeString();
    });
    
    const data = candles.map(c => c.close);
    
    // Calculate SMA if enabled
    const showSMA = document.getElementById('ind-sma').checked;
    const smaData = showSMA ? calculateSMA(candles.map(c => c.close), 20) : [];
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: coin,
                data: data,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }, ...(showSMA ? [{
                label: 'SMA 20',
                data: smaData,
                borderColor: '#f59e0b',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }] : [])]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#9ca3af',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
                }
            }
        }
    });
}

function calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
    }
    return sma;
}

// ============== SIGNALS ==============
let signalsRefreshInterval = null;

async function loadSignals() {
    console.log('Loading signals...');
    const data = await fetchAPI('/api/signals');
    console.log('Signals data:', data);
    
    if (!data) {
        showNotification('Error', 'Failed to load signals. Check connection.');
        return;
    }
    
    // Check if data has required fields
    if (data.length > 0) {
        console.log('Sample signal:', data[0]);
        console.log('Has entry:', 'entry' in data[0]);
        console.log('Has take_profit:', 'take_profit' in data[0]);
        console.log('Has stop_loss:', 'stop_loss' in data[0]);
    }
    
    const container = document.getElementById('signals-container');
    container.innerHTML = '';
    
    // Add summary header
    const buys = data.filter(s => s.signal.includes('BUY')).length;
    const sells = data.filter(s => s.signal.includes('SELL')).length;
    const holds = data.filter(s => s.signal === 'HOLD').length;
    
    const summary = document.createElement('div');
    summary.className = 'bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4';
    summary.innerHTML = `
        <div class="flex justify-between items-center">
            <h3 class="font-bold">Signals Summary</h3>
            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-400">Last updated: ${new Date().toLocaleTimeString()}</span>
                <div class="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-3">
            <div class="text-center p-3 bg-green-500/20 rounded-lg">
                <p class="text-2xl font-bold text-green-400">${buys}</p>
                <p class="text-sm text-gray-400">BUY</p>
            </div>
            <div class="text-center p-3 bg-red-500/20 rounded-lg">
                <p class="text-2xl font-bold text-red-400">${sells}</p>
                <p class="text-sm text-gray-400">SELL</p>
            </div>
            <div class="text-center p-3 bg-gray-500/20 rounded-lg">
                <p class="text-2xl font-bold text-gray-400">${holds}</p>
                <p class="text-sm text-gray-400">HOLD</p>
            </div>
        </div>
        
        <!-- Auto-refresh info -->
        <div class="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
            <span class="text-xs text-gray-500">⏱️ Auto-refresh: 15s</span>
            <button onclick="toggleAutoRefresh()" id="autorefresh-btn" class="text-xs px-2 py-1 bg-green-600/50 rounded hover:bg-green-600">ON</button>
        </div>
    `;
    container.appendChild(summary);
    
    // Set up auto-refresh
    setupAutoRefresh();
    
    // Add filter buttons
    const filters = document.createElement('div');
    filters.className = 'flex gap-2 mb-4';
    filters.innerHTML = `
        <button onclick="filterSignals('all')" class="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-sm">All</button>
        <button onclick="filterSignals('buy')" class="px-4 py-2 rounded bg-green-600/50 hover:bg-green-600 text-sm">Buy Only</button>
        <button onclick="filterSignals('sell')" class="px-4 py-2 rounded bg-red-600/50 hover:bg-red-600 text-sm">Sell Only</button>
    `;
    container.appendChild(filters);
    
    // Signals grid
    const grid = document.createElement('div');
    grid.id = 'signals-grid';
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    
    for (const signal of data) {
        const card = document.createElement('div');
        card.className = `signal-card bg-gray-800 p-4 rounded-lg border border-gray-700 cursor-pointer hover:border-cyan-500/50 transition`;
        card.dataset.signal = signal.signal.toLowerCase();
        card.dataset.coin = signal.coin;
        card.onclick = () => viewCoinChart(signal.coin);
        
        let badgeClass = 'bg-gray-600';
        if (signal.signal.includes('BUY')) badgeClass = 'bg-green-500/20 text-green-400 border-green-500/30';
        if (signal.signal.includes('SELL')) badgeClass = 'bg-red-500/20 text-red-400 border-red-500/30';
        
        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2">
                    ${getCoinIcon(signal.coin)}
                    <div>
                        <h3 class="font-bold">${signal.coin}</h3>
                        <p class="text-xs text-gray-400">$${formatPrice(signal.price)}</p>
                    </div>
                </div>
                <span class="px-3 py-1 rounded-full text-sm font-bold border ${badgeClass}">${signal.signal}</span>
            </div>
            
            <!-- Signal Details -->
            <div class="bg-gray-900/50 p-3 rounded-lg mb-3">
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                        <p class="text-gray-500">Entry</p>
                        <p class="font-mono font-bold text-yellow-400">$${signal.entry}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Take Profit</p>
                        <p class="font-mono font-bold text-green-400">$${signal.take_profit}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Stop Loss</p>
                        <p class="font-mono font-bold text-red-400">$${signal.stop_loss}</p>
                    </div>
                </div>
                <div class="mt-2 pt-2 border-t border-gray-700 flex justify-between">
                    <span class="text-xs text-gray-500">Risk/Reward: ${signal.risk_reward}</span>
                    <span class="text-xs text-cyan-400">${signal.confidence}% confidence</span>
                </div>
            </div>
            
            <div class="space-y-1">
                <div class="flex justify-between">
                    <span class="text-gray-400 text-sm">Change 24h</span>
                    <span class="${signal.change >= 0 ? 'text-green-400' : 'text-red-400'}">${signal.change >= 0 ? '+' : ''}${signal.change.toFixed(2)}%</span>
                </div>
                <div class="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">
                    📊 ${signal.reason}
                </div>            </div>
        `;
        grid.appendChild(card);
    }
    
    container.appendChild(grid);
    document.getElementById('active-signals').textContent = data.length;
    
    showNotification('Signals Updated', `Loaded ${data.length} signals - ${buys} BUY, ${sells} SELL`);
}

function filterSignals(type) {
    const cards = document.querySelectorAll('.signal-card');
    cards.forEach(card => {
        if (type === 'all') {
            card.classList.remove('hidden');
        } else {
            const signal = card.dataset.signal;
            if (signal.includes(type)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        }
    });
}

async function refreshSignals() {
    const btn = document.querySelector('[onclick="refreshSignals()"]');
    if (btn) {
        btn.innerHTML = '<span class="animate-spin">↻</span> Loading...';
        btn.disabled = true;
    }
    
    await loadSignals();
    
    if (btn) {
        btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Refresh';
        btn.disabled = false;
    }
}

async function refreshSignals() {
    const btn = document.querySelector('[onclick="refreshSignals()"]');
    if (btn) {
        btn.innerHTML = '<span class="animate-spin">↻</span> Loading...';
        btn.disabled = true;
    }
    
    await loadSignals();
    
    if (btn) {
        btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Refresh';
        btn.disabled = false;
    }
}

// Auto-refresh setup
function setupAutoRefresh() {
    // Clear existing interval
    if (signalsRefreshInterval) {
        clearInterval(signalsRefreshInterval);
    }
    
    // Set new interval (15 seconds)
    signalsRefreshInterval = setInterval(() => {
        if (currentPage === 'signals' && document.getElementById('autorefresh-btn')?.textContent === 'ON') {
            loadSignals();
            console.log('Signals auto-refreshed at', new Date().toLocaleTimeString());
        }
    }, 15000);
}

function toggleAutoRefresh() {
    const btn = document.getElementById('autorefresh-btn');
    if (!btn) return;
    
    if (btn.textContent === 'ON') {
        btn.textContent = 'OFF';
        btn.className = 'text-xs px-2 py-1 bg-red-600/50 rounded hover:bg-red-600';
        showNotification('Auto-refresh', 'Disabled');
    } else {
        btn.textContent = 'ON';
        btn.className = 'text-xs px-2 py-1 bg-green-600/50 rounded hover:bg-green-600';
        showNotification('Auto-refresh', 'Enabled (15s)');
    }
}

// ============== STRATEGIES ==============
async function runStrategies() {
    const coin = document.getElementById('strategy-coin').value;
    const tf = document.getElementById('strategy-tf').value;
    
    const container = document.getElementById('strategies-results');
    const loadingEl = document.getElementById('strategies-loading');
    
    // Show loading
    loadingEl.classList.remove('hidden');
    container.classList.add('hidden');
    
    const data = await fetchAPI(`/api/strategies/${coin}/${tf}`);
    
    // Hide loading
    loadingEl.classList.add('hidden');
    container.classList.remove('hidden');
    
    if (!data || data.error) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-red-400 mb-2">⚠️ Analysis Failed</div>
                <div class="text-white/40">${data?.error || 'Unable to fetch data'}</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    // Add Summary Card with detailed recommendation
    const summaryCard = document.createElement('div');
    summaryCard.className = 'glass-card p-6 col-span-full animate-fade-in';
    
    const summary = data.summary || {};
    const signal = summary.signal || 'HOLD';
    const confidence = summary.confidence || 50;
    const entry = summary.entry || data.price || 0;
    const takeProfit = summary.take_profit || summary.target || entry * 1.1;
    const stopLoss = summary.stop_loss || entry * 0.95;
    const riskReward = summary.risk_reward || '1:2';
    
    // Calculate profit and loss
    const potentialProfit = ((takeProfit - entry) / entry * 100).toFixed(1);
    const potentialLoss = ((entry - stopLoss) / entry * 100).toFixed(1);
    
    // Signal color
    let signalClass = 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    let signalIcon = '➡️';
    if (signal === 'STRONG_BUY' || signal === 'BUY') {
        signalClass = 'bg-green-500/20 text-green-400 border-green-500/30';
        signalIcon = '🟢';
    } else if (signal === 'STRONG_SELL' || signal === 'SELL') {
        signalClass = 'bg-red-500/20 text-red-400 border-red-500/30';
        signalIcon = '🔴';
    }
    
    // Generate detailed reasons
    const reasons = [];
    if (data.indicators?.rsi > 70) reasons.push('RSI في منطقة ذروة الشراء (>70)');
    if (data.indicators?.rsi < 30) reasons.push('RSI في منطقة ذروة البيع (<30)');
    if (data.indicators?.macd?.signal === 'BULLISH') reasons.push('MACD إيجابي');
    if (data.indicators?.macd?.signal === 'BEARISH') reasons.push('MACD سلبي');
    if (data.indicators?.volume === 'HIGH') reasons.push('حجم تداول مرتفع');
    if (data.indicators?.bollinger?.position?.includes('ABOVE')) reasons.push('السعر أعلى حدود بولينجر');
    if (data.indicators?.bollinger?.position?.includes('BELOW')) reasons.push('السعر أدنى حدود بولينجر');
    
    const reasonsHtml = reasons.length > 0 
        ? reasons.map(r => `<span class="px-2 py-1 bg-cyan-500/10 rounded text-cyan-400 text-xs">${r}</span>`).join('')
        : '<span class="text-gray-500">لا توجد إشارات قوية حالياً</span>';
    
    summaryCard.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-2xl">
                    📊
                </div>
                <div>
                    <h3 class="font-bold text-xl">التوصية النهائية</h3>
                    <p class="text-sm text-white/40">${coin} / ${tf} - ${new Date().toLocaleString()}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="px-4 py-2 rounded-full text-lg font-bold border ${signalClass}">
                    ${signalIcon} ${signal.replace('_', ' ')}
                </span>
                <span class="text-cyan-400 font-bold">${confidence}% ثقة</span>
            </div>
        </div>
        
        <!-- Trading Plan -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div class="bg-gray-900/50 p-4 rounded-lg text-center">
                <p class="text-gray-400 text-sm mb-1">سعر الدخول</p>
                <p class="text-2xl font-bold text-yellow-400">$${entry.toFixed(4)}</p>
            </div>
            <div class="bg-gray-900/50 p-4 rounded-lg text-center">
                <p class="text-gray-400 text-sm mb-1">الهدف (Take Profit)</p>
                <p class="text-2xl font-bold text-green-400">$${takeProfit.toFixed(4)}</p>
                <p class="text-xs text-green-500">+${potentialProfit}%</p>
            </div>
            <div class="bg-gray-900/50 p-4 rounded-lg text-center">
                <p class="text-gray-400 text-sm mb-1">وقف الخسارة</p>
                <p class="text-2xl font-bold text-red-400">$${stopLoss.toFixed(4)}</p>
                <p class="text-xs text-red-500">-${potentialLoss}%</p>
            </div>
            <div class="bg-gray-900/50 p-4 rounded-lg text-center">
                <p class="text-gray-400 text-sm mb-1">نسبة المخاطرة/المكافأة</p>
                <p class="text-2xl font-bold text-cyan-400">${riskReward}</p>
            </div>
        </div>
        
        <!-- Reasons -->
        <div class="bg-gray-800/50 p-4 rounded-lg">
            <p class="text-sm text-gray-400 mb-2">🎯 الأسباب:</p>
            <div class="flex flex-wrap gap-2">
                ${reasonsHtml}
            </div>
        </div>
        
        <!-- Strategies Consensus -->
        ${data.strategies ? `
        <div class="mt-4 pt-4 border-t border-gray-700">
            <p class="text-sm text-gray-400 mb-2">📈 توافق الاستراتيجيات:</p>
            <div class="flex flex-wrap gap-2">
                ${data.strategies.map(s => `
                    <span class="px-3 py-1 rounded-full text-xs ${s.signal === 'BUY' ? 'bg-green-500/20 text-green-400' : s.signal === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}">
                        ${s.name}: ${s.signal}
                    </span>
                `).join('')}
            </div>
            <p class="text-sm text-cyan-400 mt-2">${data.summary?.strategies_agree || ''}</p>
        </div>
        ` : ''}
    `;
    
    container.appendChild(summaryCard);
    
    // Strategy cards...
    // SMC Card
    const smcCard = createStrategyCard('Smart Money Concepts', 'smc', {
        icon: '🎯',
        color: 'cyan',
        items: [
            { label: 'Order Blocks', value: data.smc?.order_blocks?.length || 0, suffix: 'found' },
            { label: 'Fair Value Gaps', value: data.smc?.fvg?.length || 0, suffix: 'detected' },
            { label: 'Buy Liquidity', value: `$${(data.smc?.liquidity?.buy_side || 0).toFixed(2)}` },
            { label: 'Sell Liquidity', value: `$${(data.smc?.liquidity?.sell_side || 0).toFixed(2)}` }
        ],
        signal: data.smc?.order_blocks?.length > 0 ? 'BULLISH' : 'NEUTRAL'
    });
    container.appendChild(smcCard);
    
    // ICT Card
    const ictCard = createStrategyCard('ICT Strategy', 'ict', {
        icon: '🧠',
        color: 'purple',
        items: [
            { label: 'Market Structure', value: data.ict?.market_structure?.type || 'None' },
            { label: 'Order Block', value: data.ict?.order_block?.type || 'None' },
            { label: 'Session', value: 'London + NY' }
        ],
        signal: data.ict?.market_structure?.signal || 'NEUTRAL'
    });
    container.appendChild(ictCard);
    
    // Wyckoff Card
    const wyckoffCard = createStrategyCard('Wyckoff Method', 'wyckoff', {
        icon: '📊',
        color: 'orange',
        items: [
            { label: 'Phase', value: data.wyckoff?.phase?.phase || 'Unknown' },
            { label: 'Signal', value: data.wyckoff?.phase?.signal || 'WAIT' },
            { label: 'Strength', value: data.wyckoff?.phase?.strength || 'WEAK' },
            { label: 'Spring Test', value: data.wyckoff?.spring?.pattern || 'None' }
        ],
        signal: data.wyckoff?.phase?.signal || 'NEUTRAL'
    });
    container.appendChild(wyckoffCard);
    
    // Patterns Card
    const patterns = [];
    if (data.patterns?.double_top) patterns.push(data.patterns.double_top.pattern);
    if (data.patterns?.double_bottom) patterns.push(data.patterns.double_bottom.pattern);
    if (data.patterns?.candlestick?.length > 0) patterns.push(...data.patterns.candlestick);
    
    const patCard = createStrategyCard('Pattern Recognition', 'patterns', {
        icon: '🔮',
        color: 'pink',
        items: patterns.length > 0 ? patterns.slice(0, 4).map(p => ({ label: 'Pattern', value: p })) : [{ label: 'Status', value: 'No patterns detected' }],
        signal: patterns.length > 0 ? 'ALERT' : 'NEUTRAL'
    });
    container.appendChild(patCard);
    
    // Volume Profile Card
    const volCard = createStrategyCard('Volume Profile', 'volume', {
        icon: '📈',
        color: 'green',
        items: [
            { label: 'POC Price', value: `$${(data.volume_profile?.poc?.poc_price || 0).toFixed(2)}` },
            { label: 'POC Volume', value: `${(data.volume_profile?.poc?.poc_volume || 0).toFixed(0)}` },
            { label: 'Support', value: `$${(data.volume_profile?.poc?.support || 0).toFixed(2)}` },
            { label: 'Resistance', value: `$${(data.volume_profile?.poc?.resistance || 0).toFixed(2)}` }
        ],
        signal: 'ANALYSIS'
    });
    container.appendChild(volCard);
    
    // Whale Card
    const whaleCard = createStrategyCard('Whale Tracker', 'whale', {
        icon: '🐋',
        color: 'blue',
        items: [
            { label: 'Net Flow', value: `$${(data.whale?.net_flow || 0).toFixed(2)}M` },
            { label: 'Sentiment', value: data.whale?.sentiment || 'Neutral' },
            { label: 'Buy Volume', value: `$${(data.whale?.buy_volume || 0).toFixed(2)}M` },
            { label: 'Sell Volume', value: `$${(data.whale?.sell_volume || 0).toFixed(2)}M` }
        ],
        signal: data.whale?.sentiment === 'BULLISH' ? 'BUY' : data.whale?.sentiment === 'BEARISH' ? 'SELL' : 'NEUTRAL'
    });
    container.appendChild(whaleCard);
    
    // Load AI & Sentiment async
    loadAIAndSentiment(coin, container);
}

// Load AI Prediction and Sentiment
async function loadAIAndSentiment(coin, container) {
    console.log('Loading AI & Sentiment for', coin);
    
    // AI Prediction Card
    try {
        const aiData = await getAIPrediction(coin);
        console.log('AI Data:', aiData);
        if (aiData) {
            const aiCard = createStrategyCard('AI Prediction', 'ai', {
                icon: '🤖',
                color: 'purple',
                items: [
                    { label: 'Direction', value: aiData.direction },
                    { label: 'Confidence', value: `${aiData.confidence}%` },
                    { label: 'Predicted Change', value: `${aiData.predictedChange > 0 ? '+' : ''}${aiData.predictedChange}%` },
                    { label: 'Target Price', value: `$${aiData.predictedPrice.toFixed(4)}` }
                ],
                signal: aiData.direction === 'UP' ? 'BUY' : aiData.direction === 'DOWN' ? 'SELL' : 'NEUTRAL'
            });
            container.appendChild(aiCard);
            console.log('AI Card added');
        }
    } catch (e) {
        console.error('AI Error:', e);
    }
    
    // Social Sentiment Card
    try {
        const sentimentData = await getSocialSentiment(coin);
        console.log('Sentiment Data:', sentimentData);
        if (sentimentData && !sentimentData.error) {
            const sentimentCard = createStrategyCard('Social Sentiment', 'sentiment', {
                icon: sentimentData.emoji || '📊',
                color: sentimentData.label?.includes('BULL') ? 'green' : sentimentData.label?.includes('BEAR') ? 'red' : 'gray',
                items: [
                    { label: 'Score', value: `${sentimentData.score > 0 ? '+' : ''}${sentimentData.score}` },
                    { label: 'Label', value: sentimentData.label },
                    { label: 'Mentions', value: sentimentData.mentions?.toLocaleString() },
                    { label: 'Volume', value: `$${((sentimentData.volume || 0) / 1e6).toFixed(2)}M` }
                ],
                signal: sentimentData.label === 'VERY_BULLISH' ? 'BUY' : sentimentData.label === 'VERY_BEARISH' ? 'SELL' : 'NEUTRAL'
            });
            container.appendChild(sentimentCard);
            console.log('Sentiment Card added');
        } else {
            console.log('Sentiment Error:', sentimentData?.error || 'No data');
        }
    } catch (e) {
        console.error('Sentiment Error:', e);
    }
}

function createStrategyCard(title, type, config) {
    const card = document.createElement('div');
    card.className = 'glass-card p-6 animate-fade-in';
    card.style.animationDelay = `${Math.random() * 0.3}s`;
    
    const signalColors = {
        'BUY': 'bg-green-500/20 text-green-400 border-green-500/30',
        'SELL': 'bg-red-500/20 text-red-400 border-red-500/30',
        'BULLISH': 'bg-green-500/20 text-green-400 border-green-500/30',
        'BEARISH': 'bg-red-500/20 text-red-400 border-red-500/30',
        'ALERT': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'ANALYSIS': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        'NEUTRAL': 'bg-white/10 text-white/60 border-white/20'
    };
    
    const signalClass = signalColors[config.signal] || signalColors['NEUTRAL'];
    
    let itemsHtml = '';
    if (Array.isArray(config.items)) {
        itemsHtml = config.items.map(item => `
            <div class="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span class="text-white/40 text-sm">${item.label}</span>
                <span class="text-white font-mono">${typeof item.value === 'number' && item.suffix ? `${item.value} ${item.suffix}` : item.value}</span>
            </div>
        `).join('');
    }
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-${config.color}-500/20 flex items-center justify-center text-xl">
                    ${config.icon}
                </div>
                <div>
                    <h3 class="font-bold text-white">${title}</h3>
                    <p class="text-xs text-white/40">${type.toUpperCase()} Analysis</p>
                </div>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-bold border ${signalClass}">
                ${config.signal}
            </span>
        </div>
        <div class="space-y-1">
            ${itemsHtml}
        </div>
    `;
    
    return card;
}

// ============== CANDLESTICK CHART ==============
let candlestickChart = null;

// عملات لا تحتوي على USDT في Binance - نعرض رسالة توضيحية
const unsupportedCoins = ['ATH', 'ZBT', 'VIRTUAL', 'SYRUP', 'ZETA', 'W', 'TRAC', 'KTA', 'BIO', 'KO'];

async function loadCandlestickChart() {
    const container = document.getElementById('candlestick-chart');
    if (!container) return;
    
    // Clear previous
    container.innerHTML = '';
    
    const coin = document.getElementById('chart-coin')?.value || 'BTC';
    const tf = document.getElementById('chart-tf')?.value || '1h';
    
    // Check if coin is unsupported
    if (unsupportedCoins.includes(coin)) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center p-8">
                <div class="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-bold mb-2">${coin} - Chart Data Unavailable</h3>
                <p class="text-gray-400 mb-4">
                    This coin is not yet supported on Binance Spot.
                    Try viewing charts for major coins like BTC, ETH, SOL, etc.
                </p>
                <div class="flex gap-2">
                    <button onclick="document.getElementById('chart-coin').value='BTC'; loadCandlestickChart();" 
                            class="bg-cyan-600 px-4 py-2 rounded hover:bg-cyan-700">View BTC</button>
                    <button onclick="document.getElementById('chart-coin').value='ETH'; loadCandlestickChart();" 
                            class="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">View ETH</button>
                </div>
            </div>
        `;
        return;
    }
    
    console.log('Loading candles for', coin, tf);
    
    const data = await fetchAPI(`/api/candles/${coin}/${tf}`);
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center p-8">
                <div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-bold mb-2">Failed to Load Chart Data</h3>
                <p class="text-gray-400">Please try again or select a different coin.</p>
            </div>
        `;
        return;
    }
    
    // Create chart container
    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.height = '100%';
    container.appendChild(chartDiv);
    
    // Create chart
    const chart = LightweightCharts.createChart(chartDiv, {
        layout: {
            background: { color: 'transparent' },
            textColor: '#d1d5db',
        },
        grid: {
            vertLines: { color: '#374151' },
            horzLines: { color: '#374151' },
        },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#374151' },
        timeScale: { borderColor: '#374151', timeVisible: true },
    });
    
    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
    });
    
    // Format data
    const chartData = data.map(d => ({
        time: d.timestamp / 1000,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close
    }));
    
    candleSeries.setData(chartData);
    chart.timeScale().fitContent();
    
    candlestickChart = chart;
    
    // Add info overlay
    const infoDiv = document.createElement('div');
    infoDiv.className = 'absolute top-2 left-2 bg-gray-800/90 p-2 rounded text-xs';
    infoDiv.innerHTML = `
        <span class="font-bold text-cyan-400">${coin}</span>
        <span class="text-gray-400 mx-2">${tf.toUpperCase()}</span>
        <span class="text-green-400">● Live</span>
    `;
    container.style.position = 'relative';
    container.appendChild(infoDiv);
}

// ============== SETTINGS ==============
function saveSettings() {
    alert('Settings saved successfully!');
}

function resetSettings() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.id !== 'toggle-whale') cb.checked = true;
    });
    alert('Settings reset to defaults');
}

// ============== BACKTESTING ==============
async function runBacktest() {
    const coin = document.getElementById('backtest-coin')?.value || 'BTC';
    const strategy = document.getElementById('backtest-strategy')?.value || 'rsi';
    const days = parseInt(document.getElementById('backtest-days')?.value || 30);
    const balance = parseFloat(document.getElementById('backtest-balance')?.value || 10000);
    
    const resultContainer = document.getElementById('backtest-results');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="text-center p-8"><div class="spinner-glass"></div><p class="mt-4 text-gray-400">Running backtest...</p></div>';
    }
    
    try {
        const response = await fetch('/api/backtest', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({coin, strategy, days, balance})
        });
        
        const data = await response.json();
        
        if (data.error) {
            if (resultContainer) {
                resultContainer.innerHTML = `<div class="text-center p-8 text-red-400">
                        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p>${data.error}</p>
                    </div>`;
            }
            return;
        }
        
        renderBacktestResults(data);
    } catch (error) {
        console.error('Backtest error:', error);
        if (resultContainer) {
            resultContainer.innerHTML = '<div class="text-center p-8 text-red-400">Failed to run backtest</div>';
        }
    }
}

function renderBacktestResults(data) {
    const container = document.getElementById('backtest-results');
    if (!container) return;
    
    const summary = data.summary;
    const pnlClass = summary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400';
    const pnlIcon = summary.total_pnl >= 0 ? '↑' : '↓';
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Summary Card -->
            <div class="bg-gray-700 p-6 rounded-lg">
                <h4 class="text-lg font-bold mb-4">Backtest Results: ${data.coin} / ${data.strategy.toUpperCase()}</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center">
                        <p class="text-gray-400 text-sm">Initial Balance</p>
                        <p class="text-xl font-bold">$${summary.initial_balance.toLocaleString()}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-400 text-sm">Final Balance</p>
                        <p class="text-xl font-bold ${pnlClass}">$${summary.final_balance.toLocaleString()}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-400 text-sm">Total P&L</p>
                        <p class="text-xl font-bold ${pnlClass}">${pnlIcon} $${Math.abs(summary.total_pnl).toLocaleString()} (${summary.pnl_percent}%)</p>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-400 text-sm">Win Rate</p>
                        <p class="text-xl font-bold text-cyan-400">${summary.win_rate}%</p>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-600">
                    <div class="flex justify-center gap-8">
                        <span class="text-green-400">✓ Wins: ${summary.wins}</span>
                        <span class="text-red-400">✗ Losses: ${summary.losses}</span>
                        <span class="text-gray-400">Total Trades: ${summary.total_trades}</span>
                    </div>
                </div>
            </div>
            
            <!-- Trades Table -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-700">
                        <tr>
                            <th class="p-3 text-left">Type</th>
                            <th class="p-3 text-right">Price</th>
                            <th class="p-3 text-right">Balance</th>
                            <th class="p-3 text-right">P&L</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.trades.filter(t => t.type === 'SELL').map(t => {
                            const pnlClass = (t.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400';
                            return `
                                <tr class="border-b border-gray-700">
                                    <td class="p-3">
                                        <span class="px-2 py-1 rounded text-sm ${t.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                                            ${t.type}
                                        </span>
                                    </td>
                                    <td class="p-3 text-right">$${t.price.toLocaleString()}</td>
                                    <td class="p-3 text-right">$${t.balance.toLocaleString()}</td>
                                    <td class="p-3 text-right ${pnlClass}">${t.pnl >= 0 ? '+' : ''}$${t.pnl ? t.pnl.toFixed(2) : '0.00'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============== SENTIMENT ANALYSIS ==============
async function loadSentiment(coin) {
    const container = document.getElementById('sentiment-container');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center p-4"><div class="spinner-glass mx-auto"></div></div>';
    
    const data = await fetchAPI(`/api/sentiment/${coin}`);
    if (!data || data.error) {
        container.innerHTML = '<p class="text-gray-400 text-center">Sentiment data unavailable</p>';
        return;
    }
    
    const scoreClass = data.score >= 50 ? 'text-green-400' : 
                      data.score >= 20 ? 'text-green-300' :
                      data.score >= -20 ? 'text-gray-400' :
                      data.score >= -50 ? 'text-red-300' : 'text-red-400';
    
    const barColor = data.score >= 50 ? 'bg-green-500' : 
                     data.score >= 20 ? 'bg-green-400' :
                     data.score >= -20 ? 'bg-gray-500' :
                     data.score >= -50 ? 'bg-red-400' : 'bg-red-500';
    
    const barWidth = Math.abs(data.score); // 0-100
    
    container.innerHTML = `
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h4 class="font-bold">Social Sentiment ${data.emoji}</h4>
                    <p class="text-sm text-gray-400">${data.mentions.toLocaleString()} mentions</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold ${scoreClass}">${data.score}</p>
                    <p class="text-sm ${scoreClass}">${data.label}</p>
                </div>
            </div>
            
            <!-- Sentiment Bar -->
            <div class="relative h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
                <div class="absolute left-0 top-0 bottom-0 ${data.score >= 0 ? barColor : 'bg-gray-600'}" 
                     style="width: ${data.score >= 0 ? barWidth : 0}%"></div>
                <div class="absolute right-0 top-0 bottom-0 ${data.score < 0 ? barColor : 'bg-gray-600'}" 
                     style="width: ${data.score < 0 ? barWidth : 0}%"></div>
                <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50"></div>
            </div>
            
            <!-- Breakdown -->
            <div class="grid grid-cols-3 gap-2 text-center text-sm">
                <div class="p-2 bg-green-500/20 rounded">
                    <p class="text-green-400">${data.last_24h.positive.toLocaleString()}</p>
                    <p class="text-gray-400">Positive 😊</p>
                </div>
                <div class="p-2 bg-gray-500/20 rounded">
                    <p class="text-gray-400">${data.last_24h.neutral.toLocaleString()}</p>
                    <p class="text-gray-400">Neutral 😐</p>
                </div>
                <div class="p-2 bg-red-500/20 rounded">
                    <p class="text-red-400">${data.last_24h.negative.toLocaleString()}</p>
                    <p class="text-gray-400">Negative 😞</p>
                </div>
            </div>
            
            <!-- Trending Keywords -->
            <div class="mt-4 pt-4 border-t border-gray-700">
                <p class="text-sm text-gray-400 mb-2">Trending:</p>
                <div class="flex flex-wrap gap-2">
                    ${data.trending_keywords.map(kw => `
                        <span class="px-2 py-1 bg-gray-700 rounded text-xs">#${kw}</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function exportReport(format) {
    const data = {
        portfolio: portfolioData,
        prices: pricesData,
        date: new Date().toISOString(),
        user: localStorage.getItem('profile_name') || 'User'
    };
    
    if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qaboot-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        showNotification('Export Complete', 'Portfolio exported as JSON');
    } else if (format === 'csv') {
        // Generate CSV
        let csv = 'Coin,Amount,Price,Value,Change%\n';
        for (const [coin, amount] of Object.entries(portfolioData)) {
            if (pricesData[coin]) {
                const price = pricesData[coin].price;
                const value = amount * price;
                const change = pricesData[coin].change;
                csv += `${coin},${amount},${price},${value},${change}\n`;
            }
        }
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qaboot-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        showNotification('Export Complete', 'Portfolio exported as CSV');
    }
}

// ============== INITIALIZATION ==============
document.addEventListener('DOMContentLoaded', function() {
    console.log('QABOOT V4 PRO - Initializing...');
    
    try {
        // Initialize Paper Trading
        initPaperTrading();
        
        // Load initial data after short delay to ensure DOM is ready
        setTimeout(() => {
            loadPrices();
            loadPortfolio();
        }, 500);
        
        // Auto-refresh prices every 30 seconds
        setInterval(() => {
            if (currentPage === 'dashboard') loadPrices();
        }, 30000);
        
        // Load candlestick chart if on charts page
        setTimeout(() => {
            if (currentPage === 'charts') {
                loadCandlestickChart();
            }
        }, 1000);
        
        console.log('Initialization complete');
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

// ============== PRICE ALERTS ==============
let activeAlerts = JSON.parse(localStorage.getItem('price_alerts')) || [];

function openAlertsModal() {
    document.getElementById('alerts-modal').classList.remove('hidden');
    renderAlertsList();
}

function closeAlertsModal() {
    document.getElementById('alerts-modal').classList.add('hidden');
}

function renderAlertsList() {
    const container = document.getElementById('active-alerts-list');
    
    if (activeAlerts.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">No active alerts</div>';
        return;
    }
    
    container.innerHTML = activeAlerts.map((alert, index) => `
        <div class="flex items-center justify-between p-3 bg-gray-700 rounded">
            <div>
                <span class="font-bold">${alert.coin}</span>
                <span class="text-gray-400 mx-2">${getConditionText(alert.condition)}</span>
                <span class="text-cyan-400">$${alert.target}</span>
            </div>
            <button onclick="removeAlert(${index})" class="text-red-400 hover:text-red-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `).join('');
    
    updateAlertsBadge();
}

function getConditionText(condition) {
    const texts = {
        'above': '>',
        'below': '<',
        'up': '↑',
        'down': '↓'
    };
    return texts[condition] || condition;
}

function createAlert() {
    const coin = document.getElementById('alert-coin').value;
    const condition = document.getElementById('alert-condition').value;
    const target = parseFloat(document.getElementById('alert-target').value);
    
    if (!target || target <= 0) {
        alert('Please enter a valid target value');
        return;
    }
    
    const alert = {
        id: Date.now(),
        coin,
        condition,
        target,
        created: new Date().toISOString(),
        triggered: false
    };
    
    activeAlerts.push(alert);
    localStorage.setItem('price_alerts', JSON.stringify(activeAlerts));
    
    renderAlertsList();
    document.getElementById('alert-target').value = '';
    
    showNotification('Alert Created', `Alert set for ${coin} ${getConditionText(condition)} $${target}`);
}

function removeAlert(index) {
    activeAlerts.splice(index, 1);
    localStorage.setItem('price_alerts', JSON.stringify(activeAlerts));
    renderAlertsList();
}

function updateAlertsBadge() {
    const badge = document.getElementById('alerts-badge');
    const count = activeAlerts.filter(a => !a.triggered).length;
    
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function checkAlerts() {
    if (!pricesData || activeAlerts.length === 0) return;
    
    activeAlerts.forEach(alert => {
        if (alert.triggered || !pricesData[alert.coin]) return;
        
        const currentPrice = pricesData[alert.coin].price;
        let triggered = false;
        
        switch (alert.condition) {
            case 'above':
                triggered = currentPrice >= alert.target;
                break;
            case 'below':
                triggered = currentPrice <= alert.target;
                break;
            case 'up':
                // Percentage increase from creation
                triggered = pricesData[alert.coin].change >= alert.target;
                break;
            case 'down':
                triggered = pricesData[alert.coin].change <= -alert.target;
                break;
        }
        
        if (triggered) {
            alert.triggered = true;
            localStorage.setItem('price_alerts', JSON.stringify(activeAlerts));
            
            showNotification(
                '🚨 Price Alert!',
                `${alert.coin} is now $${currentPrice.toLocaleString()} (${getConditionText(alert.condition)} $${alert.target})`
            );
            
            // Play sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGFY\u003c/span>hcwA');
            audio.play().catch(() => {});
        }
    });
    
    updateAlertsBadge();
}

function showNotification(title, message) {
    const toast = document.getElementById('notification-toast');
    if (!toast) return;
    
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-message').textContent = message;
    
    toast.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const toast = document.getElementById('notification-toast');
    if (toast) toast.classList.add('hidden');
}

// Check alerts every 10 seconds
setInterval(checkAlerts, 10000);

// Update badge on load
updateAlertsBadge();

// ============== THEME MANAGEMENT ==============
const currentTheme = localStorage.getItem('theme') || 'dark';

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButtons();
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeButtons();
}

function updateThemeButtons() {
    const darkBtn = document.getElementById('theme-dark');
    const lightBtn = document.getElementById('theme-light');
    
    if (!darkBtn || !lightBtn) return;
    
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    
    if (current === 'dark') {
        darkBtn.className = 'flex items-center gap-2 px-4 py-2 rounded bg-cyan-600';
        lightBtn.className = 'flex items-center gap-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600';
    } else {
        darkBtn.className = 'flex items-center gap-2 px-4 py-2 rounded bg-gray-700 hover:bg-gray-600';
        lightBtn.className = 'flex items-center gap-2 px-4 py-2 rounded bg-cyan-600';
    }
}

// Initialize theme on load
initTheme();

// ============== PROFILE ==============
let currentCurrency = localStorage.getItem('currency') || 'USD';

// Coin colors for icons (when images not available)
const coinColors = {
    'BTC': '#FFD700', 'ETH': '#627EEA', 'SOL': '#14F195',
    'USDT': '#26A17B', 'BNB': '#F3BA2F', 'XRP': '#23292F',
    'ADA': '#0033AD', 'DOGE': '#C2A633', 'DOT': '#E6007A',
    'LINK': '#2A5ADA', 'UNI': '#FF007A', 'LTC': '#BFBBBB',
    'ATOM': '#2E3148', 'VET': '#15BDFF', 'TRX': '#FF060A',
    'SHIB': '#F00500', 'AAVE': '#B6509E', 'GRT': '#6747ED',
    'SUSHI': '#FA52A0', 'COMP': '#00D395', 'MKR': '#1AAB9B',
    'YFI': '#006AE3', 'CRV': '#FF0000', '1INCH': '#1C324F',
    'ENS': '#5298FF', 'LDO': '#00A3FF', 'OP': '#FF0420',
    'ARB': '#28A0F0', 'PEPE': '#4C9A2A', 'FLOKI': '#C1210B',
    'AVAX': '#E84142', 'NEAR': '#00C08B', 'FET': '#1F3C88',
    'POL': '#8247E5', 'TAO': '#FFFFFF', 'ZBT': '#FF6B35',
    'VIRTUAL': '#00D4AA', 'STX': '#5546FF', 'SEI': '#9A5CFF',
    'KAS': '#4F46E5', 'SYRUP': '#F59E0B', 'ZETA': '#10B981',
    'W': '#3B82F6', 'TRAC': '#FF4081', 'KTA': '#8B5CF6',
    'ONDO': '#14B8A6', 'SUI': '#06B6D4', 'BIO': '#22C55E',
    'KO': '#EF4444', 'ATH': '#A855F7'
};

function getCoinLogo(coin) {
    // Return CoinGecko image URL
    const coinId = {
        'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'USDT': 'tether',
        'TAO': 'bittensor', 'XRP': 'ripple', 'ADA': 'cardano', 'ATH': 'aethir',
        'NEAR': 'near', 'FET': 'fetch-ai', 'AVAX': 'avalanche-2', 
        'DOT': 'polkadot', 'LINK': 'chainlink', 'BNB': 'binancecoin',
        'DOGE': 'dogecoin', 'UNI': 'uniswap', 'LTC': 'litecoin'
    }[coin] || coin.toLowerCase();
    
    return `https://api.coingecko.com/api/v3/coins/${coinId}/image`;
}

function getCoinIcon(coin) {
    // Use colored circles with coin letters - no external images
    const color = coinColors[coin] || '#00d4ff';
    return `
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" 
             style="background: ${color}; min-width: 32px;">
            ${coin.slice(0, 2)}
        </div>
    `;
}

function openProfileModal() {
    document.getElementById('profile-modal').classList.remove('hidden');
    document.getElementById('profile-currency').value = currentCurrency;
    updateProfilePortfolio();
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.add('hidden');
}

function saveProfile() {
    const name = document.getElementById('profile-name').value;
    currentCurrency = document.getElementById('profile-currency').value;
    
    localStorage.setItem('profile_name', name);
    localStorage.setItem('currency', currentCurrency);
    
    alert('Profile saved! Currency: ' + currentCurrency);
    closeProfileModal();
    
    // Reload data with new currency
    loadPrices();
}

function changeCurrency() {
    currentCurrency = document.getElementById('profile-currency').value;
    updateProfilePortfolio();
}

function updateProfilePortfolio() {
    const display = document.getElementById('profile-portfolio-value');
    if (!display) return;
    
    let total = 0;
    for (const [coin, amount] of Object.entries(portfolioData)) {
        if (pricesData[coin]) {
            total += amount * pricesData[coin].price;
        }
    }
    
    if (currentCurrency === 'SAR') {
        total = total * 3.75;
        display.textContent = `${total.toLocaleString()} ريال`;
    } else {
        display.textContent = `$${total.toLocaleString()}`;
    }
}

// Format price based on value
function formatPrice(price) {
    if (price < 0.00001) {
        return price.toExponential(4);
    } else if (price < 0.01) {
        return price.toFixed(8);
    } else if (price < 1) {
        return price.toFixed(6);
    } else if (price < 1000) {
        return price.toFixed(2);
    } else {
        return price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }
}

// Get coin logo from CoinGecko
function getCoinLogo(coin) {
    const coinIds = {
        'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'USDT': 'tether',
        'TAO': 'bittensor', 'XRP': 'ripple', 'ADA': 'cardano', 'ATH': 'aethir',
        'NEAR': 'near', 'FET': 'fetch-ai', 'AVAX': 'avalanche-2', 
        'DOT': 'polkadot', 'LINK': 'chainlink', 'BNB': 'binancecoin',
        'DOGE': 'dogecoin', 'UNI': 'uniswap', 'LTC': 'litecoin',
        'ATOM': 'cosmos', 'VET': 'vechain', 'TRX': 'tron', 'SHIB': 'shiba-inu',
        'AAVE': 'aave', 'GRT': 'the-graph', 'SUSHI': 'sushi', 'COMP': 'compound-governance-token',
        'MKR': 'maker', 'YFI': 'yearn-finance', 'CRV': 'curve-dao-token', '1INCH': '1inch',
        'ENS': 'ethereum-name-service', 'LDO': 'lido-dao', 'OP': 'optimism', 'ARB': 'arbitrum',
        'PEPE': 'pepe', 'FLOKI': 'floki'
    };
    
    const coinId = coinIds[coin] || coin.toLowerCase();
    return `https://assets.coincap.io/assets/icons/${coin.toLowerCase()}@2x.png`;
}

// Get coin icon (image with fallback)
function getCoinIcon(coin) {
    return `
        <img src="${getCoinLogo(coin)}" 
             alt="${coin}" 
             class="w-8 h-8 rounded-full"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs hidden" 
             style="background: ${getCoinColor(coin)};">
            ${coin.slice(0, 2)}
        </div>
    `;
}

// Get coin color for fallback
function getCoinColor(coin) {
    const colors = {
        'BTC': '#F7931A', 'ETH': '#627EEA', 'SOL': '#00FFA3', 'USDT': '#26A17B',
        'TAO': '#00B4D8', 'XRP': '#23292F', 'ADA': '#0033AD', 'ATH': '#FF6B6B',
        'NEAR': '#00C08B', 'FET': '#3B82F6', 'ZBT': '#F59E0B', 'VIRTUAL': '#8B5CF6',
        'AVAX': '#E84142', 'STX': '#F7931A', 'SEI': '#FF6B6B', 'KAS': '#22C55E',
        'SYRUP': '#F59E0B', 'ZETA': '#3B82F6', 'W': '#8B5CF6', 'TRAC': '#22C55E',
        'KTA': '#FF6B6B', 'ONDO': '#3B82F6', 'SUI': '#00C08B', 'BIO': '#22C55E',
        'KO': '#F59E0B', 'POL': '#8247E5', 'BNB': '#F0B90B', 'DOGE': '#C2A633',
        'DOT': '#E6007A', 'LINK': '#2A5ADA', 'UNI': '#FF007A', 'LTC': '#BFBBBB'
    };
    return colors[coin] || '#00d4ff';
}

// ============== MOBILE MENU ==============
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar-glass');
    sidebar.classList.toggle('mobile-open');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const sidebar = document.querySelector('.sidebar-glass');
    const toggle = document.querySelector('[onclick="toggleMobileMenu()"]');
    
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && e.target !== toggle) {
            sidebar.classList.remove('mobile-open');
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const sidebar = document.querySelector('.sidebar-glass');
    if (window.innerWidth >= 1024) {
        sidebar.classList.remove('mobile-open');
    }
});

// ============== MULTI-LANGUAGE ==============
let currentLanguage = localStorage.getItem('language') || 'en';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update UI
    const enBtn = document.getElementById('lang-en');
    const arBtn = document.getElementById('lang-ar');
    if (enBtn) {
        enBtn.className = lang === 'en' 
            ? 'flex-1 py-2 rounded border border-cyan-600 bg-cyan-600/20' 
            : 'flex-1 py-2 rounded border border-gray-600 hover:bg-gray-600/20';
    }
    if (arBtn) {
        arBtn.className = lang === 'ar' 
            ? 'flex-1 py-2 rounded border border-cyan-600 bg-cyan-600/20' 
            : 'flex-1 py-2 rounded border border-gray-600 hover:bg-gray-600/20';
    }
    
    showNotification('Language Changed', lang === 'ar' ? 'تم تغيير اللغة' : 'Language updated');
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    setLanguage(currentLanguage);
});

// ============== AI PREDICTIONS ==============
async function getAIPrediction(coin) {
    try {
        // REAL AI prediction based on technical indicators
        const prices = await fetchAPI(`/api/prices`);
        const strategies = await fetchAPI(`/api/strategies/${coin}/1h`);
        
        if (!prices || !prices[coin]) return null;
        
        const price = prices[coin].price;
        const change = prices[coin].change;
        
        // Calculate prediction based on REAL data (no randomness)
        let predictedChange = 0;
        let confidence = 50;
        let factors = [];
        
        // Factor 1: Current trend
        if (change > 5) {
            predictedChange += 3;
            confidence += 10;
            factors.push('Strong uptrend momentum');
        } else if (change > 2) {
            predictedChange += 1.5;
            confidence += 5;
            factors.push('Positive momentum');
        } else if (change < -5) {
            predictedChange -= 3;
            confidence += 10;
            factors.push('Strong downtrend');
        } else if (change < -2) {
            predictedChange -= 1.5;
            confidence += 5;
            factors.push('Negative momentum');
        }
        
        // Factor 2: Strategy signals
        if (strategies && strategies.summary) {
            const signal = strategies.summary.signal;
            if (signal === 'BUY' || signal === 'STRONG_BUY') {
                predictedChange += 5;
                confidence += 15;
                factors.push('Strategy consensus: BUY');
            } else if (signal === 'SELL' || signal === 'STRONG_SELL') {
                predictedChange -= 5;
                confidence += 15;
                factors.push('Strategy consensus: SELL');
            }
            
            // RSI factor
            const rsi = strategies.summary.rsi;
            if (rsi < 30) {
                predictedChange += 2;
                factors.push('RSI oversold (<30)');
            } else if (rsi > 70) {
                predictedChange -= 2;
                factors.push('RSI overbought (>70)');
            }
        }
        
        // Factor 3: Volume analysis
        const volume = prices[coin].volume;
        const avgVolume = prices[coin].avg_volume || volume;
        if (volume > avgVolume * 1.5) {
            predictedChange *= 1.2;  // Amplify prediction on high volume
            confidence += 5;
            factors.push('High volume confirmation');
        }
        
        // Clamp values
        predictedChange = Math.max(-15, Math.min(15, predictedChange));
        confidence = Math.min(95, confidence);
        
        return {
            coin: coin,
            currentPrice: price,
            predictedPrice: price * (1 + predictedChange/100),
            predictedChange: predictedChange.toFixed(2),
            confidence: confidence,
            direction: predictedChange > 0 ? 'UP' : predictedChange < 0 ? 'DOWN' : 'NEUTRAL',
            timeframe: '24h',
            factors: factors,
            updated: new Date().toISOString()
        };
    } catch (e) {
        console.error('AI Prediction error:', e);
        return null;
    }
}

// ============== PORTFOLIO OPTIMIZATION ==============
async function analyzePortfolio() {
    const prices = await fetchAPI('/api/prices');
    if (!prices) return null;
    
    const totalValue = Object.entries(portfolioData).reduce((sum, [coin, amount]) => {
        return sum + (amount * (prices[coin]?.price || 0));
    }, 0);
    
    const recommendations = [];
    
    for (const [coin, amount] of Object.entries(portfolioData)) {
        const value = amount * (prices[coin]?.price || 0);
        const percent = (value / totalValue) * 100;
        const change = prices[coin]?.change || 0;
        
        if (percent > 50) {
            recommendations.push({
                coin, action: 'REDUCE',
                reason: `Over-concentrated (${percent.toFixed(1)}%)`,
                severity: 'HIGH'
            });
        }
        if (change > 20) {
            recommendations.push({
                coin, action: 'TAKE_PROFIT',
                reason: `Up ${change.toFixed(1)}% - consider profits`,
                severity: 'MEDIUM'
            });
        }
        if (change < -15) {
            recommendations.push({
                coin, action: 'REVIEW',
                reason: `Down ${Math.abs(change).toFixed(1)}%`,
                severity: 'MEDIUM'
            });
        }
    }
    
    return { totalValue, recommendations };
}

// ============== SOCIAL SENTIMENT ==============
async function getSocialSentiment(coin) {
    try {
        const data = await fetchAPI(`/api/sentiment/${coin}`);
        return data;
    } catch (e) {
        console.error('Sentiment error:', e);
        return null;
    }
}

// ============== PLACEHOLDER FUNCTIONS ==============
function initStrategiesPage() {
    // Initialize strategies page
    console.log('Strategies page initialized');
}

function initBacktestPage() {
    // Initialize backtest page
    console.log('Backtest page initialized');
}

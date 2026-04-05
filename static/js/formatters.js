// ============== FORMATTERS ==============
function formatPrice(price) {
    if (price === 0 || price === undefined || price === null) return '0.00';
    if (price < 0.0001) return price.toExponential(4);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatVolume(volume) {
    if (!volume || volume === 0) return '0';
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
    return volume.toFixed(2);
}

function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toLocaleString('en-US');
}
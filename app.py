"""
QABOOT V4 WEB - Professional Trading Dashboard
FAL Army - Web Application
"""

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
from datetime import datetime
import requests
import json
import random
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'qaboot-v4-pro-secret'
socketio = SocketIO(app, cors_allowed_origins="*")

# ============== BINANCE API ==============
class BinanceAPI:
    BASE_URL = 'https://api.binance.com'
    
    def __init__(self):
        self.session = requests.Session()
    
    def get_all_prices(self):
        """جميع أسعار العملات"""
        try:
            response = self.session.get(f'{self.BASE_URL}/api/v3/ticker/24hr', timeout=10)
            data = response.json()
            
            prices = {}
            for item in data:
                symbol = item['symbol']
                if symbol.endswith('USDT'):
                    coin = symbol.replace('USDT', '')
                    prices[coin] = {
                        'price': float(item['lastPrice']),
                        'change': float(item['priceChangePercent']),
                        'high': float(item['highPrice']),
                        'low': float(item['lowPrice']),
                        'volume': float(item['volume'])
                    }
            return prices
        except Exception as e:
            print(f'Error: {e}')
            return {}
    
    def get_klines(self, symbol, interval='1h', limit=100):
        """بيانات الشموع"""
        try:
            params = {'symbol': f'{symbol}USDT', 'interval': interval, 'limit': limit}
            response = self.session.get(f'{self.BASE_URL}/api/v3/klines', params=params, timeout=10)
            data = response.json()
            
            candles = []
            for item in data:
                candles.append({
                    'timestamp': item[0],
                    'open': float(item[1]),
                    'high': float(item[2]),
                    'low': float(item[3]),
                    'close': float(item[4]),
                    'volume': float(item[5])
                })
            return candles
        except Exception as e:
            print(f'Error: {e}')
            return []

# ============== SMC ANALYZER ==============
class SMCAnalyzer:
    """Smart Money Concepts"""
    
    @staticmethod
    def detect_order_blocks(candles):
        """Order Blocks"""
        obs = []
        for i in range(3, len(candles) - 1):
            prev = candles[i-1]
            curr = candles[i]
            
            if curr['close'] < prev['open'] and prev['close'] > prev['open']:
                obs.append({'type': 'BULLISH OB', 'price': prev['open'], 'index': i})
            elif curr['close'] > prev['open'] and prev['close'] < prev['open']:
                obs.append({'type': 'BEARISH OB', 'price': prev['close'], 'index': i})
        
        return obs[-5:] if len(obs) > 5 else obs
    
    @staticmethod
    def detect_fvg(candles):
        """Fair Value Gaps"""
        fvgs = []
        for i in range(2, len(candles)):
            c1, c2, c3 = candles[i-2], candles[i-1], candles[i]
            
            if c3['low'] > c1['high']:
                fvgs.append({'type': 'BULLISH FVG', 'top': c3['open'], 'bottom': c1['close']})
            elif c3['high'] < c1['low']:
                fvgs.append({'type': 'BEARISH FVG', 'top': c1['close'], 'bottom': c3['open']})
        
        return fvgs[-3:] if len(fvgs) > 3 else fvgs
    
    @staticmethod
    def liquidity_levels(candles):
        """مستويات السيولة"""
        highs = [c['high'] for c in candles[-20:]]
        lows = [c['low'] for c in candles[-20:]]
        return {
            'buy_side': min(lows),
            'sell_side': max(highs)
        }

# ============== ICT STRATEGY ==============
class ICTStrategy:
    """Inner Circle Trader"""
    
    @staticmethod
    def market_structure(candles):
        """BOS/CHoCH"""
        if len(candles) < 5:
            return None
        
        highs = [c['high'] for c in candles[-5:]]
        lows = [c['low'] for c in candles[-5:]]
        
        prev_high = max(highs[:-1])
        prev_low = min(lows[:-1])
        last_close = candles[-1]['close']
        
        if last_close > prev_high:
            return {'type': 'BOS BULLISH', 'level': prev_high}
        elif last_close < prev_low:
            return {'type': 'BOS BEARISH', 'level': prev_low}
        
        return None
    
    @staticmethod
    def order_block(candles):
        """Order Block"""
        if len(candles) < 4:
            return None
        
        for i in range(-4, -1):
            c0, c1 = candles[i], candles[i+1]
            
            if c0['close'] < c0['open'] and c1['close'] > c1['open']:
                return {'type': 'BULLISH OB', 'price': c0['open']}
            elif c0['close'] > c0['open'] and c1['close'] < c1['open']:
                return {'type': 'BEARISH OB', 'price': c0['close']}
        
        return None

# ============== PATTERN RECOGNITION ==============
class PatternRecognition:
    """التعرف على الأنماط"""
    
    @staticmethod
    def double_top(candles, tolerance=0.01):
        """قمة مزدوجة"""
        if len(candles) < 20:
            return None
        
        highs = [(i, c['high']) for i, c in enumerate(candles[-20:])]
        highs_sorted = sorted(highs, key=lambda x: x[1], reverse=True)
        
        if len(highs_sorted) >= 2:
            top1, top2 = highs_sorted[0], highs_sorted[1]
            if abs(top1[1] - top2[1]) / top1[1] < tolerance:
                return {'pattern': 'DOUBLE TOP', 'confidence': 'HIGH'}
        
        return None
    
    @staticmethod
    def double_bottom(candles, tolerance=0.01):
        """قاع مزدوج"""
        if len(candles) < 20:
            return None
        
        lows = [(i, c['low']) for i, c in enumerate(candles[-20:])]
        lows_sorted = sorted(lows, key=lambda x: x[1])
        
        if len(lows_sorted) >= 2:
            bot1, bot2 = lows_sorted[0], lows_sorted[1]
            if abs(bot1[1] - bot2[1]) / bot1[1] < tolerance:
                return {'pattern': 'DOUBLE BOTTOM', 'confidence': 'HIGH'}
        
        return None
    
    @staticmethod
    def candlestick_patterns(candle):
        """أنماط الشموع"""
        open_p = candle['open']
        close_p = candle['close']
        high_p = candle['high']
        low_p = candle['low']
        
        body = abs(close_p - open_p)
        upper_wick = high_p - max(open_p, close_p)
        lower_wick = min(open_p, close_p) - low_p
        
        patterns = []
        
        if lower_wick > body * 2 and upper_wick < body * 0.5:
            patterns.append('HAMMER')
        
        if upper_wick > body * 2 and lower_wick < body * 0.5:
            patterns.append('SHOOTING STAR')
        
        if body < (high_p - low_p) * 0.1:
            patterns.append('DOJI')
        
        return patterns

# ============== WYCKOFF METHOD ==============
class WyckoffMethod:
    """طريقة ويكوف"""
    
    @staticmethod
    def analyze_phase(candles):
        """تحديد مرحلة السوق"""
        if len(candles) < 30:
            return 'ACCUMULATION/DISTRIBUTION'
        
        # حساب المتوسطات
        closes = [c['close'] for c in candles]
        volumes = [c['volume'] for c in candles]
        
        avg_price = sum(closes) / len(closes)
        avg_volume = sum(volumes) / len(volumes)
        
        current_price = closes[-1]
        current_volume = volumes[-1]
        
        # تحديد المرحلة
        price_trend = closes[-1] - closes[-20] if len(closes) >= 20 else 0
        volume_trend = current_volume - avg_volume
        
        if current_price < avg_price * 0.9 and volume_trend > 0:
            return {'phase': 'ACCUMULATION', 'signal': 'BUY', 'strength': 'STRONG'}
        elif current_price > avg_price * 1.1 and volume_trend > 0:
            return {'phase': 'DISTRIBUTION', 'signal': 'SELL', 'strength': 'STRONG'}
        elif price_trend > 0 and current_price > avg_price:
            return {'phase': 'MARKUP', 'signal': 'HOLD', 'strength': 'MODERATE'}
        elif price_trend < 0 and current_price < avg_price:
            return {'phase': 'MARKDOWN', 'signal': 'WAIT', 'strength': 'MODERATE'}
        else:
            return {'phase': 'CONSOLIDATION', 'signal': 'NEUTRAL', 'strength': 'WEAK'}
    
    @staticmethod
    def spring_test(candles):
        """اختبار Spring"""
        if len(candles) < 10:
            return None
        
        recent = candles[-5:]
        lows = [c['low'] for c in recent]
        closes = [c['close'] for c in recent]
        
        min_low = min(lows)
        last_close = closes[-1]
        
        # Spring: السعر يكسر القاع ثم يعود
        if last_close > min_low * 1.02:
            return {
                'pattern': 'SPRING',
                'description': 'Price broke below support then recovered',
                'signal': 'BUY'
            }
        
        return None
    
    @staticmethod
    def upthrust_test(candles):
        """اختبار Upthrust"""
        if len(candles) < 10:
            return None
        
        recent = candles[-5:]
        highs = [c['high'] for c in recent]
        closes = [c['close'] for c in recent]
        
        max_high = max(highs)
        last_close = closes[-1]
        
        # Upthrust: السعر يكسر القمة ثم يرتد
        if last_close < max_high * 0.98:
            return {
                'pattern': 'UPTHRUST',
                'description': 'Price broke above resistance then fell',
                'signal': 'SELL'
            }
        
        return None

# ============== VOLUME PROFILE ==============
class VolumeProfile:
    """Volume Profile Institutional"""
    
    @staticmethod
    def calculate_poc(candles):
        """Point of Control"""
        if len(candles) < 20:
            return None
        
        # تجميع الحجم حسب السعر
        price_volume = {}
        for c in candles:
            price_level = round(c['close'] / 10) * 10
            if price_level not in price_volume:
                price_volume[price_level] = 0
            price_volume[price_level] += c['volume']
        
        # أوعى حجم
        poc = max(price_volume.items(), key=lambda x: x[1])
        
        return {
            'poc_price': poc[0],
            'poc_volume': poc[1],
            'support': poc[0] * 0.95,
            'resistance': poc[0] * 1.05
        }

# ============== RISK CALCULATOR ==============
class RiskCalculator:
    """حاسبة المخاطر"""
    
    @staticmethod
    def position_size(account_balance, risk_percent, entry_price, stop_loss):
        """حجم الصفقة"""
        risk_amount = account_balance * (risk_percent / 100)
        price_diff = abs(entry_price - stop_loss)
        
        if price_diff == 0:
            return {'error': 'Invalid prices'}
        
        position_size = (risk_amount / price_diff) * entry_price
        
        return {
            'position_size': round(position_size, 4),
            'risk_amount': round(risk_amount, 2),
            'quantity': round(position_size / entry_price, 6)
        }
    
    @staticmethod
    def risk_reward(entry, stop_loss, take_profit):
        """Risk/Reward"""
        risk = abs(entry - stop_loss)
        reward = abs(take_profit - entry)
        
        if risk == 0:
            return 0
        
        return round(reward / risk, 2)

# ============== WHALE TRACKER ==============
class WhaleTracker:
    """تتبع الحيتان"""
    
    def __init__(self):
        self.transactions = []
    
    def get_whale_accumulation(self, coin, hours=24):
        """تراكم الحيتان"""
        # محاكاة
        import random
        buy = random.uniform(100000, 5000000)
        sell = random.uniform(100000, 5000000)
        
        return {
            'coin': coin,
            'buy_volume': buy,
            'sell_volume': sell,
            'net_flow': buy - sell,
            'sentiment': 'BULLISH' if buy > sell else 'BEARISH'
        }

# ============== GLOBAL INSTANCES ==============
api = BinanceAPI()
smc = SMCAnalyzer()
ict = ICTStrategy()
patterns = PatternRecognition()
risk = RiskCalculator()
whale = WhaleTracker()
wyckoff = WyckoffMethod()
volume_profile = VolumeProfile()

# ============== ROUTES ==============
@app.route('/')
def index():
    """الصفحة الرئيسية"""
    return render_template('index.html')

@app.route('/api/prices')
def get_prices():
    """الأسعار"""
    prices = api.get_all_prices()
    return jsonify(prices)

@app.route('/api/candles/<coin>/<tf>')
def get_candles(coin, tf):
    """بيانات الشموع"""
    candles = api.get_klines(coin.upper(), tf, limit=100)
    return jsonify(candles)

@app.route('/api/strategies/<coin>/<tf>')
def analyze_strategies(coin, tf):
    """تحليل الاستراتيجيات"""
    candles = api.get_klines(coin.upper(), tf, limit=100)
    
    if not candles:
        return jsonify({'error': 'No data'})
    
    results = {
        'coin': coin.upper(),
        'timeframe': tf,
        'timestamp': datetime.now().isoformat(),
        'smc': {
            'order_blocks': smc.detect_order_blocks(candles),
            'fvg': smc.detect_fvg(candles),
            'liquidity': smc.liquidity_levels(candles)
        },
        'ict': {
            'market_structure': ict.market_structure(candles),
            'order_block': ict.order_block(candles)
        },
        'patterns': {
            'double_top': patterns.double_top(candles),
            'double_bottom': patterns.double_bottom(candles),
            'candlestick': patterns.candlestick_patterns(candles[-1]) if candles else []
        },
        'wyckoff': {
            'phase': wyckoff.analyze_phase(candles),
            'spring': wyckoff.spring_test(candles),
            'upthrust': wyckoff.upthrust_test(candles)
        },
        'volume_profile': {
            'poc': volume_profile.calculate_poc(candles)
        },
        'whale': whale.get_whale_accumulation(coin.upper())
    }
    
    return jsonify(results)

@app.route('/api/signals')
def get_signals():
    """إشارات التداول"""
    prices = api.get_all_prices()
    signals = []
    
    for coin, data in list(prices.items())[:15]:
        change = data['change']
        
        if change > 10:
            signals.append({'coin': coin, 'signal': 'STRONG BUY', 'change': change})
        elif change > 5:
            signals.append({'coin': coin, 'signal': 'BUY', 'change': change})
        elif change < -10:
            signals.append({'coin': coin, 'signal': 'STRONG SELL', 'change': change})
        elif change < -5:
            signals.append({'coin': coin, 'signal': 'SELL', 'change': change})
    
    return jsonify(signals)

@app.route('/api/calculate', methods=['POST'])
def calculate_trade():
    """حاسبة التداول"""
    data = request.json
    
    result = risk.position_size(
        data.get('balance', 10000),
        data.get('risk', 2),
        data.get('entry', 0),
        data.get('stop_loss', 0)
    )
    
    result['risk_reward'] = risk.risk_reward(
        data.get('entry', 0),
        data.get('stop_loss', 0),
        data.get('take_profit', 0)
    )
    
    return jsonify(result)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)

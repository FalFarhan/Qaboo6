"""
QABOOT ML Models
Machine Learning for Cryptocurrency Price Prediction
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json

class PricePredictionModel:
    """
    LSTM-based price prediction model
    Uses technical indicators to predict price direction
    """
    
    def __init__(self):
        self.model_trained = False
        self.sequence_length = 20
        self.features = [
            'rsi', 'macd_histogram', 'bb_position', 
            'volume_change', 'price_change_6h', 'price_change_24h',
            'sma_crossover', 'trend_strength'
        ]
        
    def prepare_features(self, candles, indicators):
        """
        Prepare feature vector from candles and indicators
        
        Args:
            candles: List of OHLCV candles
            indicators: Dict of calculated indicators
            
        Returns:
            numpy array of features
        """
        if len(candles) < self.sequence_length:
            return None
            
        closes = [float(c[4]) for c in candles]
        volumes = [float(c[5]) for c in candles]
        
        features = []
        
        # Current features
        current_price = closes[-1]
        prev_price = closes[-2] if len(closes) > 1 else current_price
        
        # RSI
        rsi = indicators.get('rsi', 50)
        features.append(rsi / 100)  # Normalize to 0-1
        
        # MACD histogram
        macd = indicators.get('macd', {})
        macd_hist = macd.get('histogram', 0)
        features.append(np.tanh(macd_hist / 100))  # Normalize
        
        # Bollinger Bands position
        bb = indicators.get('bollinger', {})
        if bb.get('upper') and bb.get('lower'):
            bb_range = bb['upper'] - bb['lower']
            if bb_range > 0:
                bb_pos = (current_price - bb['lower']) / bb_range
            else:
                bb_pos = 0.5
        else:
            bb_pos = 0.5
        features.append(bb_pos)
        
        # Volume change
        if len(volumes) >= 2:
            vol_change = (volumes[-1] - volumes[-2]) / volumes[-2] if volumes[-2] > 0 else 0
        else:
            vol_change = 0
        features.append(np.tanh(vol_change))
        
        # Price change (6h)
        if len(closes) >= 7:
            price_6h = closes[-7]
            change_6h = (current_price - price_6h) / price_6h if price_6h > 0 else 0
        else:
            change_6h = 0
        features.append(np.tanh(change_6h * 10))
        
        # Price change (24h)
        if len(closes) >= 25:
            price_24h = closes[-25]
            change_24h = (current_price - price_24h) / price_24h if price_24h > 0 else 0
        else:
            change_24h = (current_price - closes[0]) / closes[0] if closes[0] > 0 else 0
        features.append(np.tanh(change_24h * 10))
        
        # SMA Crossover
        sma20 = indicators.get('sma20', current_price)
        sma50 = indicators.get('sma50', current_price)
        if sma50 > 0:
            sma_cross = (sma20 - sma50) / sma50
        else:
            sma_cross = 0
        features.append(np.tanh(sma_cross * 10))
        
        # Trend strength
        if len(closes) >= 10:
            recent = closes[-10:]
            trend = (recent[-1] - recent[0]) / recent[0] if recent[0] > 0 else 0
        else:
            trend = 0
        features.append(np.tanh(trend * 10))
        
        return np.array(features).reshape(1, -1)
    
    def predict(self, candles, indicators):
        """
        Predict price movement
        
        Returns:
            Dict with prediction results
        """
        features = self.prepare_features(candles, indicators)
        
        if features is None:
            return {
                'prediction': 'NEUTRAL',
                'confidence': 50,
                'probability_up': 0.5,
                'probability_down': 0.5,
                'factors': ['Insufficient data']
            }
        
        # Simple rule-based prediction (until we train the model)
        # This will be replaced with actual ML model
        
        rsi = indicators.get('rsi', 50)
        macd_hist = indicators.get('macd', {}).get('histogram', 0)
        bb = indicators.get('bollinger', {})
        
        # Calculate score
        score = 0
        factors = []
        
        # RSI factor
        if rsi < 30:
            score += 30
            factors.append('RSI oversold - bullish reversal likely')
        elif rsi > 70:
            score -= 30
            factors.append('RSI overbought - bearish reversal likely')
        
        # MACD factor
        if macd_hist > 0:
            score += 20
            factors.append('MACD bullish momentum')
        else:
            score -= 20
            factors.append('MACD bearish momentum')
        
        # Bollinger factor
        if bb.get('position') == 'BELOW_LOWER':
            score += 25
            factors.append('Price below lower band - oversold')
        elif bb.get('position') == 'ABOVE_UPPER':
            score -= 25
            factors.append('Price above upper band - overbought')
        
        # Determine prediction
        if score > 30:
            prediction = 'UP'
            confidence = min(95, 50 + score)
        elif score < -30:
            prediction = 'DOWN'
            confidence = min(95, 50 - score)
        else:
            prediction = 'NEUTRAL'
            confidence = 50 + abs(score)
        
        # Calculate probabilities
        prob_up = (confidence / 100) if prediction == 'UP' else (50 - abs(score)/2) / 100
        prob_down = (confidence / 100) if prediction == 'DOWN' else (50 - abs(score)/2) / 100
        
        if prediction == 'NEUTRAL':
            prob_up = prob_down = 0.5
        
        return {
            'prediction': prediction,
            'confidence': confidence,
            'probability_up': round(prob_up, 3),
            'probability_down': round(prob_down, 3),
            'factors': factors if factors else ['Market consolidating'],
            'score': score,
            'model_version': '1.0-rule-based'
        }


class SignalValidator:
    """
    Validates trading signals using ML confidence scoring
    """
    
    def __init__(self):
        self.min_confidence = 60
        
    def validate(self, signal, indicators, ml_prediction):
        """
        Validate a trading signal
        
        Args:
            signal: Dict with signal info (BUY/SELL/HOLD)
            indicators: Technical indicators
            ml_prediction: ML model prediction
            
        Returns:
            Dict with validation result
        """
        signal_type = signal.get('signal', 'HOLD')
        signal_confidence = signal.get('confidence', 50)
        ml_confidence = ml_prediction.get('confidence', 50)
        ml_direction = ml_prediction.get('prediction', 'NEUTRAL')
        
        # Check alignment
        alignment_score = 0
        
        if signal_type == 'BUY' and ml_direction == 'UP':
            alignment_score = 40
        elif signal_type == 'SELL' and ml_direction == 'DOWN':
            alignment_score = 40
        elif signal_type == 'HOLD' and ml_direction == 'NEUTRAL':
            alignment_score = 20
        
        # Calculate final validation score
        validation_score = (signal_confidence + ml_confidence + alignment_score) / 3
        
        # Determine recommendation
        if validation_score >= 75:
            recommendation = 'EXECUTE'
            reason = 'High confidence alignment'
        elif validation_score >= 50:
            recommendation = 'EXECUTE'
            reason = 'Moderate confidence'
        elif validation_score >= 30:
            recommendation = 'WAIT'
            reason = 'Low confidence - wait for better setup'
        else:
            recommendation = 'REJECT'
            reason = 'Signal contradicts ML prediction'
        
        return {
            'valid': validation_score >= self.min_confidence,
            'validation_score': round(validation_score, 1),
            'recommendation': recommendation,
            'reason': reason,
            'signal_confidence': signal_confidence,
            'ml_confidence': ml_confidence,
            'alignment': alignment_score
        }


class MLManager:
    """
    Main manager for ML operations
    """
    
    def __init__(self):
        self.price_model = PricePredictionModel()
        self.validator = SignalValidator()
        
    def predict_price(self, coin, candles, indicators):
        """Get price prediction for a coin"""
        return self.price_model.predict(candles, indicators)
    
    def validate_signal(self, signal, indicators, ml_prediction):
        """Validate a trading signal"""
        return self.validator.validate(signal, indicators, ml_prediction)
    
    def get_market_insights(self, predictions):
        """
        Generate market-wide insights from predictions
        
        Args:
            predictions: Dict of {coin: prediction}
            
        Returns:
            Dict with market insights
        """
        bullish_count = sum(1 for p in predictions.values() if p.get('prediction') == 'UP')
        bearish_count = sum(1 for p in predictions.values() if p.get('prediction') == 'DOWN')
        neutral_count = len(predictions) - bullish_count - bearish_count
        
        total = len(predictions)
        if total == 0:
            return {'market_sentiment': 'UNKNOWN', 'strength': 0}
        
        bullish_pct = (bullish_count / total) * 100
        bearish_pct = (bearish_count / total) * 100
        
        if bullish_pct > 60:
            sentiment = 'STRONGLY_BULLISH'
        elif bullish_pct > 40:
            sentiment = 'BULLISH'
        elif bearish_pct > 60:
            sentiment = 'STRONGLY_BEARISH'
        elif bearish_pct > 40:
            sentiment = 'BEARISH'
        else:
            sentiment = 'MIXED'
        
        return {
            'market_sentiment': sentiment,
            'bullish_coins': bullish_count,
            'bearish_coins': bearish_count,
            'neutral_coins': neutral_count,
            'bullish_percentage': round(bullish_pct, 1),
            'bearish_percentage': round(bearish_pct, 1),
            'strength': abs(bullish_pct - bearish_pct)
        }


# Global ML Manager instance
ml_manager = MLManager()

if __name__ == '__main__':
    # Test the model
    print("QABOOT ML Models Loaded")
    print("Available models:")
    print("- PricePredictionModel")
    print("- SignalValidator") 
    print("- MLManager")
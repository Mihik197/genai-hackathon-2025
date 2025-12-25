"""
yfinance Tools for Investment Strategy Agents

Provides real financial data from Yahoo Finance API.
"""

import yfinance as yf
from datetime import datetime


def get_stock_quote(ticker: str) -> dict:
    """Get current quote and key metrics for a stock.
    
    Args:
        ticker: Stock ticker symbol (e.g., "AAPL", "MSFT", "GOOGL")
    
    Returns:
        Dictionary with current price, change, market cap, P/E, 52-week range, volume
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        
        price_change = None
        price_change_percent = None
        if current_price and previous_close:
            price_change = round(current_price - previous_close, 2)
            price_change_percent = round((price_change / previous_close) * 100, 2)
        
        return {
            "status": "success",
            "ticker": ticker.upper(),
            "company_name": info.get("longName") or info.get("shortName"),
            "current_price": current_price,
            "previous_close": previous_close,
            "price_change": price_change,
            "price_change_percent": price_change_percent,
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
            "volume": info.get("volume"),
            "avg_volume": info.get("averageVolume"),
            "dividend_yield": info.get("dividendYield"),
            "beta": info.get("beta"),
            "currency": info.get("currency"),
            "exchange": info.get("exchange"),
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Failed to fetch quote for {ticker}: {str(e)}"
        }


def get_stock_fundamentals(ticker: str) -> dict:
    """Get financial statement data and key ratios for a stock.
    
    Args:
        ticker: Stock ticker symbol
    
    Returns:
        Dictionary with revenue, earnings, margins, debt ratios, and growth metrics
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        return {
            "status": "success",
            "ticker": ticker.upper(),
            "company_name": info.get("longName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "revenue": info.get("totalRevenue"),
            "revenue_per_share": info.get("revenuePerShare"),
            "gross_margins": info.get("grossMargins"),
            "operating_margins": info.get("operatingMargins"),
            "profit_margins": info.get("profitMargins"),
            "earnings_per_share": info.get("trailingEps"),
            "forward_eps": info.get("forwardEps"),
            "book_value": info.get("bookValue"),
            "price_to_book": info.get("priceToBook"),
            "debt_to_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "quick_ratio": info.get("quickRatio"),
            "return_on_equity": info.get("returnOnEquity"),
            "return_on_assets": info.get("returnOnAssets"),
            "free_cash_flow": info.get("freeCashflow"),
            "operating_cash_flow": info.get("operatingCashflow"),
            "earnings_growth": info.get("earningsGrowth"),
            "revenue_growth": info.get("revenueGrowth"),
            "target_mean_price": info.get("targetMeanPrice"),
            "recommendation_key": info.get("recommendationKey"),
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Failed to fetch fundamentals for {ticker}: {str(e)}"
        }


def get_price_history(ticker: str, period: str) -> dict:
    """Get historical price data for charting.
    
    Args:
        ticker: Stock ticker symbol (e.g., "AAPL", "MSFT")
        period: Time period for historical data. Valid values: "1mo", "3mo", "6mo", "1y", "2y", "5y"
    
    Returns:
        Dictionary with OHLCV arrays and calculated metrics
    """
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        
        if hist.empty:
            return {
                "status": "error",
                "error_message": f"No historical data found for {ticker}"
            }
        
        closes = hist["Close"].tolist()
        dates = hist.index.strftime("%Y-%m-%d").tolist()
        
        sma_20 = None
        sma_50 = None
        if len(closes) >= 20:
            sma_20 = round(sum(closes[-20:]) / 20, 2)
        if len(closes) >= 50:
            sma_50 = round(sum(closes[-50:]) / 50, 2)
        
        period_return = None
        if len(closes) >= 2:
            period_return = round(((closes[-1] - closes[0]) / closes[0]) * 100, 2)
        
        high_in_period = round(max(closes), 2)
        low_in_period = round(min(closes), 2)
        
        return {
            "status": "success",
            "ticker": ticker.upper(),
            "period": period,
            "data_points": len(closes),
            "dates": dates,
            "prices": [round(p, 2) for p in closes],
            "volumes": hist["Volume"].tolist(),
            "highs": [round(h, 2) for h in hist["High"].tolist()],
            "lows": [round(l, 2) for l in hist["Low"].tolist()],
            "opens": [round(o, 2) for o in hist["Open"].tolist()],
            "current_price": round(closes[-1], 2) if closes else None,
            "period_high": high_in_period,
            "period_low": low_in_period,
            "period_return_percent": period_return,
            "sma_20": sma_20,
            "sma_50": sma_50,
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Failed to fetch price history for {ticker}: {str(e)}"
        }


def get_analyst_ratings(ticker: str) -> dict:
    """Get analyst price targets and recommendations.
    
    Args:
        ticker: Stock ticker symbol
    
    Returns:
        Dictionary with analyst targets, recommendations, and rating distribution
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        recommendations = None
        try:
            recs = stock.recommendations
            if recs is not None and not recs.empty:
                recent = recs.tail(10)
                recommendations = recent.to_dict("records")
        except Exception:
            pass
        
        return {
            "status": "success",
            "ticker": ticker.upper(),
            "company_name": info.get("longName"),
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "target_low_price": info.get("targetLowPrice"),
            "target_mean_price": info.get("targetMeanPrice"),
            "target_median_price": info.get("targetMedianPrice"),
            "target_high_price": info.get("targetHighPrice"),
            "number_of_analysts": info.get("numberOfAnalystOpinions"),
            "recommendation_key": info.get("recommendationKey"),
            "recommendation_mean": info.get("recommendationMean"),
            "recent_recommendations": recommendations,
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Failed to fetch analyst ratings for {ticker}: {str(e)}"
        }

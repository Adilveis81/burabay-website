import yfinance as yf
import json
from datetime import datetime

GLOBAL_TICKERS = ['AMD', 'INTC', 'AMZN', 'GOOGL', 'AAPL', 'MSFT', 'NVDA', 'TSLA']

KZ_TICKERS = [
    {'yf_ticker': 'HSBK.IL', 'display': 'HSBK', 'currency': 'USD', 'placeholder': 9.50},
    {'yf_ticker': 'KSPI.IL', 'display': 'KSPI', 'currency': 'USD', 'placeholder': 110.0},
    {'yf_ticker': 'KAP.IL',  'display': 'KAP',  'currency': 'USD', 'placeholder': 14.0},
    {'yf_ticker': 'KEGC',    'display': 'KEGC', 'currency': 'KZT', 'placeholder': 2180.0},
    {'yf_ticker': 'KZTK',    'display': 'KZTK', 'currency': 'KZT', 'placeholder': 24800.0},
]


def fetch_stock(yf_ticker):
    info = yf.Ticker(yf_ticker).info
    price = info.get('currentPrice', info.get('regularMarketPrice', 0))
    change = info.get('regularMarketChangePercent', 0)
    if not price:
        raise ValueError('no price data')
    return round(float(price), 2), round(float(change), 2)


# Global stocks
global_stocks = []
for ticker in GLOBAL_TICKERS:
    try:
        price, change = fetch_stock(ticker)
        global_stocks.append({'ticker': ticker, 'price': price, 'change': change})
        print(f"✅ {ticker}: ${price:.2f} ({change:+.2f}%)")
    except Exception as e:
        print(f"❌ {ticker}: {e}")

# Kazakhstan stocks
kz_stocks = []
for item in KZ_TICKERS:
    try:
        price, change = fetch_stock(item['yf_ticker'])
        kz_stocks.append({
            'ticker': item['display'],
            'price': price,
            'change': change,
            'currency': item['currency'],
        })
        print(f"✅ {item['display']} ({item['yf_ticker']}): {price:.2f} {item['currency']} ({change:+.2f}%)")
    except Exception as e:
        print(f"⚠️  {item['display']} ({item['yf_ticker']}): {e} — placeholder")
        kz_stocks.append({
            'ticker': item['display'],
            'price': item['placeholder'],
            'change': 0.0,
            'currency': item['currency'],
        })

with open('stocks_data.json', 'w') as f:
    json.dump({
        'updated': datetime.now().isoformat(),
        'global_stocks': global_stocks,
        'kazakhstan_stocks': kz_stocks,
        'stocks': global_stocks,  # backward compat
    }, f, indent=2)

print("\n✅ Данные сохранены в stocks_data.json")

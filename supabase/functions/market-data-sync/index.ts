import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY') || 'demo-key';
const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY') || 'demo';

interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  source: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // This function can be called via cron job or manually
    if (req.method === 'POST' || req.method === 'GET') {
      const symbols = [
        'VAS.AX', 'VGS.AX', 'VAF.AX', 'VGE.AX', 'VDHG.AX',
        'CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'ANZ.AX',
        'BTC-USD', 'ETH-USD', 'ADA-USD'
      ];

      const updates = await fetchMarketData(symbols);
      await updatePriceHistory(updates);
      
      // Broadcast updates via Supabase Realtime
      await broadcastMarketUpdates(updates);

      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: updates.length,
          timestamp: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Market data sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchMarketData(symbols: string[]): Promise<MarketDataUpdate[]> {
  const updates: MarketDataUpdate[] = [];
  
  for (const symbol of symbols) {
    try {
      let marketData: MarketDataUpdate | null = null;
      
      // Try different sources based on symbol type
      if (symbol.includes('-USD') && (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('ADA'))) {
        // Crypto data from Serper (search for current price)
        marketData = await fetchCryptoDataViaSerper(symbol);
      } else {
        // Stock data from Alpha Vantage or Yahoo Finance
        marketData = await fetchStockData(symbol);
      }
      
      if (marketData) {
        updates.push(marketData);
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
    }
  }
  
  return updates;
}

async function fetchCryptoDataViaSerper(symbol: string): Promise<MarketDataUpdate | null> {
  try {
    const cryptoName = symbol.replace('-USD', '');
    const searchQuery = `${cryptoName} cryptocurrency price USD current market data`;
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 5,
        gl: 'us',
        hl: 'en'
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract price from knowledge graph or search results
    const knowledgeGraph = data.knowledgeGraph;
    if (knowledgeGraph && knowledgeGraph.attributes) {
      const priceAttr = knowledgeGraph.attributes.find((attr: any) => 
        attr.name?.toLowerCase().includes('price') || attr.name?.toLowerCase().includes('value')
      );
      
      if (priceAttr) {
        const price = parseFloat(priceAttr.value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(price)) {
          return {
            symbol,
            price,
            change: 0, // Would need historical data for change
            changePercent: 0,
            volume: 0,
            source: 'serper'
          };
        }
      }
    }
    
    // Fallback to mock data
    return getMockCryptoData(symbol);
  } catch (error) {
    console.error(`Error fetching crypto data for ${symbol}:`, error);
    return getMockCryptoData(symbol);
  }
}

async function fetchStockData(symbol: string): Promise<MarketDataUpdate | null> {
  try {
    // Try Alpha Vantage first
    if (ALPHA_VANTAGE_API_KEY !== 'demo') {
      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
      
      if (response.ok) {
        const data = await response.json();
        const quote = data['Global Quote'];
        
        if (quote) {
          return {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']),
            source: 'alpha_vantage'
          };
        }
      }
    }
    
    // Fallback to Yahoo Finance
    const yahooResponse = await fetch(`https://query1.finance.yahoo.com/v1/finance/quote?symbols=${symbol}`);
    
    if (yahooResponse.ok) {
      const data = await yahooResponse.json();
      const quote = data.quoteResponse?.result?.[0];
      
      if (quote) {
        return {
          symbol: quote.symbol,
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          volume: quote.regularMarketVolume || 0,
          marketCap: quote.marketCap,
          source: 'yahoo_finance'
        };
      }
    }
    
    // Final fallback to mock data
    return getMockStockData(symbol);
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    return getMockStockData(symbol);
  }
}

function getMockStockData(symbol: string): MarketDataUpdate {
  const mockData: { [key: string]: Omit<MarketDataUpdate, 'source'> } = {
    'VAS.AX': { symbol: 'VAS.AX', price: 89.45, change: 1.23, changePercent: 1.39, volume: 125000 },
    'VGS.AX': { symbol: 'VGS.AX', price: 102.67, change: -0.45, changePercent: -0.44, volume: 89000 },
    'VAF.AX': { symbol: 'VAF.AX', price: 51.23, change: 0.12, changePercent: 0.23, volume: 45000 },
    'CBA.AX': { symbol: 'CBA.AX', price: 104.50, change: -1.20, changePercent: -1.13, volume: 890000 },
    'BHP.AX': { symbol: 'BHP.AX', price: 46.78, change: 0.89, changePercent: 1.94, volume: 1200000 },
  };
  
  return {
    ...(mockData[symbol] || { symbol, price: 100, change: 0, changePercent: 0, volume: 0 }),
    source: 'mock'
  };
}

function getMockCryptoData(symbol: string): MarketDataUpdate {
  const mockData: { [key: string]: Omit<MarketDataUpdate, 'source'> } = {
    'BTC-USD': { symbol: 'BTC-USD', price: 45000, change: 1200, changePercent: 2.74, volume: 25000000000 },
    'ETH-USD': { symbol: 'ETH-USD', price: 3200, change: -45, changePercent: -1.39, volume: 15000000000 },
    'ADA-USD': { symbol: 'ADA-USD', price: 0.45, change: 0.02, changePercent: 4.65, volume: 500000000 },
  };
  
  return {
    ...(mockData[symbol] || { symbol, price: 1, change: 0, changePercent: 0, volume: 0 }),
    source: 'mock'
  };
}

async function updatePriceHistory(updates: MarketDataUpdate[]): Promise<void> {
  try {
    const priceHistoryData = updates.map(update => ({
      symbol: update.symbol,
      asset_type: update.symbol.includes('-USD') ? 'crypto' : 'stock',
      price: update.price,
      volume: update.volume,
      market_cap: update.marketCap,
      change_percent: update.changePercent,
      currency: update.symbol.includes('.AX') ? 'AUD' : 'USD',
      exchange: update.symbol.includes('.AX') ? 'ASX' : 
                update.symbol.includes('-USD') ? 'CRYPTO' : 'NYSE',
      source: update.source,
      timestamp: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('price_history')
      .upsert(priceHistoryData, { 
        onConflict: 'symbol,timestamp',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error updating price history:', error);
    }
  } catch (error) {
    console.error('Error in updatePriceHistory:', error);
  }
}

async function broadcastMarketUpdates(updates: MarketDataUpdate[]): Promise<void> {
  try {
    // Use Supabase Realtime to broadcast market updates
    const channel = supabase.channel('market-updates');
    
    for (const update of updates) {
      await channel.send({
        type: 'broadcast',
        event: 'price-update',
        payload: update
      });
    }
  } catch (error) {
    console.error('Error broadcasting market updates:', error);
  }
}
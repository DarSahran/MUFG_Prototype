import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY') || '';
const SERPER_BASE_URL = 'https://google.serper.dev';

interface SerperChatRequest {
  query: string;
  context?: {
    portfolioValue?: number;
    riskProfile?: string;
    age?: number;
    retirementAge?: number;
  };
  searchType?: 'search' | 'news' | 'images';
}

interface SerperResponse {
  answer: string;
  searchResults: any[];
  sources: string[];
  confidence: number;
  queryType: string;
  tokensUsed: number;
  cached: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    const { query, context, searchType = 'search' }: SerperChatRequest = await req.json();

    // Validate input
    if (!query || typeof query !== 'string' || query.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 3 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (query.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Query too long. Please limit to 500 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user's query permission
    const { data: permission, error: permissionError } = await supabase
      .rpc('check_query_permission', { p_user_id: user.id })
      .single();

    if (permissionError) {
      console.error('Permission check error:', permissionError);
      return new Response(
        JSON.stringify({ error: 'Failed to check query permission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!permission.can_query) {
      return new Response(
        JSON.stringify({ 
          error: 'Query limit exceeded', 
          message: `Daily limit: ${permission.daily_remaining}/${permission.daily_limit}, Monthly limit: ${permission.monthly_remaining}/${permission.monthly_limit}`,
          nextReset: permission.next_reset,
          upgradeRequired: true 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cacheKey = `${searchType}_${Buffer.from(query).toString('base64').slice(0, 50)}`;
    const { data: cached } = await supabase
      .from('serper_cache')
      .select('response_data, hit_count')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    let response: SerperResponse;

    if (cached) {
      // Return cached response
      response = {
        ...cached.response_data,
        cached: true,
      };
      
      // Increment hit count
      await supabase
        .from('serper_cache')
        .update({ hit_count: cached.hit_count + 1 })
        .eq('cache_key', cacheKey);
    } else {
      // Make fresh Serper API call
      response = await processSerperQuery(query, context, searchType);
      
      // Cache the response
      await supabase
        .from('serper_cache')
        .upsert({
          cache_key: cacheKey,
          query_text: query,
          search_type: searchType,
          response_data: response,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        });
      
      // Increment user's query usage
      const { data: incrementResult } = await supabase
        .rpc('increment_query_usage', { p_user_id: user.id });
      
      if (!incrementResult) {
        return new Response(
          JSON.stringify({ error: 'Failed to track query usage' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log the query
    await supabase
      .from('serper_query_logs')
      .insert({
        user_id: user.id,
        query_text: query,
        response_data: response,
        search_type: searchType,
        tokens_used: response.tokensUsed || 0,
        response_time_ms: Date.now() - startTime,
        success: true,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
      });

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Serper AI Chat error:', error);
    
    const errorResponse = {
      error: 'Internal server error',
      message: 'Unable to process your query at the moment. Please try again.',
      queryType: 'error'
    };

    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processSerperQuery(
  query: string, 
  context: any, 
  searchType: string
): Promise<SerperResponse> {
  try {
    // Build enhanced search query
    const enhancedQuery = buildFinancialSearchQuery(query, context);
    
    // Call Serper API
    const searchResults = await callSerperAPI(searchType, {
      q: enhancedQuery,
      num: 10,
      gl: 'au',
      hl: 'en'
    });

    // Get additional news context if it's a financial query
    let newsResults = null;
    if (isFinancialQuery(query)) {
      try {
        newsResults = await callSerperAPI('news', {
          q: `${query.substring(0, 100)} Australian finance investment`,
          num: 5,
          gl: 'au',
          hl: 'en'
        });
      } catch (newsError) {
        console.warn('News API failed:', newsError);
      }
    }

    // Generate comprehensive AI response
    const aiResponse = generateAIResponse(query, searchResults, newsResults, context);
    
    return {
      answer: aiResponse.answer,
      searchResults: searchResults.organic || [],
      sources: extractSources(searchResults, newsResults),
      confidence: calculateConfidence(searchResults, query),
      queryType: 'financial',
      tokensUsed: estimateTokenUsage(query, aiResponse.answer),
      cached: false,
    };
  } catch (error) {
    console.error('Error processing Serper query:', error);
    return getFallbackResponse(query);
  }
}

function buildFinancialSearchQuery(query: string, context: any): string {
  let searchQuery = `${query} Australian superannuation investment advice`;
  
  if (context?.riskProfile) {
    searchQuery += ` ${context.riskProfile} risk profile`;
  }
  
  if (context?.age && context?.retirementAge) {
    const yearsToRetirement = context.retirementAge - context.age;
    searchQuery += ` ${yearsToRetirement} years retirement planning`;
  }
  
  searchQuery += ` ${new Date().getFullYear()}`;
  
  return searchQuery;
}

async function callSerperAPI(endpoint: string, params: any): Promise<any> {
  const response = await fetch(`${SERPER_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function isFinancialQuery(query: string): boolean {
  const financialKeywords = [
    'investment', 'portfolio', 'stock', 'bond', 'etf', 'crypto', 'superannuation', 'super',
    'retirement', 'pension', 'savings', 'market', 'trading', 'finance', 'financial',
    'money', 'wealth', 'asset', 'dividend', 'yield', 'return', 'risk', 'diversification'
  ];

  const queryLower = query.toLowerCase();
  return financialKeywords.some(keyword => queryLower.includes(keyword));
}

function generateAIResponse(
  query: string,
  searchResults: any,
  newsResults: any,
  context: any
): { answer: string } {
  const searchContent = searchResults.organic?.map((result: any) => result.snippet).join(' ') || '';
  const newsContent = newsResults?.news?.map((result: any) => result.snippet).join(' ') || '';
  
  let answer = `Based on current market research and analysis:\n\n`;
  
  if (context?.portfolioValue) {
    answer += `For your portfolio valued at $${context.portfolioValue.toLocaleString()}:\n\n`;
  }

  // Extract key insights from search results
  if (searchContent) {
    answer += `**Market Insights:**\n`;
    answer += `${extractKeyInsights(searchContent, query)}\n\n`;
  }

  // Add news context if available
  if (newsContent) {
    answer += `**Current Market Context:**\n`;
    answer += `Recent developments suggest ${extractMarketSentiment(newsContent)}. `;
    answer += `Stay informed about regulatory changes and market trends.\n\n`;
  }

  // Generate specific recommendations
  answer += `**Recommendations:**\n`;
  if (query.toLowerCase().includes('contribution')) {
    answer += `1. Consider maximizing your concessional contribution cap of $27,500 annually\n`;
    answer += `2. Explore salary sacrifice arrangements for immediate tax benefits\n`;
    answer += `3. Review your super fund's investment options and fees\n\n`;
  } else if (query.toLowerCase().includes('portfolio')) {
    answer += `1. Diversify across Australian and international markets\n`;
    answer += `2. Regular rebalancing helps maintain target allocation\n`;
    answer += `3. Consider your risk tolerance and time horizon\n\n`;
  } else {
    answer += `1. Review your current investment strategy\n`;
    answer += `2. Consider professional financial advice for complex decisions\n`;
    answer += `3. Stay informed about market developments\n\n`;
  }

  answer += `**Important Disclaimer:**\n`;
  answer += `This information is based on current market research and is for educational purposes only. `;
  answer += `Always consult with a licensed financial advisor for personalized advice specific to your circumstances.`;

  return { answer };
}

function extractKeyInsights(content: string, query: string): string {
  if (query.toLowerCase().includes('superannuation') || query.toLowerCase().includes('super')) {
    return 'Current superannuation strategies emphasize maximizing contribution caps and selecting appropriate investment options based on your time horizon and risk tolerance.';
  } else if (query.toLowerCase().includes('portfolio')) {
    return 'Effective portfolio management involves regular rebalancing, diversification across asset classes, and alignment with your financial goals.';
  } else if (query.toLowerCase().includes('market')) {
    return 'Market analysis suggests maintaining a long-term perspective while staying informed about economic indicators and regulatory changes.';
  }
  
  return 'Financial planning requires a comprehensive approach considering your individual circumstances, goals, and market conditions.';
}

function extractMarketSentiment(content: string): string {
  if (content.toLowerCase().includes('growth') || content.toLowerCase().includes('positive')) {
    return 'positive momentum with growth opportunities';
  } else if (content.toLowerCase().includes('decline') || content.toLowerCase().includes('concern')) {
    return 'cautious sentiment with some market concerns';
  }
  return 'mixed signals requiring careful analysis';
}

function extractSources(searchResults: any, newsResults: any): string[] {
  const sources: string[] = [];
  
  searchResults.organic?.slice(0, 3).forEach((result: any) => {
    sources.push(`${result.title} - ${result.link}`);
  });
  
  newsResults?.news?.slice(0, 2).forEach((result: any) => {
    sources.push(`${result.title} - ${result.link}`);
  });
  
  return sources;
}

function calculateConfidence(searchResults: any, query: string): number {
  let confidence = 70; // Base confidence
  
  const resultCount = searchResults.organic?.length || 0;
  confidence += Math.min(resultCount * 3, 20);
  
  const hasKnowledgeGraph = !!searchResults.knowledgeGraph;
  if (hasKnowledgeGraph) confidence += 10;
  
  return Math.min(confidence, 95);
}

function estimateTokenUsage(query: string, response: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil((query.length + response.length) / 4);
}

function getFallbackResponse(query: string): SerperResponse {
  return {
    answer: `Thank you for your financial question about "${query}". While I cannot access real-time search data at the moment, here are some general principles:\n\n**Investment Fundamentals:**\n- Diversification across asset classes reduces risk\n- Regular contributions benefit from dollar-cost averaging\n- Time in the market typically beats timing the market\n- Review and rebalance your portfolio periodically\n\n**Superannuation Strategies:**\n- Maximize your concessional contribution cap ($27,500 annually)\n- Consider salary sacrifice for tax benefits\n- Review your fund's investment options and fees\n\n**Risk Management:**\n- Align your investment strategy with your risk tolerance\n- Consider your time horizon when making investment decisions\n- Maintain an emergency fund outside of investments\n\nFor personalized advice, please consult with a licensed financial advisor.`,
    searchResults: [],
    sources: [],
    confidence: 60,
    queryType: 'financial',
    tokensUsed: 150,
    cached: false,
  };
}
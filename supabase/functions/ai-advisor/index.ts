import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY') || 'demo-key';
const SERPER_BASE_URL = 'https://google.serper.dev';

interface AIAdvisorRequest {
  query: string;
  context?: {
    portfolioValue?: number;
    riskProfile?: string;
    age?: number;
    retirementAge?: number;
  };
}

interface SerperSearchResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  source?: string;
}

interface FinancialResponse {
  answer: string;
  marketAnalysis: string;
  recommendations: string[];
  riskAssessment: string;
  sources: string[];
  confidence: number;
  queryType: string;
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
    const { query, context }: AIAdvisorRequest = await req.json();

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

    // Check user's plan and API limits
    const canProceed = await checkUserLimits(user.id);
    if (!canProceed.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'API limit exceeded', 
          message: canProceed.message,
          upgradeRequired: true 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Content filtering - ensure query is financial
    const isFinancialQuery = await classifyQuery(query);
    if (!isFinancialQuery.isFinancial) {
      const response = {
        answer: "I specialize in financial and investment advice. Please ask me about superannuation, investments, market trends, portfolio optimization, or retirement planning.",
        marketAnalysis: "",
        recommendations: ["Try asking about your investment strategy", "Ask about market trends", "Inquire about retirement planning"],
        riskAssessment: "",
        sources: [],
        confidence: 100,
        queryType: "non-financial"
      };

      await logAPIRequest(user.id, 'ai-advisor', { query, context }, response, 200, Date.now() - startTime);
      
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process financial query with Serper AI
    const financialResponse = await processFinancialQuery(query, context, user.id);
    
    // Increment API usage
    await incrementUserAPIUsage(user.id);
    
    // Log the request
    await logAPIRequest(user.id, 'ai-advisor', { query, context }, financialResponse, 200, Date.now() - startTime);

    return new Response(
      JSON.stringify(financialResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('AI Advisor error:', error);
    
    const errorResponse = {
      error: 'Internal server error',
      message: 'Unable to process your financial query at the moment. Please try again.',
      queryType: 'error'
    };

    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkUserLimits(userId: string): Promise<{ allowed: boolean; message: string; remaining: number }> {
  try {
    // Get user's plan and current usage
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(`
        plan_id,
        plans!inner(name, api_call_limit)
      `)
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return { allowed: false, message: 'User profile not found', remaining: 0 };
    }

    const plan = profile.plans as any;
    const apiLimit = plan.api_call_limit;

    // Get current usage for this billing period
    const { data: usage } = await supabase
      .from('api_usage_tracking')
      .select('current_calls')
      .eq('user_id', userId)
      .gte('billing_period_end', new Date().toISOString())
      .single();

    const currentCalls = usage?.current_calls || 0;
    const remaining = Math.max(0, apiLimit - currentCalls);

    if (currentCalls >= apiLimit) {
      return {
        allowed: false,
        message: `You've reached your ${plan.name} plan limit of ${apiLimit} AI queries this month. Upgrade your plan for more queries.`,
        remaining: 0
      };
    }

    return { allowed: true, message: 'Within limits', remaining };
  } catch (error) {
    console.error('Error checking user limits:', error);
    return { allowed: false, message: 'Error checking API limits', remaining: 0 };
  }
}

async function classifyQuery(query: string): Promise<{ isFinancial: boolean; confidence: number }> {
  const financialKeywords = [
    'investment', 'portfolio', 'stock', 'bond', 'etf', 'crypto', 'superannuation', 'super',
    'retirement', 'pension', 'savings', 'market', 'trading', 'finance', 'financial',
    'money', 'wealth', 'asset', 'dividend', 'yield', 'return', 'risk', 'diversification',
    'allocation', 'contribution', 'tax', 'capital', 'gain', 'loss', 'asx', 'nyse',
    'nasdaq', 'economy', 'inflation', 'interest', 'rate', 'rba', 'fed', 'bank',
    'fund', 'mutual', 'index', 'sector', 'commodity', 'currency', 'forex',
    'property', 'real estate', 'reit', 'mortgage', 'loan', 'debt', 'credit'
  ];

  const nonFinancialKeywords = [
    'recipe', 'cooking', 'weather', 'sports', 'entertainment', 'movie', 'music',
    'travel', 'vacation', 'health', 'medical', 'doctor', 'exercise', 'fitness',
    'programming', 'code', 'software', 'technology', 'computer', 'game',
    'joke', 'funny', 'story', 'poem', 'creative', 'art', 'design'
  ];

  const queryLower = query.toLowerCase();
  
  const financialMatches = financialKeywords.filter(keyword => 
    queryLower.includes(keyword)
  ).length;
  
  const nonFinancialMatches = nonFinancialKeywords.filter(keyword => 
    queryLower.includes(keyword)
  ).length;

  const isFinancial = financialMatches > nonFinancialMatches;
  const confidence = financialMatches > 0 ? Math.min(financialMatches * 20, 100) : 0;

  return { isFinancial, confidence };
}

async function processFinancialQuery(
  query: string, 
  context: any, 
  userId: string
): Promise<FinancialResponse> {
  try {
    // Check cache first
    const cacheKey = `ai_query_${Buffer.from(query).toString('base64').slice(0, 50)}`;
    const { data: cached } = await supabase
      .from('financial_data_cache')
      .select('data')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      return cached.data as FinancialResponse;
    }

    // Build search query for Serper
    const searchQuery = buildFinancialSearchQuery(query, context);
    
    // Call Serper API for search results
    const searchResults = await callSerperAPI('search', {
      q: searchQuery,
      num: 8,
      gl: 'au',
      hl: 'en'
    });

    // Get financial news for additional context
    const newsResults = await callSerperAPI('news', {
      q: `${query.substring(0, 100)} Australian investment finance`,
      num: 5,
      gl: 'au',
      hl: 'en'
    });

    // Process results into structured financial response
    const response = await generateFinancialResponse(
      query,
      searchResults,
      newsResults,
      context
    );

    // Cache the response
    await supabase
      .from('financial_data_cache')
      .upsert({
        cache_key: cacheKey,
        data_type: 'ai_response',
        data: response,
        source: 'serper',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      });

    // Store conversation
    await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        query,
        response: response.answer,
        query_type: response.queryType,
        confidence_score: response.confidence / 100,
        sources: response.sources,
        processing_time_ms: Date.now()
      });

    return response;
  } catch (error) {
    console.error('Error processing financial query:', error);
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
    throw new Error(`Serper API error: ${response.status}`);
  }

  return await response.json();
}

async function generateFinancialResponse(
  query: string,
  searchResults: any,
  newsResults: any,
  context: any
): Promise<FinancialResponse> {
  const searchContent = searchResults.organic?.map((result: any) => result.snippet).join(' ') || '';
  const newsContent = newsResults.news?.map((result: any) => result.snippet).join(' ') || '';
  
  let answer = `Based on current market research and analysis:\n\n`;
  let marketAnalysis = '';
  let recommendations: string[] = [];
  let riskAssessment = '';
  const sources: string[] = [];

  // Extract sources
  searchResults.organic?.slice(0, 3).forEach((result: any) => {
    sources.push(`${result.title} - ${result.link}`);
  });

  // Generate market analysis
  if (newsContent.toLowerCase().includes('asx') || newsContent.toLowerCase().includes('market')) {
    marketAnalysis = `Current market conditions show ${extractMarketSentiment(newsContent)}. `;
    marketAnalysis += `Recent developments in the Australian market suggest ${extractKeyTrends(searchContent)}.`;
  }

  // Generate recommendations based on query type
  if (query.toLowerCase().includes('contribution') || query.toLowerCase().includes('super')) {
    recommendations = [
      'Consider maximizing your concessional contribution cap of $27,500 annually',
      'Explore salary sacrifice arrangements for immediate tax benefits',
      'Review your super fund\'s investment options for optimal allocation'
    ];
    
    if (context?.age && context.age < 40) {
      recommendations.push('With your age, consider a growth-oriented investment strategy');
    }
  } else if (query.toLowerCase().includes('portfolio') || query.toLowerCase().includes('allocation')) {
    recommendations = [
      'Diversify across Australian and international markets',
      'Consider your risk tolerance when selecting asset allocation',
      'Regular rebalancing helps maintain your target allocation'
    ];
  } else if (query.toLowerCase().includes('risk')) {
    recommendations = [
      'Assess your risk capacity alongside risk tolerance',
      'Consider time diversification through regular investing',
      'Review and adjust risk levels as you approach retirement'
    ];
  }

  // Generate risk assessment
  if (context?.riskProfile) {
    riskAssessment = `Your ${context.riskProfile} risk profile `;
    if (context.age && context.retirementAge) {
      const yearsToRetirement = context.retirementAge - context.age;
      if (yearsToRetirement > 20) {
        riskAssessment += 'aligns well with your long investment timeline. You have time to ride out market volatility.';
      } else if (yearsToRetirement > 10) {
        riskAssessment += 'is appropriate for your medium-term timeline. Consider gradually shifting to more conservative allocations.';
      } else {
        riskAssessment += 'should be reviewed as you approach retirement. Consider capital preservation strategies.';
      }
    }
  }

  // Build comprehensive answer
  if (context?.portfolioValue) {
    answer += `For your portfolio valued at $${context.portfolioValue.toLocaleString()}:\n\n`;
  }

  answer += `**Key Insights:**\n`;
  answer += `${extractKeyInsights(searchContent, query)}\n\n`;

  if (marketAnalysis) {
    answer += `**Market Analysis:**\n${marketAnalysis}\n\n`;
  }

  if (recommendations.length > 0) {
    answer += `**Recommendations:**\n`;
    recommendations.forEach((rec, index) => {
      answer += `${index + 1}. ${rec}\n`;
    });
    answer += '\n';
  }

  if (riskAssessment) {
    answer += `**Risk Assessment:**\n${riskAssessment}\n\n`;
  }

  answer += `**Important Disclaimer:**\n`;
  answer += `This information is for educational purposes only and should not be considered personalized financial advice. `;
  answer += `Always consult with a licensed financial advisor for decisions specific to your circumstances.`;

  return {
    answer,
    marketAnalysis,
    recommendations,
    riskAssessment,
    sources,
    confidence: calculateConfidence(searchContent, newsContent, query),
    queryType: 'financial'
  };
}

function extractMarketSentiment(content: string): string {
  if (content.toLowerCase().includes('growth') || content.toLowerCase().includes('positive')) {
    return 'positive momentum with growth opportunities';
  } else if (content.toLowerCase().includes('decline') || content.toLowerCase().includes('concern')) {
    return 'cautious sentiment with some market concerns';
  }
  return 'mixed signals requiring careful analysis';
}

function extractKeyTrends(content: string): string {
  const trends = [];
  if (content.toLowerCase().includes('interest rate')) {
    trends.push('interest rate movements affecting investment strategies');
  }
  if (content.toLowerCase().includes('inflation')) {
    trends.push('inflation considerations for long-term planning');
  }
  if (content.toLowerCase().includes('technology') || content.toLowerCase().includes('tech')) {
    trends.push('technology sector developments');
  }
  
  return trends.length > 0 ? trends.join(', ') : 'continued focus on diversified investment approaches';
}

function extractKeyInsights(content: string, query: string): string {
  // Extract relevant insights based on query content
  if (query.toLowerCase().includes('superannuation') || query.toLowerCase().includes('super')) {
    return 'Current superannuation strategies emphasize the importance of maximizing contribution caps and selecting appropriate investment options based on your time horizon and risk tolerance.';
  } else if (query.toLowerCase().includes('portfolio')) {
    return 'Effective portfolio management involves regular rebalancing, diversification across asset classes, and alignment with your financial goals and risk profile.';
  } else if (query.toLowerCase().includes('market')) {
    return 'Market analysis suggests maintaining a long-term perspective while staying informed about economic indicators and regulatory changes that may impact your investments.';
  }
  
  return 'Financial planning requires a comprehensive approach considering your individual circumstances, goals, and market conditions.';
}

function calculateConfidence(searchContent: string, newsContent: string, query: string): number {
  let confidence = 70; // Base confidence
  
  // Increase confidence based on content relevance
  const queryWords = query.toLowerCase().split(' ');
  const contentWords = (searchContent + ' ' + newsContent).toLowerCase();
  
  const relevantMatches = queryWords.filter(word => 
    word.length > 3 && contentWords.includes(word)
  ).length;
  
  confidence += Math.min(relevantMatches * 5, 25);
  
  // Adjust based on content quality
  if (searchContent.length > 500) confidence += 5;
  if (newsContent.length > 200) confidence += 5;
  
  return Math.min(confidence, 95);
}

function getFallbackResponse(query: string): FinancialResponse {
  return {
    answer: `Thank you for your financial question about "${query}". While I cannot access real-time market data at the moment, here are some general principles:\n\n**Investment Fundamentals:**\n- Diversification across asset classes reduces risk\n- Regular contributions benefit from dollar-cost averaging\n- Time in the market typically beats timing the market\n- Review and rebalance your portfolio periodically\n\n**Superannuation Strategies:**\n- Maximize your concessional contribution cap ($27,500 annually)\n- Consider salary sacrifice for tax benefits\n- Review your fund's investment options and fees\n- Plan for your preservation age and retirement income needs\n\n**Risk Management:**\n- Align your investment strategy with your risk tolerance\n- Consider your time horizon when making investment decisions\n- Maintain an emergency fund outside of your investment portfolio\n\nFor personalized advice, please consult with a licensed financial advisor.`,
    marketAnalysis: 'Unable to access current market data. Please try again later.',
    recommendations: [
      'Review your current asset allocation',
      'Consider increasing superannuation contributions',
      'Consult with a licensed financial advisor',
      'Stay informed about market developments'
    ],
    riskAssessment: 'Risk assessment requires current market data and personal financial review.',
    sources: [],
    confidence: 60,
    queryType: 'financial'
  };
}

async function incrementUserAPIUsage(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_api_usage', { p_user_id: userId });
    if (error) {
      console.error('Error incrementing API usage:', error);
    }
  } catch (error) {
    console.error('Error calling increment_api_usage function:', error);
  }
}

async function logAPIRequest(
  userId: string,
  endpoint: string,
  requestBody: any,
  responseBody: any,
  statusCode: number,
  durationMs: number,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase
      .from('api_request_logs')
      .insert({
        user_id: userId,
        endpoint,
        request_body: requestBody,
        response_body: responseBody,
        status_code: statusCode,
        duration_ms: durationMs,
        error_message: errorMessage,
      });
  } catch (error) {
    console.error('Error logging API request:', error);
  }
}
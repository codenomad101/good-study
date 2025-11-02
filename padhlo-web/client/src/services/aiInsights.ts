/**
 * AI Insights Service - Optimized for Speed
 * Uses fast, efficient methods to generate personalized performance insights
 */

interface PerformanceData {
  overallAccuracy: number;
  totalQuestionsAttempted: number;
  currentStreak: number;
  examHistory: any[];
  practiceHistory: any[];
  weakAreas: Array<{ category: string; score: number; testCount: number }>;
}

// Cache for insights to avoid repeated API calls
const insightsCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from performance data
 */
const generateCacheKey = (data: PerformanceData): string => {
  return `${data.overallAccuracy}-${data.totalQuestionsAttempted}-${data.currentStreak}-${data.weakAreas.map(w => w.category).join(',')}`;
};

/**
 * Check if cached insights are still valid
 */
const getCachedInsights = (data: PerformanceData): string | null => {
  const key = generateCacheKey(data);
  const cached = insightsCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached insights');
    return cached.data;
  }
  
  return null;
};

/**
 * Save insights to cache
 */
const setCachedInsights = (data: PerformanceData, insights: string): void => {
  const key = generateCacheKey(data);
  insightsCache.set(key, { data: insights, timestamp: Date.now() });
};

/**
 * Generate AI insights using OpenAI API with timeout
 */
export const generateAIInsightsOpenAI = async (
  data: PerformanceData,
  timeout = 8000
): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return generateFallbackInsights(data);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const prompt = createShortPrompt(data);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150, // Reduced for faster response
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || generateFallbackInsights(data);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('OpenAI request timed out');
    } else {
      console.error('OpenAI API error:', error);
    }
    return generateFallbackInsights(data);
  }
};

/**
 * Fast Hugging Face insights with smaller models and timeout
 */
export const generateAIInsightsHuggingFace = async (
  data: PerformanceData,
  timeout = 10000
): Promise<string> => {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    return generateFallbackInsights(data);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const prompt = createShortPrompt(data);
    
    // Use faster, smaller models
    const models = [
       // Fastest
      'gpt2'         // Fallback
    ];
    
    for (const model of models) {
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/openai-community/${model}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_new_tokens: 100, // Reduced for speed
                temperature: 0.7,
                do_sample: true,
                top_p: 0.9,
                return_full_text: false
              },
              options: {
                wait_for_model: true,
                use_cache: true // Enable caching on HF side
              }
            }),
            signal: controller.signal
          }
        );

        if (!response.ok) {
          continue;
        }
        
        const result = await response.json();
        
        clearTimeout(timeoutId);
        
        if (Array.isArray(result) && result[0]?.generated_text) {
          return result[0].generated_text;
        }
        
        if (result.generated_text) {
          return result.generated_text;
        }
      } catch (modelError) {
        if (modelError.name === 'AbortError') {
          throw modelError; // Re-throw timeout errors
        }
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    return generateFallbackInsights(data);
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('Hugging Face request timed out');
    } else {
      console.error('Hugging Face API error:', error);
    }
    return generateFallbackInsights(data);
  }
};

/**
 * Shorter, more focused prompt for faster generation
 */
const createShortPrompt = (data: PerformanceData): string => {
  const { overallAccuracy, totalQuestionsAttempted, currentStreak, weakAreas } = data;
  
  return `Student performance: ${overallAccuracy}% accuracy, ${totalQuestionsAttempted} questions, ${currentStreak} day streak. ${weakAreas.length > 0 ? `Weak: ${weakAreas[0].category} (${weakAreas[0].score}%)` : 'No weak areas'}. Give 2-3 brief, motivational tips (max 100 words).`;
};

/**
 * Enhanced fallback insights with more intelligence
 */
const generateFallbackInsights = (data: PerformanceData): string => {
  const { overallAccuracy, totalQuestionsAttempted, currentStreak, weakAreas } = data;
  
  let insight = '';
  
  // Performance assessment
  if (overallAccuracy >= 80) {
    insight += `🌟 Outstanding ${overallAccuracy}% accuracy! You're excelling. `;
  } else if (overallAccuracy >= 60) {
    insight += `👍 Solid ${overallAccuracy}% accuracy. You're on the right track. `;
  } else {
    insight += `💪 At ${overallAccuracy}%, focus on fundamentals through targeted practice. `;
  }
  
  // Volume & consistency
  if (currentStreak >= 7) {
    insight += `Your ${currentStreak}-day streak shows exceptional consistency! `;
  } else if (currentStreak >= 3) {
    insight += `${currentStreak}-day streak is great progress. `;
  }
  
  if (totalQuestionsAttempted >= 100) {
    insight += `${totalQuestionsAttempted} questions completed shows dedication. `;
  }
  
  // Focused recommendations
  if (weakAreas.length > 0) {
    const topWeak = weakAreas[0];
    insight += `Priority: Improve ${topWeak.category} (${topWeak.score}%). Dedicate 15-20 min daily here. `;
  }
  
  // Quick action
  insight += `Next step: Practice 20 questions today, review all mistakes carefully.`;
  
  return insight;
};

/**
 * Local AI insights (instant)
 */
export const generateLocalAIInsights = (data: PerformanceData): string => {
  return generateFallbackInsights(data);
};

/**
 * MAIN FUNCTION - Optimized for speed with parallel requests
 */
export const generateSmartInsights = async (data: PerformanceData): Promise<string> => {
  // Check cache first (instant)
  const cached = getCachedInsights(data);
  if (cached) {
    return cached;
  }

  const hasHuggingFace = !!import.meta.env.VITE_HUGGINGFACE_API_KEY;
  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
  
  // If no API keys, return local insights immediately
  if (!hasHuggingFace && !hasOpenAI) {
    return generateLocalAIInsights(data);
  }

  // Strategy: Try both APIs in parallel with race condition
  // Whichever responds first wins
  const promises: Promise<{ source: string; result: string }>[] = [];

  if (hasHuggingFace) {
    promises.push(
      generateAIInsightsHuggingFace(data, 8000).then(result => ({
        source: 'huggingface',
        result
      }))
    );
  }

  if (hasOpenAI) {
    promises.push(
      generateAIInsightsOpenAI(data, 8000).then(result => ({
        source: 'openai',
        result
      }))
    );
  }

  // Also add fallback as a safety with slight delay
  promises.push(
    new Promise<{ source: string; result: string }>(resolve => {
      setTimeout(() => {
        resolve({
          source: 'fallback',
          result: generateLocalAIInsights(data)
        });
      }, 10000); // 10 second timeout before using fallback
    })
  );

  try {
    // Race: first successful response wins
    const { result, source } = await Promise.race(promises);
    
    console.log(`Insights generated by: ${source}`);
    
    // Validate result (not a fallback disguised as AI)
    if (result && result !== '' && !result.includes('🌟') && !result.includes('👍')) {
      setCachedInsights(data, result);
      return result;
    }
    
    // If result looks like fallback, use it anyway but cache it
    const fallback = generateLocalAIInsights(data);
    setCachedInsights(data, fallback);
    return fallback;
    
  } catch (error) {
    console.error('All insight generation methods failed:', error);
    const fallback = generateLocalAIInsights(data);
    setCachedInsights(data, fallback);
    return fallback;
  }
};

/**
 * Preload insights in background (call this when user navigates to dashboard)
 */
export const preloadInsights = async (data: PerformanceData): Promise<void> => {
  // Check if already cached
  if (getCachedInsights(data)) {
    return;
  }
  
  // Generate in background without blocking UI
  generateSmartInsights(data).catch(err => {
    console.error('Background insight preload failed:', err);
  });
};

/**
 * Clear insights cache (call when user logs out or data significantly changes)
 */
export const clearInsightsCache = (): void => {
  insightsCache.clear();
};
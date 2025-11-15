/**
 * AI Insights Service - Optimized for Speed
 * Uses fast, efficient methods to generate personalized performance insights
 */

export interface PerformanceData {
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
 * Fast Hugging Face insights using Pythia-160m model with timeout
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
    
    // Use Pythia-160m model from EleutherAI
    const model = 'EleutherAI/pythia-160m';
    
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
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
        const errorText = await response.text();
        console.error(`Hugging Face API error (${response.status}):`, errorText);
        throw new Error(`API returned ${response.status}`);
      }
      
      const result = await response.json();
      
      clearTimeout(timeoutId);
      
      // Handle different response formats from Hugging Face API
      if (Array.isArray(result) && result[0]?.generated_text) {
        return result[0].generated_text.trim();
      }
      
      if (result.generated_text) {
        return result.generated_text.trim();
      }
      
      // If response format is different, try to extract text
      if (result[0] && typeof result[0] === 'object') {
        const generatedText = result[0].generated_text || result[0].text;
        if (generatedText) {
          return generatedText.trim();
        }
      }
      
      console.warn('Unexpected response format from Pythia-160m:', result);
      throw new Error('Unexpected response format');
      
    } catch (modelError) {
      if (modelError.name === 'AbortError') {
        throw modelError; // Re-throw timeout errors
      }
      throw modelError; // Re-throw to be caught by outer catch
    }
    
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
 * Enhanced prompt with detailed session data for initial insights
 */
const createShortPrompt = (data: PerformanceData): string => {
  const { overallAccuracy, totalQuestionsAttempted, currentStreak, weakAreas, examHistory, practiceHistory } = data;
  
  // Analyze recent sessions with detailed data
  const recentExams = (examHistory || []).slice(0, 5).reverse().map((exam: any) => {
    const percentage = exam.percentage ? (typeof exam.percentage === 'string' ? parseFloat(exam.percentage) : exam.percentage) : 0;
    const date = exam.completedAt || exam.createdAt;
    const correct = exam.correctAnswers || 0;
    const incorrect = exam.incorrectAnswers || 0;
    return {
      name: exam.examName || 'Exam',
      score: percentage,
      date: date ? new Date(date).toLocaleDateString() : 'Unknown',
      correct,
      incorrect,
      total: exam.questionsAttempted || 0,
      category: exam.questionDistribution?.[0]?.category || 'Mixed'
    };
  });
  
  const recentPractice = (practiceHistory || []).slice(0, 5).reverse().map((session: any) => {
    const percentage = session.percentage 
      ? (typeof session.percentage === 'string' ? parseFloat(session.percentage) : session.percentage)
      : (session.accuracy || 0);
    const date = session.completedAt || session.createdAt;
    const correct = session.correctAnswers || 0;
    const incorrect = session.incorrectAnswers || 0;
    return {
      category: session.category || 'Unknown',
      score: percentage,
      date: date ? new Date(date).toLocaleDateString() : 'Unknown',
      correct,
      incorrect,
      questions: session.questionsAttempted || 0
    };
  });
  
  // Build detailed session summary
  let sessionSummary = '';
  if (recentExams.length > 0) {
    const avgExamScore = recentExams.reduce((sum, e) => sum + e.score, 0) / recentExams.length;
    const latestExam = recentExams[0];
    sessionSummary += `Recent exams (${recentExams.length}): avg ${avgExamScore.toFixed(1)}%. Latest: ${latestExam.name} on ${latestExam.date} - ${latestExam.score.toFixed(1)}% (${latestExam.correct}/${latestExam.total} correct). `;
  }
  if (recentPractice.length > 0) {
    const avgPracticeScore = recentPractice.reduce((sum, p) => sum + p.score, 0) / recentPractice.length;
    const latestPractice = recentPractice[0];
    const categories = [...new Set(recentPractice.map(p => p.category))];
    sessionSummary += `Recent practice (${recentPractice.length} sessions): avg ${avgPracticeScore.toFixed(1)}% in ${categories.join(', ')}. Latest: ${latestPractice.category} on ${latestPractice.date} - ${latestPractice.score.toFixed(1)}% (${latestPractice.correct} correct, ${latestPractice.incorrect} incorrect). `;
  }
  
  // Analyze trends
  let trendInfo = '';
  if (recentExams.length >= 2) {
    const firstHalf = recentExams.slice(0, Math.ceil(recentExams.length / 2));
    const secondHalf = recentExams.slice(Math.ceil(recentExams.length / 2));
    const avgFirst = firstHalf.reduce((sum, e) => sum + e.score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, e) => sum + e.score, 0) / secondHalf.length;
    if (avgSecond > avgFirst + 3) trendInfo += 'Exam scores improving. ';
    else if (avgSecond < avgFirst - 3) trendInfo += 'Exam scores declining. ';
  }
  if (recentPractice.length >= 2) {
    const firstHalf = recentPractice.slice(0, Math.ceil(recentPractice.length / 2));
    const secondHalf = recentPractice.slice(Math.ceil(recentPractice.length / 2));
    const avgFirst = firstHalf.reduce((sum, p) => sum + p.score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, p) => sum + p.score, 0) / secondHalf.length;
    if (avgSecond > avgFirst + 3) trendInfo += 'Practice scores improving. ';
    else if (avgSecond < avgFirst - 3) trendInfo += 'Practice scores declining. ';
  }
  
  // Build weak areas summary
  let weakAreasText = '';
  if (weakAreas.length > 0) {
    weakAreasText = `Weak areas: ${weakAreas.slice(0, 3).map(w => `${w.category} (${w.score}%, ${w.testCount} tests)`).join(', ')}. `;
  }
  
  return `Student performance analysis: Overall ${overallAccuracy}% accuracy, ${totalQuestionsAttempted} questions attempted, ${currentStreak}-day streak. ${sessionSummary}${trendInfo}${weakAreasText}Provide 2-3 brief, actionable, motivational tips based on this detailed session data. Reference specific recent sessions and trends (max 120 words).`;
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

/**
 * Extract category-specific statistics
 */
const getCategoryStats = (data: PerformanceData): Record<string, {
  questionsAttempted: number;
  accuracy: number;
  sessions: number;
  recentScores: number[];
}> => {
  const { examHistory, practiceHistory } = data;
  const categoryStats: Record<string, {
    questionsAttempted: number;
    accuracy: number;
    sessions: number;
    recentScores: number[];
  }> = {};
  
  // Process practice history (more detailed category info)
  (practiceHistory || []).forEach((session: any) => {
    let category = (session.category || 'General').toLowerCase();
    // Normalize category names (handle variations like "current-affairs" vs "current affairs")
    category = category.replace(/\s+/g, '-'); // Replace spaces with hyphens
    const percentage = session.percentage 
      ? (typeof session.percentage === 'string' ? parseFloat(session.percentage) : session.percentage)
      : (session.accuracy || 0);
    const questions = session.questionsAttempted || 0;
    
    if (!categoryStats[category]) {
      categoryStats[category] = {
        questionsAttempted: 0,
        accuracy: 0,
        sessions: 0,
        recentScores: []
      };
    }
    
    categoryStats[category].questionsAttempted += questions;
    categoryStats[category].sessions += 1;
    categoryStats[category].recentScores.push(percentage);
  });
  
  // Process exam history
  (examHistory || []).forEach((exam: any) => {
    const percentage = typeof exam.percentage === 'string' 
      ? parseFloat(exam.percentage) 
      : (exam.percentage ?? 0);
    
    // Extract categories from exam
    const examName = (exam.examName || exam.name || '').toLowerCase();
    const questionDist = exam.questionDistribution || [];
    
    // If exam has category distribution, use it
    if (Array.isArray(questionDist) && questionDist.length > 0) {
      questionDist.forEach((dist: any) => {
        let category = (dist.category || 'General').toLowerCase();
        // Normalize category names
        category = category.replace(/\s+/g, '-');
        const questionCount = dist.count || 0;
        
        if (!categoryStats[category]) {
          categoryStats[category] = {
            questionsAttempted: 0,
            accuracy: 0,
            sessions: 0,
            recentScores: []
          };
        }
        
        categoryStats[category].questionsAttempted += questionCount;
        categoryStats[category].sessions += 1;
        categoryStats[category].recentScores.push(percentage);
      });
    } else {
      // Fallback: extract category from exam name
      const category = extractCategoryFromName(examName);
      if (!categoryStats[category]) {
        categoryStats[category] = {
          questionsAttempted: 0,
          accuracy: 0,
          sessions: 0,
          recentScores: []
        };
      }
      categoryStats[category].sessions += 1;
      categoryStats[category].recentScores.push(percentage);
    }
  });
  
  // Calculate average accuracy for each category
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    if (stats.recentScores.length > 0) {
      stats.accuracy = stats.recentScores.reduce((a, b) => a + b, 0) / stats.recentScores.length;
    }
  });
  
  return categoryStats;
};

/**
 * Extract category from exam/practice name
 */
const extractCategoryFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('history')) return 'history';
  if (lowerName.includes('english') || lowerName.includes('grammar')) return 'english';
  if (lowerName.includes('economy') || lowerName.includes('economic')) return 'economy';
  if (lowerName.includes('geography') || lowerName.includes('geo')) return 'geography';
  if (lowerName.includes('polity') || lowerName.includes('political')) return 'polity';
  if (lowerName.includes('science')) return 'science';
  if (lowerName.includes('current affairs') || lowerName.includes('gk') || lowerName.includes('current-affairs')) return 'current-affairs';
  if (lowerName.includes('aptitude') || lowerName.includes('math')) return 'aptitude';
  if (lowerName.includes('agriculture') || lowerName.includes('agri')) return 'agriculture';
  
  return 'general';
};

/**
 * Detect category mentioned in question
 */
const detectCategoryInQuestion = (question: string): string | null => {
  const lowerQuestion = question.toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    'history': ['history', 'historical'],
    'english': ['english', 'grammar', 'language'],
    'economy': ['economy', 'economic', 'economics'],
    'geography': ['geography', 'geo', 'geographical'],
    'polity': ['polity', 'political', 'politics'],
    'science': ['science', 'scientific'],
    'current-affairs': ['current affairs', 'current-affairs', 'gk', 'general knowledge'],
    'aptitude': ['aptitude', 'math', 'mathematics'],
    'agriculture': ['agriculture', 'agri', 'farming']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      return category;
    }
  }
  
  return null;
};

/**
 * Analyze trends in session performance
 */
const analyzeTrends = (sessions: any[], sessionType: 'exam' | 'practice'): string => {
  if (sessions.length < 2) return '';
  
  const recent = sessions.slice(0, 5).reverse(); // Most recent first
  const scores = recent.map((s: any) => {
    const pct = s.percentage ? (typeof s.percentage === 'string' ? parseFloat(s.percentage) : s.percentage) : 0;
    return pct;
  }).filter(s => s > 0);
  
  if (scores.length < 2) return '';
  
  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const trend = avgSecond > avgFirst + 5 ? 'improving' : avgSecond < avgFirst - 5 ? 'declining' : 'stable';
  return `Trend: ${trend} (recent avg: ${avgSecond.toFixed(1)}% vs earlier: ${avgFirst.toFixed(1)}%)`;
};

/**
 * Create comprehensive performance context for chat queries with detailed session data
 */
const createPerformanceContext = (data: PerformanceData): string => {
  const { overallAccuracy, totalQuestionsAttempted, currentStreak, weakAreas, examHistory, practiceHistory } = data;
  
  // Get category-specific stats
  const categoryStats = getCategoryStats(data);
  
  // Build category breakdown
  let categoryBreakdown = 'Category Performance:\n';
  if (Object.keys(categoryStats).length > 0) {
    Object.entries(categoryStats).forEach(([category, stats]) => {
      if (stats.questionsAttempted > 0 || stats.sessions > 0) {
        categoryBreakdown += `- ${category}: ${stats.questionsAttempted} questions attempted, ${stats.accuracy.toFixed(1)}% average accuracy, ${stats.sessions} sessions\n`;
      }
    });
  } else {
    categoryBreakdown += '- No category-specific data available yet.\n';
  }
  
  // Detailed Exam Sessions (last 10, most recent first)
  const exams = (examHistory || []).slice(0, 10).reverse();
  let examDetails = '\n=== RECENT EXAM SESSIONS (Most Recent First) ===\n';
  if (exams.length > 0) {
    exams.forEach((exam: any, index: number) => {
      const percentage = exam.percentage ? (typeof exam.percentage === 'string' ? parseFloat(exam.percentage) : exam.percentage) : 0;
      const date = exam.completedAt || exam.createdAt;
      const dateStr = date ? new Date(date).toLocaleDateString() : 'Unknown date';
      const correct = exam.correctAnswers || 0;
      const incorrect = exam.incorrectAnswers || 0;
      const attempted = exam.questionsAttempted || 0;
      const skipped = exam.skippedQuestions || 0;
      const timeSpent = exam.timeSpentSeconds ? Math.round(exam.timeSpentSeconds / 60) : 0;
      const marks = exam.marksObtained ? (typeof exam.marksObtained === 'string' ? parseFloat(exam.marksObtained) : exam.marksObtained) : 0;
      const totalMarks = exam.totalMarks || 0;
      const categories = exam.questionDistribution ? exam.questionDistribution.map((d: any) => `${d.category}(${d.count})`).join(', ') : 'Mixed';
      
      examDetails += `${index + 1}. ${exam.examName || 'Exam'} - ${dateStr}\n`;
      examDetails += `   Score: ${percentage.toFixed(1)}% (${marks.toFixed(1)}/${totalMarks} marks)\n`;
      examDetails += `   Results: ${correct} correct, ${incorrect} incorrect, ${skipped} skipped out of ${attempted} attempted\n`;
      examDetails += `   Time: ${timeSpent} minutes\n`;
      examDetails += `   Categories: ${categories}\n`;
      examDetails += `   Status: ${exam.status || 'completed'}\n\n`;
    });
    
    // Add trend analysis
    const examTrend = analyzeTrends(exams, 'exam');
    if (examTrend) {
      examDetails += `Overall Exam Trend: ${examTrend}\n`;
    }
  } else {
    examDetails += 'No exam sessions completed yet.\n';
  }
  
  // Detailed Practice Sessions (last 10, most recent first)
  const practice = (practiceHistory || []).slice(0, 10).reverse();
  let practiceDetails = '\n=== RECENT PRACTICE SESSIONS (Most Recent First) ===\n';
  if (practice.length > 0) {
    practice.forEach((session: any, index: number) => {
      const percentage = session.percentage 
        ? (typeof session.percentage === 'string' ? parseFloat(session.percentage) : session.percentage)
        : (session.accuracy || 0);
      const date = session.completedAt || session.createdAt;
      const dateStr = date ? new Date(date).toLocaleDateString() : 'Unknown date';
      const correct = session.correctAnswers || 0;
      const incorrect = session.incorrectAnswers || 0;
      const attempted = session.questionsAttempted || 0;
      const skipped = session.skippedQuestions || 0;
      const timeSpent = session.timeSpentSeconds ? Math.round(session.timeSpentSeconds / 60) : 0;
      const totalQuestions = session.totalQuestions || attempted;
      const category = session.category || 'Unknown';
      
      practiceDetails += `${index + 1}. ${category} Practice - ${dateStr}\n`;
      practiceDetails += `   Score: ${percentage.toFixed(1)}% (${correct}/${totalQuestions} correct)\n`;
      practiceDetails += `   Results: ${correct} correct, ${incorrect} incorrect, ${skipped} skipped out of ${attempted} attempted\n`;
      practiceDetails += `   Time: ${timeSpent} minutes (${session.timeLimitMinutes || 15} min limit)\n`;
      practiceDetails += `   Status: ${session.status || 'completed'}\n\n`;
    });
    
    // Add trend analysis
    const practiceTrend = analyzeTrends(practice, 'practice');
    if (practiceTrend) {
      practiceDetails += `Overall Practice Trend: ${practiceTrend}\n`;
    }
  } else {
    practiceDetails += 'No practice sessions completed yet.\n';
  }
  
  // Calculate time-based insights
  const allSessions = [...exams, ...practice].filter(s => s.completedAt || s.createdAt);
  const sessionsByWeek: Record<string, number> = {};
  allSessions.forEach((s: any) => {
    const date = new Date(s.completedAt || s.createdAt);
    const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    sessionsByWeek[weekKey] = (sessionsByWeek[weekKey] || 0) + 1;
  });
  
  let activityInsight = '\n=== ACTIVITY PATTERNS ===\n';
  activityInsight += `Total Sessions: ${exams.length + practice.length}\n`;
  activityInsight += `Exam Sessions: ${exams.length}\n`;
  activityInsight += `Practice Sessions: ${practice.length}\n`;
  if (Object.keys(sessionsByWeek).length > 0) {
    const avgSessionsPerWeek = Object.values(sessionsByWeek).reduce((a, b) => a + b, 0) / Object.keys(sessionsByWeek).length;
    activityInsight += `Average sessions per week: ${avgSessionsPerWeek.toFixed(1)}\n`;
  }
  
  // Weak areas
  const weakAreasText = weakAreas.length > 0
    ? `\n=== WEAK AREAS ===\n${weakAreas.map(w => `- ${w.category}: ${w.score}% accuracy (${w.testCount} tests)`).join('\n')}`
    : '\n=== WEAK AREAS ===\nNo significant weak areas identified.';
  
  return `STUDENT PERFORMANCE CONTEXT
===========================================
OVERALL STATISTICS:
- Overall Accuracy: ${overallAccuracy}%
- Total Questions Attempted: ${totalQuestionsAttempted}
- Current Streak: ${currentStreak} days

${categoryBreakdown}
${examDetails}
${practiceDetails}
${activityInsight}
${weakAreasText}

Use this detailed session data to provide specific, actionable insights. Reference specific sessions, dates, scores, and trends when answering questions.`;
};

/**
 * Generate AI response to user question about their performance
 */
export const askAIAboutPerformance = async (
  question: string,
  data: PerformanceData,
  timeout = 15000
): Promise<string> => {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    return generateFallbackAnswer(question, data);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const context = createPerformanceContext(data);
    const category = detectCategoryInQuestion(question);
    const categoryStats = getCategoryStats(data);
    
    // Build enhanced prompt with category-specific instructions
    let promptInstructions = `You are a helpful educational AI assistant. Answer the student's question about their performance based on the following data:\n\n${context}\n\n`;
    
    if (category && categoryStats[category]) {
      const stats = categoryStats[category];
      promptInstructions += `IMPORTANT: The student is asking about "${category}". Use the specific data for this category:\n`;
      promptInstructions += `- ${category}: ${stats.questionsAttempted} questions attempted, ${stats.accuracy.toFixed(1)}% average accuracy, ${stats.sessions} sessions\n\n`;
    }
    
    promptInstructions += `Student Question: ${question}\n\n`;
    promptInstructions += `Provide a helpful, specific, and encouraging answer. ${category ? `Focus on the ${category} category data specifically. ` : ''}(max 150 words):`;
    
    const model = 'EleutherAI/pythia-160m';
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          inputs: promptInstructions,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            do_sample: true,
            top_p: 0.9,
            return_full_text: false
          },
          options: {
            wait_for_model: true,
            use_cache: true
          }
        }),
        signal: controller.signal
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hugging Face API error (${response.status}):`, errorText);
      throw new Error(`API returned ${response.status}`);
    }
    
    const result = await response.json();
    clearTimeout(timeoutId);
    
    // Handle different response formats
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text.trim();
    }
    
    if (result.generated_text) {
      return result.generated_text.trim();
    }
    
    if (result[0] && typeof result[0] === 'object') {
      const generatedText = result[0].generated_text || result[0].text;
      if (generatedText) {
        return generatedText.trim();
      }
    }
    
    throw new Error('Unexpected response format');
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('AI chat request timed out');
    } else {
      console.error('AI chat API error:', error);
    }
    return generateFallbackAnswer(question, data);
  }
};

/**
 * Generate fallback answer when AI is unavailable
 */
const generateFallbackAnswer = (question: string, data: PerformanceData): string => {
  const lowerQuestion = question.toLowerCase();
  const { overallAccuracy, totalQuestionsAttempted, currentStreak, weakAreas } = data;
  
  // Detect if question is about a specific category
  const category = detectCategoryInQuestion(question);
  const categoryStats = getCategoryStats(data);
  
  // Category-specific questions
  if (category && categoryStats[category]) {
    const stats = categoryStats[category];
    
    // Questions about questions attempted in a category
    if (lowerQuestion.includes('how many') && (lowerQuestion.includes('question') || lowerQuestion.includes('attempt'))) {
      return `You have attempted ${stats.questionsAttempted} questions in ${category}. ${stats.questionsAttempted > 0 ? `Your average accuracy in this category is ${stats.accuracy.toFixed(1)}% across ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''}.` : 'Start practicing this category to see your progress!'}`;
    }
    
    // Questions about category performance
    if (lowerQuestion.includes('performance') || lowerQuestion.includes('how is') || lowerQuestion.includes('how am i')) {
      return `Your ${category} performance: ${stats.questionsAttempted} questions attempted with ${stats.accuracy.toFixed(1)}% average accuracy across ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''}. ${stats.accuracy >= 80 ? 'Excellent!' : stats.accuracy >= 60 ? 'Good progress!' : 'Keep practicing to improve.'}`;
    }
    
    // Questions about category accuracy/score
    if (lowerQuestion.includes('accuracy') || lowerQuestion.includes('score') || lowerQuestion.includes('percentage')) {
      return `Your ${category} accuracy is ${stats.accuracy.toFixed(1)}% based on ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''} with ${stats.questionsAttempted} questions attempted. ${stats.accuracy >= 80 ? 'Outstanding!' : stats.accuracy >= 60 ? 'Good work!' : 'Focus on reviewing mistakes and practicing more in this area.'}`;
    }
    
    // General category question
    return `For ${category}: You've attempted ${stats.questionsAttempted} questions with ${stats.accuracy.toFixed(1)}% average accuracy across ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''}. ${stats.accuracy < 60 ? 'Consider focusing more practice time on this category.' : 'Keep up the good work!'}`;
  }
  
  // Questions about questions attempted (overall or specific category not found)
  if (lowerQuestion.includes('how many') && (lowerQuestion.includes('question') || lowerQuestion.includes('attempt'))) {
    if (category) {
      return `I couldn't find specific data for ${category} questions. You've attempted ${totalQuestionsAttempted} questions overall. Try practicing this category to track your progress!`;
    }
    return `You have attempted ${totalQuestionsAttempted} questions overall. ${totalQuestionsAttempted >= 100 ? 'Great dedication!' : 'Keep practicing to improve your skills.'}`;
  }
  
  // Improvement questions
  if (lowerQuestion.includes('improve') || lowerQuestion.includes('better')) {
    if (category && categoryStats[category]) {
      const stats = categoryStats[category];
      return `To improve in ${category} (currently ${stats.accuracy.toFixed(1)}% accuracy), practice 20-30 questions daily in this area, review explanations carefully, and focus on understanding concepts. You've attempted ${stats.questionsAttempted} questions so far - keep going!`;
    }
    if (weakAreas.length > 0) {
      return `Based on your performance, focus on improving ${weakAreas[0].category} where you're scoring ${weakAreas[0].score}%. Practice 20-30 questions daily in this area, review explanations carefully, and track your progress. Your ${overallAccuracy}% overall accuracy shows you're on the right track!`;
    }
    return `Your current accuracy is ${overallAccuracy}%. To improve, practice consistently (aim for ${currentStreak < 7 ? '7+' : 'maintain your'} day streak), review mistakes thoroughly, and focus on understanding concepts rather than memorizing.`;
  }
  
  // Weak areas questions
  if (lowerQuestion.includes('weak') || lowerQuestion.includes('struggl')) {
    if (weakAreas.length > 0) {
      return `Your weak areas are: ${weakAreas.slice(0, 3).map(w => `${w.category} (${w.score}%)`).join(', ')}. Focus on these topics with targeted practice sessions. Review the explanations for incorrect answers to understand the concepts better.`;
    }
    return `Great news! You don't have any significantly weak areas. Your ${overallAccuracy}% accuracy is solid. Keep practicing to maintain and improve further!`;
  }
  
  // Streak questions
  if (lowerQuestion.includes('streak') || lowerQuestion.includes('consist')) {
    return `You have a ${currentStreak}-day streak! ${currentStreak >= 7 ? 'Excellent consistency!' : 'Keep it up to build a strong habit.'} Consistency is key to improvement. Try to maintain daily practice.`;
  }
  
  // Performance/score/accuracy questions (general)
  if (lowerQuestion.includes('score') || lowerQuestion.includes('accuracy') || lowerQuestion.includes('performance')) {
    if (category && categoryStats[category]) {
      const stats = categoryStats[category];
      return `Your ${category} performance: ${stats.accuracy.toFixed(1)}% accuracy with ${stats.questionsAttempted} questions attempted across ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''}. ${stats.accuracy >= 80 ? 'Outstanding!' : stats.accuracy >= 60 ? 'Good progress!' : 'Keep practicing to improve.'}`;
    }
    return `Your overall accuracy is ${overallAccuracy}% with ${totalQuestionsAttempted} questions attempted. ${overallAccuracy >= 80 ? 'Outstanding performance!' : overallAccuracy >= 60 ? 'Good progress!' : 'Keep practicing to improve.'} Focus on weak areas and maintain your practice streak.`;
  }
  
  // Default response
  return `Based on your performance data: ${overallAccuracy}% accuracy, ${totalQuestionsAttempted} questions attempted, and a ${currentStreak}-day streak. ${weakAreas.length > 0 ? `Focus on improving ${weakAreas[0].category}. ` : ''}Keep practicing consistently for better results!`;
};
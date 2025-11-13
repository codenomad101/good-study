/**
 * AI Insights Service for Mobile App
 * Uses Pythia-160m model from Hugging Face for performance insights
 */

export interface PerformanceData {
  overallAccuracy: number;
  totalQuestionsAttempted: number;
  currentStreak: number;
  examHistory: any[];
  practiceHistory: any[];
  weakAreas: Array<{ category: string; score: number; testCount: number }>;
}

// Get API key from environment (for React Native/Expo)
const getHuggingFaceApiKey = (): string | null => {
  // In Expo, environment variables prefixed with EXPO_PUBLIC_ are available
  // You can set this in .env file or app.json extra field
  try {
    // Try Expo Constants first
    const Constants = require('expo-constants');
    if (Constants.default?.expoConfig?.extra?.huggingFaceApiKey) {
      return Constants.default.expoConfig.extra.huggingFaceApiKey;
    }
  } catch (e) {
    // Constants not available, try process.env
  }
  
  // Fallback to process.env (works in development)
  return process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || null;
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
  
  // Process practice history
  (practiceHistory || []).forEach((session: any) => {
    let category = (session.category || 'General').toLowerCase();
    category = category.replace(/\s+/g, '-');
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
    
    const examName = (exam.examName || exam.name || '').toLowerCase();
    const questionDist = exam.questionDistribution || [];
    
    if (Array.isArray(questionDist) && questionDist.length > 0) {
      questionDist.forEach((dist: any) => {
        let category = (dist.category || 'General').toLowerCase();
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
  
  // Calculate average accuracy
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    if (stats.recentScores.length > 0) {
      stats.accuracy = stats.recentScores.reduce((a, b) => a + b, 0) / stats.recentScores.length;
    }
  });
  
  return categoryStats;
};

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
 * Create comprehensive performance context
 */
const createPerformanceContext = (data: PerformanceData): string => {
  const { overallAccuracy, totalQuestionsAttempted, currentStreak, weakAreas, examHistory, practiceHistory } = data;
  
  const categoryStats = getCategoryStats(data);
  
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
  
  // Detailed sessions
  const exams = (examHistory || []).slice(0, 10).reverse();
  let examDetails = '\n=== RECENT EXAM SESSIONS ===\n';
  if (exams.length > 0) {
    exams.forEach((exam: any, index: number) => {
      const percentage = exam.percentage ? (typeof exam.percentage === 'string' ? parseFloat(exam.percentage) : exam.percentage) : 0;
      const date = exam.completedAt || exam.createdAt;
      const dateStr = date ? new Date(date).toLocaleDateString() : 'Unknown date';
      const correct = exam.correctAnswers || 0;
      const incorrect = exam.incorrectAnswers || 0;
      const attempted = exam.questionsAttempted || 0;
      
      examDetails += `${index + 1}. ${exam.examName || 'Exam'} - ${dateStr}: ${percentage.toFixed(1)}% (${correct}/${attempted} correct)\n`;
    });
  } else {
    examDetails += 'No exam sessions completed yet.\n';
  }
  
  const practice = (practiceHistory || []).slice(0, 10).reverse();
  let practiceDetails = '\n=== RECENT PRACTICE SESSIONS ===\n';
  if (practice.length > 0) {
    practice.forEach((session: any, index: number) => {
      const percentage = session.percentage 
        ? (typeof session.percentage === 'string' ? parseFloat(session.percentage) : session.percentage)
        : (session.accuracy || 0);
      const date = session.completedAt || session.createdAt;
      const dateStr = date ? new Date(date).toLocaleDateString() : 'Unknown date';
      const correct = session.correctAnswers || 0;
      const attempted = session.questionsAttempted || 0;
      const category = session.category || 'Unknown';
      
      practiceDetails += `${index + 1}. ${category} - ${dateStr}: ${percentage.toFixed(1)}% (${correct}/${attempted} correct)\n`;
    });
  } else {
    practiceDetails += 'No practice sessions completed yet.\n';
  }
  
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
${weakAreasText}

Use this detailed session data to provide specific, actionable insights.`;
};

/**
 * Generate AI response to user question
 */
export const askAIAboutPerformance = async (
  question: string,
  data: PerformanceData,
  timeout = 15000
): Promise<string> => {
  const apiKey = getHuggingFaceApiKey();
  
  if (!apiKey) {
    return generateFallbackAnswer(question, data);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const context = createPerformanceContext(data);
    const category = detectCategoryInQuestion(question);
    const categoryStats = getCategoryStats(data);
    
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
      throw new Error(`API returned ${response.status}`);
    }
    
    const result = await response.json();
    clearTimeout(timeoutId);
    
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
    
  } catch (error: any) {
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
 * Generate fallback answer
 */
const generateFallbackAnswer = (question: string, data: PerformanceData): string => {
  const lowerQuestion = question.toLowerCase();
  const { overallAccuracy, totalQuestionsAttempted, currentStreak, weakAreas } = data;
  
  const category = detectCategoryInQuestion(question);
  const categoryStats = getCategoryStats(data);
  
  if (category && categoryStats[category]) {
    const stats = categoryStats[category];
    
    if (lowerQuestion.includes('how many') && (lowerQuestion.includes('question') || lowerQuestion.includes('attempt'))) {
      return `You have attempted ${stats.questionsAttempted} questions in ${category}. Your average accuracy in this category is ${stats.accuracy.toFixed(1)}% across ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''}.`;
    }
    
    if (lowerQuestion.includes('performance') || lowerQuestion.includes('how is') || lowerQuestion.includes('how am i')) {
      return `Your ${category} performance: ${stats.questionsAttempted} questions attempted with ${stats.accuracy.toFixed(1)}% average accuracy across ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''}. ${stats.accuracy >= 80 ? 'Excellent!' : stats.accuracy >= 60 ? 'Good progress!' : 'Keep practicing to improve.'}`;
    }
  }
  
  if (lowerQuestion.includes('improve') || lowerQuestion.includes('better')) {
    if (weakAreas.length > 0) {
      return `Based on your performance, focus on improving ${weakAreas[0].category} where you're scoring ${weakAreas[0].score}%. Practice 20-30 questions daily in this area, review explanations carefully, and track your progress. Your ${overallAccuracy}% overall accuracy shows you're on the right track!`;
    }
    return `Your current accuracy is ${overallAccuracy}%. To improve, practice consistently (aim for ${currentStreak < 7 ? '7+' : 'maintain your'} day streak), review mistakes thoroughly, and focus on understanding concepts rather than memorizing.`;
  }
  
  if (lowerQuestion.includes('weak') || lowerQuestion.includes('struggl')) {
    if (weakAreas.length > 0) {
      return `Your weak areas are: ${weakAreas.slice(0, 3).map(w => `${w.category} (${w.score}%)`).join(', ')}. Focus on these topics with targeted practice sessions. Review the explanations for incorrect answers to understand the concepts better.`;
    }
    return `Great news! You don't have any significantly weak areas. Your ${overallAccuracy}% accuracy is solid. Keep practicing to maintain and improve further!`;
  }
  
  return `Based on your performance data: ${overallAccuracy}% accuracy, ${totalQuestionsAttempted} questions attempted, and a ${currentStreak}-day streak. ${weakAreas.length > 0 ? `Focus on improving ${weakAreas[0].category}. ` : ''}Keep practicing consistently for better results!`;
};


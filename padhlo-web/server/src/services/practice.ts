import { db } from '../db';
import { practiceSessions, practiceCategories, practiceQuestions, practiceTopics, NewPracticeSession, PracticeSession } from '../db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { StatisticsService } from './statistics';

export class PracticeService {
  // Get topics for a category (unique list from DB questions or practice_topics; JSON fallback)
  async getPracticeTopics(categoryIdentifier: string) {
    try {
      // Resolve category by id (uuid) or slug
      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryIdentifier);
      let category: any | undefined;
      if (looksLikeUuid) {
        [category] = await db
          .select()
          .from(practiceCategories)
          .where(eq(practiceCategories.categoryId, categoryIdentifier))
          .limit(1);
      } else {
        [category] = await db
          .select()
          .from(practiceCategories)
          .where(eq(practiceCategories.slug, categoryIdentifier))
          .limit(1);
      }

      const slug = category?.slug || categoryIdentifier;

      // Prefer curated topics table if present
      if (category) {
        const curated = await db
          .select({ name: practiceTopics.name, slug: practiceTopics.slug })
          .from(practiceTopics)
          .where(eq(practiceTopics.categoryId, category.categoryId));
        if (Array.isArray(curated) && curated.length) {
          return curated.sort((a, b) => a.name.localeCompare(b.name));
        }
      }

      // Fallback: collect distinct topic strings from practice_questions
      if (category) {
        const rows = await db
          .select({ topic: practiceQuestions.topic })
          .from(practiceQuestions)
          .where(eq(practiceQuestions.categoryId, category.categoryId));
        const set = new Set<string>();
        for (const r of rows) {
          const t = (r.topic || '').toString().trim();
          if (t) set.add(t);
        }
        if (set.size) {
          return Array.from(set)
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({ name, slug: this.slugify(name) }));
        }
      }

      // Final fallback: build from JSON questions for this category
      const questions = this.getQuestionsFromJsonFiles(slug, 1000);
      const set = new Set<string>();
      for (const q of questions) {
        const t = (q.topic || '').toString().trim();
        if (t) set.add(t);
      }
      return Array.from(set)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ name, slug: this.slugify(name) }));
    } catch (err) {
      console.error('Error fetching practice topics:', err);
      return [];
    }
  }

  private slugify(input: string) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  // Get available practice categories from database or JSON files
  async getPracticeCategories() {
    try {
      // Try to get categories from database first
      try {
        const categories = await db
          .select({
            id: practiceCategories.categoryId,
            categoryId: practiceCategories.categoryId,
            slug: practiceCategories.slug,
            name: practiceCategories.name,
            description: practiceCategories.description,
            questionCount: practiceCategories.totalQuestions,
            color: practiceCategories.color,
            language: practiceCategories.language,
            timeLimitMinutes: practiceCategories.timeLimitMinutes,
            questionsPerSession: practiceCategories.questionsPerSession
          })
          .from(practiceCategories)
          .where(eq(practiceCategories.status, 'active'))
          .orderBy(practiceCategories.sortOrder, practiceCategories.name);

        if (categories.length > 0) {
          return categories;
        }
      } catch (dbError) {
        console.log('Database categories not available, using JSON file counts');
      }

      // Fallback to hardcoded categories with JSON file counts
      return this.getCategoriesFromJsonFiles();

    } catch (error) {
      console.error('Error fetching practice categories:', error);
      throw new Error('Failed to fetch practice categories');
    }
  }

  // Get categories with question counts from JSON files
  private getCategoriesFromJsonFiles() {
    const categoryMapping = [
      { id: 'economy', name: 'Economy', description: 'Economic concepts and current affairs', color: '#3b82f6', language: 'English', fileName: 'economyEnglish.json' },
      { id: 'gk', name: 'General Knowledge', description: 'General awareness and current events', color: '#10b981', language: 'English', fileName: 'GKEnglish.json' },
      { id: 'history', name: 'History', description: 'Indian and world history', color: '#f59e0b', language: 'English', fileName: 'historyEnglish.json' },
      { id: 'geography', name: 'Geography', description: 'Physical and human geography', color: '#8b5cf6', language: 'English', fileName: 'geographyEnglish.json' },
      { id: 'english', name: 'English', description: 'Grammar and language skills', color: '#ec4899', language: 'English', fileName: 'englishGrammer.json' },
      { id: 'aptitude', name: 'Aptitude', description: 'Quantitative and logical reasoning', color: '#06b6d4', language: 'English', fileName: 'AptitudeEnglish.json' },
      { id: 'agriculture', name: 'Agriculture', description: 'Agricultural science and practices', color: '#84cc16', language: 'English', fileName: 'agricultureEnglish.json' },
      { id: 'marathi', name: 'Marathi', description: 'Marathi language and literature', color: '#f97316', language: 'Marathi', fileName: 'grammerMarathi.json' }
    ];

    return categoryMapping.map(category => {
      try {
        let questionCount = 0;
        const filePath = category.language === 'Marathi' 
          ? `../../../data/Marathi/${category.fileName}`
          : `../../../data/English/${category.fileName}`;
        
        const questionsData = require(filePath);
        if (Array.isArray(questionsData)) {
          questionCount = questionsData.length;
        }
        
        return {
          ...category,
          questionCount,
          timeLimitMinutes: 15,
          questionsPerSession: 20
        };
      } catch (error) {
        console.error(`Error loading question count for ${category.name}:`, error);
        return {
          ...category,
          questionCount: 0,
          timeLimitMinutes: 15,
          questionsPerSession: 20
        };
      }
    });
  }

  // Get random questions from database or JSON files
  async getRandomQuestions(categorySlug: string, count: number = 20, language: 'en' | 'mr' = 'en') {
    try {
      // Quick path: for Marathi, bypass DB and use JSON directly
      if (language === 'mr') {
        return this.getQuestionsFromJsonFiles(categorySlug, count, language);
      }
      // First try to get questions from database
      try {
        const [category] = await db
          .select()
          .from(practiceCategories)
          .where(and(
            eq(practiceCategories.slug, categorySlug),
            eq(practiceCategories.status, 'active')
          ))
          .limit(1);

        if (category) {
          const questions = await db
            .select()
            .from(practiceQuestions)
            .where(and(
              eq(practiceQuestions.categoryId, category.categoryId),
              eq(practiceQuestions.status, 'active')
            ))
            .orderBy(sql`RANDOM()`)
            .limit(Math.min(count, category.totalQuestions));

          if (questions.length > 0) {
            console.log(`Loading ${questions.length} questions from DATABASE for category: ${categorySlug}`);
            console.log('Sample question from database:', {
              questionId: questions[0].questionId,
              questionText: questions[0].questionText,
              correctAnswer: questions[0].correctAnswer,
              correctOption: questions[0].correctOption,
              options: questions[0].options,
              hasCorrectOption: 'correctOption' in questions[0]
            });
            return questions.map((q) => ({
              questionId: q.questionId,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              correctOption: q.correctOption, // Add the new field
              explanation: q.explanation || '',
              category: categorySlug,
              marks: q.marks,
              questionType: q.questionType,
              difficulty: q.difficulty
            }));
          }
        }
      } catch (dbError) {
        console.log('Database questions not available, falling back to JSON files');
      }

      // Fallback to JSON files
      console.log(`No questions found in database for category: ${categorySlug}, falling back to JSON files`);
      return this.getQuestionsFromJsonFiles(categorySlug, count, language);

    } catch (error) {
      console.error('Error loading questions:', error);
      throw new Error('Failed to load questions');
    }
  }

  // Load questions from JSON files as fallback
  private getQuestionsFromJsonFiles(categorySlug: string, count: number = 20, language: 'en' | 'mr' = 'en') {
    try {
      let questionsData: any[] = [];
      
      // Load questions based on category
      switch (categorySlug) {
        case 'economy':
          questionsData = language === 'mr'
            ? require('../../../data/Marathi/economyMarathi.json')
            : require('../../../data/English/economyEnglish.json');
          break;
        case 'gk':
          questionsData = require('../../../data/English/GKEnglish.json');
          break;
        case 'history':
          questionsData = require('../../../data/English/historyEnglish.json');
          break;
        case 'polity':
          // Marathi quick path uses Marathi JSON; English prefers DB and falls back to extra JSON
          questionsData = language === 'mr'
            ? require('../../../data/Marathi/polityMarathi.json')
            : require('../../../data/English/polityExtra.json');
          break;
        case 'geography':
          questionsData = require('../../../data/English/geographyEnglish.json');
          break;
        case 'english':
          questionsData = require('../../../data/English/englishGrammer.json');
          break;
        case 'aptitude':
          questionsData = require('../../../data/English/AptitudeEnglish.json');
          break;
        case 'agriculture':
          questionsData = require('../../../data/English/agricultureEnglish.json');
          break;
        case 'current-affairs':
          questionsData = language === 'mr'
            ? require('../../../data/Marathi/currentAffairsMarathi.json')
            : require('../../../data/English/currentAffairsEnglish.json');
          break;
        case 'marathi':
          questionsData = require('../../../data/Marathi/grammerMarathi.json');
          break;
        default:
          throw new Error('Category not found');
      }

      if (!Array.isArray(questionsData)) {
        throw new Error('Invalid JSON format');
      }

      // Shuffle and select required number of questions
      const shuffled = questionsData.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, count);

      // Transform to our format
      console.log(`Loading ${selectedQuestions.length} questions from JSON FILES for category: ${categorySlug}`);
      console.log('Sample question from JSON:', {
        questionText: selectedQuestions[0].Question,
        correctAnswer: selectedQuestions[0].CorrectAnswer,
        answer: selectedQuestions[0].Answer,
        options: selectedQuestions[0].Options
      });
      
      return selectedQuestions.map((q: any, index: number) => {
        console.log(`Processing question ${index + 1}:`, {
          questionText: q.Question,
          options: q.Options,
          correctAnswer: q.CorrectAnswer,
          answer: q.Answer
        });
        
        // Process options first
        const processedOptions = q.Options ? q.Options.map((opt: any, optIndex: number) => {
          // Handle different option formats
          if (typeof opt === 'string') {
            return {
              id: optIndex + 1,
              text: opt
            };
          } else if (opt && typeof opt === 'object') {
            return {
              id: opt.id || optIndex + 1,
              text: opt.text || opt.label || opt.value || String(opt)
            };
          } else {
            return {
              id: optIndex + 1,
              text: String(opt || '')
            };
          }
        }) : [];
        
        // Extract correct option ID and answer text
        let correctOption: number | null = null;
        let correctAnswerText: string = '';
        
        // Try to get correctOption from the question data first
        if (q.correctOption) {
          correctOption = parseInt(q.correctOption);
        } else if (q.Answer) {
          // Extract option number from "Option X" format
          const optionMatch = q.Answer.match(/Option\s*(\d+)/i);
          if (optionMatch) {
            correctOption = parseInt(optionMatch[1]);
          }
        } else if (q.CorrectAnswer) {
          // Extract option number from "Option X" format
          const optionMatch = q.CorrectAnswer.match(/Option\s*(\d+)/i);
          if (optionMatch) {
            correctOption = parseInt(optionMatch[1]);
          }
        }
        
        // Get the actual answer text from the options
        if (correctOption && processedOptions.length > 0) {
          const correctOptionObj = processedOptions.find(opt => opt.id === correctOption);
          if (correctOptionObj) {
            correctAnswerText = correctOptionObj.text;
          }
        }
        
        // Fallback to original values if extraction failed
        if (!correctAnswerText) {
          correctAnswerText = q.CorrectAnswer || q.correctAnswer || '';
        }
        
        console.log(`Processed question ${index + 1}:`, {
          questionId: `${categorySlug}_${index + 1}`,
          correctOption,
          correctAnswerText,
          originalCorrectOption: q.correctOption,
          originalCorrectAnswer: q.CorrectAnswer,
          processedOptions: processedOptions.map(opt => ({ id: opt.id, text: opt.text }))
        });
        
        return {
          questionId: `${categorySlug}_${index + 1}`,
          questionText: q.Question || q.question || '',
          options: processedOptions,
          correctAnswer: correctAnswerText,
          correctOption: correctOption,
          explanation: q.Explanation || q.explanation || '',
          category: categorySlug,
          topic: q.topic || 'general',
          marks: 1,
          questionType: 'mcq',
          difficulty: 'medium'
        };
      });

    } catch (error) {
      console.error('Error loading questions from JSON:', error);
      throw new Error('Failed to load questions from JSON files');
    }
  }

  // Create a new practice session
  async createPracticeSession(userId: string, categoryIdentifier: string, timeLimitMinutes: number = 15, language: 'en' | 'mr' = 'en') {
    try {
      console.log('createPracticeSession service called with:', {
        userId,
        categoryIdentifier,
        timeLimitMinutes,
        language,
        categoryIdentifierType: typeof categoryIdentifier
      });
      
      // Get category details - try by ID first (if it's a valid UUID), then by slug
      let category = null;
      
      // Check if categoryIdentifier is a valid UUID before attempting UUID lookup
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(categoryIdentifier);
      
      if (isUUID) {
        [category] = await db
          .select()
          .from(practiceCategories)
          .where(and(
            eq(practiceCategories.categoryId, categoryIdentifier),
            eq(practiceCategories.status, 'active')
          ))
          .limit(1);
        console.log('Category lookup by UUID result:', category ? 'Found' : 'Not found', categoryIdentifier);
      } else {
        console.log('Category identifier is not a UUID, skipping UUID lookup:', categoryIdentifier);
      }

      // If not found by ID (or not a UUID), try by slug
      if (!category) {
        [category] = await db
          .select()
          .from(practiceCategories)
          .where(and(
            eq(practiceCategories.slug, categoryIdentifier),
            eq(practiceCategories.status, 'active')
          ))
          .limit(1);
        console.log('Category lookup by slug result:', category ? 'Found' : 'Not found', categoryIdentifier);
      }

      if (!category) {
        // Let's check what categories are available in the database
        const allCategories = await db
          .select({
            categoryId: practiceCategories.categoryId,
            slug: practiceCategories.slug,
            name: practiceCategories.name,
            status: practiceCategories.status
          })
          .from(practiceCategories);
        console.error('Category not found. Available categories:', allCategories);
        throw new Error(`Category not found: "${categoryIdentifier}". Available categories: ${allCategories.map(c => c.slug || c.name).join(', ')}`);
      }

      const questions = await this.getRandomQuestions(category.slug, category.questionsPerSession, language);
      
      const newSession: NewPracticeSession = {
        userId,
        category: category.slug as any,
        totalQuestions: questions.length,
        timeLimitMinutes: timeLimitMinutes,
        status: 'in_progress',
        questionsData: questions.map(q => ({
          questionId: q.questionId,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          correctOption: q.correctOption,
          userAnswer: '',
          isCorrect: false,
          timeSpentSeconds: 0,
          explanation: q.explanation,
          category: q.category,
          topic: q.topic
        }))
      };

      const [session] = await db.insert(practiceSessions).values(newSession).returning();
      
      console.log('Created practice session:', session);
      console.log('Session ID:', session.sessionId);
      console.log('Sample question data in session:', {
        questionId: questions[0]?.questionId,
        correctOption: questions[0]?.correctOption,
        correctAnswer: questions[0]?.correctAnswer,
        options: questions[0]?.options,
        totalQuestions: questions.length,
        firstFewQuestionIds: questions.slice(0, 3).map(q => q.questionId)
      });
      
      return {
        session,
        questions
      };
    } catch (error: any) {
      console.error('Error creating practice session:', error);
      console.error('Error creating practice session details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        categoryIdentifier
      });
      // Preserve the original error message instead of masking it
      throw error instanceof Error ? error : new Error(error?.message || 'Failed to create practice session');
    }
  }

  // Get practice session by ID
  async getPracticeSession(sessionId: string, userId: string) {
    try {
      const [session] = await db
        .select()
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.sessionId, sessionId),
          eq(practiceSessions.userId, userId)
        ))
        .limit(1);

      return session;
    } catch (error) {
      console.error('Error fetching practice session:', error);
      throw new Error('Failed to fetch practice session');
    }
  }

  // Update practice session with answer
  async updatePracticeSessionAnswer(
    sessionId: string, 
    userId: string, 
    questionId: string, 
    userAnswer: string,
    timeSpentSeconds: number
  ) {
    try {
      const session = await this.getPracticeSession(sessionId, userId);
      
      if (!session) {
        throw new Error('Practice session not found');
      }

      if (session.status !== 'in_progress') {
        throw new Error('Session is not active');
      }

      // Update questions data
      const questionsData = session.questionsData || [];
      const questionIndex = questionsData.findIndex((q: any) => q.questionId === questionId);
      
      if (questionIndex === -1) {
        throw new Error('Question not found in session');
      }

      // Get the correct answer and correctOption from session data
      let correctAnswer: string;
      let correctOption: number | null = null;
      
      // First try to get from the session's questionsData (which contains full question data)
      if (session.questionsData && Array.isArray(session.questionsData)) {
        const sessionQuestionData = session.questionsData.find((q: any) => q.questionId === questionId);
        if (sessionQuestionData) {
          correctAnswer = sessionQuestionData.correctAnswer;
          correctOption = sessionQuestionData.correctOption;
          console.log('Found session question data:', {
            questionId,
            correctAnswer: sessionQuestionData.correctAnswer,
            correctOption: sessionQuestionData.correctOption,
            hasCorrectOption: 'correctOption' in sessionQuestionData,
            allKeys: Object.keys(sessionQuestionData)
          });
        } else {
          console.log('Session question not found for questionId:', questionId);
        }
      }
      
      // If not found in session data, try database
      if (correctOption === null) {
        try {
          const [question] = await db
            .select()
            .from(practiceQuestions)
            .where(eq(practiceQuestions.questionId, questionId))
            .limit(1);
          
          if (question) {
            correctAnswer = question.correctAnswer;
            correctOption = question.correctOption;
          }
        } catch (dbError) {
          console.log('Database lookup failed:', dbError.message);
        }
      }
      
      // Final fallback to questionsData array (legacy support)
      if (correctOption === null && questionsData[questionIndex]) {
        const sessionQuestion = questionsData[questionIndex];
        correctAnswer = sessionQuestion.correctAnswer;
        correctOption = sessionQuestion.correctOption;
      }

      // Parse user answer - it should be the option ID (1, 2, 3, 4)
      const selectedOptionId = parseInt(userAnswer);
      const isCorrect = !isNaN(selectedOptionId) && correctOption !== null && selectedOptionId === correctOption;

      // Debug logging for answer comparison
      console.log('Answer validation debug:', {
        questionId,
        userAnswer: `"${userAnswer}"`,
        selectedOptionId,
        correctAnswer: `"${correctAnswer}"`,
        correctOption,
        userAnswerType: typeof userAnswer,
        correctAnswerType: typeof correctAnswer,
        areEqual: isCorrect,
        validationMethod: 'optionId',
        sessionQuestionsDataLength: session.questionsData ? session.questionsData.length : 0,
        questionsDataLength: questionsData.length,
        sessionQuestionFound: session.questionsData ? !!session.questionsData.find((q: any) => q.questionId === questionId) : false
      });
      
      questionsData[questionIndex] = {
        questionId,
        userAnswer,
        isCorrect,
        timeSpentSeconds
      };

      // Update session statistics
      const correctAnswers = questionsData.filter((q: any) => q.isCorrect).length;
      const questionsAttempted = questionsData.filter((q: any) => q.userAnswer !== '').length;
      const incorrectAnswers = questionsAttempted - correctAnswers;
      const skippedQuestions = (session.totalQuestions || 0) - questionsAttempted;
      
      const percentage = (session.totalQuestions || 0) > 0 ? (correctAnswers / (session.totalQuestions || 1)) * 100 : 0;

      await db
        .update(practiceSessions)
        .set({
          questionsData,
          correctAnswers,
          incorrectAnswers,
          questionsAttempted,
          skippedQuestions,
          percentage: percentage.toString(),
          timeSpentSeconds: (session.timeSpentSeconds || 0) + timeSpentSeconds,
          updatedAt: new Date()
        })
        .where(eq(practiceSessions.sessionId, sessionId));

      return { isCorrect, correctAnswer };
    } catch (error) {
      console.error('Error updating practice session:', error);
      throw new Error('Failed to update practice session');
    }
  }

  // Complete practice session
  async completePracticeSession(sessionId: string, userId: string) {
    try {
      const session = await this.getPracticeSession(sessionId, userId);
      
      if (!session) {
        throw new Error('Practice session not found');
      }

      await db
        .update(practiceSessions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(practiceSessions.sessionId, sessionId));

      // Update user statistics
      const statisticsService = new StatisticsService();
      console.log('Updating practice statistics for user:', userId, {
        questionsAttempted: session.questionsAttempted || 0,
        correctAnswers: session.correctAnswers || 0,
        incorrectAnswers: session.incorrectAnswers || 0,
        skippedQuestions: session.skippedQuestions || 0,
        timeSpentMinutes: Math.floor((session.timeSpentSeconds || 0) / 60),
      });
      
      // Update overall statistics
      await statisticsService.updatePracticeStatistics(userId, {
        questionsAttempted: session.questionsAttempted || 0,
        correctAnswers: session.correctAnswers || 0,
        incorrectAnswers: session.incorrectAnswers || 0,
        skippedQuestions: session.skippedQuestions || 0,
        timeSpentMinutes: Math.floor((session.timeSpentSeconds || 0) / 60),
      });
      
      // Update subject-specific statistics
      // First, get the category ID from the session
      const [category] = await db
        .select()
        .from(practiceCategories)
        .where(eq(practiceCategories.slug, session.category))
        .limit(1);
      
      if (category) {
        console.log('Updating subject-specific statistics for category:', category.name, category.categoryId);
        await statisticsService.updateSubjectPracticeStatistics(userId, category.categoryId, {
          questionsAttempted: session.questionsAttempted || 0,
          correctAnswers: session.correctAnswers || 0,
          incorrectAnswers: session.incorrectAnswers || 0,
          skippedQuestions: session.skippedQuestions || 0,
          timeSpentMinutes: Math.floor((session.timeSpentSeconds || 0) / 60),
        });
        console.log('Subject-specific statistics updated successfully');
      } else {
        console.log('Category not found for slug:', session.category);
      }
      
      console.log('Practice statistics updated successfully');

      return session;
    } catch (error) {
      console.error('Error completing practice session:', error);
      throw new Error('Failed to complete practice session');
    }
  }

  // Get user's practice history
  async getUserPracticeHistory(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const sessions = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, userId))
        .orderBy(desc(practiceSessions.createdAt))
        .limit(limit)
        .offset(offset);

      return sessions;
    } catch (error) {
      console.error('Error fetching practice history:', error);
      throw new Error('Failed to fetch practice history');
    }
  }

  // Get practice statistics for user
  async getUserPracticeStats(userId: string) {
    try {
      const [totalSessions] = await db
        .select({ count: count() })
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, userId));

      const [completedSessions] = await db
        .select({ count: count() })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          eq(practiceSessions.status, 'completed')
        ));

      const sessions = await db
        .select({
          correctAnswers: practiceSessions.correctAnswers,
          totalQuestions: practiceSessions.totalQuestions,
          timeSpentSeconds: practiceSessions.timeSpentSeconds
        })
        .from(practiceSessions)
        .where(and(
          eq(practiceSessions.userId, userId),
          eq(practiceSessions.status, 'completed')
        ));

      const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
      const totalQuestions = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
      const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);

      return {
        totalSessions: totalSessions.count,
        completedSessions: completedSessions.count,
        totalCorrectAnswers: totalCorrect,
        totalQuestionsAttempted: totalQuestions,
        averageAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
        totalTimeSpentMinutes: Math.round(totalTimeSpent / 60),
        averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTimeSpent / totalQuestions) : 0
      };
    } catch (error) {
      console.error('Error fetching practice stats:', error);
      throw new Error('Failed to fetch practice statistics');
    }
  }
}

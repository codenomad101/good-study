// Data service to load and process data from backend API
import { practiceAPI } from './api';

export interface Question {
  questionId: string;
  questionText: string;
  options: Array<{ id: number; text: string }>;
  correctAnswer: string;
  correctOption: number | null;
  explanation: string;
  category: string;
  marks: number;
  questionType: string;
  difficulty: string;
  job: string[];
}

export interface CategoryData {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  color: string;
  language: 'English' | 'Marathi';
  fileName: string;
}

// Category mapping based on the JSON files in the data folder
const categoryMapping: CategoryData[] = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Economic concepts and current affairs',
    questionCount: 0, // Will be calculated dynamically
    color: '#3b82f6',
    language: 'English',
    fileName: 'economyEnglish.json'
  },
  {
    id: 'gk',
    name: 'General Knowledge',
    description: 'General awareness and current events',
    questionCount: 0, // Will be calculated dynamically
    color: '#10b981',
    language: 'English',
    fileName: 'GKEnglish.json'
  },
  {
    id: 'history',
    name: 'History',
    description: 'Indian and world history',
    questionCount: 0, // Will be calculated dynamically
    color: '#f59e0b',
    language: 'English',
    fileName: 'historyEnglish.json'
  },
  {
    id: 'geography',
    name: 'Geography',
    description: 'Physical and human geography',
    questionCount: 0, // Will be calculated dynamically
    color: '#8b5cf6',
    language: 'English',
    fileName: 'geographyEnglish.json'
  },
  {
    id: 'english',
    name: 'English',
    description: 'Grammar and language skills',
    questionCount: 0, // Will be calculated dynamically
    color: '#ec4899',
    language: 'English',
    fileName: 'englishGrammer.json'
  },
  {
    id: 'aptitude',
    name: 'Aptitude',
    description: 'Quantitative and logical reasoning',
    questionCount: 0, // Will be calculated dynamically
    color: '#06b6d4',
    language: 'English',
    fileName: 'AptitudeEnglish.json'
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Agricultural science and practices',
    questionCount: 0, // Will be calculated dynamically
    color: '#84cc16',
    language: 'English',
    fileName: 'agricultureEnglish.json'
  },
  {
    id: 'marathi',
    name: 'Marathi',
    description: 'Marathi language and literature',
    questionCount: 0, // Will be calculated dynamically
    color: '#f97316',
    language: 'Marathi',
    fileName: 'grammerMarathi.json'
  }
];

class DataService {
  private questionCache: Map<string, Question[]> = new Map();

  // Get all categories with updated question counts from backend
  async getCategories(): Promise<CategoryData[]> {
    try {
      // Get categories from backend
      const backendCategories = await practiceAPI.getCategories();
      
      // Map backend categories to our frontend format
      const categories = backendCategories.map((bc: any) => ({
        id: bc.categoryId || bc.id,
        name: bc.name,
        description: bc.description || '',
        questionCount: bc.questionCount || 0,
        color: bc.color || '#1890ff',
        language: bc.language === 'mr' ? 'Marathi' : 'English',
        fileName: this.getFileNameForCategory(bc.slug)
      }));

      return categories;
    } catch (error) {
      console.error('Error loading categories from backend:', error);
      // Fallback to frontend data with estimated counts
      return categoryMapping.map(category => ({
        ...category,
        questionCount: 200 // Default estimate
      }));
    }
  }

  getFileNameForCategory(slug: string): string {
    const fileNameMap: { [key: string]: string } = {
      'economy': 'economyEnglish.json',
      'gk': 'GKEnglish.json',
      'history': 'historyEnglish.json',
      'geography': 'geographyEnglish.json',
      'english': 'englishGrammer.json',
      'aptitude': 'AptitudeEnglish.json',
      'agriculture': 'agricultureEnglish.json',
      'marathi': 'grammerMarathi.json'
    };
    return fileNameMap[slug] || 'unknown.json';
  }

  // Get a specific category by ID
  async getCategoryById(categoryId: string): Promise<CategoryData | undefined> {
    try {
      const categories = await this.getCategories();
      return categories.find(cat => cat.id === categoryId);
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      return categoryMapping.find(cat => cat.id === categoryId);
    }
  }

  // Create a practice session via backend
  async createPracticeSession(categoryId: string, timeLimitMinutes: number = 15) {
    try {
      const response = await practiceAPI.createSession(categoryId, timeLimitMinutes);
      return response.data;
    } catch (error) {
      console.error('Error creating practice session:', error);
      throw error;
    }
  }

  // Get practice session from backend
  async getPracticeSession(sessionId: string) {
    try {
      const response = await practiceAPI.getSession(sessionId);
      return response.data;
    } catch (error) {
      console.error('Error getting practice session:', error);
      throw error;
    }
  }

  // Update practice session answer via backend
  async updatePracticeAnswer(sessionId: string, questionId: string, userAnswer: string, timeSpentSeconds: number) {
    try {
      const response = await practiceAPI.updateAnswer(sessionId, questionId, userAnswer, timeSpentSeconds);
      return response.data;
    } catch (error) {
      console.error('Error updating practice answer:', error);
      throw error;
    }
  }

  // Complete practice session via backend
  async completePracticeSession(sessionId: string) {
    try {
      const response = await practiceAPI.completeSession(sessionId);
      return response.data;
    } catch (error) {
      console.error('Error completing practice session:', error);
      throw error;
    }
  }

  // Get user's practice history from backend
  async getUserPracticeHistory() {
    try {
      const response = await practiceAPI.getHistory();
      return response || [];
    } catch (error) {
      console.error('Error getting practice history:', error);
      return [];
    }
  }

  // Get user's practice statistics from backend
  async getUserPracticeStats() {
    try {
      const response = await practiceAPI.getStats();
      return response || {};
    } catch (error) {
      console.error('Error getting practice stats:', error);
      return {};
    }
  }

  // Legacy methods for backward compatibility (now using backend)
  async loadQuestions(categoryId: string): Promise<Question[]> {
    // This method is now handled by the backend when creating a practice session
    throw new Error('Use createPracticeSession instead of loadQuestions');
  }

  async getQuestionsForCategory(categoryId: string): Promise<Question[]> {
    // This method is now handled by the backend when creating a practice session
    throw new Error('Use createPracticeSession instead of getQuestionsForCategory');
  }

  async getRandomQuestions(categoryId: string, count: number = 20): Promise<Question[]> {
    // This method is now handled by the backend when creating a practice session
    throw new Error('Use createPracticeSession instead of getRandomQuestions');
  }
}

export const dataService = new DataService();
export default dataService;

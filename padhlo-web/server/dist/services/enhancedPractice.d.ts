export declare class EnhancedPracticeService {
    createPracticeSession(userId: string, category: string, sessionData: any): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        totalQuestions: number | null;
        startedAt: Date;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        percentage: string | null;
        sessionId: string;
        category: "economy" | "gk" | "history" | "geography" | "english" | "aptitude" | "agriculture" | "marathi";
        status: "in_progress" | "completed" | "abandoned" | null;
        timeLimitMinutes: number | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
        score: string | null;
        questionsData: {
            questionId: string;
            questionText: string;
            options: Array<{
                id: number;
                text: string;
            }>;
            correctAnswer: string;
            userAnswer: string;
            isCorrect: boolean;
            timeSpentSeconds: number;
            explanation: string;
            category: string;
        }[] | null;
    }>;
    updateUserPracticeStats(userId: string, sessionData: any): Promise<void>;
    getUserPracticeHistory(userId: string, limit?: number, offset?: number): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        totalQuestions: number | null;
        startedAt: Date;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        percentage: string | null;
        sessionId: string;
        category: "economy" | "gk" | "history" | "geography" | "english" | "aptitude" | "agriculture" | "marathi";
        status: "in_progress" | "completed" | "abandoned" | null;
        timeLimitMinutes: number | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
        score: string | null;
        questionsData: {
            questionId: string;
            questionText: string;
            options: Array<{
                id: number;
                text: string;
            }>;
            correctAnswer: string;
            userAnswer: string;
            isCorrect: boolean;
            timeSpentSeconds: number;
            explanation: string;
            category: string;
        }[] | null;
    }[]>;
    getUserPracticeStats(userId: string): Promise<{
        totalPracticeSessions: number;
        totalPracticeScore: number;
        weeklyPracticeScore: number;
        monthlyPracticeScore: number;
        weeklyPracticeCount: number;
        monthlyPracticeCount: number;
        lastPracticeDate: Date | null;
        currentStreak: number;
        longestStreak: number;
        totalCorrectAnswers: number;
        totalQuestionsAttempted: number;
        averageAccuracy: number;
        totalTimeSpentMinutes: number;
        averageTimePerQuestion: number;
        categoryPerformance: any;
        recentSessions: {
            correctAnswers: number | null;
            totalQuestions: number | null;
            percentage: number;
            category: "economy" | "gk" | "history" | "geography" | "english" | "aptitude" | "agriculture" | "marathi";
            timeSpentMinutes: number;
            createdAt: Date;
        }[];
    }>;
    getSessionWithExplanations(sessionId: string, userId: string): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        totalQuestions: number | null;
        startedAt: Date;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        percentage: string | null;
        sessionId: string;
        category: "economy" | "gk" | "history" | "geography" | "english" | "aptitude" | "agriculture" | "marathi";
        status: "in_progress" | "completed" | "abandoned" | null;
        timeLimitMinutes: number | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
        score: string | null;
        questionsData: {
            questionId: string;
            questionText: string;
            options: Array<{
                id: number;
                text: string;
            }>;
            correctAnswer: string;
            userAnswer: string;
            isCorrect: boolean;
            timeSpentSeconds: number;
            explanation: string;
            category: string;
        }[] | null;
    }>;
}
//# sourceMappingURL=enhancedPractice.d.ts.map
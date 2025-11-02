export declare class PracticeService {
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
        totalSessions: number;
        completedSessions: number;
        totalCorrectAnswers: number;
        totalQuestionsAttempted: number;
        averageAccuracy: number;
        totalTimeSpentMinutes: number;
        averageTimePerQuestion: number;
    }>;
}
//# sourceMappingURL=simplePractice.d.ts.map
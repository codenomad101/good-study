import { type NewDailyPracticeSession, type NewUserQuestionHistory } from '../db/schema';
export declare class ProgressService {
    getUserProgress(userId: string, subjectId?: string): Promise<{
        userId: string;
        updatedAt: Date;
        subjectId: string;
        topicId: string;
        totalQuestionsAttempted: number | null;
        correctAnswers: number | null;
        progressId: string;
        totalTimeSpentSeconds: number | null;
        masteryLevel: "beginner" | "intermediate" | "advanced" | "expert" | null;
        masteryPercentage: string | null;
        lastPracticedAt: Date | null;
        practiceCount: number | null;
        averageAccuracy: string | null;
        averageTimePerQuestionSeconds: number | null;
        needsRevision: boolean | null;
    }[]>;
    getUserProgressByTopic(userId: string, topicId: string): Promise<{
        userId: string;
        updatedAt: Date;
        subjectId: string;
        topicId: string;
        totalQuestionsAttempted: number | null;
        correctAnswers: number | null;
        progressId: string;
        totalTimeSpentSeconds: number | null;
        masteryLevel: "beginner" | "intermediate" | "advanced" | "expert" | null;
        masteryPercentage: string | null;
        lastPracticedAt: Date | null;
        practiceCount: number | null;
        averageAccuracy: string | null;
        averageTimePerQuestionSeconds: number | null;
        needsRevision: boolean | null;
    }>;
    updateUserProgress(userId: string, topicId: string, subjectId: string, progressData: {
        totalQuestionsAttempted?: number;
        correctAnswers?: number;
        totalTimeSpentSeconds?: number;
        masteryLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        masteryPercentage?: number;
        averageAccuracy?: number;
        averageTimePerQuestionSeconds?: number;
        needsRevision?: boolean;
    }): Promise<{
        userId: string;
        updatedAt: Date;
        subjectId: string;
        topicId: string;
        totalQuestionsAttempted: number | null;
        correctAnswers: number | null;
        progressId: string;
        totalTimeSpentSeconds: number | null;
        masteryLevel: "beginner" | "intermediate" | "advanced" | "expert" | null;
        masteryPercentage: string | null;
        lastPracticedAt: Date | null;
        practiceCount: number | null;
        averageAccuracy: string | null;
        averageTimePerQuestionSeconds: number | null;
        needsRevision: boolean | null;
    }>;
    createDailyPracticeSession(sessionData: NewDailyPracticeSession): Promise<any>;
    getUserDailyPracticeSessions(userId: string, startDate?: string, endDate?: string): Promise<{
        [x: string]: any;
    }[]>;
    updateDailyPracticeSession(sessionId: string, updateData: {
        totalQuestions?: number;
        questionsAttempted?: number;
        correctAnswers?: number;
        timeSpentSeconds?: number;
        accuracyPercentage?: number;
        pointsEarned?: number;
        isCompleted?: boolean;
    }): Promise<any>;
    addQuestionHistory(historyData: NewUserQuestionHistory): Promise<any>;
    getUserQuestionHistory(userId: string, questionId?: string, limit?: number): Promise<{
        [x: string]: any;
    }[]>;
    getUserStats(userId: string, days?: number): Promise<{
        totalQuestions: number;
        totalCorrect: number;
        totalTimeSpent: number;
        totalPoints: number;
        accuracy: number;
        averageTimePerQuestion: number;
        currentStreak: number;
        longestStreak: number;
        sessionsCompleted: number;
        totalSessions: number;
    }>;
    getSubjectWiseProgress(userId: string): Promise<unknown[]>;
    getWeakTopics(userId: string, limit?: number): Promise<{
        userId: string;
        updatedAt: Date;
        subjectId: string;
        topicId: string;
        totalQuestionsAttempted: number | null;
        correctAnswers: number | null;
        progressId: string;
        totalTimeSpentSeconds: number | null;
        masteryLevel: "beginner" | "intermediate" | "advanced" | "expert" | null;
        masteryPercentage: string | null;
        lastPracticedAt: Date | null;
        practiceCount: number | null;
        averageAccuracy: string | null;
        averageTimePerQuestionSeconds: number | null;
        needsRevision: boolean | null;
    }[]>;
}
//# sourceMappingURL=progress.d.ts.map
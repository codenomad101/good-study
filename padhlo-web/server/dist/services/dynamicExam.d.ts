export declare class DynamicExamService {
    createExamSession(userId: string, examConfig: {
        examName: string;
        totalMarks: number;
        durationMinutes: number;
        questionDistribution: Array<{
            category: string;
            count: number;
            marksPerQuestion: number;
        }>;
        negativeMarking?: boolean;
        negativeMarksRatio?: number;
    }): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        examName: string;
        totalMarks: number;
        durationMinutes: number;
        negativeMarking: boolean | null;
        negativeMarksRatio: string | null;
        totalQuestions: number;
        startedAt: Date | null;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        marksObtained: string | null;
        percentage: string | null;
        sessionId: string;
        status: "not_started" | "in_progress" | "completed" | "abandoned" | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
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
            marksObtained: number;
            category: string;
        }[] | null;
        questionDistribution: {
            category: string;
            count: number;
            marksPerQuestion: number;
        }[];
    }>;
    startExamSession(sessionId: string, userId: string): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        examName: string;
        totalMarks: number;
        durationMinutes: number;
        negativeMarking: boolean | null;
        negativeMarksRatio: string | null;
        totalQuestions: number;
        startedAt: Date | null;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        marksObtained: string | null;
        percentage: string | null;
        sessionId: string;
        status: "not_started" | "in_progress" | "completed" | "abandoned" | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
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
            marksObtained: number;
            category: string;
        }[] | null;
        questionDistribution: {
            category: string;
            count: number;
            marksPerQuestion: number;
        }[];
    }>;
    updateExamSessionQuestions(sessionId: string, userId: string, questionsData: Array<{
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
        marksObtained: number;
        category: string;
    }>): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        examName: string;
        totalMarks: number;
        durationMinutes: number;
        negativeMarking: boolean | null;
        negativeMarksRatio: string | null;
        totalQuestions: number;
        startedAt: Date | null;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        marksObtained: string | null;
        percentage: string | null;
        sessionId: string;
        status: "not_started" | "in_progress" | "completed" | "abandoned" | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
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
            marksObtained: number;
            category: string;
        }[] | null;
        questionDistribution: {
            category: string;
            count: number;
            marksPerQuestion: number;
        }[];
    }>;
    completeExamSession(sessionId: string, userId: string, completionData: {
        timeSpentSeconds: number;
        questionsAttempted: number;
        correctAnswers: number;
        incorrectAnswers: number;
        skippedQuestions: number;
        marksObtained: number;
        percentage: number;
    }): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        examName: string;
        totalMarks: number;
        durationMinutes: number;
        negativeMarking: boolean | null;
        negativeMarksRatio: string | null;
        totalQuestions: number;
        startedAt: Date | null;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        marksObtained: string | null;
        percentage: string | null;
        sessionId: string;
        status: "not_started" | "in_progress" | "completed" | "abandoned" | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
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
            marksObtained: number;
            category: string;
        }[] | null;
        questionDistribution: {
            category: string;
            count: number;
            marksPerQuestion: number;
        }[];
    }>;
    getExamSession(sessionId: string, userId: string): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        examName: string;
        totalMarks: number;
        durationMinutes: number;
        negativeMarking: boolean | null;
        negativeMarksRatio: string | null;
        totalQuestions: number;
        startedAt: Date | null;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        marksObtained: string | null;
        percentage: string | null;
        sessionId: string;
        status: "not_started" | "in_progress" | "completed" | "abandoned" | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
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
            marksObtained: number;
            category: string;
        }[] | null;
        questionDistribution: {
            category: string;
            count: number;
            marksPerQuestion: number;
        }[];
    }>;
    getUserExamHistory(userId: string, limit?: number, offset?: number): Promise<{
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        examName: string;
        totalMarks: number;
        durationMinutes: number;
        negativeMarking: boolean | null;
        negativeMarksRatio: string | null;
        totalQuestions: number;
        startedAt: Date | null;
        completedAt: Date | null;
        correctAnswers: number | null;
        incorrectAnswers: number | null;
        skippedQuestions: number | null;
        marksObtained: string | null;
        percentage: string | null;
        sessionId: string;
        status: "not_started" | "in_progress" | "completed" | "abandoned" | null;
        timeSpentSeconds: number | null;
        questionsAttempted: number | null;
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
            marksObtained: number;
            category: string;
        }[] | null;
        questionDistribution: {
            category: string;
            count: number;
            marksPerQuestion: number;
        }[];
    }[]>;
    getUserExamStats(userId: string): Promise<{
        totalSessions: number;
        totalMarks: number;
        totalTimeMinutes: number;
        averagePercentage: number;
        recentExams: {
            examName: string;
            marksObtained: string | null;
            percentage: string | null;
            completedAt: Date | null;
        }[];
    }>;
    generateQuestionsFromCategories(questionDistribution: Array<{
        category: string;
        count: number;
        marksPerQuestion: number;
    }>): Promise<any[]>;
}
//# sourceMappingURL=dynamicExam.d.ts.map
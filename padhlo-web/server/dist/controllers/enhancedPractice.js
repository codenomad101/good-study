"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedPracticeController = void 0;
const enhancedPractice_1 = require("../services/enhancedPractice");
const practiceService = new enhancedPractice_1.EnhancedPracticeService();
class EnhancedPracticeController {
    // Complete a practice session with detailed scoring
    async completePracticeSession(req, res) {
        try {
            const { userId } = req.params;
            const sessionData = req.body;
            // Validate required fields
            if (!sessionData.questionsData || !Array.isArray(sessionData.questionsData)) {
                return res.status(400).json({
                    success: false,
                    message: 'Questions data is required'
                });
            }
            // Calculate session statistics
            const questionsData = sessionData.questionsData;
            const correctAnswers = questionsData.filter((q) => q.isCorrect).length;
            const incorrectAnswers = questionsData.filter((q) => !q.isCorrect && q.userAnswer).length;
            const skippedQuestions = questionsData.filter((q) => !q.userAnswer).length;
            const questionsAttempted = correctAnswers + incorrectAnswers;
            const percentage = questionsData.length > 0 ? (correctAnswers / questionsData.length) * 100 : 0;
            const enhancedSessionData = {
                ...sessionData,
                correctAnswers,
                incorrectAnswers,
                questionsAttempted,
                skippedQuestions,
                percentage: percentage.toFixed(2),
                timeSpentSeconds: sessionData.timeSpentSeconds || 0
            };
            const session = await practiceService.createPracticeSession(userId, sessionData.category, enhancedSessionData);
            res.status(201).json({
                success: true,
                message: 'Practice session completed successfully',
                data: {
                    sessionId: session.sessionId,
                    score: correctAnswers,
                    totalQuestions: questionsData.length,
                    percentage: percentage.toFixed(2),
                    timeSpentMinutes: Math.round((sessionData.timeSpentSeconds || 0) / 60),
                    category: sessionData.category,
                    completedAt: session.completedAt
                }
            });
        }
        catch (error) {
            console.error('Error completing practice session:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to complete practice session',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Get user's practice history
    async getUserPracticeHistory(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const sessions = await practiceService.getUserPracticeHistory(userId, parseInt(limit), parseInt(offset));
            res.status(200).json({
                success: true,
                data: sessions
            });
        }
        catch (error) {
            console.error('Error fetching practice history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch practice history',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Get comprehensive practice statistics
    async getUserPracticeStats(req, res) {
        try {
            const { userId } = req.params;
            const stats = await practiceService.getUserPracticeStats(userId);
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error fetching practice stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch practice statistics',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Get detailed session with explanations
    async getSessionDetails(req, res) {
        try {
            const { sessionId, userId } = req.params;
            const session = await practiceService.getSessionWithExplanations(sessionId, userId);
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }
            res.status(200).json({
                success: true,
                data: session
            });
        }
        catch (error) {
            console.error('Error fetching session details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch session details',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.EnhancedPracticeController = EnhancedPracticeController;
//# sourceMappingURL=enhancedPractice.js.map
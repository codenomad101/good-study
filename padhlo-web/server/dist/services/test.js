"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestService = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class TestService {
    // Test Templates
    async getAllTestTemplates(examId) {
        let query = db_1.db.select().from(schema_1.testTemplates).where((0, drizzle_orm_1.eq)(schema_1.testTemplates.isActive, true));
        if (examId) {
            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.testTemplates.isActive, true), (0, drizzle_orm_1.eq)(schema_1.testTemplates.examId, examId)));
        }
        return await query.orderBy((0, drizzle_orm_1.desc)(schema_1.testTemplates.createdAt));
    }
    async getTestTemplateById(templateId) {
        const [template] = await db_1.db.select().from(schema_1.testTemplates).where((0, drizzle_orm_1.eq)(schema_1.testTemplates.templateId, templateId)).limit(1);
        return template;
    }
    async createTestTemplate(templateData) {
        const [createdTemplate] = await db_1.db.insert(schema_1.testTemplates).values(templateData).returning();
        return createdTemplate;
    }
    async updateTestTemplate(templateId, updateData) {
        const [updatedTemplate] = await db_1.db
            .update(schema_1.testTemplates)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.testTemplates.templateId, templateId))
            .returning();
        return updatedTemplate;
    }
    async deleteTestTemplate(templateId) {
        await db_1.db.update(schema_1.testTemplates).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.testTemplates.templateId, templateId));
    }
    // User Tests
    async createUserTest(userId, templateId) {
        const template = await this.getTestTemplateById(templateId);
        if (!template) {
            throw new Error('Test template not found');
        }
        const newUserTest = {
            userId,
            templateId,
            testStatus: 'not_started',
            totalMarks: template.totalMarks,
        };
        const [createdTest] = await db_1.db.insert(schema_1.userTests).values(newUserTest).returning();
        return createdTest;
    }
    async getUserTests(userId, status) {
        let query = db_1.db.select().from(schema_1.userTests).where((0, drizzle_orm_1.eq)(schema_1.userTests.userId, userId));
        if (status) {
            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userTests.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userTests.testStatus, status)));
        }
        return await query.orderBy((0, drizzle_orm_1.desc)(schema_1.userTests.createdAt));
    }
    async getUserTestById(userTestId) {
        const [userTest] = await db_1.db.select().from(schema_1.userTests).where((0, drizzle_orm_1.eq)(schema_1.userTests.userTestId, userTestId)).limit(1);
        return userTest;
    }
    async startUserTest(userTestId) {
        const [updatedTest] = await db_1.db
            .update(schema_1.userTests)
            .set({
            testStatus: 'in_progress',
            startedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.userTests.userTestId, userTestId))
            .returning();
        return updatedTest;
    }
    async completeUserTest(userTestId, testData) {
        const [updatedTest] = await db_1.db
            .update(schema_1.userTests)
            .set({
            testStatus: 'completed',
            completedAt: new Date(),
            ...testData,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.userTests.userTestId, userTestId))
            .returning();
        return updatedTest;
    }
    async abandonUserTest(userTestId) {
        const [updatedTest] = await db_1.db
            .update(schema_1.userTests)
            .set({
            testStatus: 'abandoned',
            completedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.userTests.userTestId, userTestId))
            .returning();
        return updatedTest;
    }
    // Test Responses
    async submitTestResponse(responseData) {
        const [createdResponse] = await db_1.db.insert(schema_1.userTestResponses).values(responseData).returning();
        return createdResponse;
    }
    async getUserTestResponses(userTestId) {
        return await db_1.db
            .select()
            .from(schema_1.userTestResponses)
            .where((0, drizzle_orm_1.eq)(schema_1.userTestResponses.userTestId, userTestId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.userTestResponses.responseOrder));
    }
    async updateTestResponse(responseId, updateData) {
        const [updatedResponse] = await db_1.db
            .update(schema_1.userTestResponses)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.userTestResponses.responseId, responseId))
            .returning();
        return updatedResponse;
    }
    // Generate test questions
    async generateTestQuestions(templateId, examId, subjectIds) {
        const template = await this.getTestTemplateById(templateId);
        if (!template) {
            throw new Error('Test template not found');
        }
        let query = db_1.db.select().from(schema_1.questions).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.questions.examId, examId), (0, drizzle_orm_1.eq)(schema_1.questions.isActive, true)));
        if (subjectIds && subjectIds.length > 0) {
            query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.questions.examId, examId), (0, drizzle_orm_1.eq)(schema_1.questions.isActive, true), (0, drizzle_orm_1.inArray)(schema_1.questions.subjectId, subjectIds)));
        }
        // Get random questions based on template requirements
        const allQuestions = await query;
        // Simple random selection (in production, you might want more sophisticated logic)
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, template.totalQuestions);
        return selectedQuestions;
    }
    // Test Analytics
    async getUserTestAnalytics(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const userTestsList = await db_1.db
            .select()
            .from(schema_1.userTests)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userTests.userId, userId), (0, drizzle_orm_1.sql) `${schema_1.userTests.createdAt} >= ${startDate.toISOString()}`))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.userTests.createdAt));
        const completedTests = userTestsList.filter(test => test.testStatus === 'completed');
        const totalTests = userTestsList.length;
        const completedCount = completedTests.length;
        const averageScore = completedCount > 0
            ? completedTests.reduce((sum, test) => sum + Number(test.percentage || 0), 0) / completedCount
            : 0;
        const averageTime = completedCount > 0
            ? completedTests.reduce((sum, test) => sum + (test.timeTakenSeconds || 0), 0) / completedCount
            : 0;
        const bestScore = completedCount > 0
            ? Math.max(...completedTests.map(test => Number(test.percentage || 0)))
            : 0;
        const worstScore = completedCount > 0
            ? Math.min(...completedTests.map(test => Number(test.percentage || 0)))
            : 0;
        return {
            totalTests,
            completedTests: completedCount,
            averageScore: Math.round(averageScore * 100) / 100,
            averageTime: Math.round(averageTime),
            bestScore: Math.round(bestScore * 100) / 100,
            worstScore: Math.round(worstScore * 100) / 100,
            completionRate: totalTests > 0 ? Math.round((completedCount / totalTests) * 100) : 0,
        };
    }
    async getTestLeaderboard(templateId, limit = 100) {
        return await db_1.db
            .select()
            .from(schema_1.userTests)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userTests.templateId, templateId), (0, drizzle_orm_1.eq)(schema_1.userTests.testStatus, 'completed')))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.userTests.percentage))
            .limit(limit);
    }
    async getUserRankInTest(userTestId) {
        const userTest = await this.getUserTestById(userTestId);
        if (!userTest || userTest.testStatus !== 'completed') {
            return null;
        }
        const betterScores = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.userTests)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userTests.templateId, userTest.templateId), (0, drizzle_orm_1.eq)(schema_1.userTests.testStatus, 'completed'), (0, drizzle_orm_1.sql) `${schema_1.userTests.percentage} > ${userTest.percentage}`));
        const totalParticipants = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.userTests)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userTests.templateId, userTest.templateId), (0, drizzle_orm_1.eq)(schema_1.userTests.testStatus, 'completed')));
        const rank = (betterScores[0]?.count || 0) + 1;
        const total = totalParticipants[0]?.count || 1;
        const percentile = Math.round(((total - rank) / total) * 100);
        return {
            rank,
            totalParticipants: total,
            percentile,
        };
    }
}
exports.TestService = TestService;
//# sourceMappingURL=test.js.map
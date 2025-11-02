import { db } from '../db';
import { testTemplates, userTests, questions, type NewTestTemplate, type NewUserTest } from '../db/schema';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';

export class TestService {
  // Test Templates
  async getAllTestTemplates(examId?: string) {
    let query = db.select().from(testTemplates).where(eq(testTemplates.isActive, true));
    
    if (examId) {
      query = query.where(and(eq(testTemplates.isActive, true), eq(testTemplates.examId, examId)));
    }
    
    return await query.orderBy(desc(testTemplates.createdAt));
  }

  async getTestTemplateById(templateId: string) {
    const [template] = await db.select().from(testTemplates).where(eq(testTemplates.templateId, templateId)).limit(1);
    return template;
  }

  async createTestTemplate(templateData: NewTestTemplate) {
    const [createdTemplate] = await db.insert(testTemplates).values(templateData).returning();
    return createdTemplate;
  }

  async updateTestTemplate(templateId: string, updateData: Partial<NewTestTemplate>) {
    const [updatedTemplate] = await db
      .update(testTemplates)
      .set(updateData)
      .where(eq(testTemplates.templateId, templateId))
      .returning();
    return updatedTemplate;
  }

  async deleteTestTemplate(templateId: string) {
    await db.update(testTemplates).set({ isActive: false }).where(eq(testTemplates.templateId, templateId));
  }

  // User Tests
  async createUserTest(userId: string, templateId: string) {
    const template = await this.getTestTemplateById(templateId);
    if (!template) {
      throw new Error('Test template not found');
    }

    const newUserTest: NewUserTest = {
      userId,
      templateId,
      testStatus: 'not_started',
      totalMarks: template.totalMarks,
    };

    const [createdTest] = await db.insert(userTests).values(newUserTest).returning();
    return createdTest;
  }

  async getUserTests(userId: string, status?: string) {
    let query = db.select().from(userTests).where(eq(userTests.userId, userId));
    
    if (status) {
      query = query.where(and(eq(userTests.userId, userId), eq(userTests.testStatus, status as any)));
    }
    
    return await query.orderBy(desc(userTests.createdAt));
  }

  async getUserTestById(userTestId: string) {
    const [userTest] = await db.select().from(userTests).where(eq(userTests.userTestId, userTestId)).limit(1);
    return userTest;
  }

  async startUserTest(userTestId: string) {
    const [updatedTest] = await db
      .update(userTests)
      .set({
        testStatus: 'in_progress',
        startedAt: new Date(),
      })
      .where(eq(userTests.userTestId, userTestId))
      .returning();
    return updatedTest;
  }

  async completeUserTest(userTestId: string, testData: {
    timeTakenSeconds: number;
    totalQuestionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    marksObtained: number;
    percentage: number;
    rank?: number;
    totalParticipants?: number;
    percentile?: number;
  }) {
    const [updatedTest] = await db
      .update(userTests)
      .set({
        testStatus: 'completed',
        completedAt: new Date(),
        ...testData,
      })
      .where(eq(userTests.userTestId, userTestId))
      .returning();
    return updatedTest;
  }

  async abandonUserTest(userTestId: string) {
    const [updatedTest] = await db
      .update(userTests)
      .set({
        testStatus: 'abandoned',
        completedAt: new Date(),
      })
      .where(eq(userTests.userTestId, userTestId))
      .returning();
    return updatedTest;
  }

  // Test Responses (simplified)
  async submitTestResponse(responseData: any) {
    // For now, return mock response since userTestResponses table doesn't exist
    return { responseId: 'mock-response-id', ...responseData };
  }

  async getUserTestResponses(userTestId: string) {
    // For now, return empty array since userTestResponses table doesn't exist
    return [];
  }

  async updateTestResponse(responseId: string, updateData: any) {
    // For now, return mock response
    return { responseId, ...updateData };
  }

  // Generate test questions
  async generateTestQuestions(templateId: string, examId: string, subjectIds?: string[]) {
    const template = await this.getTestTemplateById(templateId);
    if (!template) {
      throw new Error('Test template not found');
    }

    let query = db.select().from(questions).where(
      and(
        eq(questions.examId, examId),
        eq(questions.isActive, true)
      )
    );

    if (subjectIds && subjectIds.length > 0) {
      query = query.where(
        and(
          eq(questions.examId, examId),
          eq(questions.isActive, true),
          inArray(questions.subjectId, subjectIds)
        )
      );
    }

    // Get random questions based on template requirements
    const allQuestions = await query;
    
    // Simple random selection (in production, you might want more sophisticated logic)
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, template.totalQuestions);

    return selectedQuestions;
  }

  // Test Analytics
  async getUserTestAnalytics(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userTestsList = await db
      .select()
      .from(userTests)
      .where(
        and(
          eq(userTests.userId, userId),
          sql`${userTests.createdAt} >= ${startDate.toISOString()}`
        )
      )
      .orderBy(desc(userTests.createdAt));

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

  async getTestLeaderboard(templateId: string, limit: number = 100) {
    return await db
      .select()
      .from(userTests)
      .where(
        and(
          eq(userTests.templateId, templateId),
          eq(userTests.testStatus, 'completed')
        )
      )
      .orderBy(desc(userTests.percentage))
      .limit(limit);
  }

  async getUserRankInTest(userTestId: string) {
    const userTest = await this.getUserTestById(userTestId);
    if (!userTest || userTest.testStatus !== 'completed') {
      return null;
    }

    const betterScores = await db
      .select({ count: sql<number>`count(*)` })
      .from(userTests)
      .where(
        and(
          eq(userTests.templateId, userTest.templateId),
          eq(userTests.testStatus, 'completed'),
          sql`${userTests.percentage} > ${userTest.percentage}`
        )
      );

    const totalParticipants = await db
      .select({ count: sql<number>`count(*)` })
      .from(userTests)
      .where(
        and(
          eq(userTests.templateId, userTest.templateId),
          eq(userTests.testStatus, 'completed')
        )
      );

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


import { Router } from 'express';
import { TestService } from '../services/test';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const testService = new TestService();

// Validation schemas
const CreateTestTemplateSchema = z.object({
  examId: z.string().uuid('Invalid exam ID'),
  templateName: z.string().min(1, 'Template name is required'),
  testType: z.enum(['full_length', 'sectional', 'topic_wise', 'previous_year', 'daily_practice']).optional(),
  totalQuestions: z.number().positive('Total questions must be positive'),
  totalMarks: z.number().positive('Total marks must be positive'),
  durationMinutes: z.number().positive('Duration must be positive'),
  isFree: z.boolean().optional(),
  price: z.number().min(0).optional(),
  instructions: z.string().optional(),
  syllabusCoverage: z.string().optional(),
});

const CreateUserTestSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
});

const CompleteTestSchema = z.object({
  timeTakenSeconds: z.number().min(0),
  totalQuestionsAttempted: z.number().min(0),
  correctAnswers: z.number().min(0),
  incorrectAnswers: z.number().min(0),
  skippedQuestions: z.number().min(0),
  marksObtained: z.number().min(0),
  percentage: z.number().min(0).max(100),
  rank: z.number().positive().optional(),
  totalParticipants: z.number().positive().optional(),
  percentile: z.number().min(0).max(100).optional(),
});

const SubmitResponseSchema = z.object({
  userTestId: z.string().uuid('Invalid user test ID'),
  questionId: z.string().uuid('Invalid question ID'),
  userAnswer: z.string().optional(),
  isCorrect: z.boolean().optional(),
  timeTakenSeconds: z.number().min(0).optional(),
  isMarkedForReview: z.boolean().optional(),
  responseOrder: z.number().min(1).optional(),
  marksObtained: z.number().min(0).optional(),
});

const UpdateResponseSchema = z.object({
  userAnswer: z.string().optional(),
  isCorrect: z.boolean().optional(),
  timeTakenSeconds: z.number().min(0).optional(),
  isMarkedForReview: z.boolean().optional(),
  marksObtained: z.number().min(0).optional(),
});

const GenerateTestSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  examId: z.string().uuid('Invalid exam ID'),
  subjectIds: z.array(z.string().uuid()).optional(),
});

// Test Templates routes
router.get('/templates', async (req, res) => {
  try {
    const { examId } = req.query;
    const templates = await testService.getAllTestTemplates(examId as string);
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch test templates',
    });
  }
});

router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await testService.getTestTemplateById(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Test template not found',
      });
    }
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch test template',
    });
  }
});

router.post('/templates', authenticateToken, async (req, res) => {
  try {
    const validatedData = CreateTestTemplateSchema.parse(req.body);
    const template = await testService.createTestTemplate(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Test template created successfully',
      data: template,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create test template',
    });
  }
});

router.put('/templates/:templateId', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const validatedData = CreateTestTemplateSchema.partial().parse(req.body);
    
    const template = await testService.updateTestTemplate(templateId, validatedData);
    
    res.json({
      success: true,
      message: 'Test template updated successfully',
      data: template,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update test template',
    });
  }
});

router.delete('/templates/:templateId', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    await testService.deleteTestTemplate(templateId);
    
    res.json({
      success: true,
      message: 'Test template deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete test template',
    });
  }
});

// User Tests routes
router.post('/user-tests', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = CreateUserTestSchema.parse(req.body);
    
    const userTest = await testService.createUserTest(userId, validatedData.templateId);
    
    res.status(201).json({
      success: true,
      message: 'User test created successfully',
      data: userTest,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create user test',
    });
  }
});

router.get('/user-tests', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { status } = req.query;
    
    const userTests = await testService.getUserTests(userId, status as string);
    
    res.json({
      success: true,
      data: userTests,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user tests',
    });
  }
});

router.get('/user-tests/:userTestId', authenticateToken, async (req, res) => {
  try {
    const { userTestId } = req.params;
    const userTest = await testService.getUserTestById(userTestId);
    
    if (!userTest) {
      return res.status(404).json({
        success: false,
        message: 'User test not found',
      });
    }
    
    res.json({
      success: true,
      data: userTest,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user test',
    });
  }
});

router.put('/user-tests/:userTestId/start', authenticateToken, async (req, res) => {
  try {
    const { userTestId } = req.params;
    const userTest = await testService.startUserTest(userTestId);
    
    res.json({
      success: true,
      message: 'Test started successfully',
      data: userTest,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start test',
    });
  }
});

router.put('/user-tests/:userTestId/complete', authenticateToken, async (req, res) => {
  try {
    const { userTestId } = req.params;
    const validatedData = CompleteTestSchema.parse(req.body);
    
    const userTest = await testService.completeUserTest(userTestId, validatedData);
    
    res.json({
      success: true,
      message: 'Test completed successfully',
      data: userTest,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete test',
    });
  }
});

router.put('/user-tests/:userTestId/abandon', authenticateToken, async (req, res) => {
  try {
    const { userTestId } = req.params;
    const userTest = await testService.abandonUserTest(userTestId);
    
    res.json({
      success: true,
      message: 'Test abandoned successfully',
      data: userTest,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to abandon test',
    });
  }
});

// Test Responses routes
router.post('/responses', authenticateToken, async (req, res) => {
  try {
    const validatedData = SubmitResponseSchema.parse(req.body);
    const response = await testService.submitTestResponse(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Test response submitted successfully',
      data: response,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit test response',
    });
  }
});

router.get('/user-tests/:userTestId/responses', authenticateToken, async (req, res) => {
  try {
    const { userTestId } = req.params;
    const responses = await testService.getUserTestResponses(userTestId);
    
    res.json({
      success: true,
      data: responses,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch test responses',
    });
  }
});

router.put('/responses/:responseId', authenticateToken, async (req, res) => {
  try {
    const { responseId } = req.params;
    const validatedData = UpdateResponseSchema.parse(req.body);
    
    const response = await testService.updateTestResponse(responseId, validatedData);
    
    res.json({
      success: true,
      message: 'Test response updated successfully',
      data: response,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update test response',
    });
  }
});

// Test Generation routes
router.post('/generate-questions', authenticateToken, async (req, res) => {
  try {
    const validatedData = GenerateTestSchema.parse(req.body);
    const questions = await testService.generateTestQuestions(
      validatedData.templateId,
      validatedData.examId,
      validatedData.subjectIds
    );
    
    res.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate test questions',
    });
  }
});

// Analytics routes
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { days = '30' } = req.query;
    
    const analytics = await testService.getUserTestAnalytics(userId, parseInt(days as string));
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch test analytics',
    });
  }
});

router.get('/templates/:templateId/leaderboard', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { limit = '100' } = req.query;
    
    const leaderboard = await testService.getTestLeaderboard(templateId, parseInt(limit as string));
    
    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch leaderboard',
    });
  }
});

router.get('/user-tests/:userTestId/rank', authenticateToken, async (req, res) => {
  try {
    const { userTestId } = req.params;
    const rank = await testService.getUserRankInTest(userTestId);
    
    if (!rank) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or not completed',
      });
    }
    
    res.json({
      success: true,
      data: rank,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch test rank',
    });
  }
});

export default router;


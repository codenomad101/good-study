import { Router } from 'express';
import { ExamService } from '../services/exam';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const examService = new ExamService();

// Validation schemas
const CreateExamSchema = z.object({
  examName: z.string().min(1, 'Exam name is required'),
  examCode: z.string().min(1, 'Exam code is required'),
  description: z.string().optional(),
  examPattern: z.string().optional(),
  totalMarks: z.number().positive().optional(),
  durationMinutes: z.number().positive().optional(),
  negativeMarking: z.boolean().optional(),
  negativeMarksRatio: z.number().min(0).max(1).optional(),
});

const CreateSubjectSchema = z.object({
  examId: z.string().uuid('Invalid exam ID'),
  subjectName: z.string().min(1, 'Subject name is required'),
  subjectCode: z.string().min(1, 'Subject code is required'),
  weightagePercentage: z.number().min(0).max(100).optional(),
  totalQuestions: z.number().positive().optional(),
  displayOrder: z.number().optional(),
});

const CreateTopicSchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID'),
  topicName: z.string().min(1, 'Topic name is required'),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  estimatedTimeMinutes: z.number().positive().optional(),
  parentTopicId: z.string().uuid().optional(),
  displayOrder: z.number().optional(),
});

const CreateQuestionSchema = z.object({
  topicId: z.string().uuid('Invalid topic ID'),
  subjectId: z.string().uuid('Invalid subject ID'),
  examId: z.string().uuid('Invalid exam ID'),
  questionText: z.string().min(1, 'Question text is required'),
  questionImageUrl: z.string().url().optional(),
  questionType: z.enum(['mcq', 'numerical', 'true_false', 'fill_blank']).optional(),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  marks: z.number().positive().optional(),
  negativeMarks: z.number().min(0).optional(),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  optionE: z.string().optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  detailedSolution: z.string().optional(),
  solutionVideoUrl: z.string().url().optional(),
  hint: z.string().optional(),
  yearAppeared: z.number().positive().optional(),
  source: z.string().optional(),
  language: z.string().optional(),
});

const UserExamPreferenceSchema = z.object({
  examId: z.string().uuid('Invalid exam ID'),
  targetExamDate: z.string().optional(),
  dailyStudyGoalMinutes: z.number().positive().optional(),
  isPrimaryExam: z.boolean().optional(),
});

// Public routes
router.get('/exams', async (req, res) => {
  try {
    const exams = await examService.getAllExams();
    res.json({
      success: true,
      data: exams,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exams',
    });
  }
});

router.get('/exams/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await examService.getExamById(examId);
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }
    
    res.json({
      success: true,
      data: exam,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exam',
    });
  }
});

router.get('/exams/:examId/structure', async (req, res) => {
  try {
    const { examId } = req.params;
    const examStructure = await examService.getExamWithStructure(examId);
    
    if (!examStructure) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }
    
    res.json({
      success: true,
      data: examStructure,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch exam structure',
    });
  }
});

router.get('/exams/:examId/subjects', async (req, res) => {
  try {
    const { examId } = req.params;
    const subjects = await examService.getSubjectsByExam(examId);
    
    res.json({
      success: true,
      data: subjects,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch subjects',
    });
  }
});

router.get('/subjects/:subjectId/topics', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const topics = await examService.getTopicsBySubject(subjectId);
    
    res.json({
      success: true,
      data: topics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch topics',
    });
  }
});

router.get('/topics/:topicId/questions', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    
    const questions = await examService.getQuestionsByTopic(
      topicId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch questions',
    });
  }
});

router.get('/subjects/:subjectId/questions', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    
    const questions = await examService.getQuestionsBySubject(
      subjectId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch questions',
    });
  }
});

// Protected routes
router.post('/exams', authenticateToken, async (req, res) => {
  try {
    const validatedData = CreateExamSchema.parse(req.body);
    const exam = await examService.createExam(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: exam,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create exam',
    });
  }
});

router.post('/subjects', authenticateToken, async (req, res) => {
  try {
    const validatedData = CreateSubjectSchema.parse(req.body);
    const subject = await examService.createSubject(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create subject',
    });
  }
});

router.post('/topics', authenticateToken, async (req, res) => {
  try {
    const validatedData = CreateTopicSchema.parse(req.body);
    const topic = await examService.createTopic(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: topic,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create topic',
    });
  }
});

router.post('/questions', authenticateToken, async (req, res) => {
  try {
    const validatedData = CreateQuestionSchema.parse(req.body);
    const question = await examService.createQuestion(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create question',
    });
  }
});

// User exam preferences
router.get('/user/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const preferences = await examService.getUserExamPreferences(userId);
    
    res.json({
      success: true,
      data: preferences,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user preferences',
    });
  }
});

router.post('/user/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = UserExamPreferenceSchema.parse(req.body);
    
    const preference = await examService.setUserExamPreference({
      userId,
      ...validatedData,
    });
    
    res.status(201).json({
      success: true,
      message: 'Exam preference set successfully',
      data: preference,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to set exam preference',
    });
  }
});

export default router;


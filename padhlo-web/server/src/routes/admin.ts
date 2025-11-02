import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { adminController, upload } from '../controllers/admin';

const router = Router();

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));

// Category Management
router.post('/categories', adminController.createCategory.bind(adminController));
router.get('/categories', adminController.getCategories.bind(adminController));
router.put('/categories/:categoryId', adminController.updateCategory.bind(adminController));
router.delete('/categories/:categoryId', adminController.deleteCategory.bind(adminController));

// Question Management
router.get('/questions', adminController.getQuestions.bind(adminController));
router.delete('/questions/:questionId', adminController.deleteQuestion.bind(adminController));

// JSON Import
router.post('/import/questions', upload.single('jsonFile'), adminController.importQuestionsFromJson.bind(adminController));
router.get('/import/logs', adminController.getImportLogs.bind(adminController));

// User Management
router.get('/users', adminController.getUsers.bind(adminController));
router.put('/users/:userId', adminController.updateUser.bind(adminController));

export default router;



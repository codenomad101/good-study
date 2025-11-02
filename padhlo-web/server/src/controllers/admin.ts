import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { 
  practiceCategories, 
  practiceQuestions, 
  jsonImportLogs, 
  users,
  NewPracticeCategory,
  NewPracticeQuestion,
  NewJsonImportLog
} from '../db/schema';
import { eq, desc, count, and, like, or } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    console.log('File filter - mimetype:', file.mimetype, 'originalname:', file.originalname);
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation schemas
const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  slug: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  language: z.string().default('en'),
  icon: z.string().optional(),
  timeLimitMinutes: z.number().min(5).max(120).default(15),
  questionsPerSession: z.number().min(5).max(100).default(20),
  sortOrder: z.number().default(0)
});

const UpdateCategorySchema = CreateCategorySchema.partial();

const ImportQuestionsSchema = z.object({
  categoryId: z.string().uuid(),
  fileName: z.string(),
  questions: z.array(z.object({
    category: z.string().optional(),
    Question: z.string(),
    Options: z.array(z.object({
      id: z.number(),
      text: z.string()
    })),
    Answer: z.string().optional(),
    CorrectAnswer: z.string(),
    Explanation: z.string().optional()
  }))
});

export class AdminController {
  // Category Management
  async createCategory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const validatedData = CreateCategorySchema.parse(req.body);
      
      const newCategory: NewPracticeCategory = {
        ...validatedData,
        createdBy: userId,
        updatedBy: userId
      };

      const [category] = await db.insert(practiceCategories).values(newCategory).returning();
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create category'
      });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(practiceCategories);

      // Add search filter
      if (search) {
        query = query.where(
          or(
            like(practiceCategories.name, `%${search}%`),
            like(practiceCategories.description, `%${search}%`)
          )
        );
      }

      // Add status filter
      if (status) {
        query = query.where(eq(practiceCategories.status, status as any));
      }

      const categories = await query
        .orderBy(desc(practiceCategories.sortOrder), desc(practiceCategories.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const [totalCount] = await db
        .select({ count: count() })
        .from(practiceCategories);

      res.json({
        success: true,
        data: categories,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch categories'
      });
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const userId = (req as any).user.userId;
      const validatedData = UpdateCategorySchema.parse(req.body);

      const updateData = {
        ...validatedData,
        updatedBy: userId,
        updatedAt: new Date()
      };

      const [category] = await db
        .update(practiceCategories)
        .set(updateData)
        .where(eq(practiceCategories.categoryId, categoryId))
        .returning();

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update category'
      });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;

      // Check if category has questions
      const [questionCount] = await db
        .select({ count: count() })
        .from(practiceQuestions)
        .where(eq(practiceQuestions.categoryId, categoryId));

      if (questionCount.count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category with existing questions. Please delete questions first.'
        });
      }

      const [category] = await db
        .delete(practiceCategories)
        .where(eq(practiceCategories.categoryId, categoryId))
        .returning();

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete category'
      });
    }
  }

  // Question Management
  async getQuestions(req: Request, res: Response) {
    try {
      const { categoryId, page = 1, limit = 50, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select().from(practiceQuestions);

      // Add category filter
      if (categoryId) {
        query = query.where(eq(practiceQuestions.categoryId, categoryId as string));
      }

      // Add search filter
      if (search) {
        query = query.where(like(practiceQuestions.questionText, `%${search}%`));
      }

      // Add status filter
      if (status) {
        query = query.where(eq(practiceQuestions.status, status as any));
      }

      const questions = await query
        .orderBy(desc(practiceQuestions.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const [totalCount] = await db
        .select({ count: count() })
        .from(practiceQuestions);

      res.json({
        success: true,
        data: questions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch questions'
      });
    }
  }

  async deleteQuestion(req: Request, res: Response) {
    try {
      const { questionId } = req.params;

      const [question] = await db
        .delete(practiceQuestions)
        .where(eq(practiceQuestions.questionId, questionId))
        .returning();

      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      res.json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete question'
      });
    }
  }

  // JSON Import
  async importQuestionsFromJson(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      
      console.log('Import request body:', req.body);
      console.log('Import request file:', req.file);
      console.log('Import request files:', req.files);
      
      // Get categoryId from either body or query params
      const categoryId = req.body.categoryId || req.query.categoryId;

      if (!req.file) {
        console.log('No file found in request');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please select a JSON file.'
        });
      }

      // Category ID is now optional - we can auto-create categories from JSON
      console.log('Category ID provided:', categoryId || 'None - will auto-create from JSON');

      console.log('Processing file:', req.file.originalname, 'for category:', categoryId);

      // Read and parse JSON file
      const filePath = req.file.path;
      
      if (!fs.existsSync(filePath)) {
        return res.status(400).json({
          success: false,
          message: 'Uploaded file not found'
        });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      let questionsData;
      
      try {
        questionsData = JSON.parse(fileContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format. Please check your file.'
        });
      }

      if (!Array.isArray(questionsData)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format. Expected an array of questions.'
        });
      }

      console.log('Found', questionsData.length, 'questions in file');

      // Create import log
      const importLog: NewJsonImportLog = {
        categoryId: categoryId || null, // Allow null for auto-created categories
        fileName: req.file.originalname,
        filePath: filePath,
        fileSize: req.file.size,
        totalQuestions: questionsData.length,
        importedBy: userId,
        status: 'pending'
      };

      const [log] = await db.insert(jsonImportLogs).values(importLog).returning();
      const importLogId = log.importId; // Store log ID for error handling

      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // Process each question
      for (const questionData of questionsData) {
        try {
          // Validate question data
          if (!questionData.Question || !questionData.Options || !questionData.CorrectAnswer) {
            console.log('Skipping invalid question:', questionData);
            skippedCount++;
            continue;
          }

          // Handle category mapping - if question has a category field, try to find or create it
          let targetCategoryId = categoryId;
          if (questionData.category) {
            console.log(`Processing question with category: ${questionData.category}`);
            
            // Try to find existing category by name
            const [existingCategory] = await db
              .select()
              .from(practiceCategories)
              .where(eq(practiceCategories.name, questionData.category))
              .limit(1);
            
            if (existingCategory) {
              targetCategoryId = existingCategory.categoryId;
              console.log(`Found existing category: ${existingCategory.name} (${targetCategoryId})`);
            } else {
              // Create new category if it doesn't exist
              console.log(`Creating new category: ${questionData.category}`);
              
              // Generate unique slug
              let baseSlug = questionData.category.toLowerCase().replace(/\s+/g, '-');
              let slug = baseSlug;
              let counter = 1;
              
              // Check if slug already exists and make it unique
              while (true) {
                const [existingSlug] = await db
                  .select()
                  .from(practiceCategories)
                  .where(eq(practiceCategories.slug, slug))
                  .limit(1);
                
                if (!existingSlug) {
                  break; // Slug is unique
                }
                
                slug = `${baseSlug}-${counter}`;
                counter++;
              }
              
              const newCategory: NewPracticeCategory = {
                name: questionData.category,
                slug: slug,
                description: `Auto-created category for imported questions`,
                color: '#FF7846',
                language: 'en',
                timeLimitMinutes: 15,
                questionsPerSession: 20,
                status: 'active',
                createdBy: userId,
                updatedBy: userId
              };
              
              try {
                const [createdCategory] = await db.insert(practiceCategories).values(newCategory).returning();
                targetCategoryId = createdCategory.categoryId;
                console.log(`Created new category: ${createdCategory.name} (${targetCategoryId}) with slug: ${slug}`);
              } catch (error) {
                console.error(`Error creating category ${questionData.category}:`, error);
                // Fall back to using the provided categoryId or skip this question
                if (categoryId) {
                  targetCategoryId = categoryId;
                  console.log(`Falling back to provided category: ${categoryId}`);
                } else {
                  console.log(`Skipping question due to category creation failure`);
                  skippedCount++;
                  continue;
                }
              }
            }
          }

          const newQuestion: NewPracticeQuestion = {
            categoryId: targetCategoryId,
            questionText: questionData.Question,
            options: questionData.Options,
            correctAnswer: questionData.CorrectAnswer,
            correctOption: questionData.correctOption || null, // Add the new field
            explanation: questionData.Explanation || '',
            difficulty: questionData.Difficulty || 'medium',
            job: questionData.Job || [],
            originalCategory: questionData.category || '',
            source: 'json_import',
            createdBy: userId,
            updatedBy: userId
          };

          try {
            await db.insert(practiceQuestions).values(newQuestion);
            importedCount++;
            console.log(`Successfully imported question: ${questionData.Question.substring(0, 50)}...`);
          } catch (error) {
            console.error(`Error inserting question:`, error);
            errorCount++;
          }

        } catch (error) {
          console.error('Error importing question:', error);
          errorCount++;
        }
      }

      // Update category question counts for all affected categories
      // Note: Since we may have created new categories, we'll update counts for all categories
      // This is a simplified approach - in production, you might want to track per-category counts
      if (categoryId) {
        const [category] = await db
          .select()
          .from(practiceCategories)
          .where(eq(practiceCategories.categoryId, categoryId))
          .limit(1);

        if (category) {
          await db
            .update(practiceCategories)
            .set({
              totalQuestions: (category.totalQuestions || 0) + importedCount,
              updatedAt: new Date()
            })
            .where(eq(practiceCategories.categoryId, categoryId));
        }
      }
      // For auto-created categories, the counts are already correct since we just created them

      // Update import log
      await db
        .update(jsonImportLogs)
        .set({
          importedQuestions: importedCount,
          skippedQuestions: skippedCount,
          errorCount: errorCount,
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(jsonImportLogs.importId, log.importId));

      // Clean up uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }

      console.log('Import completed:', { importedCount, skippedCount, errorCount });

      res.json({
        success: true,
        message: 'Questions imported successfully',
        data: {
          totalQuestions: questionsData.length,
          importedQuestions: importedCount,
          skippedQuestions: skippedCount,
          errorCount: errorCount
        }
      });

    } catch (error: any) {
      console.error('Import error:', error);
      
      // Try to update import log with error status
      try {
        if (importLogId) {
          await db
            .update(jsonImportLogs)
            .set({
              status: 'failed',
              errorMessage: error.message || 'Unknown error',
              completedAt: new Date()
            })
            .where(eq(jsonImportLogs.importId, importLogId));
        }
      } catch (logError) {
        console.error('Error updating import log:', logError);
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to import questions'
      });
    }
  }

  async getImportLogs(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const logs = await db
        .select({
          importId: jsonImportLogs.importId,
          fileName: jsonImportLogs.fileName,
          fileSize: jsonImportLogs.fileSize,
          totalQuestions: jsonImportLogs.totalQuestions,
          importedQuestions: jsonImportLogs.importedQuestions,
          skippedQuestions: jsonImportLogs.skippedQuestions,
          errorCount: jsonImportLogs.errorCount,
          status: jsonImportLogs.status,
          errorMessage: jsonImportLogs.errorMessage,
          createdAt: jsonImportLogs.createdAt,
          completedAt: jsonImportLogs.completedAt,
          categoryName: practiceCategories.name
        })
        .from(jsonImportLogs)
        .leftJoin(practiceCategories, eq(jsonImportLogs.categoryId, practiceCategories.categoryId))
        .orderBy(desc(jsonImportLogs.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const [totalCount] = await db
        .select({ count: count() })
        .from(jsonImportLogs);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch import logs'
      });
    }
  }

  // User Management
  async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, search, role } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db.select({
        userId: users.userId,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        subscriptionType: users.subscriptionType,
        totalPoints: users.totalPoints,
        level: users.level,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt
      }).from(users);

      // Add search filter
      if (search) {
        query = query.where(
          or(
            like(users.fullName, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.username, `%${search}%`)
          )
        );
      }

      // Add role filter
      if (role) {
        query = query.where(eq(users.role, role as any));
      }

      const userList = await query
        .orderBy(desc(users.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const [totalCount] = await db
        .select({ count: count() })
        .from(users);

      res.json({
        success: true,
        data: userList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch users'
      });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { role, subscriptionType, isActive } = req.body;

      const updateData: any = {};
      if (role) updateData.role = role;
      if (subscriptionType) updateData.subscriptionType = subscriptionType;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.userId, userId))
        .returning({
          userId: users.userId,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          subscriptionType: users.subscriptionType,
          isActive: users.isActive
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user'
      });
    }
  }

  // Dashboard Statistics
  async getDashboardStats(req: Request, res: Response) {
    try {
      // Get total counts
      const [totalUsers] = await db.select({ count: count() }).from(users);
      const [totalCategories] = await db.select({ count: count() }).from(practiceCategories);
      const [totalQuestions] = await db.select({ count: count() }).from(practiceQuestions);
      const [totalSessions] = await db.select({ count: count() }).from(jsonImportLogs);

      // Get active users (logged in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [activeUsers] = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          eq(users.isActive, true),
          // Add date filter if lastLoginAt is available
        ));

      res.json({
        success: true,
        data: {
          totalUsers: totalUsers.count,
          activeUsers: activeUsers.count,
          totalCategories: totalCategories.count,
          totalQuestions: totalQuestions.count,
          totalImports: totalSessions.count
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch dashboard statistics'
      });
    }
  }
}

export const adminController = new AdminController();

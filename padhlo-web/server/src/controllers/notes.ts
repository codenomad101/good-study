import { Request, Response } from 'express';
import { db } from '../db';
import { userPersonalNotes, type NewUserPersonalNote } from '../db/schema';
import { eq, and, or, isNull, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Validation schemas
const CreateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  color: z.string().max(7).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  categorySlug: z.string().optional().nullable(),
  topicSlug: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.string(), // 'image', 'pdf', 'document', etc.
    filename: z.string().optional(),
  })).optional(),
  isPinned: z.boolean().optional().default(false),
  isArchived: z.boolean().optional().default(false),
});

const UpdateNoteSchema = CreateNoteSchema.partial();

// Multer configuration for note attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/notes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId || 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const uploadAttachment = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/notes/upload - Upload attachment
export const uploadNoteAttachment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Generate URL to access the file
    // In production, you'd want to use a CDN or cloud storage
    const fileUrl = `/uploads/notes/${req.file.filename}`;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fullUrl = `${baseUrl}${fileUrl}`;

    // Determine file type
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fullUrl,
        type: fileType,
        filename: req.file.originalname,
        size: req.file.size,
      }
    });
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload attachment'
    });
  }
};

// GET /api/notes - Get all notes for authenticated user
export const getNotes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { archived, pinned, category, search } = req.query as { archived?: string; pinned?: string; category?: string; search?: string };

    // Build where clause
    let whereClause = eq(userPersonalNotes.userId, userId);
    
    // Always exclude soft-deleted notes
    whereClause = and(whereClause, isNull(userPersonalNotes.deletedAt)) as any;
    
    if (archived === 'true') {
      whereClause = and(whereClause, eq(userPersonalNotes.isArchived, true)) as any;
    } else {
      whereClause = and(whereClause, or(eq(userPersonalNotes.isArchived, false), isNull(userPersonalNotes.isArchived)) as any) as any;
    }

    if (pinned === 'true') {
      whereClause = and(whereClause, eq(userPersonalNotes.isPinned, true)) as any;
    }

    if (category) {
      whereClause = and(whereClause, eq(userPersonalNotes.categorySlug, category)) as any;
    }

    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      whereClause = and(
        whereClause,
        or(
          // @ts-ignore
          db.sql`LOWER(title) LIKE ${searchPattern}`,
          // @ts-ignore
          db.sql`LOWER(content) LIKE ${searchPattern}`
        ) as any
      ) as any;
    }

    const notes = await db
      .select()
      .from(userPersonalNotes)
      .where(whereClause)
      .orderBy(desc(userPersonalNotes.isPinned), desc(userPersonalNotes.updatedAt));

    res.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notes',
    });
  }
};

// GET /api/notes/:noteId - Get a specific note
export const getNoteById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { noteId } = req.params;

    const [note] = await db
      .select()
      .from(userPersonalNotes)
      .where(and(eq(userPersonalNotes.noteId, noteId), eq(userPersonalNotes.userId, userId)))
      .limit(1);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch note',
    });
  }
};

// POST /api/notes - Create a new note
export const createNote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const validatedData = CreateNoteSchema.parse(req.body);

    const newNote: NewUserPersonalNote = {
      userId,
      title: validatedData.title,
      content: validatedData.content,
      color: validatedData.color || '#fffacd',
      categoryId: validatedData.categoryId || null,
      categorySlug: validatedData.categorySlug || null,
      topicSlug: validatedData.topicSlug || null,
      tags: validatedData.tags || [],
      attachments: validatedData.attachments || [],
      isPinned: validatedData.isPinned || false,
      isArchived: validatedData.isArchived || false,
    };

    const [created] = await db.insert(userPersonalNotes).values(newNote).returning();

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: created,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create note',
    });
  }
};

// PUT /api/notes/:noteId - Update a note
export const updateNote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { noteId } = req.params;
    const validatedData = UpdateNoteSchema.parse(req.body);

    // Check if note exists and belongs to user
    const [existing] = await db
      .select()
      .from(userPersonalNotes)
      .where(and(eq(userPersonalNotes.noteId, noteId), eq(userPersonalNotes.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Update note
    const [updated] = await db
      .update(userPersonalNotes)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(eq(userPersonalNotes.noteId, noteId), eq(userPersonalNotes.userId, userId)))
      .returning();

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update note',
    });
  }
};

// DELETE /api/notes/:noteId - Delete a note (soft delete by setting deletedAt)
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { noteId } = req.params;

    // Check if note exists and belongs to user
    const [existing] = await db
      .select()
      .from(userPersonalNotes)
      .where(and(eq(userPersonalNotes.noteId, noteId), eq(userPersonalNotes.userId, userId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Soft delete by setting deletedAt
    await db
      .update(userPersonalNotes)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(userPersonalNotes.noteId, noteId), eq(userPersonalNotes.userId, userId)));

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete note',
    });
  }
};


import { Request, Response } from 'express';
import { JobsService } from '../services/jobs';
import { z } from 'zod';

const jobsService = new JobsService();

// Validation schemas
const CreateJobSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(150),
  description: z.string().optional(),
  shortCode: z.string().min(1).max(20),
  totalMarks: z.number().min(1).optional().default(100),
  durationMinutes: z.number().min(1).optional().default(120),
  totalQuestions: z.number().min(1).optional().default(100),
  minQualification: z.string().optional(),
  ageLimit: z.number().min(1).optional(),
  experienceRequired: z.string().optional(),
  sortOrder: z.number().optional().default(0),
});

const UpdateJobSchema = CreateJobSchema.partial();

// Get all jobs
export const getJobs = async (req: Request, res: Response) => {
  try {
    const { status, isActive } = req.query;
    
    const jobs = await jobsService.getJobs({
      status: status as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
    
    res.json({
      success: true,
      data: jobs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch jobs',
    });
  }
};

// Get job by ID
export const getJobById = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const job = await jobsService.getJobById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    
    res.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch job',
    });
  }
};

// Get job by short code
export const getJobByShortCode = async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;
    
    const job = await jobsService.getJobByShortCode(shortCode);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    
    res.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch job',
    });
  }
};

// Create new job
export const createJob = async (req: Request, res: Response) => {
  try {
    const validatedData = CreateJobSchema.parse(req.body);
    
    const newJob = await jobsService.createJob(validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: newJob,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create job',
    });
  }
};

// Update job
export const updateJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const validatedData = UpdateJobSchema.parse(req.body);
    
    const updatedJob = await jobsService.updateJob(jobId, validatedData);
    
    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update job',
    });
  }
};

// Delete job
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const deletedJob = await jobsService.deleteJob(jobId);
    
    if (!deletedJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Job deleted successfully',
      data: deletedJob,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete job',
    });
  }
};

// Get jobs with statistics
export const getJobsWithStats = async (req: Request, res: Response) => {
  try {
    const jobs = await jobsService.getJobsWithStats();
    
    res.json({
      success: true,
      data: jobs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch jobs with stats',
    });
  }
};

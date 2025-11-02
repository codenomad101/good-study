import { db } from '../db';
import { jobs, NewJob } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export class JobsService {
  // Get all active jobs
  async getJobs(params?: { status?: string; isActive?: boolean }) {
    try {
      const conditions = [];
      
      if (params?.status) {
        conditions.push(eq(jobs.status, params.status as any));
      }
      
      if (params?.isActive !== undefined) {
        conditions.push(eq(jobs.isActive, params.isActive));
      }

      const jobsList = await db
        .select()
        .from(jobs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(jobs.sortOrder, jobs.displayName);

      return jobsList;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new Error('Failed to fetch jobs');
    }
  }

  // Get job by ID
  async getJobById(jobId: string) {
    try {
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.jobId, jobId))
        .limit(1);

      return job;
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      throw new Error('Failed to fetch job');
    }
  }

  // Get job by short code
  async getJobByShortCode(shortCode: string) {
    try {
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.shortCode, shortCode))
        .limit(1);

      return job;
    } catch (error) {
      console.error('Error fetching job by short code:', error);
      throw new Error('Failed to fetch job');
    }
  }

  // Create new job
  async createJob(jobData: NewJob) {
    try {
      const [newJob] = await db
        .insert(jobs)
        .values(jobData)
        .returning();

      return newJob;
    } catch (error) {
      console.error('Error creating job:', error);
      throw new Error('Failed to create job');
    }
  }

  // Update job
  async updateJob(jobId: string, jobData: Partial<NewJob>) {
    try {
      const [updatedJob] = await db
        .update(jobs)
        .set({ ...jobData, updatedAt: new Date() })
        .where(eq(jobs.jobId, jobId))
        .returning();

      return updatedJob;
    } catch (error) {
      console.error('Error updating job:', error);
      throw new Error('Failed to update job');
    }
  }

  // Delete job (soft delete by setting isActive to false)
  async deleteJob(jobId: string) {
    try {
      const [deletedJob] = await db
        .update(jobs)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(jobs.jobId, jobId))
        .returning();

      return deletedJob;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw new Error('Failed to delete job');
    }
  }

  // Get jobs with question counts
  async getJobsWithStats() {
    try {
      const jobsList = await this.getJobs({ isActive: true });
      
      // For now, return jobs with default stats
      // In the future, you can add actual question counts by joining with practiceQuestions
      return jobsList.map(job => ({
        ...job,
        questionCount: 0, // Will be calculated when questions are imported
        totalSessions: 0, // Will be calculated from practice sessions
      }));
    } catch (error) {
      console.error('Error fetching jobs with stats:', error);
      throw new Error('Failed to fetch jobs with stats');
    }
  }
}

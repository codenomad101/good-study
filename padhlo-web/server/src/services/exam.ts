import { db } from '../db';
import { exams, subjects, topics, questions, userExamPreferences, type NewExam, type NewSubject, type NewTopic, type NewQuestion, type NewUserExamPreference } from '../db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export class ExamService {
  // Exam CRUD operations
  async getAllExams() {
    return await db.select().from(exams).where(eq(exams.isActive, true)).orderBy(asc(exams.examName));
  }

  async getExamById(examId: string) {
    const [exam] = await db.select().from(exams).where(eq(exams.examId, examId)).limit(1);
    return exam;
  }

  async createExam(examData: NewExam) {
    const [createdExam] = await db.insert(exams).values(examData).returning();
    return createdExam;
  }

  async updateExam(examId: string, updateData: Partial<NewExam>) {
    const [updatedExam] = await db
      .update(exams)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(exams.examId, examId))
      .returning();
    return updatedExam;
  }

  async deleteExam(examId: string) {
    await db.update(exams).set({ isActive: false }).where(eq(exams.examId, examId));
  }

  // Subject operations
  async getSubjectsByExam(examId: string) {
    return await db
      .select()
      .from(subjects)
      .where(eq(subjects.examId, examId))
      .orderBy(asc(subjects.displayOrder));
  }

  async createSubject(subjectData: NewSubject) {
    const [createdSubject] = await db.insert(subjects).values(subjectData).returning();
    return createdSubject;
  }

  async updateSubject(subjectId: string, updateData: Partial<NewSubject>) {
    const [updatedSubject] = await db
      .update(subjects)
      .set(updateData)
      .where(eq(subjects.subjectId, subjectId))
      .returning();
    return updatedSubject;
  }

  async deleteSubject(subjectId: string) {
    await db.delete(subjects).where(eq(subjects.subjectId, subjectId));
  }

  // Topic operations
  async getTopicsBySubject(subjectId: string) {
    return await db
      .select()
      .from(topics)
      .where(eq(topics.subjectId, subjectId))
      .orderBy(asc(topics.displayOrder));
  }

  async createTopic(topicData: NewTopic) {
    const [createdTopic] = await db.insert(topics).values(topicData).returning();
    return createdTopic;
  }

  async updateTopic(topicId: string, updateData: Partial<NewTopic>) {
    const [updatedTopic] = await db
      .update(topics)
      .set(updateData)
      .where(eq(topics.topicId, topicId))
      .returning();
    return updatedTopic;
  }

  async deleteTopic(topicId: string) {
    await db.delete(topics).where(eq(topics.topicId, topicId));
  }

  // Question operations
  async getQuestionsByTopic(topicId: string, limit: number = 50, offset: number = 0) {
    return await db
      .select()
      .from(questions)
      .where(and(eq(questions.topicId, topicId), eq(questions.isActive, true)))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(questions.createdAt));
  }

  async getQuestionsBySubject(subjectId: string, limit: number = 50, offset: number = 0) {
    return await db
      .select()
      .from(questions)
      .where(and(eq(questions.subjectId, subjectId), eq(questions.isActive, true)))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(questions.createdAt));
  }

  async getQuestionsByExam(examId: string, limit: number = 50, offset: number = 0) {
    return await db
      .select()
      .from(questions)
      .where(and(eq(questions.examId, examId), eq(questions.isActive, true)))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(questions.createdAt));
  }

  async createQuestion(questionData: NewQuestion) {
    const [createdQuestion] = await db.insert(questions).values(questionData).returning();
    return createdQuestion;
  }

  async updateQuestion(questionId: string, updateData: Partial<NewQuestion>) {
    const [updatedQuestion] = await db
      .update(questions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(questions.questionId, questionId))
      .returning();
    return updatedQuestion;
  }

  async deleteQuestion(questionId: string) {
    await db.update(questions).set({ isActive: false }).where(eq(questions.questionId, questionId));
  }

  // User exam preferences
  async getUserExamPreferences(userId: string) {
    return await db
      .select({
        preference: userExamPreferences,
        exam: exams,
      })
      .from(userExamPreferences)
      .innerJoin(exams, eq(userExamPreferences.examId, exams.examId))
      .where(eq(userExamPreferences.userId, userId))
      .orderBy(desc(userExamPreferences.isPrimaryExam));
  }

  async setUserExamPreference(preferenceData: NewUserExamPreference) {
    const [createdPreference] = await db
      .insert(userExamPreferences)
      .values(preferenceData)
      .returning();
    return createdPreference;
  }

  async updateUserExamPreference(preferenceId: string, updateData: Partial<NewUserExamPreference>) {
    const [updatedPreference] = await db
      .update(userExamPreferences)
      .set(updateData)
      .where(eq(userExamPreferences.preferenceId, preferenceId))
      .returning();
    return updatedPreference;
  }

  async removeUserExamPreference(preferenceId: string) {
    await db.delete(userExamPreferences).where(eq(userExamPreferences.preferenceId, preferenceId));
  }

  // Get exam with subjects and topics
  async getExamWithStructure(examId: string) {
    const exam = await this.getExamById(examId);
    if (!exam) return null;

    const subjectsList = await this.getSubjectsByExam(examId);
    
    const subjectsWithTopics = await Promise.all(
      subjectsList.map(async (subject) => {
        const topicsList = await this.getTopicsBySubject(subject.subjectId);
        return {
          ...subject,
          topics: topicsList,
        };
      })
    );

    return {
      ...exam,
      subjects: subjectsWithTopics,
    };
  }
}


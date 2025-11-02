"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamService = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class ExamService {
    // Exam CRUD operations
    async getAllExams() {
        return await db_1.db.select().from(schema_1.exams).where((0, drizzle_orm_1.eq)(schema_1.exams.isActive, true)).orderBy((0, drizzle_orm_1.asc)(schema_1.exams.examName));
    }
    async getExamById(examId) {
        const [exam] = await db_1.db.select().from(schema_1.exams).where((0, drizzle_orm_1.eq)(schema_1.exams.examId, examId)).limit(1);
        return exam;
    }
    async createExam(examData) {
        const [createdExam] = await db_1.db.insert(schema_1.exams).values(examData).returning();
        return createdExam;
    }
    async updateExam(examId, updateData) {
        const [updatedExam] = await db_1.db
            .update(schema_1.exams)
            .set({ ...updateData, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.exams.examId, examId))
            .returning();
        return updatedExam;
    }
    async deleteExam(examId) {
        await db_1.db.update(schema_1.exams).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.exams.examId, examId));
    }
    // Subject operations
    async getSubjectsByExam(examId) {
        return await db_1.db
            .select()
            .from(schema_1.subjects)
            .where((0, drizzle_orm_1.eq)(schema_1.subjects.examId, examId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.subjects.displayOrder));
    }
    async createSubject(subjectData) {
        const [createdSubject] = await db_1.db.insert(schema_1.subjects).values(subjectData).returning();
        return createdSubject;
    }
    async updateSubject(subjectId, updateData) {
        const [updatedSubject] = await db_1.db
            .update(schema_1.subjects)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.subjects.subjectId, subjectId))
            .returning();
        return updatedSubject;
    }
    async deleteSubject(subjectId) {
        await db_1.db.delete(schema_1.subjects).where((0, drizzle_orm_1.eq)(schema_1.subjects.subjectId, subjectId));
    }
    // Topic operations
    async getTopicsBySubject(subjectId) {
        return await db_1.db
            .select()
            .from(schema_1.topics)
            .where((0, drizzle_orm_1.eq)(schema_1.topics.subjectId, subjectId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.topics.displayOrder));
    }
    async createTopic(topicData) {
        const [createdTopic] = await db_1.db.insert(schema_1.topics).values(topicData).returning();
        return createdTopic;
    }
    async updateTopic(topicId, updateData) {
        const [updatedTopic] = await db_1.db
            .update(schema_1.topics)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.topics.topicId, topicId))
            .returning();
        return updatedTopic;
    }
    async deleteTopic(topicId) {
        await db_1.db.delete(schema_1.topics).where((0, drizzle_orm_1.eq)(schema_1.topics.topicId, topicId));
    }
    // Question operations
    async getQuestionsByTopic(topicId, limit = 50, offset = 0) {
        return await db_1.db
            .select()
            .from(schema_1.questions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.questions.topicId, topicId), (0, drizzle_orm_1.eq)(schema_1.questions.isActive, true)))
            .limit(limit)
            .offset(offset)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.questions.createdAt));
    }
    async getQuestionsBySubject(subjectId, limit = 50, offset = 0) {
        return await db_1.db
            .select()
            .from(schema_1.questions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.questions.subjectId, subjectId), (0, drizzle_orm_1.eq)(schema_1.questions.isActive, true)))
            .limit(limit)
            .offset(offset)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.questions.createdAt));
    }
    async getQuestionsByExam(examId, limit = 50, offset = 0) {
        return await db_1.db
            .select()
            .from(schema_1.questions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.questions.examId, examId), (0, drizzle_orm_1.eq)(schema_1.questions.isActive, true)))
            .limit(limit)
            .offset(offset)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.questions.createdAt));
    }
    async createQuestion(questionData) {
        const [createdQuestion] = await db_1.db.insert(schema_1.questions).values(questionData).returning();
        return createdQuestion;
    }
    async updateQuestion(questionId, updateData) {
        const [updatedQuestion] = await db_1.db
            .update(schema_1.questions)
            .set({ ...updateData, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.questions.questionId, questionId))
            .returning();
        return updatedQuestion;
    }
    async deleteQuestion(questionId) {
        await db_1.db.update(schema_1.questions).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.questions.questionId, questionId));
    }
    // User exam preferences
    async getUserExamPreferences(userId) {
        return await db_1.db
            .select({
            preference: schema_1.userExamPreferences,
            exam: schema_1.exams,
        })
            .from(schema_1.userExamPreferences)
            .innerJoin(schema_1.exams, (0, drizzle_orm_1.eq)(schema_1.userExamPreferences.examId, schema_1.exams.examId))
            .where((0, drizzle_orm_1.eq)(schema_1.userExamPreferences.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.userExamPreferences.isPrimaryExam));
    }
    async setUserExamPreference(preferenceData) {
        const [createdPreference] = await db_1.db
            .insert(schema_1.userExamPreferences)
            .values(preferenceData)
            .returning();
        return createdPreference;
    }
    async updateUserExamPreference(preferenceId, updateData) {
        const [updatedPreference] = await db_1.db
            .update(schema_1.userExamPreferences)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.userExamPreferences.preferenceId, preferenceId))
            .returning();
        return updatedPreference;
    }
    async removeUserExamPreference(preferenceId) {
        await db_1.db.delete(schema_1.userExamPreferences).where((0, drizzle_orm_1.eq)(schema_1.userExamPreferences.preferenceId, preferenceId));
    }
    // Get exam with subjects and topics
    async getExamWithStructure(examId) {
        const exam = await this.getExamById(examId);
        if (!exam)
            return null;
        const subjectsList = await this.getSubjectsByExam(examId);
        const subjectsWithTopics = await Promise.all(subjectsList.map(async (subject) => {
            const topicsList = await this.getTopicsBySubject(subject.subjectId);
            return {
                ...subject,
                topics: topicsList,
            };
        }));
        return {
            ...exam,
            subjects: subjectsWithTopics,
        };
    }
}
exports.ExamService = ExamService;
//# sourceMappingURL=exam.js.map
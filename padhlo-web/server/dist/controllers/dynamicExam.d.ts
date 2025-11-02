import { Request, Response } from 'express';
export declare const createExamSession: (req: Request, res: Response) => Promise<void>;
export declare const startExamSession: (req: Request, res: Response) => Promise<void>;
export declare const generateExamQuestions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitExamAnswers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const completeExamSession: (req: Request, res: Response) => Promise<void>;
export declare const getExamSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserExamHistory: (req: Request, res: Response) => Promise<void>;
export declare const getUserExamStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=dynamicExam.d.ts.map
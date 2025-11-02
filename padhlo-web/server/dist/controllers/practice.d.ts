import { Request, Response } from 'express';
export declare const getPracticeCategories: (req: Request, res: Response) => Promise<void>;
export declare const createPracticeSession: (req: Request, res: Response) => Promise<void>;
export declare const getPracticeSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePracticeSessionAnswer: (req: Request, res: Response) => Promise<void>;
export declare const completePracticeSession: (req: Request, res: Response) => Promise<void>;
export declare const getUserPracticeHistory: (req: Request, res: Response) => Promise<void>;
export declare const getUserPracticeStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=practice.d.ts.map
import { Request, Response } from 'express';
export declare class EnhancedPracticeController {
    completePracticeSession(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserPracticeHistory(req: Request, res: Response): Promise<void>;
    getUserPracticeStats(req: Request, res: Response): Promise<void>;
    getSessionDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=enhancedPractice.d.ts.map
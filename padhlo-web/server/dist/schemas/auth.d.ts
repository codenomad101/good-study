import { z } from 'zod';
export declare const RegisterInput: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    fullName: string;
    password: string;
    gender?: "male" | "female" | "other" | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
}, {
    email: string;
    fullName: string;
    password: string;
    gender?: "male" | "female" | "other" | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
}>;
export declare const LoginInput: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const UpdateProfileInput: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other"]>>;
    profilePictureUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    gender?: "male" | "female" | "other" | undefined;
    phone?: string | undefined;
    fullName?: string | undefined;
    profilePictureUrl?: string | undefined;
    dateOfBirth?: string | undefined;
}, {
    gender?: "male" | "female" | "other" | undefined;
    phone?: string | undefined;
    fullName?: string | undefined;
    profilePictureUrl?: string | undefined;
    dateOfBirth?: string | undefined;
}>;
export declare const ChangePasswordInput: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type RegisterInputType = z.infer<typeof RegisterInput>;
export type LoginInputType = z.infer<typeof LoginInput>;
export type UpdateProfileInputType = z.infer<typeof UpdateProfileInput>;
export type ChangePasswordInputType = z.infer<typeof ChangePasswordInput>;
//# sourceMappingURL=auth.d.ts.map
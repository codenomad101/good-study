"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordInput = exports.UpdateProfileInput = exports.LoginInput = exports.RegisterInput = void 0;
const zod_1 = require("zod");
exports.RegisterInput = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    phone: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
});
exports.LoginInput = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.UpdateProfileInput = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
    profilePictureUrl: zod_1.z.string().url().optional(),
});
exports.ChangePasswordInput = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
//# sourceMappingURL=auth.js.map
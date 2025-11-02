"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const JWT_SECRET = process.env.JWT_SECRET;
class AuthService {
    async register(userData) {
        const { email, password, fullName, phone, dateOfBirth, gender } = userData;
        // Check if user already exists
        const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (existingUser.length > 0) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const newUser = {
            email,
            passwordHash: hashedPassword,
            fullName,
            phone,
            dateOfBirth,
            gender,
            isActive: true,
            isVerified: false,
            totalPoints: 0,
            level: 1,
            coins: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalStudyTimeMinutes: 0,
        };
        const createdUser = await db_1.db.insert(schema_1.users).values(newUser).returning();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: createdUser[0].userId, email: createdUser[0].email }, JWT_SECRET, { expiresIn: '7d' });
        // Return user data without password
        const { passwordHash: _, ...userWithoutPassword } = createdUser[0];
        return {
            user: userWithoutPassword,
            token,
        };
    }
    async login(credentials) {
        const { email, password } = credentials;
        // Find user by email
        const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (user.length === 0) {
            throw new Error('Invalid email or password');
        }
        const foundUser = user[0];
        // Check if user is active
        if (!foundUser.isActive) {
            throw new Error('Account is deactivated');
        }
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, foundUser.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        // Update last login
        await db_1.db
            .update(schema_1.users)
            .set({ lastLoginAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.userId, foundUser.userId));
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: foundUser.userId, email: foundUser.email }, JWT_SECRET, { expiresIn: '7d' });
        // Return user data without password
        const { passwordHash: _, ...userWithoutPassword } = foundUser;
        return {
            user: userWithoutPassword,
            token,
        };
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.userId, decoded.userId)).limit(1);
            if (user.length === 0) {
                throw new Error('User not found');
            }
            const foundUser = user[0];
            if (!foundUser.isActive) {
                throw new Error('Account is deactivated');
            }
            const { passwordHash: _, ...userWithoutPassword } = foundUser;
            return userWithoutPassword;
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async updateUserProfile(userId, updateData) {
        try {
            const updatedUser = await db_1.db
                .update(schema_1.users)
                .set({
                ...updateData,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.userId, userId))
                .returning();
            if (!updatedUser[0]) {
                throw new Error('User not found');
            }
            const { passwordHash: _, ...userWithoutPassword } = updatedUser[0];
            return userWithoutPassword;
        }
        catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Get current user
            const user = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.userId, userId)).limit(1);
            if (user.length === 0) {
                throw new Error('User not found');
            }
            const foundUser = user[0];
            // Verify current password
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, foundUser.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            // Hash new password
            const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 12);
            // Update password
            await db_1.db
                .update(schema_1.users)
                .set({
                passwordHash: newPasswordHash,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.userId, userId));
        }
        catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.js.map
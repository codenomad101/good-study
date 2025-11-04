-- Create community tables
-- Run this SQL script to create the community tables

-- Community Groups table
CREATE TABLE IF NOT EXISTS "community_groups" (
	"group_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_groups_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- Community Group Members table
CREATE TABLE IF NOT EXISTS "community_group_members" (
	"member_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" user_role DEFAULT 'student' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_group_members_group_id_community_groups_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "community_groups"("group_id") ON DELETE CASCADE,
	CONSTRAINT "community_group_members_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- Community Posts table
CREATE TABLE IF NOT EXISTS "community_posts" (
	"post_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"post_content" text NOT NULL,
	"is_vulgar" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_posts_group_id_community_groups_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "community_groups"("group_id") ON DELETE CASCADE,
	CONSTRAINT "community_posts_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- Community Comments table
CREATE TABLE IF NOT EXISTS "community_comments" (
	"comment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"comment_content" text NOT NULL,
	"is_vulgar" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_comments_post_id_community_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "community_posts"("post_id") ON DELETE CASCADE,
	CONSTRAINT "community_comments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- Community Likes table
CREATE TABLE IF NOT EXISTS "community_likes" (
	"like_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid,
	"comment_id" uuid,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_likes_post_id_community_posts_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "community_posts"("post_id") ON DELETE CASCADE,
	CONSTRAINT "community_likes_comment_id_community_comments_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "community_comments"("comment_id") ON DELETE CASCADE,
	CONSTRAINT "community_likes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "community_groups_created_by_idx" ON "community_groups"("created_by");
CREATE INDEX IF NOT EXISTS "community_group_members_group_id_idx" ON "community_group_members"("group_id");
CREATE INDEX IF NOT EXISTS "community_group_members_user_id_idx" ON "community_group_members"("user_id");
CREATE INDEX IF NOT EXISTS "community_posts_group_id_idx" ON "community_posts"("group_id");
CREATE INDEX IF NOT EXISTS "community_posts_user_id_idx" ON "community_posts"("user_id");
CREATE INDEX IF NOT EXISTS "community_comments_post_id_idx" ON "community_comments"("post_id");
CREATE INDEX IF NOT EXISTS "community_comments_user_id_idx" ON "community_comments"("user_id");
CREATE INDEX IF NOT EXISTS "community_likes_post_id_idx" ON "community_likes"("post_id");
CREATE INDEX IF NOT EXISTS "community_likes_comment_id_idx" ON "community_likes"("comment_id");
CREATE INDEX IF NOT EXISTS "community_likes_user_id_idx" ON "community_likes"("user_id");


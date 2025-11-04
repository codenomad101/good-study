-- Migration to add exam/subject fields and join requests to community groups
-- Run this SQL script to update the database schema

-- Add exam type and subject fields to community_groups
ALTER TABLE "community_groups" 
ADD COLUMN IF NOT EXISTS "exam_type" varchar(50),
ADD COLUMN IF NOT EXISTS "subject_id" uuid REFERENCES "subjects"("subject_id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true;

-- Create enum for join request status (must be created before table)
CREATE TYPE IF NOT EXISTS request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create community_join_requests table
CREATE TABLE IF NOT EXISTS "community_join_requests" (
    "request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "group_id" uuid NOT NULL REFERENCES "community_groups"("group_id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("user_id") ON DELETE CASCADE,
    "status" request_status DEFAULT 'pending' NOT NULL,
    "requested_at" timestamp DEFAULT now() NOT NULL,
    "reviewed_at" timestamp,
    "reviewed_by" uuid REFERENCES "users"("user_id") ON DELETE SET NULL,
    "rejection_reason" text,
    UNIQUE("group_id", "user_id", "status") WHERE "status" = 'pending'
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_join_requests_group" ON "community_join_requests"("group_id");
CREATE INDEX IF NOT EXISTS "idx_join_requests_user" ON "community_join_requests"("user_id");
CREATE INDEX IF NOT EXISTS "idx_join_requests_status" ON "community_join_requests"("status");


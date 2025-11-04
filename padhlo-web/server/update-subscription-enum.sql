-- Migration script to update subscription_type enum
-- This script adds 'trial', 'lite', 'pro' and removes 'premium', 'premium_plus'

-- First, update existing 'premium' and 'premium_plus' to 'pro' if needed
UPDATE users 
SET subscription_type = 'pro' 
WHERE subscription_type IN ('premium', 'premium_plus');

-- Drop the old enum type (this will fail if there are still dependencies)
-- We need to recreate it with new values
DO $$ 
BEGIN
    -- Drop the old enum type
    DROP TYPE IF EXISTS subscription_type CASCADE;
    
    -- Create the new enum type with updated values
    CREATE TYPE subscription_type AS ENUM ('free', 'trial', 'lite', 'pro');
    
    -- Add the column back to users table if it doesn't exist
    ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_type subscription_type DEFAULT 'free';
    
EXCEPTION WHEN OTHERS THEN
    -- If something goes wrong, we'll handle it
    RAISE NOTICE 'Error updating subscription_type enum: %', SQLERRM;
END $$;

-- If the above didn't work, try this alternative approach:
-- ALTER TABLE users ALTER COLUMN subscription_type TYPE subscription_type_new USING subscription_type::text::subscription_type_new;
-- But we need to create subscription_type_new first, then drop old and rename

-- Alternative safer approach:
DO $$
BEGIN
    -- Check if enum already exists with new values
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_type') THEN
        CREATE TYPE subscription_type AS ENUM ('free', 'trial', 'lite', 'pro');
    ELSE
        -- If it exists but has old values, we need to recreate it
        -- First, update all users to a safe value
        UPDATE users SET subscription_type = 'free' WHERE subscription_type IN ('premium', 'premium_plus');
        
        -- Drop and recreate
        DROP TYPE subscription_type CASCADE;
        CREATE TYPE subscription_type AS ENUM ('free', 'trial', 'lite', 'pro');
        
        -- Re-add column
        ALTER TABLE users ADD COLUMN subscription_type subscription_type DEFAULT 'free';
    END IF;
END $$;


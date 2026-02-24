-- Migration for v2.3.0: Add instructions and photo_uri to recipes table

-- 1. Add 'instructions' column (TEXT)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'instructions') THEN 
        ALTER TABLE "public"."recipes" ADD COLUMN "instructions" TEXT DEFAULT ''; 
    END IF; 
END $$;

-- 2. Add 'photo_uri' column (TEXT)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'photo_uri') THEN 
        ALTER TABLE "public"."recipes" ADD COLUMN "photo_uri" TEXT DEFAULT NULL; 
    END IF; 
END $$;

-- 3. Verify changes (Optional: Run this separately to check)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'recipes';

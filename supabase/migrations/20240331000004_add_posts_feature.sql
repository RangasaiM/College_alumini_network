-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(post_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.posts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.posts;
DROP POLICY IF EXISTS "Enable update for post owners" ON public.posts;
DROP POLICY IF EXISTS "Enable delete for post owners" ON public.posts;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.likes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.likes;
DROP POLICY IF EXISTS "Enable delete for like owners" ON public.likes;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.comments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.comments;
DROP POLICY IF EXISTS "Enable update for comment owners" ON public.comments;
DROP POLICY IF EXISTS "Enable delete for comment owners" ON public.comments;

-- Create policies for posts
CREATE POLICY "Enable read access for all users"
    ON public.posts FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for post owners"
    ON public.posts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for post owners"
    ON public.posts FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for likes
CREATE POLICY "Enable read access for all users"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for like owners"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for comments
CREATE POLICY "Enable read access for all users"
    ON public.comments FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for comment owners"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for comment owners"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_user_id') THEN
        CREATE INDEX idx_posts_user_id ON public.posts(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_created_at') THEN
        CREATE INDEX idx_posts_created_at ON public.posts(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_likes_post_id') THEN
        CREATE INDEX idx_likes_post_id ON public.likes(post_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_likes_user_id') THEN
        CREATE INDEX idx_likes_user_id ON public.likes(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_post_id') THEN
        CREATE INDEX idx_comments_post_id ON public.comments(post_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comments_user_id') THEN
        CREATE INDEX idx_comments_user_id ON public.comments(user_id);
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.likes TO authenticated;
GRANT ALL ON public.comments TO authenticated; 
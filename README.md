# College Alumni Network

This is a Next.js application for connecting college alumni and students.

## Setup Instructions

### 1. Supabase Configuration

1. Create a new Supabase project at https://supabase.io
2. Get your project URL and anon key from the Supabase dashboard (Project Settings → API)
3. Update the `.env.local` file with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

### 2. Database Setup

1. Link your local project to your Supabase project:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REFERENCE
   ```

2. Push the database migrations:
   ```bash
   npx supabase db push
   ```

### 3. Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting

If you encounter build errors:
1. Delete the `.next` directory
2. Reinstall dependencies with `npm install`
3. Restart the development server
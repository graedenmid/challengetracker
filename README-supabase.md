The web app will be used to create and track challenges and goals. The user will be able to select from a list of things they may want to complete and set the rate and occurrence. For example, the first drop down could list things like "running, push-ups" etc. or they can have a custom input. The second drop down will let the user decide the number of repetitions that the user wants to do per unit of time - this can be a calculation, like "= the day of the year" where the goal is 1 rep on Jan 1st, 10 reps on Jan 10th, 45 reps on the 45th day of the year, etc.. The third drop-down will be the unit of time, such as days, weeks, months, or custom input. The fourth drop-down/input will be the start date. The fifth/final drop-down/input will be the total length of time for this challenge, where the user can decide either total number of units of time (30 days, 1 month, 1 year, 2 weeks, etc.) OR they can choose an end date which will automatically calculate the total number of time-units/length of time. The web app will then use this to create regular tracking ability for each number of repetitions per unit of time they want to track. They user can check off when they have completed the number of repetitions for that unit of time, or input a different number if they did not complete the challenge for that input period. The tracker will also keep track of the total number of repetitions the user has completed, and their progress towards the total goal. Here's an example user case: 1. User opens web app where they are prompted to create a new challenge tracker. The user selects from the first drop down "push-ups". The user selects from the second drop down "0+n reps" to add 1 rep per unit of time selected. The user selected from the third drop down "daily". The user selects from the fourth drop-down "today" to start the challenge on the current day (for example March 3 2025). The user selects from the fifth drop down "specify date" and then chooses Dec 31 2025. The user selected "Create Tracker". This will create a challenge tracker for the user that will be to do 1 pushup for each day of the year, starting on March 3 2025. The first day will be to do 62 pushups (as March 3 2025 is the 62nd day of the year), and the next day the challenge will be to do 63 pushups, and so on following the 0+n reps formula. This will continue through to the final day of Dec 31 2025 where the challenge will be to do 365 pushups as it is the 365th day of the year.

Please refer to 'cursor_project_rules.mdc' for structure and general rules

Please refer to tech-stack-guidelines.mdc for the ideal tech stack.

## Getting Started with Deployment

### Step-by-Step Guide to Connect to Supabase

1. **Create a Supabase Account**

   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account using your email or GitHub account

2. **Create a New Project**

   - Click "New Project" on your Supabase dashboard
   - Give your project a name (e.g., "Challenge Tracker")
   - Set a secure database password
   - Choose the region closest to your users
   - Click "Create Project"

3. **Set Up Your Database**

   - Wait for your project to initialize (takes about 2 minutes)
   - Once ready, navigate to the "SQL Editor" in the sidebar
   - Use the Prisma schema to create your tables (or use the migration command below)

4. **Get Your API Keys**

   - Go to "Project Settings" > "API" in the sidebar
   - Copy the "URL" (anon public) and "anon public" key
   - You'll need these for connecting your app

5. **Set Up Environment Variables**

   - Create a `.env` file in your project root (if not already present)
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     DATABASE_URL=postgresql://postgres:your_password@your_project_ref.supabase.co:5432/postgres
     ```
   - Replace the placeholder values with your actual Supabase credentials

6. **Push Your Database Schema**

   - Open your terminal in the project directory
   - Run `npm run prisma:generate` to generate the Prisma client
   - Run `npm run prisma:push` to push your schema to Supabase

7. **Test Your Connection**

   - Run `npm run dev` to start your local development server
   - Try to create an account and log in
   - Verify that data is being stored in your Supabase database

8. **Deploy Your Next.js App**

   - Create an account on Vercel (vercel.com)
   - Install the Vercel CLI: `npm install -g vercel`
   - Run `vercel` in your project directory and follow the prompts
   - Add your environment variables in the Vercel dashboard

9. **Connect Your Deployed App to Supabase**

   - Make sure your environment variables are set correctly in Vercel
   - The application should now be connected to your Supabase database

10. **Set Up Authentication**

    - In Supabase dashboard, go to "Authentication" > "Settings"
    - Add your site URL to the "Site URL" field (e.g., https://your-app.vercel.app)
    - Configure any additional auth providers if needed (Google, GitHub, etc.)

11. **Using Supabase CLI (Optional)**

    - Instead of installing the CLI globally, use `npx` to run Supabase commands:

    ```bash
    # Initialize Supabase in your project
    npx supabase init

    # Link your project
    npx supabase link --project-ref your-project-ref

    # Push schema changes
    npx supabase db push
    ```

    - This approach avoids installation issues and ensures you're always using the latest version

Your Challenge Tracker app should now be fully deployed and connected to Supabase! You can access it at the URL provided by Vercel and start tracking your challenges.

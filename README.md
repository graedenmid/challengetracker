# Challenge Tracker

A full-stack web application for tracking personal challenges and goals.

## Features

- Create and manage personal challenges
- Track progress with customizable metrics
- View challenge history and statistics
- Set daily, weekly, or monthly goals

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL (via Supabase)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/challenge-tracker.git
   cd challenge-tracker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   DATABASE_URL="your_postgresql_connection_string"
   ```

4. Set up the database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── challenges/     # Challenge-related pages
│   └── page.tsx        # Home page
├── components/         # Reusable components
├── lib/               # Utility functions
└── styles/            # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

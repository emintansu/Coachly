# Coachly

**Coachly** is a personalized AI workout coaching platform built with Next.js. It generates custom day-by-day workout plans tailored to your specific goals, body stats, and available equipment, along with basic nutrition guidance.

The application natively supports **bilingual (English and Turkish)** experiences seamlessly via `next-intl`.

## Features
- **AI Active Plan Generator:** Powered by Google's Gemini AI to build tailored fitness plans in seconds.
- **Bilingual Support:** 100% TR/EN support for both content and user dashboard.
- **Onboarding Flow:** Smoothly collects user body metrics, goals, and experience levels.
- **Nutrition Guidance:** Provides complementary dietary tips aligned with your specific fitness goals.
- **Modern UI:** Built using Tailwind CSS, featuring glassmorphism and fully responsive design.

## Tech Stack
- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com)
- **Database & Auth:** [Supabase](https://supabase.com)
- **AI Integration:** [Google Gemini API](https://ai.google.dev/)
- **Internationalization:** [next-intl](https://next-intl-docs.vercel.app/)

## Prerequisites

Before running the project locally, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://npmjs.com/)

You will also need:
- A Supabase account and a new project to get your URL and Anon Key.
- A Google AI Studio account to get your Gemini API Key.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/emintansu/Coachly.git
   cd Coachly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Copy the `.env.example` file to `.env.local` and fill in your actual credentials.
   ```bash
   cp .env.example .env.local
   ```
   *Note: Never commit your `.env.local` file to version control.*

   **Required Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase API Anon Key.
   - `GEMINI_API_KEY`: Your Google Gemini API Key.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the Application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically redirect you to the default locale (e.g., `http://localhost:3000/en` or `http://localhost:3000/tr`).

## License
&copy; Coachly. All rights reserved.

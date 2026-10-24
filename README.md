# ArhaStudio — Video Project Library

A production-ready YouTube video project library and management dashboard designed with a minimal, warm aesthetic inspired by **Claude AI**. Built for YouTube creators to record, organize, search, edit, and access all video projects and associated resources.

---

## 1. Project Overview & Architecture

**ArhaStudio — Video Project Library** provides a centralized, persistent dashboard for managing YouTube channel video project records.

- **Frontend**: Next.js 14 (App Router) using pure JavaScript (no TypeScript).
- **Styling**: Tailwind CSS tailored to Claude AI's warm minimalist palette (`#F5F3EE`, `#292825`, `#C96442`, `#ECEAE4`).
- **Icons**: Lucide React.
- **Database**: Supabase PostgreSQL with strict typed schemas, unique integer constraints, and performance indexes.
- **Security & Auth**: Supabase Auth with Row Level Security (RLS) policies and Next.js middleware route protection.
- **Deployment**: Optimized for zero-configuration Vercel deployment.

---

## 2. Claude AI-Inspired Design System

| Element | Color Code | Description |
|---|---|---|
| **Main Background** | `#F5F3EE` | Warm cream / off-white canvas |
| **Primary Surface** | `#FFFFFF` | Crisp white cards and containers |
| **Secondary Surface** | `#ECEAE4` | Subtle neutral section accents |
| **Primary Text** | `#292825` | Deep charcoal for readability |
| **Secondary Text** | `#77746D` | Muted slate for metadata |
| **Borders** | `#DEDAD2` | Soft divider borders |
| **Accent Color** | `#C96442` | Warm terracotta for buttons and active states |
| **Hover States** | `#EAE7DF` / `#B85535` | Warm beige / deeper terracotta |

---

## 3. Folder Structure

```
├── app/
│   ├── globals.css              # Tailwind base, Claude variables, custom scrollbars
│   ├── layout.jsx               # Root layout with ToastProvider & Inter typography
│   ├── page.jsx                 # Main Dashboard (Summary cards, recent items, full list)
│   ├── login/
│   │   └── page.jsx             # Admin authentication portal
│   ├── projects/
│   │   ├── page.jsx             # All Projects management (Grid/List views, search & filters)
│   │   └── new/
│   │       └── page.jsx         # Dedicated Add New Project page
│   └── settings/
│       └── page.jsx             # Library settings, backup tools, and DB status
├── components/
│   ├── CSVModal.jsx             # Data export and validated CSV import modal
│   ├── DeleteConfirmModal.jsx   # Safe two-step deletion confirmation dialog
│   ├── EmptyState.jsx           # Polished empty & no-search-results states
│   ├── ProjectCard.jsx          # Grid view project card with badges & quick actions
│   ├── ProjectModal.jsx         # Add / Edit project modal with uniqueness validation
│   ├── ProjectTableRow.jsx      # Compact table row for list view
│   ├── SearchBar.jsx            # Deep search bar with exact number toggle
│   ├── Sidebar.jsx              # Responsive navigation sidebar and mobile drawer
│   ├── SortAndFilter.jsx        # Sort dropdown & category filter pills
│   ├── SummaryCard.jsx          # Real-time metrics summary card
│   └── Toast.jsx                # Understated notification toast system
├── lib/
│   ├── api/
│   │   └── projects.js          # Project CRUD operations, queries & statistics
│   ├── supabase/
│   │   ├── client.js            # Browser-side Supabase client
│   │   ├── server.js            # Server-side Supabase client with cookie storage
│   │   └── middleware.js        # Auth session refreshing & route protection
│   ├── csv.js                   # CSV generation & parser with duplicate detection
│   └── utils.js                 # Validation, numeric formatting & link sanitization
├── supabase/
│   └── schema.sql               # PostgreSQL schema, triggers, indexes & RLS policies
├── test/
│   └── unit-test.mjs            # Comprehensive test suite for ordering, parsing, and validation
├── middleware.js                # Next.js App Router edge route protector
├── .env.example                 # Environment variable templates
├── package.json                 # Project dependencies and npm scripts
└── tailwind.config.js           # Custom Claude AI theme palette configuration
```

---

## 4. Supabase Database Setup

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project** and name it `ArhaStudio Video Library`.
3. Select your preferred database region and set a strong database password.

### Step 2: Run the SQL Schema Script
1. In your Supabase dashboard, navigate to the **SQL Editor** tab on the left sidebar.
2. Open the file `supabase/schema.sql` from this codebase.
3. Paste the entire SQL script into the query editor and click **Run**.

This script sets up:
- The `public.projects` table with strict types and positive integer constraints (`video_number > 0`).
- Unique constraint `unique_video_number` preventing race conditions and duplicate video IDs.
- Automatic `updated_at` timestamp triggers.
- Multi-column and GIN search indexes.
- Strict **Row Level Security (RLS)** policies granting CRUD rights only to authenticated administrator users. Anonymous access is blocked at the database level.

---

## 5. Setting Up the Administrator Account

To ensure only you can manage your library without public sign-ups:

1. In your Supabase project dashboard, navigate to **Authentication** -> **Users**.
2. Click **Add user** -> **Create user**.
3. Enter your administrator email (e.g. `admin@arhastudio.com`) and a secure password.
4. Set **Auto Confirm User** to `true` (checked), then click **Create User**.
5. You can now use these credentials to sign in on the `/login` page of your application.

---

## 6. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials found in **Project Settings** -> **API**:

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Public Anon Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Restrict dashboard access to a specific administrator email
ADMIN_EMAIL=admin@arhastudio.com
```

---

## 7. Local Installation & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Test Suite
Verify numeric sorting, form validation, and CSV parsing:
```bash
npm test
```

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Step-by-Step Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of ArhaStudio Video Project Library"
   git branch -M main
   git remote add origin https://github.com/your-username/arhastudio-video-library.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
   - Select your GitHub repository.
   - Framework Preset: **Next.js**.

3. **Configure Environment Variables**:
   In Vercel's **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase Anon Key
   - `ADMIN_EMAIL` = your administrator email

4. **Deploy**:
   - Click **Deploy**. Vercel will automatically build and deploy the production application in under a minute.

---

## 9. Verification & Testing Checklist

Test each of the following critical operational scenarios:

- [x] **Numeric Ordering Test**: Add Video 10, then add Video 2. The default sorted list places Video 2 before Video 10 (true numeric sort, not string sort).
- [x] **Duplicate Prevention**: Attempt to add another video with an existing video number (e.g., Video 1). The form displays an error preventing duplicate creation.
- [x] **Search by Video Number**:
  - Searching `1` finds Video 1.
  - Toggling **Exact Number** ensures searching `1` returns Video 1 while excluding Video 10.
  - Pressing `Enter` opens the first matching result in a new tab.
- [x] **Persistence Check**: Add a project, reload the browser, log out, and log back in. The project remains permanently saved in Supabase.
- [x] **Edit Project & Re-sort**: Change Video 5 to Video 1. It immediately moves to the top of the list in position #1 while preserving its unique ID and creation timestamp.
- [x] **Safe URL Navigation**: Clicking "Open Video" opens the saved HTTPS link in a new browser tab with `rel="noopener noreferrer"`.
- [x] **Two-Step Delete Confirmation**: Clicking delete shows a confirmation modal containing the project title and video number. Only confirming permanently deletes the project.
- [x] **CSV Export & Import**: Export library to `.csv` and re-import projects while duplicate checking protects against conflicts.
- [x] **Authentication Protection**: Attempt to access `/`, `/projects`, or `/settings` while signed out. You are immediately redirected to `/login`.
- [x] **Database Security (RLS)**: Anonymous requests without a Supabase auth token are rejected by PostgreSQL Row Level Security.

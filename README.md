# Askal Fitness Booking Frontend

Modern fitness booking platform frontend built with Next.js 14+, React, NextAuth, Tailwind CSS, and Google Gemini-powered AI recommendations.

**Live App:** `https://fitness-booking-frontend-rust.vercel.app`
**Backend API:** `https://askal.prajwolghimire.com.np`

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Pages & Routes](#pages--routes)
- [User Roles & Flows](#user-roles--flows)
- [Authentication System](#authentication-system)
- [Route Protection & Middleware](#route-protection--middleware)
- [Booking Flow](#booking-flow)
- [AI-Powered Recommendations](#ai-powered-recommendations)
- [Trainer Directory & Filters](#trainer-directory--filters)
- [Trainer Dashboard](#trainer-dashboard)
- [User Dashboard](#user-dashboard)
- [Components](#components)
- [API Client](#api-client)
- [PWA Support](#pwa-support)
- [Deployment](#deployment)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14+ | React framework (App Router) |
| React | UI library |
| TypeScript 5 | Type safety |
| NextAuth v4 | Authentication (JWT session strategy) |
| Tailwind CSS v4 | Styling (custom design system with shared utility classes) |
| Axios | File uploads with progress tracking |
| Lucide React | Icon library |
| Sonner | Toast notifications |
| @ducanh2912/next-pwa | Progressive Web App support |
| Workbox | Service worker caching |

---

## Architecture

```
src/
  app/                          # Next.js App Router pages
    page.tsx                    # Landing page (public)
    layout.tsx                  # Root layout - fonts, PWA meta, providers, toaster
    login/page.tsx              # Login & registration (public)
    onboarding/page.tsx         # 6-step onboarding wizard (user only)
    trainers/
      page.tsx                  # Trainer directory with advanced search/filter + recommendations
      [id]/page.tsx             # Trainer detail + booking calendar (public)
    dashboard/
      page.tsx                  # User dashboard - stats, recommendations, upcoming sessions
      bookings/page.tsx         # Booking management - pay, cancel, review (user only)
      profile/page.tsx          # Profile editing - photo, metrics, goals (user only)
    trainer/
      dashboard/page.tsx        # Trainer control center - KPI strip, pending requests, agenda
      profile/page.tsx          # Trainer profile editor - bio, focus, pricing, intensity
    about/page.tsx              # About page (public)
    contact/page.tsx            # Contact page (public)
    careers/page.tsx            # Careers page (public)
    privacy/page.tsx            # Privacy policy (public)
    terms/page.tsx              # Terms of service (public)
    api/auth/[...nextauth]/     # NextAuth API route

  components/
    Navbar.tsx                  # Auth-aware top navigation with mobile menu
    Footer.tsx                  # Site footer with links
    Hero.tsx                    # Landing hero section
    Features.tsx                # Feature highlights (3 cards)
    HowItWorks.tsx              # Step-by-step guide
    Trainers.tsx                # Trainer preview section for landing page
    TrainerCard.tsx             # Reusable trainer display card
    Testimonials.tsx            # Client testimonials
    BentoGrid.tsx               # Feature bento grid layout
    FAQ.tsx                     # FAQ accordion
    CTASection.tsx              # Call-to-action banner
    DashboardNavbar.tsx         # User dashboard navigation with ProfileMenu dropdown
    TrainerNavbar.tsx           # Trainer dashboard navigation with ProfileMenu dropdown
    InstallPWA.tsx              # PWA install prompt
    FloatingAssistant.tsx       # AI chat widget (currently disabled)
    Providers.tsx               # NextAuth SessionProvider wrapper
    ui/
      Button.tsx                # Styled button (primary, secondary, outline variants)
      Card.tsx                  # Clickable card with selected state
      Input.tsx                 # Form input with label
      ProgressBar.tsx           # Animated progress bar
      Avatar.tsx                # User avatar component
      ProfileMenu.tsx           # Reusable dropdown menu (avatar + items + logout)

  lib/
    auth.ts                     # NextAuth config (CredentialsProvider, JWT callbacks)
    api.ts                      # Typed API client (authApi, trainerApi, bookingApi, onboardingApi)
    constants.tsx               # Shared constants (training focus categories)

  middleware.ts                 # Route protection + role-based redirects
  types/index.ts                # TypeScript interfaces (User, Trainer, Booking, etc.)
```

### Global CSS Utility Classes

The design system uses shared utility classes defined in `globals.css`:

| Class | Usage |
|---|---|
| `page-container` | Standard page padding and max-width |
| `card-premium` | Rounded card with border and shadow |
| `btn-primary` | Primary CTA button style |
| `section-header` | Section title + subtitle block |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Backend API running (see Backend README)

### Installation

```bash
git clone https://github.com/askal-thapa/Fitness-Booking-Frontend.git
cd Fitness-Booking-Frontend
npm install
```

### Configure Environment

Create `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Run Development Server

```bash
npm run dev     # http://localhost:3000
```

### Other Commands

```bash
npm run build   # Production build
npm run lint    # ESLint
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NEXTAUTH_URL` | Frontend URL (required by NextAuth) | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Secret for encrypting NextAuth sessions | `your-secret-key` |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://askal.prajwolghimire.com.np` |

---

## Pages & Routes

### Public Pages (No Authentication Required)

| Route | Page | Description |
|---|---|---|
| `/` | Landing Page | Hero, features, trainer preview, testimonials, FAQ, CTA |
| `/login` | Login & Register | Dual-mode auth form with role selection |
| `/trainers` | Trainer Directory | Advanced search, price/rating/intensity/location filters, AI recommendations banner |
| `/trainers/[id]` | Trainer Detail | Full profile, availability calendar, booking with Stripe |
| `/about` | About | Company information |
| `/contact` | Contact | Contact form |
| `/careers` | Careers | Job listings |
| `/privacy` | Privacy Policy | Privacy information |
| `/terms` | Terms of Service | Terms and conditions |

### User Pages (Requires `user` Role)

| Route | Page | Description |
|---|---|---|
| `/onboarding` | Onboarding Wizard | 6-step fitness profile collection |
| `/dashboard` | User Dashboard | Stats, upcoming sessions, AI recommendations, quick actions |
| `/dashboard/bookings` | Booking Management | Pay, cancel, review bookings across 3 tabs |
| `/dashboard/profile` | Profile Editor | Photo upload, metrics, fitness goals |

### Trainer Pages (Requires `trainer` Role)

| Route | Page | Description |
|---|---|---|
| `/trainer/dashboard` | Trainer Dashboard | KPI strip, pending requests, agenda view grouped by time |
| `/trainer/profile` | Trainer Profile Editor | Bio, specialty, focus areas, pricing, intensity, location |

---

## User Roles & Flows

### Flow 1: New User Registration & Onboarding

```
/login (register mode)
  -> Select "Fitness User" role
  -> Enter name, email, password
  -> Auto-signed in via NextAuth
  -> Middleware redirects to /onboarding

/onboarding (6 steps)
  Step 1: Select fitness goal (Lose Weight / Build Muscle / Stay Fit / Improve Health)
  Step 2: Enter metrics (age, height in cm, weight in kg)
  Step 3: Select activity level (sedentary / light / moderate / active / very_active)
  Step 4: Select experience level (beginner / intermediate / advanced)
  Step 5: Select health conditions (multi-select: Knee pain, Back pain, etc.)
  Step 6: Select workout type (Gym / Home / Yoga) + diet preference (Veg / Non-veg / Vegan)
  -> Saves onboarding data + triggers semantic embedding refresh
  -> Marks onboardingCompleted = true in session
  -> Redirects to /dashboard
```

### Flow 2: Trainer Registration

```
/login (register mode)
  -> Select "Professional Trainer" role
  -> Enter name, email, password
  -> Auto-signed in via NextAuth
  -> Redirects to /trainer/dashboard

/trainer/dashboard
  -> Red "Visibility Restricted" banner (incomplete profile)
  -> Navigate to /trainer/profile to set up:
    - Specialty headline and bio
    - Training focus toggles (9 categories)
    - Hourly rate, intensity level (1-5), training location
    - Profile photo upload via Cloudinary
  -> Set weekly availability via the dashboard's schedule section
```

### Flow 3: Booking a Session

```
/trainers -> Browse, filter, view AI recommendations -> Click trainer card
/trainers/[id] -> Select date and time slot -> Click "Book & Pay"
  -> If not logged in: redirect to /login?callbackUrl=/trainers/[id]
  -> If logged in: create booking -> redirect to Stripe Checkout
Stripe Checkout -> Enter payment -> success redirect to /dashboard/bookings?success=true
```

### Flow 4: Managing Bookings

```
/dashboard/bookings (3 tabs: Upcoming | Past | Cancelled)

  Upcoming tab:
    - Pending/unpaid: "Pay Now" (retry Stripe) + "Cancel"
    - Confirmed: "Cancel" with reason modal

  Past tab:
    - Completed + not reviewed: "Rate Session" (star rating + comment)
    - Completed + reviewed: "Book Again" link to trainer page

  Cancelled tab:
    - Shows cancellation reason for each booking
```

### Flow 5: Trainer Session Management

```
/trainer/dashboard
  KPI Strip: Today's sessions | Pending requests | Active clients | Earnings | Rating
  Pending Requests: Accept or Decline (with reason) incoming bookings
  Agenda: Sessions grouped by Today / Tomorrow / This Week / Later
  
/trainer/profile
  Update specialty, bio, focus areas, pricing, intensity, location
  Upload or change profile photo
```

---

## Authentication System

### NextAuth Configuration

- **Provider:** CredentialsProvider authenticating against backend `/auth/login`.
- **Session Strategy:** JWT (no database sessions).
- **Token Lifetime:** 15 days.
- **Custom Fields in Session:** `accessToken`, `role`, `onboardingCompleted`.

### Auth Flow

1. User submits credentials on `/login`.
2. NextAuth `authorize()` calls backend `/auth/login` with only `email` and `password` (extra NextAuth fields stripped).
3. On success, fetches user profile from `/auth/me`.
4. Stores `accessToken`, `role`, `onboardingCompleted` in JWT.
5. Frontend components access session via `useSession()`.
6. API calls pass `session.user.accessToken` as Bearer token.

### Session Update

When onboarding completes, the session is updated in-place via `update({ onboardingCompleted: true })` without requiring re-login.

---

## Route Protection & Middleware

The middleware runs on `/dashboard/*`, `/onboarding`, `/trainer/*`, and `/login`.

| Condition | Action |
|---|---|
| Authenticated user visits `/login` | Redirect to role-appropriate dashboard |
| Non-trainer visits `/trainer/*` | Redirect to `/dashboard` |
| Trainer visits `/dashboard/*` | Redirect to `/trainer/dashboard` |
| User with incomplete onboarding | Redirect to `/onboarding` |
| Completed onboarding visits `/onboarding` | Redirect to `/dashboard` |
| Unauthenticated on protected page | Redirect to `/login` with `callbackUrl` |

---

## Booking Flow

### Slot Generation

Time slots are generated client-side from the trainer's availability:
- 1-hour slots between trainer's start and end time for the selected day.
- Today's slots filtered with a 5-hour buffer from current time.
- Closed days show "No availability for this day."

### Slot Availability

- Fetches non-cancelled bookings via `GET /bookings/trainer/:id`.
- Booked slots shown in red with "Full" badge (disabled).

### Payment Flow

1. `POST /bookings` returns `{ checkoutUrl }`.
2. Frontend redirects to Stripe Checkout.
3. On success: Stripe redirects to `/dashboard/bookings?success=true` with toast.
4. On cancel: Stripe redirects to `/dashboard/bookings?cancelled=true`.
5. Retry: "Pay Now" calls `POST /bookings/:id/retry-payment` for a new checkout URL.

---

## AI-Powered Recommendations

Personalized trainer recommendations powered by a **blended scoring engine** on the backend combining rule-based vector matching and **Google Gemini semantic embeddings** (`gemini-embedding-001`).

### Where Recommendations Appear

| Location | What's Shown |
|---|---|
| `/dashboard` | Up to 4 recommended trainers with match confidence and reasons |
| `/trainers` | Top-3 recommendations banner at the top when authenticated |
| Trainer cards | Match confidence badge (e.g. "87% Match") on each card |

### What Users See

Each recommendation card shows:
- Trainer photo, name, specialty, rating
- **Match confidence badge** (percentage — e.g. "87% Match")
- **Match reasons** as pill badges (e.g. "Specializes in Weight Loss & Cardio", "Matches your fitness level")
- Bio excerpt and "View Trainer" button

### How It Works

The backend computes a blended score for each trainer:
- **40%** rule-based cosine similarity across 10-dimensional fitness feature vectors
- **30%** semantic cosine similarity from Gemini embedding comparison
- **10%** rating quality bonus
- **20%** training focus overlap bonus

No embeddings stored yet? The engine doubles the rule-based weight and still returns ranked results. See Backend README for the full mathematical model.

---

## Trainer Directory & Filters

`/trainers` provides a rich discovery experience with multiple filter controls:

| Filter | Type | Options |
|---|---|---|
| Search | Text input | Matches name, specialty, bio |
| Price range | Dual slider | Min/max session price (GBP) |
| Min rating | Pill selector | 4.0+, 4.5+, 4.8+ |
| Intensity level | Range pills | 1–5 (Light to Extreme) |
| Location | Toggle buttons | Gym, Home, Virtual |
| Sort by | Dropdown | Best Match (auth only), Rating, Price, Name |
| Focus area | Tag pills | Weight Loss, Cardio, HIIT, Yoga, etc. |

When authenticated:
- "Best Match" sort option uses the AI recommendation engine
- Top-3 recommendations appear in a highlighted banner above the grid
- Each trainer card shows a match confidence badge

---

## Trainer Dashboard

`/trainer/dashboard` is the trainer's control center:

### KPI Strip

5 metrics in a compact top bar: **Today's Sessions | Pending Requests | Active Clients | Total Earnings | Star Rating**

### Pending Requests

Dedicated section with amber styling for all incoming bookings awaiting acceptance. Trainers can Accept or Decline (with reason text) each request directly.

### Agenda

Upcoming confirmed sessions grouped into time buckets:
- **Today** — sessions scheduled for today
- **Tomorrow** — tomorrow's sessions
- **This Week** — rest of the current week
- **Later** — anything beyond this week

---

## User Dashboard

`/dashboard` gives users a summary of their fitness journey:

### Stats Overview

4 metric cards: Total Bookings, Upcoming, Completed, Current Weight.

### Upcoming Schedule

Next upcoming sessions with trainer name, date, and time.

### AI Recommendations

Up to 4 personalized trainer matches with confidence scores and reasons.

### Quick Actions

Find a Trainer, My Schedule, Edit Profile.

### Incomplete Profile Banner

Shown if onboarding data is missing, links to profile page.

---

## Components

### UI Primitives

| Component | Description |
|---|---|
| `Button` | Primary/secondary/outline variants, full-width option |
| `Card` | Clickable with selected state (primary border + background) |
| `Input` | Styled form input with label |
| `ProgressBar` | Animated progress bar (0-100%) |
| `Avatar` | Image or initial fallback |
| `ProfileMenu` | Dropdown with avatar header, configurable nav items, danger variant for logout |

### Navigation

| Component | Used On | Features |
|---|---|---|
| `Navbar` | Public pages | Auth-aware with dropdown and mobile menu |
| `DashboardNavbar` | User dashboard | ProfileMenu dropdown (Dashboard, Profile, Bookings, Trainers, Help, Logout) |
| `TrainerNavbar` | Trainer dashboard | ProfileMenu dropdown (Dashboard, Profile, Help, Logout) |

### ProfileMenu Behavior

- Renders avatar + user name/email as header
- Items support `href` (navigation) or `onClick` (action)
- `divider: true` inserts a separator line between groups
- `danger: true` renders logout item in red
- Dismisses on Escape key or pointer-down outside the panel

### Landing Page Sections

Hero, Features, HowItWorks, Trainers, Testimonials, BentoGrid, FAQ, CTASection.

---

## API Client

Typed wrappers in `src/lib/api.ts` for all backend endpoints:

- `authApi` — register, login, getMe
- `onboardingApi` — save, getMe, uploadProfileImage
- `trainerApi` — getAll, getRecommended, getOne, getMe, updateProfile, updateAvailability, uploadProfileImage, submitReview
- `bookingApi` — create, getMyBookings, getMySessions, getByTrainer, updateStatus, retryPayment

File uploads use Axios for `onUploadProgress` callbacks. All other requests use `fetch`.

---

## PWA Support

- Custom install prompt via `InstallPWA` component.
- `manifest.json` with app icons (72px to 512px).
- Service worker via `@ducanh2912/next-pwa` with Workbox caching.
- Aggressive front-end navigation caching.
- Auto-reload when network returns.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub.
2. Import in Vercel.
3. Set environment variables:
   - `NEXTAUTH_URL` = Vercel deployment URL
   - `NEXTAUTH_SECRET` = your secret
   - `NEXT_PUBLIC_API_URL` = backend API URL
4. Deploy.

**Note:** `NEXT_PUBLIC_API_URL` is embedded at build time. After changing it, trigger a redeployment.

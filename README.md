# Askal Fitness Booking Frontend

Modern fitness booking platform frontend built with Next.js 16, React 19, NextAuth, Tailwind CSS v4, and PWA support.

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
| Next.js 16 | React framework (App Router) |
| React 19 | UI library |
| TypeScript 5 | Type safety |
| NextAuth v4 | Authentication (JWT session strategy) |
| Tailwind CSS v4 | Styling (custom design system) |
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
      page.tsx                  # Trainer directory with search/filter (public)
      [id]/page.tsx             # Trainer detail + booking calendar (public)
    dashboard/
      page.tsx                  # User dashboard - stats, recommendations (user only)
      bookings/page.tsx         # Booking management - pay, cancel, review (user only)
      profile/page.tsx          # Profile editing - photo, metrics, goals (user only)
    trainer/
      dashboard/page.tsx        # Trainer control center - sessions, profile, availability
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
    DashboardNavbar.tsx         # User dashboard navigation
    TrainerNavbar.tsx           # Trainer dashboard navigation
    InstallPWA.tsx              # PWA install prompt
    FloatingAssistant.tsx       # AI chat widget (currently disabled)
    Providers.tsx               # NextAuth SessionProvider wrapper
    ui/
      Button.tsx                # Styled button (primary, secondary, outline variants)
      Card.tsx                  # Clickable card with selected state
      Input.tsx                 # Form input with label
      ProgressBar.tsx           # Animated progress bar
      Avatar.tsx                # User avatar component

  lib/
    auth.ts                     # NextAuth config (CredentialsProvider, JWT callbacks)
    api.ts                      # Typed API client (authApi, trainerApi, bookingApi, onboardingApi)
    constants.tsx               # Shared constants (training focus categories)

  middleware.ts                 # Route protection + role-based redirects
  types/index.ts                # TypeScript interfaces (User, Trainer, Booking, etc.)
```

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
npm run dev     # http://localhost:3000 (webpack mode)
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
| `/trainers` | Trainer Directory | Search, filter by focus, sort by rating/price/name |
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
| `/dashboard` | User Dashboard | Stats, upcoming sessions, recommendations, quick actions |
| `/dashboard/bookings` | Booking Management | Pay, cancel, review bookings across 3 tabs |
| `/dashboard/profile` | Profile Editor | Photo upload, metrics, fitness goals |

### Trainer Pages (Requires `trainer` Role)

| Route | Page | Description |
|---|---|---|
| `/trainer/dashboard` | Trainer Dashboard | Session management, profile editor, availability scheduler |

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
  -> Saves onboarding data
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
  -> Click "Setup Profile" to open 3-step profile wizard:
    Step 1: Aesthetics - Upload image, set specialty headline, write bio
    Step 2: Focus Areas - Select training focus categories
    Step 3: Settings - Hourly rate, intensity level, training location
  -> Set weekly availability via calendar modal
```

### Flow 3: Booking a Session

```
/trainers -> Browse, search, filter trainers -> Click trainer card
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
    - Completed: "Book Again" link to trainer page

  Cancelled tab:
    - Shows cancellation reason for each booking
```

### Flow 5: Trainer Session Management

```
/trainer/dashboard
  Agenda: Accept or Decline (with reason) pending bookings
  Profile: Update via 3-step modal
  Schedule: Edit weekly availability (toggle days, set hours)
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

The user dashboard shows personalized trainer recommendations powered by the backend's vector-based cosine similarity engine.

### What Users See

Up to 4 trainer cards on `/dashboard`, each showing:
- Trainer photo, name, specialty.
- **Match confidence bar** (e.g., "85% Match").
- **Match reasons** as pill badges (e.g., "Specializes in Weight Loss & Cardio").
- Bio excerpt and "View Trainer" button.

### How It Works

The backend matches users to trainers using 10-dimensional vectors built from onboarding data and trainer profiles. See Backend README for the full mathematical model.

---

## Trainer Dashboard

### Profile Management (3-Step Wizard)

1. **Aesthetics:** Image upload (Cloudinary with progress bar), specialty headline, bio.
2. **Focus Areas:** Multi-select from 9 categories.
3. **Settings:** Hourly rate (GBP), intensity (1-5), location (Gym / Home / Virtual).

### Availability Management

Weekly schedule editor: toggle each day on/off, set start and end times. Default: Mon-Fri 08:00-20:00.

### Session Management

Accept or decline pending bookings. Stats: total sessions, active clients, session rate.

---

## User Dashboard

### Stats Overview

4 metric cards: Total Bookings, Upcoming, Completed, Current Weight.

### Upcoming Schedule

Next 2 upcoming sessions with trainer name, date, and time.

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

### Navigation

| Component | Used On |
|---|---|
| `Navbar` | Public pages - auth-aware with dropdown and mobile menu |
| `DashboardNavbar` | User dashboard pages |
| `TrainerNavbar` | Trainer dashboard |

### Landing Page Sections

Hero, Features, HowItWorks, Trainers, Testimonials, BentoGrid, FAQ, CTASection.

---

## API Client

Typed wrappers in `src/lib/api.ts` for all backend endpoints:

- `authApi` - register, login, getMe
- `onboardingApi` - save, getMe, uploadProfileImage
- `trainerApi` - getAll, getRecommended, getOne, getMe, updateProfile, updateAvailability, uploadProfileImage, submitReview
- `bookingApi` - create, getMyBookings, getMySessions, getByTrainer, updateStatus, retryPayment

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

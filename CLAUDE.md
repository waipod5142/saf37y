# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a Next.js 15 property management application with Firebase authentication and real-time database. The app supports property listing, search, admin management, and machine inspection functionality.

### Key Technologies
- **Next.js 15** with App Router
- **Firebase** (Authentication, Storage, Admin SDK)
- **TypeScript** with strict configuration
- **Tailwind CSS** with custom design system
- **Radix UI** components with shadcn/ui
- **Zod** for schema validation
- **React Hook Form** for form management

### Application Structure

**Authentication System:**
- Firebase Auth with Google OAuth and email/password
- JWT token management with refresh tokens
- Role-based access control (admin vs regular users)
- Auth context at `context/auth.tsx` provides global auth state
- Middleware at `middleware.ts` handles route protection and token refresh

**Route Structure:**
- `app/` - Main application routes using App Router
- `app/(auth)/` - Authentication routes (login, register, forgot-password)
- `app/property-search/` - Property search with filtering
- `app/property/[propertyId]/` - Individual property pages
- `app/admin-dashboard/` - Admin-only property management
- `app/account/` - User account management with favorites
- `app/Machine/[bu]/[type]/[id]/` - Machine inspection pages with business unit, type, and ID parameters

**Data Layer:**
- `data/` - Data access functions for properties, favorites, and machine inspections
  - `data/machines.ts` - Machine data fetching and inspection records
- `firebase/client.ts` - Client-side Firebase configuration
- `firebase/server.ts` - Server-side Firebase Admin SDK
- `types/` - TypeScript type definitions
  - `types/machine.ts` - Machine type definitions
  - `types/machineInspectionRecord.ts` - Machine inspection record types
- `validation/` - Zod schemas for form validation
- `app/actions/` - Server actions for form submissions and data mutations
  - `app/actions/machine-form.ts` - Machine inspection form submission

**Components:**
- `components/ui/` - Reusable UI components (shadcn/ui)
- `components/` - Application-specific components
  - `components/machine-form.tsx` - Machine inspection form with Firebase integration
  - `components/machine-detail.tsx` - Machine inspection records display
  - `components/machine-header.tsx` - Machine information header
  - `components/multi-image-uploader.tsx` - Multi-image upload component
- Uses Radix UI primitives with custom styling

### Configuration Notes

**Path Aliases:**
- `@/*` maps to project root for clean imports

**ESLint Configuration:**
- Extends Next.js TypeScript rules
- Disables unused vars, explicit any, and empty object type warnings

**Tailwind Setup:**
- Custom design system with CSS variables
- Dark mode support configured
- Animation utilities included

**Firebase Configuration:**
- Production environment: `sccc-inseesafety-prod`
- Supports Google Auth and file storage
- Firebase Admin SDK for server-side operations
- Collections: `properties`, `favourites`, `machine`, `machinetr` (machine inspection records)

### Key Patterns

**Form Handling:**
- React Hook Form with Zod validation
- Consistent error handling and user feedback
- Server actions for form submissions
- Machine inspection forms use anonymous auth for Firebase Storage uploads
- Form submissions trigger page reload to refresh inspection records

**Image Management:**
- Multi-image uploader component
- Firebase Storage integration
- Image optimization for property listings
- Machine inspection images stored in `machines/{bu}/{type}/{id}/` paths

**State Management:**
- React Context for authentication
- Server actions for data mutations
- Client-side state for UI interactions
- Machine form state managed via React Hook Form
- Inspection records fetched server-side and cached with Next.js

**Security:**
- Middleware-based route protection
- Token-based authentication with refresh
- Role-based access control
- Input validation with Zod schemas
- Anonymous authentication for machine inspection forms
- Server-side Firebase Admin SDK for secure Firestore operations
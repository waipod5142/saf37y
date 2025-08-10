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
- `app/property-search/` - Property search with filtering and modal intercepted login
- `app/property/[propertyId]/` - Individual property pages
- `app/admin-dashboard/` - Admin-only property management with edit and new property pages
- `app/account/` - User account management with favorites and password updates
- `app/Machine/[bu]/[type]/[id]/` - Machine inspection pages with business unit, type, and ID parameters
- `app/Man/` - Man-related functionality pages
- `app/dashboard/` - Country selection for safety inspection dashboards
- `app/dashboard/[bu]/` - Country-specific dashboard with interactive maps and machine data visualization
- `app/transaction/` - Transaction summary page showing inspection statistics by country
- `app/transaction/[bu]/` - Country-specific transaction history and detailed inspection records
- `app/api/` - API routes for machine records, token refresh, dashboard data, and transaction summaries

**Data Layer:**
- `data/` - Data access functions for properties, favorites, machines, and vocabulary
  - `data/machines.ts` - Machine data fetching and inspection records
  - `data/forms.ts` - Form questions and title fetching from Firebase forms collection
  - `data/properties.ts` - Property data access functions
  - `data/favourites.ts` - User favorites management
  - `data/vocabulary.ts` - Vocabulary data access functions
- `firebase/client.ts` - Client-side Firebase configuration
- `firebase/server.ts` - Server-side Firebase Admin SDK
- `types/` - TypeScript type definitions
  - `types/machine.ts` - Machine type definitions including country and site fields
  - `types/machineInspectionRecord.ts` - Machine inspection record types
  - `types/property.ts` - Property type definitions
  - `types/propertyStatus.ts` - Property status enumeration
  - `types/vocabulary.ts` - Vocabulary type definitions
- `validation/` - Zod schemas for form validation
  - `validation/propertySchema.ts` - Property validation schemas
  - `validation/registerUser.ts` - User registration validation
- `lib/` - Utility functions and shared logic
  - `lib/actions/` - Shared server actions for form submissions and data mutations
    - `lib/actions/forms.ts` - Form questions and title fetching with dynamic title support
    - `lib/actions/machines.ts` - Machine inspection form submission and records management
    - `lib/actions/vocabulary.ts` - Vocabulary management actions
  - `lib/constants/` - Application constants and configuration
    - `lib/constants/countries.ts` - Dynamic country and site management with vocabulary system integration
  - `lib/machine-types.ts` - Machine type utilities
  - `lib/imageUrlFormatter.ts` - Image URL formatting utilities
  - `lib/imageCompression.ts` - Image compression utilities with presets for different use cases (defects, general, thumbnails)
  - `lib/utils.ts` - General utility functions

**Components:**
- `components/ui/` - Reusable UI components (shadcn/ui)
  - Form components, buttons, dialogs, tables, and other primitive UI elements
- `components/` - Application-specific components
  - `components/machine-form.tsx` - Full machine inspection form with Firebase integration, geolocation, form submission, and image uploads
  - `components/machine-title.tsx` - Simplified component displaying only machine title fetched from Firebase forms collection
  - `components/machine-detail.tsx` - Machine inspection records display
  - `components/machine-detail-client.tsx` - Client-side machine detail functionality with defect response system
  - `components/machine-header.tsx` - Machine information header
  - `components/multi-image-uploader.tsx` - Multi-image upload component
  - `components/property-form.tsx` - Property management form
  - `components/auth-buttons.tsx` - Authentication UI components
  - `components/login-form.tsx` - Login form component
  - `components/qr-code.tsx` - QR code generation component
  - `components/ClusteredMarkers.tsx` - Map clustering component for machine location visualization
  - `components/LocationMapDialog.tsx` - Interactive location map modal for machine positioning
  - `components/MachineDetailDialog.tsx` - Machine detail modal dialog for inspection data
  - `components/MachineListModal.tsx` - Machine list modal interface for dashboard views
  - `components/RecentInspectionsDialog.tsx` - Recent inspections modal for displaying latest records
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
- Collections: 
  - `properties` - Property listings and management data
  - `favourites` - User favorite properties
  - `machine` - Basic machine metadata including country and site information
  - `machinetr` - Machine inspection records and transaction history
  - `forms` - Inspection questions and titles for dynamic form generation
  - `vocabularies` - Dynamic country, site, and business unit configuration data

### Key Patterns

**Form Handling:**
- React Hook Form with Zod validation
- Consistent error handling and user feedback
- Server actions for form submissions located in `lib/actions/`
- Machine inspection forms use anonymous auth for Firebase Storage uploads
- Form submissions trigger page reload to refresh inspection records
- Dynamic form titles fetched from Firebase forms collection instead of hardcoded values
- Machine header displays dynamic fields (country, site) when available from machine collection
- **Defect response system** - Failed inspection items can be responded to with fix descriptions and evidence photos

**Image Management:**
- Multi-image uploader component
- Firebase Storage integration
- Image optimization for property listings
- Machine inspection images stored in `machines/{bu}/{type}/{id}/` paths
- **Defect fix images** stored in `machines/{bu}/{type}/{id}/{questionName}/fix-{timestamp}-{index}-{filename}` paths
- **Image compression** with different types (general, defect) for optimal storage

**State Management:**
- React Context for authentication
- Server actions for data mutations located in `lib/actions/` and co-located with features
- Client-side state for UI interactions
- Machine form state managed via React Hook Form with dynamic title state
- Inspection records fetched server-side and cached with Next.js
- Form questions and titles dynamically loaded from Firebase forms collection

**Machine Inspection Components:**
- **Dual-component architecture** for machine inspection pages:
  - `machine-form.tsx` - Full-featured inspection form with all functionality
  - `machine-title.tsx` - Lightweight title-only display component
- **Title fetching pattern** - Both components use `getMachineQuestions()` from `@/lib/actions/forms` to fetch dynamic titles from Firebase forms collection
- **Fallback title logic** - Components fall back to hardcoded titles from `machineTitles` when Firebase title is unavailable
- **Loading states** - Proper loading indicators while fetching titles from Firebase
- **Error handling** - Toast notifications for title fetching failures with graceful degradation

**Dashboard and Analytics:**
- Country-specific dashboard views with interactive maps and machine clustering
- Real-time statistics and inspection data visualization
- Dynamic machine location mapping with clustered markers
- Interactive modals for detailed machine information and recent inspections
- Dashboard data API with caching and error handling for performance
- Visual country selection interface with flag icons and site information

**Transaction Tracking:**
- Comprehensive transaction history by country and business unit
- Daily and weekly inspection statistics with global aggregation
- Real-time transaction summaries with automated data refresh
- Country-specific transaction views with detailed inspection records
- Error handling and retry mechanisms for reliable data fetching
- Performance optimization with parallel API calls and timeouts

**Dynamic Country/Site Management:**
- Vocabulary-driven country and site configuration
- Fallback data system for reliability when vocabulary service is unavailable
- Dynamic loading of country flags, names, and site mappings
- Centralized country constants with Firebase integration
- Flexible business unit and site relationship management
- Support for adding new countries without code changes

**Security:**
- Middleware-based route protection
- Token-based authentication with refresh
- Role-based access control
- Input validation with Zod schemas
- Anonymous authentication for machine inspection forms
- Server-side Firebase Admin SDK for secure Firestore operations
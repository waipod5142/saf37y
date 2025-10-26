# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**Saf37y** is a comprehensive workplace safety management platform built with Next.js 15 and Firebase. The application serves multi-national construction and industrial operations across Thailand, Vietnam, Cambodia, Sri Lanka, and Bangladesh.

### Core Capabilities

1. **Machine Safety Inspections** - Digital inspection forms for construction equipment (mixers, pumps, excavators, etc.) with:
   - QR code-based machine identification
   - GPS-tagged inspection records
   - Photo documentation with defect tracking
   - Pass/fail status determination
   - Defect response and resolution tracking

2. **Personnel Safety Activities** - Comprehensive safety program management including:
   - Safety Observation Tools (SOT)
   - Safety talks and toolbox meetings
   - Training records with expiration tracking
   - Safety alerts and incident reporting
   - Risk assessments
   - Boot/PPE inspections
   - Safety coupon/token incentive programs

3. **Maintenance Tracking** - Equipment maintenance schedule management:
   - Greasing schedules
   - Lubrication tracking
   - Maintenance history

4. **Analytics & KPI Dashboards** - Real-time safety metrics and compliance tracking:
   - Interactive maps with machine location clustering
   - Country and site-specific dashboards
   - Inspection completion rates
   - Defect trending
   - Personnel safety activity metrics
   - Transaction history and audit trails

5. **Property Management** (Legacy feature) - Real estate listing and management system

### Target Users

- Safety inspectors and supervisors
- Maintenance personnel
- Site managers
- Safety managers
- Corporate safety leadership

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to Firebase App Hosting (main branch)
- `npm run deploy:old` - Legacy Firebase deployment command

## Architecture Overview

This is a Next.js 15 safety management application with Firebase authentication and real-time database. The app supports:

- **Property management** - Property listings, search, and admin management
- **Machine safety inspections** - Equipment inspection forms and tracking
- **Personnel safety activities** - Safety training, meetings, alerts, and safety observations
- **Maintenance tracking** - Lubrication and greasing schedules
- **Analytics and KPI dashboards** - Real-time safety metrics and compliance tracking

### Key Technologies

- **Next.js 15** with App Router
- **React 19** with modern features
- **Firebase** (Authentication, Storage, Admin SDK)
- **TypeScript** with strict configuration
- **Tailwind CSS** with custom design system
- **Radix UI** components with shadcn/ui
- **Leaflet** and **React Leaflet** for interactive mapping
- **Leaflet.markercluster** for map marker clustering
- **Zod** for schema validation
- **React Hook Form** for form management
- **@hello-pangea/dnd** for drag-and-drop functionality
- **browser-image-compression** for client-side image optimization
- **QRCode** library for QR code generation
- **numeral** for number formatting
- **React Markdown** for markdown rendering
- **next-themes** for theme management
- **Sonner** for toast notifications

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
- **Machine Inspection Routes:**
  - `app/Machine/[bu]/[type]/[id]/` - Machine inspection form pages with business unit, type, and ID parameters
  - `app/dashboard/` - Country selection for machine safety inspection dashboards
  - `app/dashboard/[bu]/` - Country-specific dashboard with interactive maps and machine location visualization
  - `app/dashboardbysite/` - Site selection dashboard
  - `app/dashboardbysite/[site]/` - Site-specific machine dashboard
  - `app/transaction/` - Transaction summary page showing inspection statistics by country
  - `app/transaction/[bu]/` - Country-specific transaction history and detailed inspection records
  - `app/kpi/` - Machine inspection KPI country selection
  - `app/kpi/[bu]/` - Country-specific machine KPI dashboard
  - `app/kpi/[bu]/[site]/` - Site-specific machine KPI dashboard
  - `app/kpilog/[bu]/[site]/` - Machine inspection log by site
  - `app/rmx/` - Mixer machine owner dashboard
  - `app/rmxtype/` - Mixer machine type analytics
- **Personnel Safety Activity Routes:**
  - `app/Man/[bu]/[type]/[id]/` - Personnel safety activity pages (SOT, Talk, Toolbox, Coupon tracking)
  - `app/ManForm/[bu]/[type]/[id]/` - Safety activity forms (Alerts, Meetings, Toolbox, Boot inspections, Risk Assessments, PTO)
  - `app/ManForm/[bu]/[type]/[id]/[trainingDate]/[expirationDate]/[courseId]/` - Training record creation
  - `app/kpiman/` - Personnel safety activity KPI country selection
  - `app/kpiman/[bu]/` - Country-specific personnel safety KPI dashboard
  - `app/kpialert/` - Alert KPI country selection
  - `app/kpialert/[bu]/` - Country-specific alert KPI dashboard
- **Maintenance Method Routes:**
  - `app/MethodForm/[bu]/[type]/[id]/` - Maintenance method forms (Greasing, Lubrication)
- **API Routes:**
  - `app/api/machine-records/` - Machine inspection records API
  - `app/api/man-records/` - Personnel safety activity records API
  - `app/api/token-data/` - Safety coupon/token data API
  - `app/api/refresh-token/` - JWT token refresh endpoint
  - `app/api/dashboard-data/` - Dashboard statistics and analytics API
  - `app/api/transaction-summary/` - Transaction summary aggregation API
  - `app/api/transactions/` - Transaction data API
  - `app/api/all-machine-transactions/` - All machine transactions API

**Data Layer:**

- `data/` - Data access functions for properties, favorites, machines, personnel activities, and vocabulary
  - `data/machines.ts` - Machine data fetching and inspection records
  - `data/man.ts` - Personnel safety activity data (SOT, Talk, Toolbox, training, alerts, meetings, risk assessments, PTO)
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
    - `lib/actions/man.ts` - Personnel safety activity form submission and records management
    - `lib/actions/method.ts` - Maintenance method form submission
    - `lib/actions/employees.ts` - Employee data management
    - `lib/actions/vocabulary.ts` - Vocabulary management actions
  - `lib/constants/` - Application constants and configuration
    - `lib/constants/countries.ts` - Dynamic country and site management with vocabulary system integration
  - `lib/machine-types.ts` - Machine type utilities
  - `lib/imageUrlFormatter.ts` - Image URL formatting utilities
  - `lib/imageCompression.ts` - Image compression utilities with presets for different use cases (defects, general, thumbnails)
  - `lib/utils.ts` - General utility functions including BU code normalization
- `hooks/` - Custom React hooks
  - `hooks/useGeolocation.ts` - Geolocation functionality for machine positioning

**Components:**

- `components/ui/` - Reusable UI components (shadcn/ui)
  - Form components, buttons, dialogs, tables, and other primitive UI elements
  - `components/ui/date-utils.tsx` - Date formatting utilities and timestamp conversion
  - `components/ui/skeleton.tsx` - Loading skeleton components for better UX
  - `components/ui/breadcrumb.tsx` - Navigation breadcrumb component
  - `components/ui/carousel.tsx` - Image carousel component with Embla Carousel
- `components/` - Application-specific components
  - **Machine Components:**
    - `components/machine-form.tsx` - Full machine inspection form with Firebase integration, geolocation, form submission, and image uploads
    - `components/machine-title.tsx` - Simplified component displaying only machine title fetched from Firebase forms collection
    - `components/machine-detail.tsx` - Machine inspection records display
    - `components/machine-detail-client.tsx` - Client-side machine detail functionality with defect response system
    - `components/machine-header.tsx` - Machine information header with dynamic field display
  - **Personnel Safety Activity Components:**
    - `components/man-option.tsx` - Personnel activity option selector
    - `components/man-header.tsx` - Personnel information header
    - `components/man-detail.tsx` - Personnel safety activity records display
    - `components/man-type-badge.tsx` - Personnel activity type badge
    - `components/man-form-sot.tsx` - Safety Observation Tool form
    - `components/man-form-talk.tsx` - Safety Talk form
    - `components/man-form-toolbox.tsx` - Toolbox meeting form
    - `components/man-form-token.tsx` - Safety coupon/token form
    - `components/man-form-alert.tsx` - Safety alert form
    - `components/man-form-meeting.tsx` - Safety meeting form
    - `components/man-form-boot.tsx` - Boot inspection form
    - `components/man-form-ra.tsx` - Risk assessment form
    - `components/man-form-pto.tsx` - PTO (Paid Time Off) form
    - `components/man-detail-*-client.tsx` - Client-side detail views for each activity type
  - **Maintenance Method Components:**
    - `components/method-form-grease.tsx` - Greasing schedule form
    - `components/method-form-lub.tsx` - Lubrication schedule form
  - **Shared Components:**
    - `components/multi-image-uploader.tsx` - Multi-image upload component with compression
    - `components/change-user-button.tsx` - User switching component
    - `components/property-form.tsx` - Property management form
    - `components/auth-buttons.tsx` - Authentication UI components
    - `components/continue-with-google-button.tsx` - Google OAuth authentication button
    - `components/login-form.tsx` - Login form component
    - `components/mobile-nav.tsx` - Mobile navigation component with responsive design
    - `components/property-status-badge.tsx` - Property status display component with color coding
    - `components/qr-code.tsx` - QR code generation component for machine identification
    - `components/ClusteredMarkers.tsx` - Map clustering component for machine location visualization using Leaflet
    - `components/LocationMapDialog.tsx` - Interactive location map modal for machine positioning
    - `components/MachineDetailDialog.tsx` - Machine detail modal dialog for inspection data display
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
- Firebase App Hosting configuration via `apphosting.yaml`
- Collections:
  - `properties` - Property listings and management data
  - `favourites` - User favorite properties
  - `machine` - Basic machine metadata including country and site information
  - `machinetr` - Machine inspection records and transaction history
  - `man` - Personnel safety activity records (SOT, Talk, Toolbox, training, alerts, meetings, risk assessments, PTO, coupons)
  - `mantr` - Personnel safety activity transaction history
  - `employees` - Employee data and information
  - `forms` - Inspection questions and titles for dynamic form generation
  - `vocabularies` - Dynamic country, site, and business unit configuration data

**Deployment Configuration:**

- `apphosting.yaml` - Firebase App Hosting configuration for modern deployment
- `firebase.json` - Legacy Firebase hosting configuration
- Automated deployment via `npm run deploy` for main branch
- Node.js version requirements: `>=18.17.0 <21.0.0`

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

**Personnel Safety Activity System:**

- **Multi-type form system** for different safety activities:
  - SOT (Safety Observation Tool) - Safety observations and hazard identification
  - Talk - Safety discussions and communications
  - Toolbox - Toolbox meeting records
  - Alert - Safety alerts and incident reporting
  - Meeting - Safety meeting minutes
  - Boot - Boot and PPE inspection records
  - RA (Risk Assessment) - Risk assessment documentation
  - PTO - Personnel time off tracking
  - Coupon/Token - Safety incentive token tracking
- **Training management** - Training records with expiration dates and course tracking
- **Detail views** - Each activity type has dedicated client-side detail components for viewing records
- **Activity routing** - Dynamic routing based on activity type for appropriate form display

**Maintenance Method System:**

- **Lubrication tracking** - Greasing and lubrication schedule management
- **Method-specific forms** - Dedicated forms for different maintenance methods
- **Schedule management** - Tracking of maintenance schedules and completion

**Dashboard and Analytics:**

- **Machine Inspection Dashboards:**
  - Country-specific dashboard views with interactive maps and machine clustering
  - Site-specific dashboard for focused analysis
  - Real-time statistics and inspection data visualization
  - Dynamic machine location mapping with clustered markers
  - Interactive modals for detailed machine information and recent inspections
  - Dashboard data API with caching and error handling for performance
  - Visual country selection interface with flag icons and site information
  - Mixer-specific dashboards tracking by owner and type
- **Personnel Safety KPI Dashboards:**
  - Country-specific personnel safety activity tracking
  - Alert-specific KPI monitoring
  - Safety activity metrics and compliance tracking
- **Multi-level KPI views:**
  - Country-level aggregated metrics
  - Site-level detailed analytics
  - Activity-specific KPI tracking

**Transaction Tracking:**

- Comprehensive transaction history by country and business unit
- Daily and weekly inspection statistics with global aggregation
- Real-time transaction summaries with automated data refresh
- Country-specific transaction views with detailed inspection records
- Advanced filtering and search capabilities:
  - Text-based search across machine records
  - Site and inspector filtering with Select components
  - Date range filtering for targeted analysis
  - Real-time filtering with debounced input
- Inspection status calculation with sophisticated logic:
  - Automated pass/fail determination from inspection fields
  - Failed items tracking for detailed reporting
  - Status badges with color-coded visual indicators
  - Support for N/A status when no evaluable items present
- Loading states and skeleton components for better UX
- Error handling and retry mechanisms for reliable data fetching
- Performance optimization with parallel API calls and timeouts
- Responsive design with mobile-optimized transaction cards

**Dynamic Country/Site Management:**

- Vocabulary-driven country and site configuration
- Fallback data system for reliability when vocabulary service is unavailable
- Dynamic loading of country flags, names, and site mappings
- Centralized country constants with Firebase integration
- Flexible business unit and site relationship management
- Support for adding new countries without code changes
- **Business unit normalization** - BU codes (office, srb, mkt, lbm, rmx, iagg, ieco) normalized to country codes (e.g., "th" for Thailand-based units)

**Security:**

- Middleware-based route protection
- Token-based authentication with refresh
- Role-based access control
- Input validation with Zod schemas
- Anonymous authentication for machine inspection forms
- Server-side Firebase Admin SDK for secure Firestore operations

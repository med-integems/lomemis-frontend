# LoMEMIS Frontend Application Structure

This document describes the Next.js application structure for the LoMEMIS TLM Management System.

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/                # Login page
│   │   └── layout.tsx            # Auth layout
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── admin/                # Admin-only pages
│   │   │   ├── users/            # User management
│   │   │   ├── items/            # Item master management
│   │   │   ├── schools/          # School management
│   │   │   └── councils/         # Council management
│   │   ├── dashboard/            # Main dashboard
│   │   ├── inventory/            # Inventory management
│   │   │   ├── national/         # National warehouse inventory
│   │   │   └── councils/         # Council inventories
│   │   ├── shipments/            # Shipment management
│   │   ├── distributions/        # Distribution management
│   │   ├── reports/              # Reports and analytics
│   │   └── layout.tsx            # Dashboard layout with sidebar
│   ├── globals.css               # Global styles with SL color scheme
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (redirects to dashboard)
├── components/
│   ├── layout/                   # Layout components
│   │   ├── app-sidebar.tsx       # Main navigation sidebar
│   │   └── header.tsx            # Top header with user info
│   └── ui/                       # Shadcn UI components
├── lib/
│   └── utils.ts                  # Utility functions
└── types/
    └── index.ts                  # TypeScript type definitions
```

## Features Implemented

### ✅ Task 9.1 - Next.js Application Structure

- **Next.js with TypeScript**: Configured with latest Next.js 15.4.4
- **Tailwind CSS**: Configured with Government of Sierra Leone color scheme
- **Shadcn UI**: Pre-installed and configured components
- **Routing Structure**: Role-based routing with protected routes
- **Base Layout**: Government styling with responsive design

### Government of Sierra Leone Color Scheme

- **Primary Green**: #007A33 - Navigation, primary buttons, headers
- **Secondary Blue**: #005DAA - Secondary actions, links, info elements
- **Accent Lime**: #A3C940 - Success states, highlights, call-to-action
- **Background Grey**: #F7F7F7 - Page backgrounds, card backgrounds
- **Text/Dark Grey**: #333333 - Primary text, icons

### Role-Based Navigation

The sidebar navigation adapts based on user roles:

- **Super Administrator**: Full access to all features
- **National Warehouse Manager**: National inventory and shipment management
- **Local Council M&E Officer**: Council inventory and distribution management
- **School Representative**: View distributions and confirm receipts
- **View-Only User**: Read-only access to dashboards and reports

## Next Steps

- **Task 9.2**: Implement authentication UI components
- **Task 9.3**: Build responsive navigation system
- **Task 10.1**: Implement dashboard components
- **Task 11.1**: Build inventory management interfaces

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

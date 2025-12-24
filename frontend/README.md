# FinGuard AI Frontend

AI-powered banking dashboard built with Next.js and Tailwind CSS.

## Setup

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard home
│   ├── comply/             # RegTech Compliance module
│   ├── advisor/            # Investment Advisor module
│   ├── inclusion/          # Credit Scoring module
│   └── shield/             # Fraud Detection module
├── components/
│   ├── ui/                 # Shared UI components
│   ├── comply/             # RegTech-specific components
│   ├── advisor/            # Investment-specific components
│   ├── inclusion/          # Credit-specific components
│   └── shield/             # Fraud-specific components
├── public/                 # Static assets
└── styles/
    └── globals.css         # Global styles + Tailwind
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components following design system

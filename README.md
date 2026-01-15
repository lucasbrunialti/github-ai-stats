# GitHub PR Summary

AI-powered engineering reports for leadership. Generate comprehensive summaries of merged pull requests across your GitHub organization using Claude AI.

## Features

- **Organization-wide PR Analysis**: Fetch merged PRs from multiple repositories in a GitHub organization
- **Date Range Filtering**: Select specific time periods for your reports
- **AI-Powered Summaries**: Claude generates executive summaries categorizing changes by type
- **Streaming Responses**: Watch the AI summary generate in real-time
- **Export Options**: Download reports as Markdown or copy to clipboard
- **Team Performance Dashboard**: Track PRs merged per developer over time with interactive charts
- **Developer Analytics**: Filter by date range and developer to analyze individual performance

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Web Application                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        FRONTEND (React)                              │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐    │   │
│   │  │  Org      │  │  Date     │  │  Repo     │  │   Report      │    │   │
│   │  │  Input    │  │  Picker   │  │  Filter   │  │   Viewer      │    │   │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        BACKEND (Node.js)                             │   │
│   │                                                                      │   │
│   │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │   │
│   │  │   GitHub     │───▶│   PR Data    │───▶│   Claude     │          │   │
│   │  │   Service    │    │   Aggregator │    │   Summarizer │          │   │
│   │  └──────────────┘    └──────────────┘    └──────────────┘          │   │
│   │         │                                        │                  │   │
│   │         ▼                                        ▼                  │   │
│   │  ┌────────────────────────────────────────────────────────────┐    │   │
│   │  │  • List repos from org         • Executive summary         │    │   │
│   │  │  • Merged PRs from each repo   • Categorization            │    │   │
│   │  │  • Commits from each PR        • Highlights and risks      │    │   │
│   │  └────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Application Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER ENTERS ORGANIZATION                                      │
│    ┌─────────────────────────────────────────┐                   │
│    │  Organization: [ vercel              ]  │                   │
│    │                         [Load Repos →]  │                   │
│    └─────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. SYSTEM LOADS REPOS FROM ORG                                   │
│    GET /api/orgs/{org}/repos                                     │
│    → Lists all public/private repos (with permission)            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. USER SELECTS REPOS AND DATE RANGE                             │
│    ┌─────────────────────────────────────────┐                   │
│    │  Repositories:                          │                   │
│    │  ☑ next.js                              │                   │
│    │  ☑ turbo                                │                   │
│    │  ☐ swr                                  │                   │
│    │  ☑ ai                                   │                   │
│    │                                         │                   │
│    │  Period: [2026-01-01] to [2026-01-12]   │                   │
│    │                                         │                   │
│    │              [Generate Report →]        │                   │
│    └─────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. BACKEND FETCHES MERGED PRs                                    │
│    POST /api/prs                                                 │
│    → For each selected repo:                                     │
│      • Lists PRs with state=closed                               │
│      • Filters by merged_at in date range                        │
│      • Fetches commits for each PR                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. CLAUDE GENERATES EXECUTIVE SUMMARY                            │
│    POST /api/summary                                             │
│    → Sends context: PRs + descriptions + commits                 │
│    → Receives: Categorized and formatted summary                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. DISPLAYS REPORT                                               │
│    ┌─────────────────────────────────────────────────────────┐   │
│    │  📊 Engineering Report - Vercel                         │   │
│    │  Period: Jan 1-12, 2026 | 47 PRs merged                 │   │
│    │                                                         │   │
│    │  ## 🚀 New Features (12)                                │   │
│    │  - Next.js: Implemented streaming SSR improvements...   │   │
│    │  - Turbo: Added remote caching for monorepos...         │   │
│    │                                                         │   │
│    │  ## 🐛 Bug Fixes (23)                                   │   │
│    │  - Fixed memory leak in image optimization...           │   │
│    │                                                         │   │
│    │  ## ⚠️ Attention Points                                 │   │
│    │  - Large refactor in auth module - monitor for issues   │   │
│    │                                                         │   │
│    │  [📥 Download MD] [📋 Copy] [🔄 Regenerate]             │   │
│    └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | shadcn/ui | Accessible React components |
| Database | Prisma + SQLite | Data persistence for analytics |
| Charts | Recharts | Interactive data visualization |
| GitHub API | @octokit/rest | Official GitHub SDK |
| AI | Anthropic Claude API | Summary generation |

## Prerequisites

- Node.js 18+
- GitHub Personal Access Token with `repo` and `read:org` scopes
- Anthropic API Key

## Setup

1. Clone the repository:

```bash
git clone https://github.com/lucasbrunialti/github-ai-stats.git
cd github-ai-stats
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:

```env
GITHUB_TOKEN=ghp_your_github_token
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
DATABASE_URL="file:./dev.db"
```

5. Initialize the database:

```bash
npm run db:push
```

6. Run the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter a GitHub organization or username
2. Select the repositories you want to analyze
3. Choose the date range for merged PRs
4. Click "Fetch Pull Requests" to retrieve the data
5. Review the list of PRs found
6. Click "Generate AI Summary" to create the report
7. Download or copy the generated report

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orgs/[org]/repos` | List repositories for an organization |
| `POST` | `/api/prs` | Fetch merged PRs for selected repositories |
| `POST` | `/api/summary` | Generate AI summary of PRs |
| `GET` | `/api/analytics` | Get developer performance statistics |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analytics/         # Developer analytics endpoint
│   │   ├── orgs/[org]/repos/  # Organization repos endpoint
│   │   ├── prs/               # Pull requests endpoint
│   │   └── summary/           # AI summary endpoint
│   ├── performance/           # Team performance page
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Main application page
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── PerformanceChart.tsx   # PRs per month chart
│   ├── PerformanceFilters.tsx # Date/developer filters
│   └── ...                    # Other components
├── lib/
│   ├── prisma.ts              # Prisma client
│   └── utils.ts
├── services/
│   ├── claude.ts              # Claude AI integration
│   ├── database.ts            # Database operations
│   └── github.ts              # GitHub API integration
└── types/
    └── index.ts
prisma/
└── schema.prisma              # Database schema
```

## License

MIT

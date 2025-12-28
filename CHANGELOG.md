# Changelog

All notable changes to the EHDS Regulation Explorer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced search with advanced filtering options
- Comparative view between regulation versions
- Multi-language support

---

## [1.4.0] - 2025-12-28

### Added

#### Plain Language Translations
- AI-powered plain language translations for articles and recitals
- Side-by-side view showing legal text alongside accessible plain language version
- Clear AI disclaimer on all generated translations
- Admin interface for generating, editing, and publishing translations
- Batch generation capability for translating multiple articles/recitals at once
- Progress tracking during batch generation with success/failure indicators
- Draft/published workflow for editorial review

#### Firecrawl Integration for News Summaries
- Firecrawl connector integration for URL scraping
- New "Scrape Sources" tab in manual news summary creation
- Ability to scrape EHDS-related news URLs and extract content
- Insert scraped content excerpts directly into summaries
- Automatic source URL tracking from scraped content

---

## [1.3.0] - 2025-12-24

### Added

#### User Profile & Account Management
- New profile page at `/profile` for logged-in users
- Display name editing with profile settings
- Email change functionality with confirmation link
- Password change feature via secure edge function
- Account information display (email, member since, roles)
- Profile access button added to admin dashboard header

---

## [1.2.0] - 2025-12-23

### Added

#### Implementing Acts Detailed Content
- Dedicated database tables for implementing act recitals, articles, and sections
- Full content management for each implementing act with its own articles, recitals, and sections
- Searchable content within each implementing act detail page
- Section-based article organization with accordion navigation
- Tabbed interface for articles and recitals on detail pages

#### Enhanced Bulk Import
- Added bulk import for Joint Action Deliverables
- Added bulk import for Published Works
- Added bulk import for Footnotes
- Added bulk import for Implementing Act Recitals
- Added bulk import for Implementing Act Articles
- Added bulk import for Implementing Act Sections
- Smart import that replaces content per implementing act ID rather than all data

#### Admin Improvements
- New admin page for managing implementing act content (articles, recitals, sections)
- Direct link from implementing acts list to content management
- Fixed Select component issues with empty values in dialogs

---

## [1.1.0] - 2025-12-15

### Added

#### Public Data API
- RESTful API at `/functions/v1/api-data` for programmatic access
- Support for JSON and CSV export formats
- Six endpoints: articles, recitals, definitions, chapters, implementing-acts, metadata
- Rate limiting (100 requests/hour/IP) with headers showing remaining quota
- FAIR-compliant metadata including ELI identifiers and provenance
- No authentication required for read-only access

#### API Documentation
- Dedicated developer documentation page at `/api`
- Prominent copy-to-clipboard button for base URL
- Quick start section with curl examples
- Comprehensive endpoint documentation with parameter tables
- Example responses and FAIR compliance explanation

#### Key Dates Gantt Chart
- Interactive Gantt chart visualization for key EHDS dates
- Zoom controls (1x-4x) for better timeline navigation
- Timeline extended to 2033 for long-term planning
- Export functionality to ICS (calendar), CSV (spreadsheet), and JSON formats
- Hover interactions with milestone highlighting
- Color-coded milestones with chart color palette

#### Content Landing Pages
- New Articles landing page (/articles) with search functionality
- Search articles by number, title, or content
- Recitals page now includes search functionality
- Filter recitals by number or content

#### UI Improvements
- Chapter numbers displayed as Roman numerals in sidebar navigation
- Added chart color tokens to design system (chart-1 through chart-5)

### Fixed
- Fixed uncolored date markers in Gantt chart after first milestone
- Added missing chart color definitions to Tailwind config and CSS

---

## [1.0.0] - 2024-12-12

### Added

#### Core Features
- Complete EHDS Regulation content with 105 articles, 115 recitals, and 4 annexes
- Chapter and section navigation with hierarchical structure
- Individual article and recital detail pages with full text
- Definitions page with searchable legal terms
- Full-text search with fuzzy matching via Fuse.js
- Natural language search queries ("article 42", "recital 15", "chapter 3")

#### Implementing Acts Tracker
- Tracking for 33 implementing and delegated acts
- Status indicators (pending, in progress, adopted)
- Feedback period countdown timers with "days remaining" indicators
- Official document links and deliverable connections
- Organized by theme (Primary Use, EHR Systems, Secondary Use, etc.)

#### Admin Backend
- Role-based access control (admin/editor roles)
- Content management for all content types
- Markdown WYSIWYG editor with live preview
- Bulk import functionality for JSON data
- User invitation system via email
- Maintenance mode with custom messages

#### Linking Features
- Joint Action Deliverables linking to articles and implementing acts
- Published Works linking for academic research and publications
- Article-to-recital cross-references
- Implementing act to article relationships

#### User Experience
- Dark/light mode toggle with system preference detection
- Reading progress tracking per chapter
- Bookmarking system for articles and recitals
- Adjustable font sizes (small, medium, large, x-large)
- Cookie consent management

#### Accessibility
- Keyboard shortcuts (arrows, 'b' for bookmark, '/' for search, '?' for help)
- Breadcrumb navigation on all pages
- Print-friendly stylesheets with print buttons
- WCAG compliant design
- Skip to content links

#### Notifications System
- Admin-managed notifications with expiration dates
- Dismissible notification banners for users
- Active/inactive toggle for notifications

#### Legal Compliance
- Privacy Policy page
- Cookies Policy page
- Terms of Service page
- Accessibility Statement page

#### Technical
- Loading indicator during app initialization
- Responsive design for all screen sizes
- Database-driven content management via Supabase
- RLS policies for secure data access
- Real-time content updates without redeployment

---

## [0.2.0] - 2024-11-XX

### Added
- Recital detail pages with individual navigation
- Quick explorers for articles (1-105) and recitals (1-115)
- Hover tooltips showing preview content
- Chapter page with article listings
- Search command palette (Cmd/Ctrl + K)

### Changed
- Migrated from static data to database-driven content
- Updated article and recital hooks to fetch from Supabase

### Fixed
- Missing articles 100-105 added to database
- Missing recitals 97-115 extracted from PDF and added

---

## [0.1.0] - 2024-10-XX

### Added
- Initial project setup with React, Vite, and TypeScript
- Basic navigation structure
- Static article and recital data
- Simple search functionality
- Light/dark mode toggle
- Basic styling with Tailwind CSS

---

## Contributing

When contributing to this project, please update this changelog with your changes under the `[Unreleased]` section.

### Change Types
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes

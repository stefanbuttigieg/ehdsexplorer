# Changelog

All notable changes to the EHDS Regulation Explorer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced search with advanced filtering options
- Comparative view between regulation versions

---

## [2.0.3] - 2026-02-05

### Added

#### Translation Import Tool
- **PDF Translation Parser** - New admin tool at `/admin/translation-import` for bulk importing translated regulation content
  - Multi-language pattern detection for Article, Recital, and Chapter markers (24 EU languages)
  - Automatic language detection from document content
  - Structural validation against English source (105 articles, 115 recitals)
  - Side-by-side diff preview comparing translated content with English source
  - Selective import with checkbox selection for individual articles/recitals
  - Duplicate and missing content detection with warnings
  - Character count validation to identify parsing issues
- **Translation Import Hook** - `useTranslationImport` for parsing and validating regulation documents
- **Diff Preview Component** - `TranslationDiffPreview` for comparing and selecting translations

#### MFA Login Verification Flow
- **Login MFA Challenge** - Users with MFA enabled are now properly prompted for verification after password entry
  - Unified verification dialog supporting both TOTP (authenticator apps) and Email OTP
  - Tab-based interface to switch between verification methods when both are enrolled
  - Session held at AAL1 until verification is completed, then elevated to AAL2
- **Email OTP Login Verification** - New edge function `verify-email-otp-login` for secure code validation during login
- **Automatic MFA Detection** - Login flow now checks both native TOTP factors and custom Email OTP preferences

### Fixed
- **TOTP QR Code Loading** - Fixed issue where authenticator app setup QR code was stuck in loading state
  - Refactored enrollment trigger from `onOpenChange` to proper `useEffect` hook
  - Added `isStarting` state to prevent duplicate enrollment requests
  - Enhanced error handling with cancel option when enrollment fails
- **MFA Verification Race Condition** - Fixed issue where MFA dialog would flash momentarily then redirect
  - Added `awaitingMFA` state flag to block premature navigation during verification
  - Redirect logic now waits for successful MFA completion before proceeding
  - Cancel during MFA properly signs out user and resets authentication state
- **Footnote Import Missing Base Records** - Fixed translation import not creating base footnote entries
  - Batch-insert missing base footnotes before processing translations
  - Base footnotes now store full content instead of truncated placeholders
  - Improved marker-to-UUID mapping for correct translation linking

---

## [2.0.2] - 2026-02-04

### Added

#### Two-Factor Authentication (2FA/MFA)
- **Dual MFA Methods** - Support for both Authenticator Apps (TOTP) and Email OTP verification
- **Admin Security Settings** - New admin page at `/admin/security` for super admins to manage MFA enforcement
  - Toggle reminder banners for users without MFA enabled
  - Enable/disable enforcement with configurable grace period
  - Set grace period end date for 6-month transition period
  - Choose allowed MFA methods (TOTP, Email, or both)
- **User MFA Enrollment** - New Security tab in Profile page for users to set up 2FA
  - QR code setup flow for authenticator apps (Google Authenticator, Authy, etc.)
  - Email OTP enrollment with verification code confirmation
  - View and manage enrolled MFA methods
- **Gentle Reminder System** - Dismissable banner encouraging MFA setup during transition period
- **MFA Verification Flow** - Challenge dialog during login when MFA is enrolled
- **Database Tables** - `mfa_settings` for global config, `user_mfa_preferences` for per-user tracking

---

## [2.0.1] - 2026-02-04

### Added

#### SEO & Growth Infrastructure
- **Admin SEO Management** - New admin page at `/admin/seo` for managing page-level SEO settings
  - Configure meta titles, descriptions, and keywords per page
  - Open Graph and Twitter card customization
  - Structured data type selection (Article, Legislation, FAQ, HowTo)
  - Robots directives (noindex, nofollow) per page
  - Quick setup tab for unconfigured common pages
- **Schema Markup Components** - Rich snippets for Google search results
  - ArticleSchema for 105 articles and 115 recitals
  - BreadcrumbSchema for enhanced navigation display
  - FAQSchema for Help Center page
  - HowToSchema for procedural content
  - WebsiteSchema with SearchAction for sitelinks
- **Newsletter Subscription System** - Email capture for user acquisition
  - Multiple variants: card, banner, and inline forms
  - Secure edge function with email validation
  - Source tracking (website, footer, resource downloads)
  - Verification token flow for double opt-in

#### Admin API Documentation Hub
- New centralized API documentation page at `/admin/api-docs` for super admins
- Comprehensive reference for all 11 GET endpoints and POST endpoints
- Includes `articles`, `recitals`, `definitions`, `chapters`, `sections`, `annexes`, `implementing-acts`, `health-authorities`, `country-legislation`, `ehds-obligations`, and `metadata`
- Full documentation for `POST /update-obligation-status` endpoint with authentication requirements
- Base URL, authentication methods (API Key and Bearer token), query parameters, and field specifications
- `curl` examples and response schemas for each endpoint
- Rate limiting documentation (100 req/hour for public GET, 100 req/min for authenticated POST)
- Accessible via Admin Dashboard under Super Admin section

#### Implementation Tracker Evidence Panel
- Integrated evidence management directly into Admin Implementation Tracker page
- Expandable obligation rows with chevron indicators and evidence count badges
- Click any obligation to reveal full evidence panel (links, documents, notes)
- Streamlined workflow for country managers to add evidence without leaving the tracker

#### Database Tables
- `seo_settings` - Page-level SEO configuration with structured data support
- `newsletter_subscriptions` - Email subscriber management with verification flow
- `downloadable_resources` - Lead magnet resource management
- `resource_downloads` - Download tracking for email-gated resources

---

## [2.0.0] - 2026-02-03

### Added

#### Public API v2.0
- **New Endpoints**: Added `sections`, `annexes`, `health-authorities`, and `country-legislation` resources
- **Translation Support**: New `lang` parameter enables fetching content in 24 EU languages (en, de, fr, mt, etc.)
- **Field Selection**: New `fields` parameter allows clients to request only specific fields, reducing payload size
- **Filtering**: Country and status filtering for health-authorities and country-legislation endpoints
- **OpenAPI 3.0 Specification**: Full machine-readable API spec available at `/openapi.json`

#### API Documentation Enhancements
- Updated docs page to reflect all new v2.0 features
- Added feature cards for translations, field selection, and OpenAPI spec
- Rate limiting documentation with header explanations
- Available fields listed for each endpoint

### Changed
- API version bumped to 2.0 in metadata response
- Improved code organization in edge function

---

## [1.9.4] - 2026-02-02

### Fixed

#### Umami Analytics Error Handling
- Improved edge function error handling for Umami API calls
- Added proper HTTP status code checking before parsing JSON responses
- Better error logging to diagnose API failures (401, 500, etc.)
- Graceful degradation when Umami API is unavailable

---

## [1.9.3] - 2026-02-02

### Added

#### Multi-Source Definitions
- Definitions can now have multiple sources (EHDS Regulation, EU EHR Glossary, Xt-EHR)
- Each source stores its own version of the definition text
- New `definition_sources` table stores source-specific texts with article references
- Public definitions page shows expandable source-specific texts when a term has multiple sources
- Click "Show other sources" to view how the same term is defined across different references

#### Admin Definition Source Editor
- New inline source editor in definition edit dialog
- Add, edit, or remove source-specific texts for any definition
- Color-coded source cards for visual distinction
- Each source can have its own article reference

#### Enhanced Import
- Xt-EHR import now creates entries in both definitions and definition_sources tables
- Existing definitions migrated to new multi-source structure

---

## [1.9.2] - 2026-02-02

### Added

#### Xt-EHR Glossary Import
- One-click import of ~48 technical terms from [Xt-EHR Glossary](https://www.xt-ehr.eu/glossary-list/)
- Automatic duplicate detection during import with visual indicators
- Selective import with checkboxes to choose which terms to add
- All imported terms tagged with `source='xt_ehr'` for filtering

#### Definition Merge Feature
- New merge functionality in Admin Definitions page
- Select a primary definition and merge content from a secondary one
- Three merge strategies: append, prepend, or replace
- Automatic deletion of secondary definition after merge
- Useful for consolidating duplicate or related terms from different sources

#### Admin UI Enhancements
- Source filtering added to Admin Definitions page
- Editable source field when editing definitions
- Import Xt-EHR button in Admin Definitions header

---

## [1.9.1] - 2026-02-02

### Added

#### EU EHR Systems Glossary Integration
- Imported ~60 technical terms from the official EU EHR Systems Glossary
- Definitions now include source tracking (`ehds_regulation`, `eu_ehr_glossary`, `xt_ehr`)
- Source filtering on Definitions page with visual badges
- Total definitions expanded from ~67 to 122+ entries

#### Topics & Glossary Page
- Renamed Topic Index to "Topics & Glossary" at `/topic-index`
- Added new Glossary tab with A-Z quick navigation
- Source filtering between Regulation terms and EHR technical glossary
- Links to external glossary sources (EU EHR Database, Xt-EHR)

#### Admin Improvements
- Added eHDSI KPI Data to admin dashboard navigation
- Sync and review MyHealth@EU primary use KPIs from eHDSI dashboard

---

## [1.9.0] - 2026-02-02

### Added

#### Automated EHDS Paper Discovery
- Weekly automated search for new EHDS-related publications using Firecrawl
- Searches academic sources (PubMed) and EU sources (DG SANTE, HaDEA, project sites)
- Auto-discovery runs every Monday at 8:00 AM UTC via scheduled cron job
- Manual "Search EHDS Papers" button in admin for on-demand discovery
- Auto-discovered papers marked with "Auto" badge in admin interface

#### Published Works Flagging System
- Users can flag issues with specific published works for admin review
- Flagged works highlighted in admin interface with "Flagged" badge
- Flag metadata includes reason, timestamp, and user who flagged
- Enables community-driven quality control for auto-discovered content

#### Admin UI Improvements
- Fixed column alignment in Published Works admin table
- Added Source column showing link hostname with clickable URL
- Visual distinction between manually added and auto-discovered works

---

## [1.8.9] - 2026-02-01

### Added

#### Topic Index System
- New dedicated Topic Index page at `/topic-index` with tabbed interface by stakeholder type
- Database-driven topic-to-article mappings stored in `topic_article_index` table
- Grouped tables showing topics with direct links to related articles and recitals
- Stakeholder categories: Citizens (10 topics), Health Tech (13 topics), Healthcare Professionals (10 topics)
- Admin management page at `/admin/topic-index` for CRUD operations on topic mappings

#### External Glossary Integration
- Added prominent links to [Xt-EHR Glossary](https://www.xt-ehr.eu/glossary-list/) across all stakeholder landing pages
- Glossary link included on Topic Index page for terminology reference

#### Joint Action Deliverables Update
- Scraped and added 10 new deliverables from Xt-EHR (Primary Use) and TEHDAS2 (Secondary Use)
- Direct PDF links to deliverables with article mappings
- Updated existing data containers with latest Joint Action content

#### Stakeholder Landing Page Enhancements
- Replaced static "Key Articles" sections with dynamic TopicIndexTable component
- Topic-based navigation with category grouping on For Citizens, For Health Tech, and For Healthcare Pros pages

---

## [1.8.8] - 2026-02-01

### Added

#### Scenario-Driven Guidance System
- New AI-powered Scenario Finder page at `/scenario-finder`
- 18 predefined scenario templates organized by stakeholder type (Citizen, Health Tech, Research, etc.)
- Custom scenario input with AI analysis via `ehds-assistant` edge function
- Structured output with article citations (clickable links), compliance guidance, and documentation tips
- Clear disclaimers about implementing acts still being under development

#### Stakeholder Landing Pages
- **For Citizens** (`/for/citizens`): Rights-based guide with access, correction, and portability information
- **For Health Tech** (`/for/healthtech`): Interactive compliance checklist with progress tracking (persisted in localStorage)
- **For Healthcare Professionals** (`/for/healthcare-professionals`): Workflow-oriented clinical scenarios with step-by-step EHDS obligations

#### Navigation Improvements
- Added "Tailored Guidance" section on home page with quick access cards for all stakeholder pages and Scenario Finder
- Added sidebar navigation items for For Citizens, For Health Tech, For Healthcare Pros, and Scenario Finder

---

## [1.8.7] - 2026-01-28

### Fixed

#### Feature Flags Integration
- Feature flags now properly control their associated features across the application
- AI Assistant chat widget visibility controlled by `ai_assistant` flag
- Teams sidebar navigation link visibility controlled by `teams` flag
- Implementation Tracker tab in Overview page controlled by `implementation_tracker` flag
- When flags are disabled, features are completely hidden from the UI

---

## [1.8.6] - 2026-01-27

### Added

#### EHDS Obligations Admin Management
- New admin page at `/admin/obligations` for managing EHDS obligation definitions
- Full CRUD interface for creating, editing, and deleting obligations
- Category filtering (Primary Use, Secondary Use, General)
- Configurable fields: ID, name, description, article references, sort order, and active status
- Toggle to activate/deactivate individual obligations
- Integration with Implementation Timeline Tracker for per-country progress tracking

---

## [1.8.5] - 2026-01-25

### Added

#### Country Manager Dashboard Mobile Improvements
- Swipe gestures to navigate between country cards on mobile devices
- Responsive layout with 2x2 stats grid on mobile, 4-column on desktop
- Condensed status badges with icons for better mobile readability
- Optimized pending obligations list with line clamping and responsive heights
- Touch-friendly card navigation with visual indicators

#### Cross-Regulation Map Mobile Improvements
- Stacked header layout preventing title/controls overlap on mobile
- Compact filter button (icon-only on mobile, text on desktop)
- Smaller zoom controls with touch-friendly sizing
- Responsive text and icon sizing throughout

#### Gantt Chart Mobile Improvements
- Adaptive year label display (every 5th year at 1x zoom, every 2nd at 2x, all at 3x+)
- Smaller year markers and timeline dots on mobile
- Prevents label overlap on narrow screens

---

## [1.8.4] - 2026-01-22

### Added

#### Native Mobile App Support
- Capacitor configuration for iOS and Android native app builds
- App ID and configuration for App Store/Play Store distribution
- Development server URL for hot-reloading during mobile testing
- Documentation for local build and deployment workflow

---

## [1.8.3] - 2026-01-22

### Added

#### Cross-Regulation Linking
- Added cross-regulation references linking EHDS articles to GDPR, AI Act, MDR, Data Act, and Data Governance Act provisions
- Visual relationship map with animated SVG showing connections between EHDS and related EU regulations
- Color-coded regulation cards with relationship type badges (complements, specifies, implements, aligns, relates_to)
- Direct links to EUR-Lex for each referenced provision
- Toggle between list view and visual map view
- Seed data with 14 cross-references across 5 regulations

---

## [1.8.2] - 2026-01-20

### Changed

#### Codebase Refactoring
- Migrated from `react-leaflet` to vanilla Leaflet for improved React 18 compatibility
- Created shared `useAdminGuard` hook for consistent admin authentication and role checking
- Created `useBulkSelection` hook for reusable multi-item selection state management
- Introduced `AdminPageLayout` and `AdminPageLoading` components for unified admin page structure
- Extracted `FootnoteManager` component for centralized footnote CRUD operations
- Refactored `AdminArticlesPage` (590 → ~380 lines), `AdminRecitalsPage` (456 → ~280 lines), and `AdminDefinitionsPage` (247 → ~195 lines)
- Reduced code duplication across admin pages by ~35%

### Fixed
- Resolved `render2 is not a function` error caused by react-leaflet version incompatibility

---

## [1.8.1] - 2026-01-16

### Added

#### Gamification Enhancements
- Level-up modal with celebratory animations when users advance to a new level
- Confetti effects in achievement unlock toasts for enhanced celebration
- "View All Achievements" link in achievement notifications
- Achievement triggers integrated with bookmarks and notes workflows
- Persistent level tracking via localStorage for level-up detection

#### Mobile UX Improvements
- Compact sign-in button for mobile navigation (icon-only for cleaner UI)
- Responsive authentication controls in header

---

## [1.8.0] - 2026-01-15

### Added

#### National EHDS Entities Directory
- New public page at `/health-authorities` for browsing Digital Health Authorities (DHAs) and Health Data Access Bodies (HDABs)
- Interactive EU map visualization showing countries with designated entities
- Color-coded entity types: blue for DHAs, purple for HDABs
- Filter entities by type (DHA/HDAB), status (active, pending, planned, inactive), and search
- Entity cards displaying contact information, websites, and descriptions
- Explanatory info cards differentiating DHA and HDAB responsibilities
- Database table `health_authorities` with full CRUD operations and RLS policies

#### Admin Entity Management
- New admin page at `/admin/health-authorities` for managing national entities
- Create, edit, and delete DHAs and HDABs for all 27 EU member states
- Track entity status: active, pending, planned, or inactive
- Store contact details, websites, addresses, and EHDS-specific roles

#### Enhanced AI Assistant
- Voice input via ElevenLabs Speech-to-Text integration
- Text-to-Speech playback for AI responses using ElevenLabs
- Improved system prompt with stricter topic boundaries
- Citation links to articles and recitals in AI responses
- Stop playback control for TTS audio

---

## [1.7.0] - 2026-01-12

### Added

#### Multi-Language Support
- Full multi-lingual infrastructure supporting all 24 official EU languages
- Language selection via header dropdown, URL parameter (`?lang=de`), and saved user preferences
- English fallback for untranslated content with user-friendly notice
- Database tables for translations of all content types:
  - Articles, Recitals, Definitions, Annexes
  - Chapters, Sections
  - Implementing Acts (including their articles and recitals)
  - News Summaries
  - UI strings
- User language preference persistence for logged-in users
- Language-aware content hooks with automatic fallback

#### Translation Admin Dashboard
- New admin page at `/admin/translations` for managing translations
- Translation statistics showing progress per content type and language
- Side-by-side editor for original English content and translations
- Search and filter source content items
- Translation status indicators (translated/not translated, published/draft)
- Publish/unpublish toggle for individual translations
- Support for all translatable fields per content type

---

## [1.6.0] - 2026-01-09

### Added

#### Team Collaboration
- New Teams page at `/teams` for managing collaborative workspaces
- Create teams with name and description
- Invite team members by email
- Role-based access control: Owner, Admin, Member, Viewer
- Team member management (update roles, remove members)
- Leave team functionality for non-owners
- Delete team option for owners
- Database tables for teams, team memberships, and team activity
- Row-level security policies for team data protection
- Automatic owner assignment on team creation via database trigger

---

## [1.5.2] - 2026-01-07

### Added

#### Admin User Management
- Resend confirmation email feature for admins to help users who haven't confirmed their email
- New edge function `resend-confirmation-email` with admin authentication and magic link generation
- Visual feedback during confirmation email resending process

#### Search Improvements
- Improved search accuracy with lower fuzzy matching threshold (0.35)
- Direct article matching for standalone numbers (e.g., typing "42" finds Article 42)

#### Plain Language Translations
- Bulk publish feature for publishing multiple draft translations at once
- Progress tracking and selection interface in bulk publish dialog

---

## [1.5.1] - 2026-01-02

### Added

#### QA Test System Enhancements
- "Run All Tests" button to execute data integrity checks and API endpoint tests in sequence
- QA test history with database persistence for tracking test results over time
- Save, load, and delete historical test results
- Visual history panel showing past test runs with pass/fail/pending counts
- Collapsible test history interface with load/delete actions per entry

---

## [1.5.0] - 2026-01-01

### Added

#### Annotations & Note-Taking System
- Inline text highlighting on articles, recitals, and implementing acts
- 5 highlight color options (yellow, green, blue, pink, orange)
- Add comments to any highlighted text
- Custom annotation tags with color coding
- Dedicated Notes page at `/notes` for managing all notes and annotations
- Create, edit, pin, and delete personal notes
- Search and filter notes by title, content, or tags
- View all annotations with links to source content
- Clickable highlighted text that shows annotation details

#### Export Functionality
- Export notes and annotations to Markdown
- Export to JSON format for data portability
- Notion-compatible export with YAML frontmatter
- Obsidian-compatible export with wikilinks and hashtag tags
- Copy individual notes as Markdown to clipboard

#### Hybrid Storage
- Local storage for anonymous users (works offline)
- Cloud sync for logged-in users via database
- Seamless transition between local and synced storage

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

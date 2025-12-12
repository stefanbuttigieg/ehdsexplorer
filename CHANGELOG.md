# Changelog

All notable changes to the EHDS Regulation Explorer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced search with advanced filtering options
- Comparative view between regulation versions
- API access for developers
- Multi-language support

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

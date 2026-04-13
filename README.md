# EHDS Regulation Explorer

A comprehensive digital platform for exploring **Regulation (EU) 2025/327** - the European Health Data Space Regulation. Navigate, search, and understand the complete EHDS framework with ease.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)
![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119EFF?logo=capacitor)
[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://buymeacoffee.com/stefanbuttigieg)
![Lovable Credits](https://img.shields.io/badge/Lovable%20Credits-700%20credits%20used-blue)
![Analytics](https://img.shields.io/badge/Analytics-Umami-brightgreen)
![UX Analytics](https://img.shields.io/badge/UX%20Analytics-PostHog-blue)


## 🎯 Overview

The EHDS Regulation Explorer provides an intuitive interface for healthcare professionals, legal experts, policymakers, health tech companies, and citizens to navigate and understand the European Health Data Space Regulation.

**Source**: Complete EHDS Regulation (9 chapters, 105 articles, 115 recitals, 4 annexes)

## ✨ Current Features

### 📖 Content Navigation
- **9 Chapters** with expandable table of contents using Roman numerals, sections, and article navigation
- **105 Articles** with full text, cross-references, related recitals, and implementing acts
- **Article Dependency Graph** — interactive visualization showing how articles reference each other, with spiral layout, pan/zoom, filtering, and detail panel
- **115 Recitals** with individual detail pages and related article links
- **4 Annexes** with detailed technical requirements and specifications
- **170+ Definitions** from Article 2, EU EHR Glossary, Xt-EHR, and Implementing Acts with multi-source support
- **Multi-source definitions** - See how the same term is defined across EHDS Regulation, EU EHR Glossary, Xt-EHR, and Implementing Acts
- **Smart legal reference linking** - Internal article/recital references are auto-linked; external regulation references (e.g., "Article 6 of Regulation (EU) 2016/679") are correctly left as plain text

### 🔍 Advanced Search
- **Fuzzy search** powered by Fuse.js across all content types
- **Direct ID matching** - search "article 42", "recital 15", "chapter 3", "annex I"
- **Command palette** (press `/`) for quick navigation
- **Filter by type** - articles, recitals, definitions, chapters, implementing acts, annexes
- **Real-time results** as you type
- **Search-result highlighting**
- **Recent searches history**

### 📋 Implementing Acts Tracker
- **33 implementing/delegated acts** identified in the regulation
- **6 thematic categories**: Primary Use, EHR Systems, Secondary Use, Health Data Access Bodies, Cross-Border Infrastructure, EHDS Board & Governance
- **Status tracking**: Pending, Open for Feedback, In Progress, Adopted
- **Adoption lifecycle dates** — adopted_date, entry_into_force_date, and date_of_effect per implementing act
- **Feedback period countdowns** with "days remaining" indicators
- **Feedback changes tracking** — Admin-managed changelog of modifications between feedback and adopted versions
- **"Open for Feedback" section** highlighting acts with active feedback windows
- **EUR-Lex integration** — Direct links to adopted implementing acts on EUR-Lex
- **Related articles** and official document links
- **Detailed act pages** with dedicated articles, recitals, and footnotes per implementing act
- **Import from Document** — PDF and Word (.docx) file upload with adaptive parsing for articles, recitals, and sections
- **Definition extraction** — Auto-detect definitions from "Definitions" articles in implementing acts with admin review and glossary import
- **Full definitions CRUD** — Create, edit, delete definitions from the admin interface with source selection (Regulation, EU EHR, Xt-EHR, Implementing Act) and implementing act picker
- **Searchable content** within each implementing act
- **Section-based article organization** for complex acts
- **Data Tables** — Structured data element tables per implementing act with search, CSV/JSON export, FHIR mapping fields
- **Search & sort** — Filter implementing acts by title/description and sort by linked article number

### 🗺️ National EHDS Entities
- **Directory of DHAs and HDABs** across all 27 EU member states
- **Digital Health Authorities (DHAs)** - Primary use of health data (citizen access to EHRs)
- **Health Data Access Bodies (HDABs)** - Secondary use of health data (research, policy)
- **Interactive EU map** showing countries with designated entities
- **Color-coded entity types** - Blue for DHAs, purple for HDABs
- **Status tracking** - Active, pending, planned, or inactive
- **Contact information** - Email, phone, website, and address for each entity
- **Filterable directory** - Search by name, country, type, or status

### 🔗 External Resources Linking
- **Joint Action Deliverables** - Links to deliverables from EHDS-related joint actions
  - **Xt-EHR deliverables** - Primary use focused resources
  - **TEHDAS2 deliverables** - Secondary use focused resources
- **Published Works** - Academic research and publications linked to articles and implementing acts
  - **Automated discovery** - Weekly Firecrawl-powered search for new EHDS papers from academic and EU sources
  - **User flagging** - Community-driven quality control for auto-discovered content
- **Live Deliverables** - Direct links to EHDS acceptance data platform resources
- **EU EHR Glossary** - ~60 technical terms imported from [EU EHR Systems Glossary](https://acceptance.data.health.europa.eu/ehr-systems/glossary)
- **Xt-EHR Glossary** - ~48 technical terms imported from [Xt-EHR Glossary](https://www.xt-ehr.eu/glossary-list/) with one-click admin import
- **Definition Merge Tool** - Admin feature to consolidate duplicate or related definitions from different sources

### ✏️ Annotations & Notes
- **Inline text highlighting** - Select text on articles, recitals, or implementing acts to highlight
- **5 highlight colors** - Yellow, green, blue, pink, and orange
- **Comments on highlights** - Add notes to any highlighted text
- **Annotation tags** - Organize highlights with custom color-coded tags
- **Notes page** - Central hub for managing all notes and annotations
- **Export options** - Export to Markdown, JSON, Notion, and Obsidian formats
- **Local & synced storage** - Works offline for anonymous users, syncs when logged in

### 👥 Team Collaboration
- **Create teams** - Organize workspaces for collaborative research
- **Invite members** - Add team members by email with role-based access
- **Role management** - Owner, Admin, Member, and Viewer roles with different permissions
- **Team settings** - Edit team name, description, and manage members

### 🌍 Multi-Language Support
- **24 EU languages** - Full translation infrastructure for all official EU languages
- **Language selector** - Easy switching via header dropdown
- **URL language parameter** - Share links with `?lang=de` for specific language
- **User preferences** - Language choice saved for logged-in users
- **English fallback** - Graceful fallback to English when translations unavailable
- **Translation notice** - Clear indicator when viewing fallback content
- **Admin translation dashboard** - Manage translations with side-by-side editor

### 🎨 User Experience
- **Dark/Light mode** toggle with system preference detection
- **Adjustable font sizes** (small, medium, large, x-large)
- **Reading progress tracking** per chapter with visual indicators
- **Bookmarking system** for saving articles and recitals
- **Loading indicator** with dark mode support
- **Keyboard shortcuts** for power users:
  - `/` - Open search
  - `b` - Toggle bookmark
  - `h` - Go home
  - `?` - Show shortcuts help
  - Arrow keys - Navigate articles
- **Print-friendly stylesheet** for articles and chapters
- **Breadcrumb navigation** on all pages
- **Mobile responsive** design with swipe gestures for country cards
- **Touch-optimized dashboards** with responsive layouts

### 🔍 SEO & Discoverability
- **Structured data markup** for Google rich snippets (Article, FAQ, Breadcrumb, HowTo schemas)
- **Dynamic meta tags** with keyword-rich titles and descriptions under 60/160 characters
- **Open Graph and Twitter cards** for social sharing optimization
- **Admin SEO Management** at `/admin/seo` for page-level configuration
- **Newsletter signup** for email capture and user retention
- **Weekly newsletter management** — AI-assisted newsletter composer with subscriber management and bulk distribution
- **Downloadable resources** with email gating for lead generation

### ♿ Accessibility
- **WCAG 2.1 Level AA** compliance efforts
- **Semantic HTML** structure throughout
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** mode support
- **Adjustable text sizes**
- **Focus indicators** for all interactive elements

### 🔔 Notifications System
- **Admin-managed announcements** displayed as banners
- **Expiration dates** for time-limited notifications
- **Dismissible notifications** for better UX

### ❓ Official EHDS FAQs
- **67 official EU Commission Q&As** parsed from the EHDS FAQ PDF document
- **Chapter-grouped accordion** display with search across questions and answers
- **Rich content** rendering including markdown tables, links, and formatted lists
- **Footnote tooltips** per FAQ with inline markers
- **Article reference badges** linking to `/articles/{number}`
- **Implementing Act cross-links** showing related acts per FAQ
- **FAQ cross-references** (e.g. "see question 33") as clickable anchors
- **Official source linkback** to EU Commission page
- **Auto-update pipeline** — weekly monitoring of EU source page for new PDF versions
- **PDF parser** — AI-powered extraction of all 67 FAQs preserving tables, footnotes, and references
- **API endpoint** — `?resource=faqs` with chapter filtering and CSV export
- **JSON-LD structured data** for SEO

### 🕸️ Content Network Graph
- **Interactive knowledge graph** linking Articles, FAQs, Recitals, Annexes, and Implementing Acts
- **SVG visualization** with pan, zoom, and force-grouped layout
- **Filter by content type** and click nodes for detail panel
- **Color-coded nodes** for different EHDS entity types
- **Accessible from** Article Dependencies page

### 📊 Quick Explorers & Visualizations
- **Articles grid** (1-105) with hover tooltips showing titles
- **Recitals grid** (1-115) with content preview on hover
- **Articles landing page** with search by number, title, or content
- **Recitals landing page** with search functionality
- **Continue reading** section to resume where you left off
- **Interactive Gantt chart** for key dates timeline visualization
  - Zoom controls (1x-4x) for timeline navigation
  - Timeline extended to 2033
  - Export to ICS (calendar), CSV (spreadsheet), and JSON formats
  - Hover interactions with milestone highlighting

### 🧰 Compliance Tools Hub
- **Tools Hub** at `/tools` - Centralized compliance resource center
- **Compliance Starter Kit** - Multi-step Q&A wizard for personalized EHDS guidance
  - 5-step wizard: organization type, size, product scope, market status, awareness
  - Tailored recommendations by profile type and organization size
  - Direct links to relevant articles, checklists, and stakeholder pages
- **Readiness Assessment** - Weighted scoring for EHDS compliance gap analysis
  - 14 questions across 5 domains (Data Governance, Technical, Compliance, Cross-Border, Security)
  - Maturity levels from Beginner to Compliance Ready
  - Category breakdown with prioritized gap analysis and recommendations

### 🎯 Stakeholder Guidance
- **Scenario Finder** - AI-powered situation analysis at `/scenario-finder`
  - 18 predefined scenario templates by stakeholder type
  - Custom scenario input with structured AI analysis
  - Article citations with direct links to content
  - Compliance guidance and documentation tips
  - Disclaimer about evolving implementing acts
- **Topics & Glossary** - Consolidated reference at `/topic-index`
  - Database-driven topic-to-article mappings organized by stakeholder type
  - Tabbed interface for Citizens, Health Tech, Healthcare Professionals, and Glossary
  - A-Z quick navigation for glossary terms
  - Source filtering between EHDS Regulation and EU EHR Glossary
  - Direct links to related articles and recitals
  - External glossary integration with [Xt-EHR Glossary](https://www.xt-ehr.eu/glossary-list/)
- **For Citizens** page - Rights-based guide for personal health data access
- **For Health Tech** page - Interactive compliance checklist with progress tracking
- **For Healthcare Professionals** page - Workflow-oriented clinical scenarios

### 👶 Kids Mode & Interactive Comics
- **Kids Mode toggle** - Simplified, child-friendly interface accessible from the header
- **Interactive Comics** - "Data Guardians" comic series teaching EHDS concepts through storytelling
  - Panel-by-panel navigation with comic book layout
  - **Read Aloud (TTS)** - ElevenLabs-powered text-to-speech with character-specific voices
    - Alex: boyish voice (10-13 year old character)
    - Mia: girl's voice (10-13 year old character)
    - Professor Byte: robotic/sci-fi voice
  - AI-generated comic panels via admin dashboard
- **Kids Corner** - Dedicated landing page with comics and learning games

### 🎮 Learning Tools & Gamification
- **Match Game** - Card-matching game to learn EHDS terminology by pairing terms with definitions
  - Selectable difficulty levels (4, 6, or 8 pairs)
  - Timer tracking and accuracy metrics
  - Accessible from homepage "Learn" quick link
- **Flashcard Game** - Study EHDS definitions with interactive flashcards
  - Flip cards to reveal definitions
  - Self-assessment marking (knew it / didn't know)
  - Progress tracking and shuffle functionality
- **Quiz Game** - Multiple-choice questions testing EHDS knowledge
- **True/False Game** - Quick-fire statements about the regulation
- **Who Am I? Game** - Guess the EHDS concept from clues
- **Word Search Game** - Find EHDS terms in a letter grid
- **Achievement System** - Gamified progress tracking for logged-in users
  - Unlock achievements for bookmarking, note-taking, and game completion
  - Level-up modals with celebratory animations (Newcomer to EHDS Master)
  - Confetti effects and toast notifications when achievements unlock
  - Points-based leveling system with 5 tiers
  - Achievements page accessible from user profile
- **Country Leaderboard** - Compete nationally by reading, playing games, and exploring
  - Automatic point tracking across reading, games, exploration, and achievements
  - **Population-weighted ranking** — toggle to rank by points per million inhabitants for fair cross-country comparison
  - IP-based country detection with manual override in user profile
  - Collapsible points scoring guide explaining exact point values
  - Time-range filters (All Time, This Month, This Week)

### 📝 Footnotes System
- **Inline footnote markers** in article and recital content (e.g., [^1], *, †)
- **Clickable markers** that smooth-scroll to footnote with highlight effect
- **Hover tooltips** showing footnote content preview
- **Central management** via admin dashboard
- **Per-article/recital footnotes** displayed at content bottom

### 🔐 Security & Authentication
- **Two-Factor Authentication (2FA)** - Optional MFA for enhanced account security
  - Authenticator app support (TOTP) via Google Authenticator, Authy, etc.
  - Email OTP as an alternative verification method
  - Admin-controlled enforcement with 6-month grace period transition
  - Gentle reminder banners for users without MFA enabled
  - Security settings page in user profile for enrollment
  - **Login MFA verification** - Automatic challenge prompts during login for enrolled users
  - Unified verification dialog supporting both TOTP and Email OTP methods
  - Race condition fix ensures MFA dialog stays open until verification completes
- **Admin Security Settings** at `/admin/security` for super admins
  - Toggle MFA enforcement and reminders
  - Configure allowed authentication methods
  - Set transition grace period dates

### 🔐 Admin Backend
- **Role-based access control** (Admin/Editor roles)
- **Centralized API documentation** at `/admin/api-docs` with all GET/POST endpoints
- **Sidebar Manager** at `/admin/sidebar` — database-driven navigation with reorder, visibility toggle, add/delete
- **Content management** for all content types:
  - Articles, Recitals, Chapters, Sections
  - Definitions, Annexes
  - Implementing Acts (with dedicated article/recital/section content, data tables, and definition extraction)
  - EHDS FAQs (separate from Help Center FAQs) with PDF parser and auto-sync
  - Joint Action Deliverables
  - Published Works
  - Notifications
  - Footnotes (inline and attached)
  - Plain Language Translations
- **AI Settings** — manage available models, default model, system prompt, and **Knowledge Base dashboard** with content coverage reports and test queries
- **Implementation Tracker** with inline evidence management per obligation
- **Markdown WYSIWYG editor** with live preview
- **Bulk editing** with multi-select for recitals and articles
- **Bulk import** functionality for JSON data:
  - Recitals, Articles, Definitions, Annexes
  - Joint Action Deliverables, Published Works, Footnotes
  - Implementing Act Recitals, Articles, and Sections
- **QA test system** with data integrity and API endpoint checks:
  - Run all tests button for sequential execution
  - Test history with database persistence
  - Save, load, and compare historical results
- **User management** with email invitation system
- **Resend confirmation emails** for users who haven't verified their email
- **EHDS Obligations management** - Full CRUD for obligation definitions with category filtering
- **Maintenance mode** with custom messaging
- **Overview page** content management
- **Plain language translations** with AI generation and batch processing
- **Bulk publish** for plain language translations
- **News summaries** with AI generation and Firecrawl URL scraping
- **Translation management** - Admin dashboard for multi-language content translations
- **Downloadable resources** - Upload and manage files with visibility and email-gating controls
- **Toolkit questions** - Manage Starter Kit and Readiness Assessment wizard Q&A content
- **Feature flags** - Toggle major features (AI Assistant, Teams, Tools Hub, Implementation Tracker) without code changes
- **Dashboard search** - Search across all admin tools and settings for quick discovery

### 📜 Legal & Compliance
- **Privacy Policy** page with detailed data collection disclosures
- **Cookies Policy** page with full cookie inventory table
- **Terms of Service** page
- **Accessibility Statement** page
- **Consent-based analytics** - Umami and PostHog only activate when users opt in to analytics cookies
- **PostHog UX analytics** - Heatmaps, session recordings, and click tracking (EU-hosted, consent-gated)

## 🚀 Completed Features
- [X] Search result highlighting showing matched text
- [X] Recent searches history
- [X] Export bookmarks to PDF/JSON
- [X] Shareable deep links with highlighted text
- [X] Offline support (PWA)
- [X] AI-generated news summaries
- [X] Footnotes
- [X] Implementing Acts - Separate Pages with relevant IA Articles and Recitals
- [X] Self-Service Portal for Users (Password, Email, and Profile Management)
- [X] Plain Language Version of Legal Text - side-by-side to legal text (with admin management)
- [X] Real-time Umami Analytics Dashboard for Admins
- [X] Rating System for Translation (especially Plain language)
- [X] AI-powered Q&A about the regulation with voice input/output
- [X] Comparison view between articles
- [X] Annotation and note-taking
- [X] Collaboration features for teams
- [X] Email alerts for implementing act status changes
- [X] Sign-up of new users and creation of profiles
- [X] Multi-language support (all 24 EU languages)
- [X] API for third-party integrations
- [X] National EHDS Entities directory (DHAs and HDABs)

## 🚀 Planned Features and Actions

### Near-term - Q1 and Q2 2026
- [X] Update Help Centres content (Public-facing and Admin)
- [X] Add link and integration to Comitology Register in the Implementing Acts Pages
- [X] Map of officially designated Digital Health Authorities and Health Data Access Bodies
- [X] Add links to existing regulatory-focused portals
- [X] Help Centre Content Manager
- [X] Website Layout Manager (Sidebar Manager)
- [X] EHDS Official FAQs with PDF parser and auto-update
- [ ] Complete content updates - Implementing Acts
- [ ] Complete content updates - Annexes
- [ ] Complete content updates - Language Translations
- [ ] Complete content updates - Joint Action Deliverables
- [ ] Complete content updates - Footnotes
- [ ] Complete content updates - Published Works
- [X] Add links to relevant national legislations

### Medium-term - Q2 to Q4 2026
- [ ] Integration with national implementation trackers
- [X] Mobile apps (iOS/Android) - Capacitor configured
- [ ] Linkages with other EU Acts and Regulations such as AI Act, MDR, Data Act, Data Governance Act, GDPR and more

### Long-term - Q1 to Q4 2027
- [ ] Funding and Support for Project
- [ ] Set up EHDS Explorer Team for long-term project sustainability

## 🔌 Public API

The EHDS Explorer provides a public RESTful API for programmatic access to all content.

### Base URL
```
https://api.ehdsexplorer.eu/functions/v1/api-data
```

### Features
- **No authentication required** for read-only access
- **JSON and CSV** export formats
- **Rate limited** to 100 requests/hour/IP
- **FAIR-compliant** metadata with ELI identifiers

### Endpoints
| Resource | Description |
|----------|-------------|
| `?resource=articles` | All 105 articles |
| `?resource=recitals` | All 115 recitals |
| `?resource=definitions` | All definitions |
| `?resource=chapters` | All 10 chapters |
| `?resource=implementing-acts` | All 33 implementing acts |
| `?resource=faqs` | All 67 official EHDS FAQs |
| `?resource=metadata` | Dataset metadata |

### Example
```bash
curl "https://lmjjghvrjgffmbidajih.supabase.co/functions/v1/api-data?resource=articles&format=json"
```

See the [API Documentation](/api) for full details.

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Search**: Fuse.js for fuzzy matching
- **Routing**: React Router v6
- **State**: React Query + Local Storage
- **Icons**: Lucide React
- **Email**: Resend for user invitations
- **Mobile**: Capacitor for iOS/Android native apps

## 📱 Mobile Apps

The EHDS Explorer can be built as native iOS and Android apps using Capacitor.

### Build Steps

```bash
# Clone and install dependencies
git clone https://github.com/stefanbuttigieg/ehdsexplorer.git
cd ehdsexplorer
npm install

# Add mobile platforms
npx cap add ios      # Requires macOS with Xcode
npx cap add android  # Requires Android Studio

# Build web assets and sync to native projects
npm run build
npx cap sync

# Run on device or emulator
npx cap run ios
npx cap run android
```

### Production Build
For production releases, remove the `server` block from `capacitor.config.ts` to use bundled assets instead of the development server.

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/stefanbuttigieg/ehdsexplorer.git

# Navigate to the project directory
cd ehdsexplorer

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🏗️ Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   └── ...            # Custom components
├── hooks/             # Custom React hooks
│   ├── useArticles.ts
│   ├── useAuth.ts
│   ├── useBookmarks.ts
│   └── ...
├── integrations/      # Third-party integrations
│   └── supabase/      # Supabase client and types
├── pages/             # Page components
│   ├── Admin*/        # Admin dashboard pages
│   └── ...            # Public pages
├── data/              # Static fallback data
└── lib/               # Utility functions

supabase/
├── config.toml        # Supabase configuration
├── functions/         # Edge functions
│   └── send-invite/   # User invitation function
└── migrations/        # Database migrations
```

## 🔒 Security

- **Row Level Security (RLS)** on all database tables
- **Role-based access control** for admin functions
- **Email-only user registration** (no public signups)
- **Server-side role verification**
- **Secure secret management**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see below for details.

```
MIT License

Copyright (c) 2025 EHDS Explorer Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Contact

For questions, suggestions, or feedback, please open an issue on GitHub.

## 🙏 Acknowledgments

- European Commission for the EHDS Regulation text
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Lovable](https://lovable.dev) for the development platform
- [Supabase](https://supabase.com/) for the backend infrastructure

---

**Disclaimer**: This is an unofficial tool created for educational and informational purposes. It is not affiliated with the European Union or any official EU body. For official legal text, always refer to the [Official Journal of the European Union](https://eur-lex.europa.eu/).

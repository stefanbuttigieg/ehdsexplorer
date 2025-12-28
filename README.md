# EHDS Regulation Explorer

A comprehensive digital platform for exploring **Regulation (EU) 2025/327** - the European Health Data Space Regulation. Navigate, search, and understand the complete EHDS framework with ease.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase)
[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://buymeacoffee.com/stefanbuttigieg)
![Lovable Credits](https://img.shields.io/badge/Lovable%20Credits-260%20credits%20used-blue)
![Analytics](https://img.shields.io/badge/Analytics-Umami-brightgreen)


## 🎯 Overview

The EHDS Regulation Explorer provides an intuitive interface for healthcare professionals, legal experts, policymakers, health tech companies, and citizens to navigate and understand the European Health Data Space Regulation.

**Source**: Complete EHDS Regulation (10 chapters, 105 articles, 115 recitals, 4 annexes)

## ✨ Current Features

### 📖 Content Navigation
- **10 Chapters** with expandable table of contents using Roman numerals, sections, and article navigation
- **105 Articles** with full text, cross-references, related recitals, and implementing acts
- **115 Recitals** with individual detail pages and related article links
- **4 Annexes** with detailed technical requirements and specifications
- **67+ Definitions** from Article 2 with quick reference and source links

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
- **Feedback period countdowns** with "days remaining" indicators
- **"Open for Feedback" section** highlighting acts with active feedback windows
- **Live deliverable links** to EHDS acceptance data platform
- **Related articles** and official document links
- **Detailed act pages** with dedicated articles and recitals per implementing act
- **Searchable content** within each implementing act
- **Section-based article organization** for complex acts

### 🔗 External Resources Linking
- **Joint Action Deliverables** - Links to deliverables from EHDS-related joint actions
- **Published Works** - Academic research and publications linked to articles and implementing acts
- **Live Deliverables** - Direct links to EHDS acceptance data platform resources

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
- **Mobile responsive** design

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

### 🎮 Learning Tools

### 📝 Footnotes System
- **Inline footnote markers** in article and recital content (e.g., [^1], *, †)
- **Clickable markers** that smooth-scroll to footnote with highlight effect
- **Hover tooltips** showing footnote content preview
- **Central management** via admin dashboard
- **Per-article/recital footnotes** displayed at content bottom

### 🔐 Admin Backend
- **Role-based access control** (Admin/Editor roles)
- **Content management** for all content types:
  - Articles, Recitals, Chapters, Sections
  - Definitions, Annexes
  - Implementing Acts (with dedicated article/recital/section content)
  - Joint Action Deliverables
  - Published Works
  - Notifications
  - Footnotes (inline and attached)
  - Plain Language Translations
- **Markdown WYSIWYG editor** with live preview
- **Bulk editing** with multi-select for recitals and articles
- **Bulk import** functionality for JSON data:
  - Recitals, Articles, Definitions, Annexes
  - Joint Action Deliverables, Published Works, Footnotes
  - Implementing Act Recitals, Articles, and Sections
- **User management** with email invitation system
- **Maintenance mode** with custom messaging
- **Overview page** content management
- **Plain language translations** with AI generation and batch processing
- **News summaries** with AI generation and Firecrawl URL scraping

### 📜 Legal & Compliance
- **Privacy Policy** page
- **Cookies Policy** page
- **Terms of Service** page
- **Accessibility Statement** page

## 🚀 Planned Features

### Near-term
- [X] Search result highlighting showing matched text
- [X] Recent searches history
- [X] Export bookmarks to PDF/JSON
- [X] Shareable deep links with highlighted text
- [X] Offline support (PWA)
- [X] AI-generated news summaries
- [X] Footnotes
- [X] Implementing Acts - Separate Pages with relevant IA Articles and Recitals
- [X] Self-Service Portal for Users (Password, Email, and Profile Management)
- [X] Plain Language Version of Legal Text - side-by-side to legal text
- [ ] Real-time Umami Analytics Dashboard for Admins

### Medium-term
- [ ] AI-powered Q&A about the regulation
- [ ] Comparison view between articles
- [ ] Annotation and note-taking
- [ ] Collaboration features for teams
- [ ] Email alerts for implementing act status changes
- [ ] Sign-up of new users and creation of profiles

### Long-term
- [ ] Multi-language support (all EU languages)
- [ ] Integration with national implementation trackers
- [x] API for third-party integrations
- [ ] Mobile apps (iOS/Android)

## 🔌 Public API

The EHDS Explorer provides a public RESTful API for programmatic access to all content.

### Base URL
```
https://lmjjghvrjgffmbidajih.supabase.co/functions/v1/api-data
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

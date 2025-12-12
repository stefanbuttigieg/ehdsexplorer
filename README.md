# EHDS Regulation Explorer

A comprehensive digital platform for exploring **Regulation (EU) 2025/327** - the European Health Data Space Regulation. Navigate, search, and understand the complete EHDS framework with ease.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

## 🎯 Overview

The EHDS Regulation Explorer provides an intuitive interface for healthcare professionals, legal experts, policymakers, health tech companies, and citizens to navigate and understand the European Health Data Space Regulation.

**Source**: Complete EHDS Regulation (96 pages, 10 chapters, 99 articles, 96 recitals, 4 annexes)

## ✨ Current Features

### 📖 Content Navigation
- **9 Chapters** with expandable table of contents and article navigation
- **105 Articles** with full text, cross-references, and related recitals
- **115 Recitals** providing context and interpretation guidance
- **4 Annexes** with detailed technical requirements and specifications
- **62 Definitions** from Article 2 with quick reference

### 🔍 Advanced Search
- **Fuzzy search** powered by Fuse.js across all content types
- **Direct ID matching** - search "article 42", "recital 15", "chapter 3", "annex I"
- **Command palette** (press `/`) for quick navigation
- **Filter by type** - articles, recitals, definitions, chapters, implementing acts, annexes
- **Real-time results** as you type

### 📋 Implementing Acts Tracker
- **33 implementing/delegated acts** identified in the regulation
- **6 thematic categories**: Primary Use, EHR Systems, Secondary Use, Health Data Access Bodies, Cross-Border Infrastructure, EHDS Board & Governance
- **Status tracking**: Pending, Open for Consultation, In Progress, Adopted
- **Live deliverable links** to EHDS acceptance data platform
- **Parent article references** and consultation deadlines

### 🎨 User Experience
- **Dark/Light mode** toggle with system preference detection
- **Adjustable font sizes** (small, medium, large, x-large)
- **Reading progress tracking** per chapter with visual indicators
- **Bookmarking system** for saving articles and recitals
- **Keyboard shortcuts** for power users:
  - `/` - Open search
  - `b` - Toggle bookmark
  - `h` - Go home
  - `?` - Show shortcuts help
  - Arrow keys - Navigate articles
- **Print-friendly stylesheet** for articles and chapters
- **Breadcrumb navigation** on all pages
- **Mobile responsive** design

### 🔗 Cross-References
- **Article-to-recital linking** with internal navigation
- **Related articles** shown on recital pages
- **Implementing act references** to parent articles
- **Annex links** to relevant regulation articles

### 📊 Quick Explorers
- **Articles grid** (1-99) with hover tooltips showing titles
- **Recitals grid** (1-96) with content preview on hover
- **Continue reading** section to resume where you left off

## 🚀 Planned Features

### Near-term
- [ ] Search result highlighting showing matched text
- [ ] Recent searches history
- [ ] Export bookmarks to PDF/JSON
- [ ] Shareable deep links with highlighted text
- [ ] Offline support (PWA)

### Medium-term
- [ ] AI-powered Q&A about the regulation
- [ ] Comparison view between articles
- [ ] Annotation and note-taking
- [ ] Collaboration features for teams
- [ ] Email alerts for implementing act status changes

### Long-term
- [ ] Multi-language support (all EU languages)
- [ ] Integration with national implementation trackers
- [ ] API for third-party integrations
- [ ] Mobile apps (iOS/Android)

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Search**: Fuse.js for fuzzy matching
- **Routing**: React Router v6
- **State**: React Query + Local Storage
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/stefanbuttigieg/ehdsexplorer.git

# Navigate to the project directory
cd ehds-explorer

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
├── data/              # Static regulation data
│   ├── articles.ts    # 99 articles
│   ├── recitals.ts    # 96 recitals
│   ├── chapters.ts    # 10 chapters
│   ├── annexes.ts     # 4 annexes
│   ├── definitions.ts # 28 definitions
│   └── implementingActs.ts # 33 acts
├── hooks/             # Custom React hooks
├── pages/             # Page components
└── lib/               # Utility functions
```

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

---

**Disclaimer**: This is an unofficial tool created for educational and informational purposes. For official legal text, always refer to the [Official Journal of the European Union](https://eur-lex.europa.eu/).

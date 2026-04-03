
# Study Mode for EHDS Explorer

## Overview
A dedicated Study Hub at `/study` combining three learning modes across FAQs, Articles, and Recitals, with progress tracked locally (localStorage) and synced to the database when logged in.

## Pages & Components

### 1. Study Hub Page (`/study`)
- Dashboard showing overall progress across all content types
- Three study mode cards: **Read**, **Flashcards**, **Quiz**
- Content filter: FAQs / Articles / Recitals
- Progress rings showing completion percentage per content type
- Recent activity / continue where you left off

### 2. Reading Mode (`/study/read`)
- Sequential chapter-by-chapter walkthrough
- FAQ chapters as primary sections, with linked articles/recitals shown inline
- "Mark as read" button per item
- Progress bar per chapter
- Next/Previous navigation

### 3. Flashcard Mode (`/study/flashcards`)
- Cards showing question → reveal answer (FAQs), title → reveal content (Articles/Recitals)
- Self-rating: "Got it" / "Needs review" / "Skip"
- Spaced repetition: items marked "Needs review" appear more often
- Filter by content type, chapter, or difficulty
- Session stats (cards reviewed, accuracy)

### 4. Quiz Mode (`/study/quiz`)
- Auto-generated questions from FAQ content
- Multiple choice format using real FAQ answers + plausible distractors
- Score tracking per session
- Review incorrect answers with links to source FAQ/article

## Database Changes
- New `study_progress` table: `user_id, content_type, content_id, status (read/reviewing/mastered), last_studied_at, review_count`
- RLS: users can only access their own progress

## Progress Tracking
- **Not logged in**: localStorage with same schema
- **Logged in**: sync to database, merge on login

## Integration
- New route `/study` added to router
- Link added to navigation/sidebar
- Ties into existing achievement system

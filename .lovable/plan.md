
# Stakeholder-Specific Views & Scenario-Driven Guidance

## Analysis Summary

The GitHub issue suggests enhancing the EHDS Explorer to better serve different stakeholder groups beyond the current "implementer/regulator" focus. The good news is that **significant foundational work already exists** that can be leveraged.

---

## What Already Exists (Foundation to Build On)

| Capability | Current State |
|------------|---------------|
| **AI Role System** | 6 personas (General, Healthcare, Legal, Researcher, Developer, Policy) in the AI Assistant |
| **Explanation Levels** | 4 levels (Expert → Beginner) to adjust complexity |
| **Plain Language** | AI-generated simplified versions of articles/recitals with feedback system |
| **Context Suggestions** | Dynamic quick questions based on current page |
| **Help Center FAQ** | Admin-manageable FAQ system with categories |

---

## Feature Breakdown & Quick Wins

### QUICK WIN 1: Stakeholder Landing Pages (Low Effort, High Impact)
**Time estimate: 1-2 sessions**

Create dedicated "I am a..." landing pages that curate existing content for specific audiences:

- `/for/citizens` - Rights focus with plain language defaults
- `/for/healthtech` - Compliance checklist, relevant articles grouped
- `/for/healthcare-professionals` - Workflow-oriented guide

**Implementation:**
- New page component per stakeholder type
- Curated links to existing articles grouped by relevance
- Auto-enable plain language view for citizen-focused pages
- No new data structures needed

---

### QUICK WIN 2: "Your Rights at a Glance" Section for Citizens
**Time estimate: 1 session**

Add a prominent section on the homepage or new citizen page that maps citizen rights to articles:

| Right | Article Reference |
|-------|-------------------|
| Access your health data | Art. 3 |
| Request corrections | Art. 4 |
| Portability to another provider | Art. 5 |
| Know who accessed your data | Art. 12 |

**Implementation:**
- New reusable component: `CitizenRightsCard.tsx`
- Static data mapping rights to articles (can be admin-managed later)
- Links to articles with auto-enabled plain language toggle

---

### QUICK WIN 3: Add "Citizen" Role to AI Assistant
**Time estimate: 30 minutes**

The AI role system currently lacks a dedicated "Citizen" persona. Add it with beginner-friendly prompts:

```typescript
{
  id: 'citizen',
  label: 'Citizen / Patient',
  description: 'My rights and how EHDS affects me',
  icon: 'Heart',
  promptAddition: `
USER ROLE: Citizen / Patient
Focus on explaining how the EHDS regulation protects and empowers individuals. Emphasize:
- Your rights to access your own health data (Chapter II)
- How to request, view, and share your electronic health records
- Cross-border healthcare rights when traveling in the EU
- What happens if your rights are violated
- How to file complaints with health authorities
Use simple, everyday language. Avoid legal jargon.`
}
```

---

### MEDIUM EFFORT: Scenario-Driven Guidance System
**Time estimate: 3-5 sessions**

Create a Q&A / scenario interface that helps users find relevant articles based on their situation.

**User Flow:**
1. User describes scenario in text (or selects from common examples)
2. AI analyzes and identifies relevant articles/obligations
3. Response includes:
   - Why these articles apply
   - What "compliant" looks like
   - What evidence/documentation may be needed

**Implementation Options:**

**Option A: Enhance Existing AI Assistant**
- Add a "Scenario Mode" toggle
- Include structured response format (articles, obligations, compliance tips)
- Add pre-built scenario templates as quick suggestions

**Option B: Dedicated Scenario Finder Page**
- New page: `/scenario-finder`
- Guided form with common scenario types
- AI-generated analysis with article citations

---

### MEDIUM EFFORT: Compliance Checklist for Health Tech
**Time estimate: 2-3 sessions**

Create an interactive compliance checklist page for health tech companies:

- Grouped by obligation type (EHR systems, wellness apps, data holders)
- Each item links to relevant article
- Progress tracking (localStorage or user account)
- Export as PDF/CSV for documentation

**Data structure:**
```typescript
interface ComplianceItem {
  id: string;
  category: 'ehr_system' | 'wellness_app' | 'data_holder';
  requirement: string;
  articleReferences: number[];
  evidenceHint: string;
}
```

---

### LARGER EFFORT: Stakeholder-Filtered Content Mode
**Time estimate: 5-8 sessions**

Add a global "View as..." filter that persists across the application:

- Filters articles/recitals to show only those relevant to selected stakeholder
- Highlights key provisions per stakeholder
- Auto-adjusts AI assistant role and explanation level
- Stored in user preferences (localStorage or profile)

**Technical approach:**
- Add stakeholder relevance tags to articles in database
- Create context provider for global stakeholder filter
- Filter content display based on active stakeholder view

---

## Recommended Prioritization

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Add "Citizen" role to AI Assistant | 30 min | Quick win, immediately useful |
| 2 | Citizen Rights Card component | 1 session | High visibility for citizens |
| 3 | `/for/citizens` landing page | 1-2 sessions | Dedicated citizen experience |
| 4 | Scenario Mode for AI Assistant | 2-3 sessions | Addresses Q&A request directly |
| 5 | Health Tech Compliance Checklist | 2-3 sessions | Valuable for companies |
| 6 | Stakeholder Landing Pages (all) | 3-4 sessions | Complete stakeholder coverage |
| 7 | Global Stakeholder Filter | 5-8 sessions | Comprehensive but complex |

---

## Where to Start

I recommend starting with **Quick Wins 1-3** as they:
- Require minimal new infrastructure
- Leverage existing systems (AI roles, plain language)
- Provide immediate value to the stakeholder groups mentioned
- Can be shipped incrementally

Would you like me to implement any of these features? The fastest to implement would be:
1. **Add Citizen role to AI Assistant** (can do right now)
2. **Create a Citizen Rights Card component** (visual, high impact)
3. **Build the `/for/citizens` landing page** (pulling it all together)

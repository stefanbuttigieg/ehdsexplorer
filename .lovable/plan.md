## Conversation Mode — Full-Screen AI Chat Page

### What This Is

A dedicated `/chat`page where the entire screen is devoted to the EHDS AI Assistant conversation. Unlike the current floating widget (380px popup), this provides a full-width, immersive chat experience — similar to ChatGPT or Claude's interface.

### Layout

```text
┌─────────────────────────────────────────────────┐
│  Sidebar (collapsible)  │   Chat Area            │i
│                         │                        │
│  [+ New Chat]           │   Welcome / Messages   │
│                         │                        │
│  ★ Favorites            │   ┌──────────────────┐ │
│    • Conv title...      │   │ Bot: ...         │ │
│                         │   │ You: ...         │ │
│  Recent                 │   │ Bot: ...         │ │
│    • Conv title...      │   └──────────────────┘ │
│    • Conv title...      │                        │
│                         │   ┌──────────────────┐ │
│  Settings (role/level)  │   │ 🎤 [input]  Send │ │
│                         │   └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Plan

1. **Create `AssistantPage.tsx**` — A full-screen page at `/assistant` with:
  - Left sidebar: conversation history (favorites + recent), new chat button, role/level settings
  - Main area: message list with markdown rendering, streaming responses, feedback buttons, TTS
  - Bottom input bar: textarea + mic button + send button + usage counter
  - Sidebar collapses on mobile to a sheet/drawer
  - Reuses `useEHDSAssistant` hook and `useAIPreferences` — no backend changes needed
2. **Add route in `App.tsx**` — Register `/assistant` with lazy loading
3. **Add navigation entry** — Add "Assistant" link to the sidebar/nav so users can find it

### Technical Details

- Reuses all existing hooks (`useEHDSAssistant`, `useAIPreferences`, `useStakeholderAIRole`)
- Reuses existing components (`AIRoleSelector`, `AIContextSuggestions`, `AIConversationActions`, `ReactMarkdown`)
- Same streaming, feedback, voice, and conversation persistence logic as the floating widget
- Responsive: sidebar visible on `md+`, collapsible sheet on mobile
- The floating widget remains available on other pages — this is an additional dedicated view
# Implementation Guide

This document provides step-by-step guidance for completing the OutSystems Exam Trainer implementation.

## MVP Implementation Priority

### Phase 1: Core Infrastructure (COMPLETE)
- [x] Project setup (Next.js, TypeScript, Tailwind)
- [x] Prisma schema
- [x] Zod schemas
- [x] SQLite storage layer
- [x] Docker configuration
- [x] Sample data

### Phase 2: Admin & Import (MVP Critical)
Priority: HIGH | Estimated Time: 4-6 hours

**Files to Create:**
1. `app/(admin)/admin/page.tsx` - Admin dashboard
2. `app/(admin)/admin/layout.tsx` - Admin layout with auth check
3. `components/admin/ImportForm.tsx` - Upload and validation UI
4. `components/admin/SetList.tsx` - Display and manage sets
5. `components/admin/SetPreview.tsx` - Preview questions before import

**Implementation Steps:**
```typescript
// 1. Admin Layout with Auth
// app/(admin)/admin/layout.tsx
export default function AdminLayout({ children }) {
  // Check for ADMIN_KEY in query or header
  // Redirect if unauthorized
  return <div className="admin-layout">{children}</div>
}

// 2. Import Form Component
// components/admin/ImportForm.tsx
- File upload dropzone
- Format detection (A or B)
- If Format B, show setMeta form
- Validation preview
- Submit to /api/sets/import

// 3. Set Management
// components/admin/SetList.tsx
- Fetch from /api/sets
- Display in table/cards
- Search and sort controls
- Actions: View, Clone, Delete, Export

// 4. Preview Component
// components/admin/SetPreview.tsx
- Show first 3 questions
- Topic distribution chart
- Difficulty breakdown
- Question count summary
```

**API Routes Needed:**
- [x] `POST /api/sets/import` (DONE)
- [x] `GET /api/sets` (DONE)
- [ ] `GET /api/sets/[id]/route.ts`
- [ ] `DELETE /api/sets/[id]/route.ts`
- [ ] `POST /api/sets/[id]/clone/route.ts`
- [ ] `GET /api/sets/[id]/export/route.ts`

### Phase 3: Play Mode (MVP Critical)
Priority: HIGH | Estimated Time: 6-8 hours

**Files to Create:**
1. `app/(play)/play/page.tsx` - Set selection
2. `app/(play)/play/[setId]/page.tsx` - Question practice UI
3. `components/play/QuestionCard.tsx` - Single question display
4. `components/play/ProgressBar.tsx` - Visual progress indicator
5. `components/play/NavigationControls.tsx` - Prev/Next/Jump buttons
6. `components/play/ResultsScreen.tsx` - Final score and analysis
7. `lib/hooks/useProgress.ts` - Progress auto-save hook

**Implementation Steps:**
```typescript
// 1. Set Selection Page
// app/(play)/play/page.tsx
- Fetch sets from /api/sets
- Display as cards or list
- Click to start practice

// 2. Practice Page with State Management
// app/(play)/play/[setId]/page.tsx
- Fetch set questions from /api/sets/[id]
- Load progress from /api/progress?scope=set&scopeId=[id]
- Track current question index
- Store user answers in state
- Auto-save on each answer
- Navigate with keyboard (1-4, arrows, G)

// 3. Question Card Component
// components/play/QuestionCard.tsx
Props: { question, onAnswer, selectedAnswer, isSubmitted }
- Display stem
- Render 4 choices as radio/buttons
- Show correct/incorrect feedback after selection
- Toggle explanation
- Copy to clipboard button

// 4. Progress Bar Component
// components/play/ProgressBar.tsx
Props: { questions, currentIndex, answers }
- Visual bar with segments
- Each segment clickable (jump to question)
- Color code: gray (unanswered), green (correct), red (wrong)

// 5. Results Screen
// components/play/ResultsScreen.tsx
Props: { questions, answers }
- Calculate score
- Show percentage
- List wrong questions
- Button: "Create Mistake Snapshot"
- Button: "Retry" vs "Back to Sets"
```

**API Routes Needed:**
- [ ] `GET /api/sets/[id]/route.ts`
- [ ] `POST /api/progress/route.ts`
- [ ] `GET /api/progress/route.ts`

### Phase 4: Mistake Notebook (MVP Critical)
Priority: HIGH | Estimated Time: 4-6 hours

**Files to Create:**
1. `app/(mistakes)/mistakes/page.tsx` - List snapshots
2. `app/(mistakes)/mistakes/[snapshotId]/page.tsx` - Practice mistakes
3. `components/mistakes/SnapshotCard.tsx` - Snapshot display
4. `lib/mistakes/autoArchive.ts` - Auto-archive logic

**Implementation Steps:**
```typescript
// 1. Create Snapshot (from Play results)
// Called after completing a set/training
POST /api/mistakes/snapshot
Body: {
  baseScope: "set",
  baseScopeId: setId,
  wrongQuestionIds: [...],
  title: `Mistakes ${new Date().toLocaleString()}`
}

// 2. Snapshot List Page
// app/(mistakes)/mistakes/page.tsx
- Fetch /api/mistakes
- Group by active vs archived
- Display cards with: title, date, question count, status
- Click to practice

// 3. Practice Mistakes
// app/(mistakes)/mistakes/[snapshotId]/page.tsx
- Fetch snapshot and load questions by IDs
- Reuse QuestionCard from Play mode
- On each answer:
  - POST /api/mistakes/[id]/answer
  - Server updates correctStreak
  - If correctStreak >= 2, remove from active
  - If all removed, auto-archive snapshot
- Show remaining active count

// 4. Auto-Archive Logic
// lib/mistakes/autoArchive.ts
function updateCorrectStreak(snapshot, questionId, isCorrect) {
  if (isCorrect) {
    streak[questionId] = (streak[questionId] || 0) + 1
    if (streak[questionId] >= 2) {
      // Remove from wrongQuestionIds
      // Check if all questions mastered
      if (wrongQuestionIds.length === 0) {
        snapshot.isArchived = true
      }
    }
  } else {
    streak[questionId] = 0
  }
}
```

**API Routes Needed:**
- [ ] `POST /api/mistakes/snapshot/route.ts`
- [ ] `GET /api/mistakes/route.ts`
- [ ] `GET /api/mistakes/[id]/route.ts`
- [ ] `POST /api/mistakes/[id]/answer/route.ts`
- [ ] `DELETE /api/mistakes/[id]/route.ts`

### Phase 5: Custom Training (Enhanced)
Priority: MEDIUM | Estimated Time: 6-8 hours

**Files to Create:**
1. `app/(train)/train/page.tsx` - Training configuration
2. `app/(train)/train/[sessionId]/page.tsx` - Training practice
3. `components/train/FilterForm.tsx` - Topic/difficulty selectors
4. `components/train/TrainingResults.tsx` - Results with topic breakdown

**Implementation Steps:**
```typescript
// 1. Configuration Page
// app/(train)/train/page.tsx
- Multi-select for topics (fetch unique topics from all questions)
- Multi-select for difficulties (1, 2, 3)
- Number input for question count (default 20)
- Multi-select for source sets (optional)
- Button: "Generate Training"
- POST to /api/train with config
- Redirect to /train/[sessionId]

// 2. Training Practice
// app/(train)/train/[sessionId]/page.tsx
- Fetch /api/train/[sessionId]
- Load questions by selectedQuestionIds
- Reuse Play mode components
- Same UX: QuestionCard, ProgressBar, Navigation
- Results show topic/difficulty breakdown

// 3. Question Selection Logic
// In /api/train route
async function selectQuestions(config) {
  const allQuestions = await storage.getAllQuestions({
    topics: config.topics,
    difficulties: config.difficulties,
    sourceSetIds: config.sourceSetIds
  })
  
  // Shuffle and take N
  const shuffled = allQuestions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, config.questionCount)
}
```

**API Routes Needed:**
- [ ] `POST /api/train/route.ts`
- [ ] `GET /api/train/[id]/route.ts`
- [ ] `GET /api/questions/topics/route.ts` (unique topics)

### Phase 6: Stats Dashboard (Enhanced)
Priority: MEDIUM | Estimated Time: 4-6 hours

**Files to Create:**
1. `app/(stats)/stats/page.tsx` - Main dashboard
2. `components/stats/ScoreChart.tsx` - Visual score representation
3. `components/stats/TopicBreakdown.tsx` - Topic analysis
4. `components/stats/GoalTracker.tsx` - 70% goal progress
5. `lib/scoring/analytics.ts` - Calculation logic

**Implementation Steps:**
```typescript
// 1. Data Aggregation
// lib/scoring/analytics.ts
export function analyzeProgress(allProgress: UserProgress[]) {
  // Calculate by set
  const bySet = {}
  
  // Calculate by topic
  const byTopic = {}
  
  // Calculate by difficulty
  const byDifficulty = {}
  
  // Identify weak areas (< 70%)
  const weakTopics = []
  
  return { bySet, byTopic, byDifficulty, weakTopics }
}

// 2. Dashboard Page
// app/(stats)/stats/page.tsx
- Fetch all progress records
- Fetch all questions for topic/difficulty info
- Run analytics
- Display:
  - Overall score
  - Set-by-set performance table
  - Topic breakdown chart
  - Difficulty breakdown chart
  - Weak areas alert
  - Recommended training button

// 3. Goal Tracker Component
// components/stats/GoalTracker.tsx
- Show current overall percentage
- Progress bar to 70%
- List of topics below 70%
- "Start Training" buttons for each
```

**API Routes Needed:**
- [ ] `GET /api/progress/all/route.ts`
- [ ] `GET /api/questions/all/route.ts` (for topic/difficulty mapping)

## Additional Components to Build

### Shared Components
1. `components/ui/Button.tsx` - Reusable button
2. `components/ui/Card.tsx` - Card wrapper
3. `components/ui/Modal.tsx` - Modal dialog
4. `components/ui/Loader.tsx` - Loading spinner
5. `components/ui/Toast.tsx` - Notification toast

### Utilities
1. `lib/utils/clipboard.ts` - Copy question to clipboard
2. `lib/utils/keyboard.ts` - Keyboard shortcut handler
3. `lib/utils/format.ts` - Date/time formatting
4. `lib/utils/validation.ts` - Client-side validation helpers

## Testing Checklist

### Unit Tests
- [x] Schema validation (all scenarios)
- [ ] Import format detection
- [ ] Set cloning preserves locks
- [ ] Training question random selection
- [ ] Mistake auto-archive (2-streak rule)
- [ ] Progress calculation
- [ ] Topic/difficulty analytics

### Integration Tests
- [ ] Full import flow (A & B formats)
- [ ] Play mode: answer, save, resume
- [ ] Training: config, generate, complete
- [ ] Mistake: create, practice, auto-archive
- [ ] Stats: data aggregation accuracy

### E2E Tests (Optional)
- [ ] User journey: Import → Play → Mistakes
- [ ] User journey: Train → Check Stats
- [ ] Admin: management operations

## Environment Setup Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Set `ADMIN_KEY`
- [ ] Run `npm install`
- [ ] Run `npx prisma db push`
- [ ] Run `npm run db:seed`
- [ ] Run `npm run dev`
- [ ] Test at `http://localhost:3651`

## Deployment Checklist

- [ ] Build Docker image
- [ ] Test docker-compose locally
- [ ] Deploy to NAS
- [ ] Verify data persistence
- [ ] Test admin access
- [ ] Import real question sets
- [ ] Backup database regularly

## Code Style Guidelines

1. **No special characters in UI**: User requirement - avoid emojis, use text labels
2. **TypeScript strict mode**: All code should pass strict checks
3. **Error handling**: Always provide user-friendly error messages
4. **Accessibility**: Use semantic HTML, aria-labels, keyboard navigation
5. **Mobile-first**: Tailwind responsive classes (sm:, md:, lg:)

## Performance Optimizations

1. **Pagination**: For large question sets (>100 questions)
2. **Caching**: API responses with React Query or SWR
3. **Lazy loading**: For images and code-split routes
4. **Database indexes**: Already defined in Prisma schema

## Security Considerations

1. **Admin routes**: Always check ADMIN_KEY
2. **Input validation**: Server-side validation for all API inputs
3. **SQL injection**: Prisma handles this automatically
4. **XSS prevention**: React handles this automatically
5. **Rate limiting**: Consider adding for API routes

## Next Steps After MVP

1. **Export functionality**: Download sets as JSON
2. **Question editing**: In-place editing for unlocked sets
3. **User accounts**: Optional multi-user support
4. **Social features**: Share scores, leaderboards
5. **Mobile app**: React Native version
6. **Analytics dashboard**: Detailed charts and graphs
7. **AI integration**: Question generation, hint system
8. **Offline mode**: PWA with service workers

## Getting Help

Refer to:
- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
- Tailwind docs: https://tailwindcss.com/docs
- Zod docs: https://zod.dev

## Commit Strategy

Suggested commit messages following the pattern:
```
feat: Add admin import page
feat: Implement play mode with navigation
feat: Add mistake notebook auto-archive
feat: Create training session generation
feat: Build stats dashboard
fix: Correct progress save timing
refactor: Extract question card component
test: Add import validation tests
docs: Update deployment guide
```

Good luck with the implementation!

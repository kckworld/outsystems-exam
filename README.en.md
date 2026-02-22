# OutSystems Exam Trainer

A comprehensive exam training web application for OutSystems Associate Developer O11 certification. Designed to help users identify weak topics and reach 70%+ passing score through targeted practice.

## Features

- **Question Bank Management**: 
  - Import, validate, and manage question sets with version control
  - Multiple JSON file import support
  - Real-time import progress display
  - View and manage question set contents in admin panel
- **Practice Modes**: 
  - Regular exam practice with full question sets
  - Custom training mode (filter by topic/difficulty)
  - Topic selection dropdown (multi-select with checkboxes)
  - Early finish button ("View Results")
  - Automatic mistake tracking with smart archiving
- **Progress Tracking**: Track scores by set, topic, and difficulty level
- **70% Goal Support**: Clear guidance on weak areas and recommended practice
- **Auto-Archive Mistakes**: Questions mastered after 2 consecutive correct answers
- **Security**: Admin Key-based authentication (environment variable management)

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: SQLite + Prisma (recommended for NAS deployment)
- **Validation**: Zod
- **Deployment**: Docker + docker-compose (Synology Container Manager ready)

## Project Structure

```
outsystems-exam/
├── app/
│   ├── (admin)/admin/          # Question management
│   ├── (play)/play/            # Regular practice
│   ├── (train)/train/          # Custom training
│   ├── (mistakes)/mistakes/    # Mistake notebook
│   ├── (stats)/stats/          # Performance dashboard
│   └── api/                    # API routes
├── components/                 # Reusable React components
├── lib/
│   ├── schema/                 # Zod schemas
│   ├── storage/                # Database layer
│   └── scoring/                # Analytics logic
├── prisma/                     # Prisma schema & migrations
├── scripts/                    # Seed & utility scripts
├── tests/                      # Unit tests
├── data/                       # Sample data
└── public/                     # Static assets
```

## Data Models

### Question
```typescript
{
  id: string              // UUID or OSAD-####
  topic: string
  difficulty: 1 | 2 | 3
  stem: string
  choices: [string, string, string, string]
  answer: "A" | "B" | "C" | "D"
  explanation: string
  tags: string[]
  source: string
  createdAt: ISO string
}
```

### QuestionSet
```typescript
{
  setId: string
  title: string
  description: string
  versionLabel: string
  createdAt: ISO string
  questionCount: number
  isLocked: boolean        // Immutable by default
  parentSetId?: string     // For cloned sets
  questions: Question[]
}
```

### MistakeSnapshot
```typescript
{
  snapshotId: string
  baseScope: "set" | "train"
  baseScopeId: string
  createdAt: ISO string
  title: string
  wrongQuestionIds: string[]
  correctStreak: { [questionId]: number }  // Auto-archive at 2+
  isArchived: boolean
  deletedAt?: ISO string
}
```

## Getting Started

### Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Initialize database**
   ```bash
   npx prisma db push
   ```

4. **Seed sample data (optional)**
   ```bash
   npm run db:seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. Navigate to `http://localhost:3651`

### Production (Docker)

1. **Configure environment**
   ```bash
   # Create .env file with production settings
   ADMIN_KEY=your-secure-admin-key
   STORAGE_MODE=sqlite
   DATABASE_URL=file:/app/data/prod.db
   ```

2. **Build and run**
   ```bash
   docker-compose up -d
   ```

3. **Access application**
   - App: `http://localhost:3651`
   - Admin: `http://localhost:3651/admin?adminKey=your-secure-admin-key`

### Synology NAS Deployment

1. **Enable Container Manager** (Docker)
   - Open Package Center
   - Install "Container Manager"

2. **Upload project**
   - Copy entire `outsystems-exam` folder to NAS
   - Example path: `/volume1/docker/outsystems-exam`

3. **Configure environment**
   - Edit `docker-compose.yml`
   - Set `ADMIN_KEY` in environment section

4. **Deploy**
   ```bash
   # SSH into NAS
   cd /volume1/docker/outsystems-exam
   docker-compose up -d
   ```

5. **Access**
   - Use NAS IP: `http://your-nas-ip:3651`

6. **Persistent data**
   - Database: `./data/prod.db`
   - Volume mounted automatically

## Import Formats

### Format A: Complete Set
```json
{
  "setMeta": {
    "title": "Practice Set 1",
    "description": "Basic certification questions",
    "versionLabel": "v1.0"
  },
  "questions": [
    {
      "id": "OSAD-0001",
      "topic": "Client Variables",
      "difficulty": 2,
      "stem": "What is a client variable?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "A",
      "explanation": "Client variables store client-side data...",
      "tags": ["basics", "variables"],
      "source": "Generated"
    }
  ]
}
```

### Format B: Questions Only
```json
[
  {
    "id": "OSAD-0001",
    "topic": "Client Variables",
    "difficulty": 2,
    "stem": "What is a client variable?",
    "choices": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "A",
    "explanation": "Client variables store client-side data...",
    "tags": ["basics"],
    "source": "Generated"
  }
]
```
*Note: Format B requires setMeta input via UI after upload*

## API Reference

### Question Sets
- `POST /api/sets/import` - Import question set
- `GET /api/sets` - List all sets (query: search, sortBy)
- `GET /api/sets/:id` - Get set details
- `DELETE /api/sets/:id` - Delete set (admin only)
- `POST /api/sets/:id/clone` - Clone set with new version

### Progress
- `POST /api/progress` - Save progress
- `GET /api/progress?scope=&scopeId=` - Get progress

### Training
- `POST /api/train` - Create training session
- `GET /api/train/:id` - Get training session

### Mistakes
- `POST /api/mistakes/snapshot` - Create mistake snapshot
- `GET /api/mistakes` - List snapshots
- `GET /api/mistakes/:id` - Get snapshot details
- `POST /api/mistakes/:id/answer` - Record answer (handles auto-archive)
- `DELETE /api/mistakes/:id` - Soft delete snapshot

## Key Features

### Import System
- **Flexible formats**: Supports both complete sets and questions-only arrays
- **Multiple file import**: Upload multiple JSON files at once
- **Progress display**: Real-time import progress (N/M counter and progress bar)
- **Validation**: Comprehensive schema validation with detailed error messages
- **Preview**: Shows question count, topic distribution, difficulty breakdown
- **Duplicate detection**: Prevents duplicate question IDs
- **Auto ID generation**: Automatically assigns UUIDs to questions without IDs

### Play Mode
- Question-by-question practice
- Immediate feedback with explanations
- Progress bar with question navigation
- Jump to specific question number
- **Early finish button**: "View Results" available anytime without completing all questions
- Copy question to clipboard (ChatGPT-ready format)
- Auto-save progress (resume on reload)

### Custom Training
- **Topic selection dropdown**: Multi-select topics with checkboxes
- "Select All" option for quick selection
- Filter by difficulty levels (Easy/Medium/Hard)
- Configure question count (5-50 questions)
- Randomized question selection
- Results analytics by topic/difficulty
- **Early finish button**: View results anytime

### Mistake Notebook
- Auto-creates snapshots after completing sets/training
- Smart tracking: correctStreak counter per question
- **Auto-archive rule**: 2 consecutive correct answers = mastered
- Snapshot auto-archives when all questions mastered
- Soft delete with restoration option

### Stats Dashboard
- Set-by-set performance
- Topic-level accuracy
- Difficulty-level accuracy
- **70% Goal Tracking**: Highlights weak areas
- Recommended practice suggestions

## Keyboard Shortcuts

- `1-4`: Select answer (A-D)
- `Arrow Left/Right`: Previous/Next question
- `G`: Focus question number input (jump to question)
- `E`: Toggle explanation
- `C`: Copy question to clipboard

## Validation Rules

### Question Schema
- ID: Required, non-empty string
- Topic: Required, non-empty string
- Difficulty: Must be 1, 2, or 3
- Stem: Required, non-empty string
- Choices: Exactly 4 non-empty strings
- Answer: Must be "A", "B", "C", or "D"
- Explanation: Required, non-empty string
- Tags: Array of strings (can be empty)
- Source: Required, non-empty string

### Import Validation
- Schema compliance for all questions
- No duplicate question IDs (within set and globally)
- All required fields present
- Choices exactly 4 items
- Answer is valid option (A-D)

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

### Test Coverage
- Schema validation (pass/fail cases)
- Import format handling
- Set cloning with lock preservation
- Training question extraction
- Mistake auto-archive (2-streak rule)

## Implementation Priority (MVP → Full)

### Phase 1: MVP (Essential)
1. Data models (Prisma schema)
2. Import API (/api/sets/import)
3. Play page (/play)
4. Mistake tracking (/mistakes)
5. Basic admin (/admin)

### Phase 2: Expansion (Enhanced)
1. Custom training (/train)
2. Stats dashboard (/stats)
3. Progress persistence
4. Smart filtering

### Phase 3: Polish (UX)
1. Keyboard shortcuts
2. Copy to clipboard
3. Accessibility improvements
4. Performance optimization

## Environment Variables

```bash
# Storage
STORAGE_MODE=sqlite                    # "sqlite" or "json"
DATABASE_URL=file:./dev.db            # SQLite database path

# Security
ADMIN_KEY=your-secret-key             # Admin login key (managed in environment)
                                      # Enter once when accessing admin page
                                      # Stored in localStorage, no re-entry needed

# App Config
NEXT_PUBLIC_APP_NAME=OutSystems Exam Trainer
NEXT_PUBLIC_PASS_THRESHOLD=70         # Target passing percentage
```

## Troubleshooting

### Database Issues
```bash
# Reset database
rm prisma/*.db
npx prisma db push

# View database
npm run db:studio
```

### Docker Issues
```bash
# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View logs
docker-compose logs -f
```

### Import Failures
- Check JSON format validity
- Verify all required fields present
- Ensure choices array has exactly 4 items
- Check for duplicate question IDs
- Review validation error details in response

## Storage Choice: SQLite (Recommended)

**Why SQLite over JSON:**
1. **Concurrency**: Safe multi-user access
2. **Transactions**: Data integrity guaranteed
3. **Queries**: Fast filtering/searching
4. **Reliability**: No file corruption risks
5. **NAS-Friendly**: Single-file, easy backup

**JSON Alternative**: Available for simple setups, but lacks robustness for multi-user scenarios.

## Contributing

This is a self-contained training application. To extend:

1. Add new question topics in import data
2. Customize scoring logic in `lib/scoring/`
3. Add new training filters in `/train`
4. Extend stats calculations in `/stats`

## License

MIT

## Support

For issues or questions about OutSystems certification:
- Official docs: https://www.outsystems.com/learn/
- Certification guide: https://www.outsystems.com/learn/certifications/

---

**Built for helping developers achieve 70%+ and master OutSystems Associate Developer O11 certification.**

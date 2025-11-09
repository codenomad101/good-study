# Import Dated Questions Script

This script imports all question files with dates in their filenames (containing "2025") into the database.

## Usage

```bash
npm run import:dated
```

Or directly:

```bash
tsx --require dotenv/config scripts/import-dated-questions.ts
```

## What it does

1. **Finds all dated question files**: Scans the `data/` directory recursively for JSON files containing "2025" in the filename
2. **Maps to categories**: Automatically determines the category based on:
   - Directory name (e.g., `currentAffairs/`, `economy/`, `gk/`)
   - Filename keywords (e.g., files with "agri" → agriculture category)
3. **Imports questions**: 
   - Validates question format
   - Checks for duplicates (skips if question text already exists)
   - Extracts correct options and answers
   - Updates category question counts

## Category Mapping

The script automatically maps files to categories:

- `currentAffairs/`, `current-affairs/` → `current-affairs`
- `gk/` → `gk`
- `economy/` → `economy`
- `history/` → `history`
- `geography/` → `geography`
- `english/` → `english`
- `aptitude/` → `aptitude`
- `polity/` → `polity`
- `science/` → `science`
- `agri/`, `agriculture/` → `agriculture`
- `marathi/` → `marathi`

## File Format

Questions should be in JSON array format:

```json
[
  {
    "category": "Category Name",
    "Question": "Question text?",
    "Options": [
      { "id": 1, "text": "Option 1" },
      { "id": 2, "text": "Option 2" },
      { "id": 3, "text": "Option 3" },
      { "id": 4, "text": "Option 4" }
    ],
    "Answer": "Option 2",
    "CorrectAnswer": "Option 2 text",
    "Explanation": "Detailed explanation",
    "Difficulty": "Medium",
    "Job": ["MPSC", "UPSC"],
    "correctOption": 2,
    "topic": "Topic name"
  }
]
```

## Output

The script provides:
- Progress for each file processed
- Number of questions inserted, skipped, and failed
- Final summary with totals
- Updated category question counts

## Notes

- Questions with duplicate text in the same category are skipped
- The script updates the `total_questions` count for each category after import
- Source field is set to the filename for tracking
- Questions are set to 'active' status by default


# Markdown Documentation Style Guide

This guide establishes conventions for writing consistent, well-structured markdown documentation.

## YAML Frontmatter

All markdown documents should begin with YAML frontmatter containing metadata:

```yaml
---
title: "Document Title"
author: "Author Name"
date: "2025-01-27"
slug: "document-slug"
hero: "/path/to/hero-image.jpg"
description: "Brief description of the document content"
tags: ["tag1", "tag2", "tag3"]
category: "documentation"
status: "draft" # draft, review, published
version: "1.0"
last_updated: "2025-01-27"
---
```

### Required Fields
- `title`: Document title (use title case)
- `author`: Author name or team
- `date`: Creation date (YYYY-MM-DD format)
- `slug`: URL-friendly identifier (lowercase, hyphens)

### Recommended Fields
- `hero`: Path to hero/banner image
- `description`: 1-2 sentence summary (for SEO/previews)
- `tags`: Array of relevant tags for categorization
- `category`: Primary document category
- `status`: Publication status (draft/review/published)
- `version`: Document version number
- `last_updated`: Last modification date

## Markdown Structure

### Headings
- Use ATX-style headings (`#`) not Setext-style (`===`)
- Start with H1 for document title, use H2-H6 for sections
- Use sentence case for headings
- Leave blank line before and after headings

```markdown
# Main title

## Section heading

### Subsection heading
```

### Lists
- Use `-` for unordered lists (consistent bullet style)
- Use numbers for ordered lists
- Indent sublists with 2 spaces
- Leave blank line before and after lists

```markdown
- Item one
- Item two
  - Subitem
  - Another subitem
- Item three

1. First step
2. Second step
3. Third step
```

### Code Blocks
- Use fenced code blocks with language specification
- Use backticks for inline code
- Keep code blocks under 50 lines when possible

```markdown
Inline code: `const example = "code"`

```javascript
// Code block example
function greet(name) {
  return `Hello, ${name}!`;
}
```
```

### Links and Images
- Use descriptive link text (avoid "click here")
- Use relative paths for internal links
- Include alt text for all images
- Use reference-style links for repeated URLs

```markdown
[Descriptive link text](./path/to/document.md)

![Alt text describing the image](./images/example.png)

![Hero image alt text][hero-image]

[hero-image]: ./images/hero.jpg "Optional title"
```

### Tables
- Use pipe-separated format
- Align columns for readability
- Include header row

```markdown
| Column 1    | Column 2    | Column 3    |
|-------------|-------------|-------------|
| Row 1 Data  | More data   | Even more   |
| Row 2 Data  | More data   | Even more   |
```

### Emphasis
- Use `**bold**` for strong emphasis
- Use `*italic*` for light emphasis
- Use `~~strikethrough~~` sparingly
- Avoid excessive formatting

## Content Guidelines

### Writing Style
- Use active voice when possible
- Write in present tense for instructions
- Keep sentences concise and clear
- Use second person ("you") for user-facing docs

### File Organization
- Use lowercase filenames with hyphens
- Group related documents in folders
- Include README.md in each folder
- Use descriptive, searchable filenames

### Examples
```
docs/
├── README.md
├── getting-started.md
├── api/
│   ├── README.md
│   ├── authentication.md
│   └── endpoints.md
└── guides/
    ├── README.md
    ├── deployment-guide.md
    └── troubleshooting.md
```

## Best Practices

### Accessibility
- Use proper heading hierarchy (don't skip levels)
- Include alt text for images
- Use descriptive link text
- Ensure adequate color contrast

### SEO and Discoverability
- Include meta description in frontmatter
- Use relevant tags and categories
- Create descriptive page titles
- Link to related content

### Maintenance
- Review and update documentation regularly
- Use consistent terminology throughout
- Include last_updated dates
- Archive or redirect outdated content

### Version Control
- Use meaningful commit messages for doc changes
- Consider using branch protection for important docs
- Tag major documentation releases
- Include docs in code review process

## Tools and Validation

### Recommended Extensions
- Markdown linters (markdownlint)
- Spell checkers
- Link validators
- Table formatters

### Validation Checklist
- [ ] YAML frontmatter is valid
- [ ] All links work correctly
- [ ] Images have alt text
- [ ] Headings follow hierarchy
- [ ] Code blocks specify language
- [ ] Tables are properly formatted
- [ ] Content is spell-checked
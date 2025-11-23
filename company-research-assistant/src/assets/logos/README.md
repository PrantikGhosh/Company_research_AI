# Company Logos

Place company logo images here to appear in the History tab.

Supported formats: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`.

Naming convention (examples):
- `apple.png`
- `microsoft.svg`
- `google.png`
- `amazon.png`
- `meta.png`

Slug generation rules applied in code:
1. Lowercase the company name
2. Remove characters other than letters, numbers, spaces & hyphens
3. Replace whitespace runs with single hyphen

So `Apple Inc.` -> `apple-inc` (code will also check a simplified version without `-inc`).

Best size: 64x64 (transparent background) or an SVG.

After adding logos, just refresh the dev server; no manual import needed.

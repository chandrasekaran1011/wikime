# Document Conversion Reference

Full conversion commands for all formats.

## PDF → Markdown
```bash
# 1. markitdown (best — handles scanned PDFs)
markitdown raw/file.pdf -o raw/file.md

# 2. marker (best for academic PDFs)
marker_single raw/file.pdf --output_dir raw/

# 3. pdftotext (usually pre-installed)
pdftotext -layout raw/file.pdf - > raw/file.md

# 4. Python pdfminer (no system dep)
python3 -c "import pdfminer.high_level as pm; print(pm.extract_text('raw/file.pdf'))" > raw/file.md
```

## DOCX → Markdown
```bash
markitdown raw/file.docx -o raw/file.md
pandoc raw/file.docx -t markdown -o raw/file.md
python3 -c "
from docx import Document
doc = Document('raw/file.docx')
for p in doc.paragraphs:
    if p.style.name.startswith('Heading'):
        print(f\"{'#'*int(p.style.name[-1])} {p.text}\")
    elif p.text.strip(): print(p.text)
    else: print()
" > raw/file.md
```

## PPTX → Markdown
```bash
markitdown raw/file.pptx -o raw/file.md
python3 -c "
from pptx import Presentation
prs = Presentation('raw/file.pptx')
for i, slide in enumerate(prs.slides, 1):
    print(f'## Slide {i}')
    for shape in slide.shapes:
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                t = para.text.strip()
                if t: print(t)
    if slide.has_notes_slide:
        notes = slide.notes_slide.notes_text_frame.text.strip()
        if notes: print(f'> **Notes:** {notes}')
    print()
" > raw/file.md
pandoc raw/file.pptx -t markdown -o raw/file.md
```

## XLSX / CSV → Markdown
```bash
markitdown raw/file.xlsx -o raw/file.md
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('raw/file.xlsx', data_only=True)
for name in wb.sheetnames:
    ws = wb[name]
    print(f'## {name}')
    rows = list(ws.iter_rows(values_only=True))
    if not rows: continue
    header = [str(c or '') for c in rows[0]]
    print('| ' + ' | '.join(header) + ' |')
    print('| ' + ' | '.join(['---']*len(header)) + ' |')
    for row in rows[1:1001]:
        print('| ' + ' | '.join(str(c or '') for c in row) + ' |')
    print()
" > raw/file.md

# CSV
python3 -c "
import csv, sys
r = list(csv.reader(open(sys.argv[1])))[:1001]
if not r: exit()
print('| ' + ' | '.join(r[0]) + ' |')
print('| ' + ' | '.join(['---']*len(r[0])) + ' |')
for row in r[1:]: print('| ' + ' | '.join(row) + ' |')
" raw/file.csv > raw/file.md
```

## Images → Markdown
Send image to vision model:
```
Describe this image for a knowledge wiki:
- What type of document/visual is this
- All visible text (transcribe exactly)
- Key concepts illustrated
- Any data, charts, diagrams explained
```
Write to `raw/<image-name>.md`.

**Note**: Read text first, then open images separately — LLMs can't process inline images in one pass.

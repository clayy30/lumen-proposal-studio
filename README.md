# Lumen Proposal Studio

Premium solar proposal & design tool — built to **outclass OpenSolar default PDFs** with an **Enerflo-class** presentation: clean, trustworthy, conversion-focused.

## What’s included

| Area | Capability |
|------|------------|
| **Dashboard** | Pipeline KPIs, featured proposal, project table |
| **CRM** | Project list with stage filters, search, source tags |
| **OpenSolar import** | Parse `/api/user_logins/` proposal JSON (or compatible shapes) |
| **Template engine** | Canonical model → multi-page customer deck |
| **Design preview** | Address → stylized roof + panel layout visualization |
| **PDF export** | Multi-page JPEG capture (html2canvas + jsPDF), plus browser print |

## Quick start

```bash
cd solar-proposal-studio
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OpenSolar workflow

1. Export proposal data from OpenSolar (Raw Data API):
   ```
   GET https://api.opensolar.com/api/user_logins/?project_ids=<id>
   Authorization: Bearer <token>
   ```
2. Save the JSON response.
3. **Import** → drop the file (or click “Load sample OpenSolar export”).
4. Open the generated **proposal** → **Export PDF**.

A sample file lives at `public/sample-opensolar.json`.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript  
- Tailwind CSS 4  
- Recharts (production charts)  
- html2canvas + jsPDF (premium PDF)  
- Local storage workspace (no backend required for v1)

## Project layout

```
src/
  app/                  # Routes: dashboard, projects, import, proposals/[id]
  components/
    dashboard/          # Stats + tables
    import/             # JSON dropzone
    layout/             # App shell / sidebar
    proposal/           # Template + design preview + toolbar
  lib/
    types.ts            # Canonical proposal model
    opensolar-parser.ts # OpenSolar → Lumen mapper
    sample-data.ts      # Demo portfolio
    store.ts            # Client workspace
    pdf-export.ts       # PDF pipeline
```

## Design language

- **Sales UI:** deep charcoal, gold accent, DM Sans + Newsreader  
- **Customer proposal:** warm paper `#faf9f6`, strong hierarchy, cover → design → savings → financing  

## Next steps (roadmap)

- Live map / satellite roof underlay  
- True CAD panel placement from OpenSolar design zip  
- Branding kit (logo, colors, fonts per org)  
- e-sign + financing deep links  
- Multi-user CRM backend

## License

Private — for your solar sales workflow.

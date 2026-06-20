# Restaurant Website Audit Tool

A full-stack SaaS lead generation tool for PlatedSites. This tool helps identify restaurants with poor or outdated websites, then captures their contact info for sales outreach.

## Features

✅ **AI-Powered Website Audits** - Uses Claude API with web search to find restaurant websites and audit them across 15 key metrics

✅ **Public Search Tool** - Free audit interface at `audit.platedsites.com` with no login required

✅ **Email Capture Gate** - Unlock full detailed report by providing email address

✅ **Lead Scoring** - Automatically scores leads as Hot (12+), Warm (8-11), or Cold (<8)

✅ **GoHighLevel Sync** - Automatically creates contacts in your GHL location with audit scores

✅ **Authenticated Dashboard** - Tony-only dashboard to view all prospects, filter by score, export CSV

✅ **Google OAuth** - Sign in with Google Workspace email (cheftony@cheftonysbethesda.com)

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions + Auth)
- **Deployment:** Netlify (hosting + Edge Functions + Forms)
- **AI:** Claude API with web_search tool
- **CRM:** GoHighLevel (contact sync)

## Project Structure

```
audit-platedsites/
├── src/
│   ├── App.jsx                 # Main React component (search + dashboard)
│   ├── main.jsx                # Vite entry point
│   └── index.css               # Tailwind styles
├── public/
│   └── index.html              # HTML with Netlify Forms handler
├── netlify/
│   └── edge-functions/
│       └── ghl-webhook.ts      # GoHighLevel sync function
├── supabase/
│   └── migrations/
│       └── init.sql            # Database schema
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example
└── DEPLOYMENT_GUIDE.md
```

## Getting Started

### 1. Clone and Install
```bash
git clone [your-repo]
cd audit-platedsites
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Fill in your Supabase and GoHighLevel credentials
```

### 3. Deploy Supabase
- Copy `supabase/migrations/init.sql` into Supabase SQL Editor and run
- Deploy the `audit-restaurant` Edge Function with Anthropic API key

### 4. Local Development
```bash
npm run dev
# Opens at http://localhost:3000
```

### 5. Deploy to Netlify
```bash
npm run build
npm run deploy
```

See `DEPLOYMENT_GUIDE.md` for detailed step-by-step instructions.

## How It Works

### Public Flow (User)
1. User visits `audit.platedsites.com`
2. Enters restaurant name and location
3. Claude API searches web, finds domain, audits the site
4. Results show as 15-point score breakdown
5. User enters email to unlock full report
6. Contact is automatically created in GoHighLevel

### Dashboard Flow (Tony)
1. Sign in with Google at `audit.platedsites.com`
2. View all audit results in real-time
3. Filter by lead quality (Hot/Warm/Cold)
4. Export to CSV for bulk outreach
5. Check GoHighLevel for contact details and automation status

## Audit Metrics (15 points)

1. Phone Number Presence
2. Mobile Responsiveness
3. SEO Basics (Meta Tags & Schema)
4. Reservation System
5. Online Ordering
6. Menu Accessibility
7. High Quality Images
8. Local Business Schema
9. Social Media Links
10. Site Speed
11. Content Freshness
12. Accessibility Standards
13. E-commerce Integration
14. Contact Form/Email
15. Reviews & Testimonials

## Costs

- **Supabase:** ~$25-50/month (project tier)
- **Netlify:** ~$19/month (team plan)
- **Anthropic API:** ~$20-50/month (depends on audit volume; ~$0.02-0.05 per audit)
- **GoHighLevel:** Your existing plan

**Total:** ~$65-145/month (scales with audit volume)

## Customization

### Change Audit Metrics
Edit the `AUDIT_METRICS` array in `src/App.jsx` and update the Claude prompt in the Supabase Edge Function.

### Change Lead Scoring
Modify the score thresholds in:
- `src/App.jsx` (color coding: red <8, yellow 8-11, green 12+)
- `netlify/edge-functions/ghl-webhook.ts` (tags: Hot/Warm/Cold)

### Change Email Copy
All text in the component is directly in `src/App.jsx` - easy to customize for your brand.

## Troubleshooting

**"Failed to audit restaurant"**
- Check Anthropic API key in Supabase Edge Function secrets
- Verify Claude API has web_search tool enabled
- Check Edge Function logs in Supabase dashboard

**"Email not syncing to GoHighLevel"**
- Verify GHL API key in Netlify environment variables
- Check location ID: `qGxwvogo8YJzyzlNa7Yk`
- Check Netlify Edge Function logs

**"Google OAuth not working"**
- Clear cookies and try again
- Verify redirect URI in Google Cloud Console matches exactly
- Check Supabase Google provider settings

## Support

For bugs, questions, or feature requests, reach out to Tony directly or create an issue.

---

**Built by Claude for PlatedSites**

# SiteDrop.AI Audit Tool - Deployment Guide

## Overview
This is a full-stack restaurant website audit tool that:
1. Searches for restaurant websites using Claude API + web search
2. Audits them across 15 metrics
3. Captures emails via gated results
4. Syncs leads to GoHighLevel automatically
5. Provides Tony with an authenticated dashboard to see all prospects

---

## Prerequisites
- Netlify team with `audit.platedsites.com` subdomain
- Supabase project (use existing PlatedSites project or new one)
- Anthropic API key (for Claude API)
- GoHighLevel API key
- Google OAuth credentials (for dashboard auth)

---

## Step 1: Supabase Setup

### 1.1 Create Tables
1. Go to your Supabase project SQL editor
2. Copy the entire contents of `supabase-migration.sql`
3. Paste into SQL editor and run
4. Verify tables created: `restaurant_audits` and `email_signups`

### 1.2 Get Your Supabase Credentials
From Supabase dashboard:
- Project URL: `https://[PROJECT_ID].supabase.co`
- Anon Key: Settings > API > anon public key
- Service Role Key: Settings > API > service_role secret key

### 1.3 Deploy Edge Function
1. Go to Supabase > Edge Functions
2. Create new function named `audit-restaurant`
3. Copy contents of `audit-restaurant-edge-function.ts`
4. Paste and deploy
5. Set environment variables:
   - `ANTHROPIC_API_KEY` = Your Anthropic API key

### 1.4 Enable Google OAuth
1. Go to Authentication > Providers
2. Enable Google
3. Add your Google OAuth credentials (from Google Cloud Console)
4. Set authorized redirect URI: `https://audit.platedsites.com/auth/callback`

---

## Step 2: Netlify Setup

### 2.1 Create Netlify Site
1. Log into Netlify (using `cheftony` team)
2. Create new site from Git or connect existing repo
3. Set custom domain to `audit.platedsites.com`
4. Enable SSL (auto-provisioned)

### 2.2 Environment Variables
In Netlify Site Settings > Build & Deploy > Environment:
```
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[Your anon key from Step 1.2]
GHL_LOCATION_ID=qGxwvogo8YJzyzlNa7Yk
GHL_API_KEY=[Your GoHighLevel API key]
```

### 2.3 Deploy the Frontend
1. Create a new Vite + React project
2. Copy code from `audit-platedsites-frontend.jsx` into `src/App.jsx`
3. Install dependencies:
   ```bash
   npm install @supabase/supabase-js
   npm install -D tailwindcss postcss autoprefixer
   ```
4. Configure Tailwind (already in App.jsx)
5. Create `public/index.html` with Netlify Forms hidden form from `netlify-form-template.html`
6. Push to Git - Netlify will auto-deploy

### 2.4 Deploy Edge Function for GHL Sync
1. Create `netlify/edge-functions/ghl-webhook.ts`
2. Copy contents from `netlify-ghl-webhook.ts`
3. This function will intercept Netlify Forms submissions and sync to GHL

### 2.5 Configure Netlify Forms
1. Site Settings > Forms
2. Verify `audit-signup` form is detected
3. Set form notifications to send to `cheftony@cheftonysbethesda.com`

---

## Step 3: GoHighLevel Integration

### 3.1 Get Your GHL API Key
1. Log into GoHighLevel
2. Go to Settings > Integrations > API Keys
3. Create new API key (or use existing)
4. Copy the key

### 3.2 Custom Fields in GHL
Create these custom fields in your location for richer lead data:
- `restaurantName` (text)
- `auditLocation` (text)
- `auditScore` (number)

### 3.3 Create Automation
In GHL Automation:
1. Trigger: Contact added with tag "Website Audit"
2. Actions:
   - Send welcome email with audit results summary
   - Assign to you (Tony)
   - Schedule follow-up task based on lead quality (Hot/Warm/Cold)

---

## Step 4: Google OAuth Setup

### 4.1 Google Cloud Console
1. Go to Google Cloud Console
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs:
   - `https://audit.platedsites.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
4. Copy Client ID and Client Secret

### 4.2 Supabase Google OAuth Config
1. Authentication > Providers > Google
2. Paste Client ID and Client Secret
3. Save

---

## Step 5: Testing

### 5.1 Test Public Audit Tool
1. Go to `https://audit.platedsites.com`
2. Enter restaurant name (e.g., "Chef Tony's Fresh Seafood")
3. Enter location (e.g., "Rockville, MD")
4. Click "Get Free Audit"
5. Wait for Claude API to search and audit
6. Should see 15-point score breakdown
7. Enter email to unlock full report
8. Check GoHighLevel to verify contact was created

### 5.2 Test Dashboard
1. Go to `https://audit.platedsites.com/auth/callback`
2. Click "Sign in with Google"
3. Use your Google Workspace email (cheftony@cheftonysbethesda.com)
4. Should see authenticated dashboard with all prospects
5. Test filters and CSV export

---

## Step 6: Monitoring & Optimization

### 6.1 Monitor Claude API Usage
- Check Anthropic dashboard for web search usage
- Budget: ~$0.01-0.05 per audit (web search + token costs)

### 6.2 Monitor Supabase
- Check Supabase metrics for query performance
- Monitor Edge Function logs for errors

### 6.3 Monitor Netlify
- Check function logs for GHL webhook errors
- Monitor Forms submissions

---

## Troubleshooting

### Issue: "Failed to audit restaurant"
- Check if Anthropic API key is set in Supabase
- Check Edge Function logs in Supabase dashboard
- Verify Claude API has access to web_search tool

### Issue: Email not syncing to GHL
- Check GHL API key in Netlify environment variables
- Check GHL webhook function logs
- Verify location ID is correct: `qGxwvogo8YJzyzlNa7Yk`

### Issue: Google OAuth not working
- Verify redirect URI matches exactly in Google Cloud Console
- Check Supabase Google provider settings
- Clear browser cookies and try again

### Issue: Dashboard shows "unauthorized"
- Make sure you're signed in with correct Google account
- Verify Google OAuth is enabled in Supabase
- Check browser console for auth errors

---

## File Locations Summary
- **Frontend:** `audit-platedsites-frontend.jsx` → `src/App.jsx`
- **Supabase Migration:** `supabase-migration.sql` → Supabase SQL Editor
- **Edge Function (Supabase):** `audit-restaurant-edge-function.ts` → Supabase Functions
- **Edge Function (Netlify):** `netlify-ghl-webhook.ts` → `netlify/edge-functions/ghl-webhook.ts`
- **Netlify Form HTML:** `netlify-form-template.html` → `public/index.html`

---

## Next Steps After Deployment

1. **Create a GHL automation** that sends audit results to prospects
2. **Set up email sequence** in GHL to nurture warm/cold leads
3. **Monitor for false positives** - refine Claude audit criteria if needed
4. **Export CSV weekly** to track conversion rates
5. **A/B test email copy** for follow-up sequences

---

## Cost Estimates (Monthly)

- Supabase: $25-50 (project tier)
- Netlify: $19/month (team plan)
- Anthropic API: ~$20-50 (depends on audit volume)
- GoHighLevel: Your existing plan
- **Total: ~$65-145/month** (scales with audit volume)

---

Questions? Tony can reach out to Claude for debugging or feature additions.

# TalentKart — Vercel Deployment Guide

## 📁 Project Structure

```
talentkart_vercel/
├── index.html              ← Main page (no-cache)
├── talentkart.css          ← Stylesheet (1-year cache)
├── talentkart.js           ← JavaScript (1-year cache)
├── vercel.json             ← Security headers + redirects
├── robots.txt              ← Crawler rules
├── sitemap.xml             ← SEO sitemap
├── .well-known/
│   └── security.txt        ← Vulnerability disclosure
└── favicon.ico             ← ⚠️  ADD YOUR OWN FAVICON HERE
```

---

## 🚀 Deploy to Vercel (3 Steps)

### Option A — Vercel Dashboard (Easiest)
1. Go to https://vercel.com and sign in
2. Click **"Add New Project"** → **"Upload"**
3. Drag and drop this entire folder → **Deploy**

### Option B — Vercel CLI
```bash
npm install -g vercel
cd talentkart_vercel
vercel --prod
```

### Option C — GitHub (Recommended for updates)
1. Push this folder to a GitHub repo
2. Connect repo in Vercel dashboard
3. Every `git push` auto-deploys

---

## 🌐 Custom Domain Setup (talentkart.co.in)

1. In Vercel dashboard → **Settings → Domains**
2. Add `talentkart.co.in` and `www.talentkart.co.in`
3. Vercel shows you DNS records to add — go to your domain registrar and add:
   ```
   Type    Name    Value
   A       @       76.76.21.21
   CNAME   www     cname.vercel-dns.com
   ```
4. Wait 5–30 minutes for DNS propagation
5. Vercel auto-provisions a FREE SSL certificate (Let's Encrypt)

---

## ✅ Post-Deploy Security Checklist

Run these checks after going live:

| Check | Tool | Expected Score |
|-------|------|----------------|
| Security headers | https://securityheaders.com | A+ |
| SSL/TLS config | https://ssllabs.com/ssltest | A+ |
| Observatory scan | https://observatory.mozilla.org | 100/100 |
| SEO & crawl | https://search.google.com/search-console | Submit sitemap |
| Performance | https://pagespeed.web.dev | 90+ |

---

## ⚠️  Things to Do Before Going Live

1. **Add favicon.ico** — place your logo as `favicon.ico` in the root folder
2. **Update sitemap.xml** — change the `<lastmod>` date to today
3. **Update security.txt** — update the `Expires:` date yearly
4. **HSTS Preload** — after confirming HTTPS works, submit to https://hstspreload.org
5. **DNS CAA record** — add this to restrict who can issue SSL certs for your domain:
   ```
   talentkart.co.in  CAA  0 issue "letsencrypt.org"
   talentkart.co.in  CAA  0 issuewild "letsencrypt.org"
   ```
6. **Enable DNSSEC** — ask your domain registrar to enable DNSSEC

---

## 🔒 Security Features Active

| Feature | Status | How |
|---------|--------|-----|
| HTTPS only | ✅ | Vercel auto SSL + HTTP redirect |
| HSTS (2 years) | ✅ | vercel.json header |
| Content Security Policy | ✅ | vercel.json header (server-side) |
| X-Frame-Options DENY | ✅ | vercel.json header |
| X-Content-Type-Options | ✅ | vercel.json header |
| Referrer-Policy | ✅ | vercel.json header |
| Permissions-Policy | ✅ | vercel.json header (blocks camera, mic, GPS, payments) |
| Cross-Origin-Opener-Policy | ✅ | vercel.json header |
| Bot honeypot | ✅ | Hidden form field |
| Rate limiting | ✅ | 3 submissions per 10 minutes |
| Input sanitization | ✅ | Strips HTML, JS, control chars |
| Clickjacking defence | ✅ | Frame-busting JS + X-Frame-Options |
| robots.txt | ✅ | Guides crawlers |
| security.txt | ✅ | Responsible disclosure |
| Static asset caching | ✅ | CSS/JS cached 1 year (immutable) |

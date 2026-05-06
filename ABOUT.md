# Polly — Your Daily World, Curated

## What Is Polly?

Polly is a personal lifestyle app built for one person: its owner. It is not a product trying to serve everyone. It is a tightly opinionated, mobile-first daily companion that replaces the scattered ritual of checking weather, scrolling fashion sites, hunting for dining deals, and staring at a wardrobe — with a single, curated morning experience.

The name and the tagline say it plainly: **"Your daily world, curated."** Every screen is designed around a specific daily moment — waking up, getting dressed, eating out, staying inspired.

---

## Why It Was Built

Most lifestyle apps are built for mass audiences. They are ad-funded, data-hungry, recommendation-engine-driven, and optimized for engagement over usefulness. The result is noise dressed up as personalization.

Polly rejects that model entirely.

It was built because the owner wanted a single place that:

- Knows her wardrobe and tells her what to wear given today's weather
- Surfaces fashion content from sources she already trusts, summarized by AI so she can decide in seconds whether something is worth her time
- Surfaces the best dining deals in Hong Kong without digging through apps, mailing lists, and bank offer pages
- Gives her a daily edition feel — calm, editorial, personal — not a feed designed to maximize scroll time

The underlying belief is that software built for one person, shaped precisely around her life and preferences, will always outperform software built for millions. Polly is that bet made concrete.

---

## Who It Is For

Polly is built for a specific user: a fashion-aware, Hong Kong-based person who wants a high-quality morning information ritual.

More precisely, the target user:

- Lives in or spends significant time in **Hong Kong**, where the deals and dining features are sourced and curated
- Has a personal **style sensibility** and follows fashion media (Vogue, Harper's Bazaar, and similar)
- Wants **AI to do the filtering**, not the scrolling — she wants summaries and recommendations, not feeds
- Uses the app **on her phone**, as a PWA installed on the home screen, integrated into her morning
- Cares about **what she wears** and wants outfit suggestions that account for weather, her actual wardrobe, and her stated style preferences

This is not a consumer app seeking growth. It is a personal tool seeking depth.

---

## How It Works

Polly is organized into four core experiences, accessible via a bottom navigation bar:

### 1. The Daily Edition (Home)

The home screen is the app's centrepiece. Each day it generates a personal brief:

- **Date and weather** pulled from the user's location via the wttr.in API
- **An inspirational quote**, refreshed daily
- **Three AI-generated outfit suggestions** based on the day's weather, the user's wardrobe items, and her saved style preferences
- **A style tip** relevant to the conditions

The brief is generated once per day and cached locally, so it loads instantly on repeat visits. Claude (Anthropic's AI) is the engine behind the outfit and tip generation, receiving structured context about wardrobe, preferences, and weather to produce grounded, personal suggestions rather than generic advice.

### 2. Style

The Style screen aggregates fashion content from major RSS-enabled publications (Vogue, Harper's Bazaar, and others), filters it for relevance using keyword matching, and then passes each article through Claude to produce:

- A short **editorial summary**
- A **category tag** (trends, beauty, culture, etc.)
- An **enriched image** scraped directly from the article

The result is a curated fashion feed that reads like a personal editor's digest rather than a raw RSS dump. Users can also add custom URLs to include sources beyond the built-in list. All enriched articles are stored in Supabase and refreshed on demand.

### 3. Deals

The Deals screen surfaces **dining and lifestyle deals specifically in Hong Kong**. Sources include bank offer programmes (HSBC Red Hot, Cathay Dining), dining platforms (DiningCity), and other local deal aggregators.

There are two ingestion paths:

- **On-demand URL refresh**: paste a deals page URL, and the app fetches it via Jina Reader (for clean text extraction), then passes the content to Claude which extracts structured deal data and saves it to the database
- **Batch scraping**: a separate offline script using Playwright (a headless browser) handles sites that require JavaScript rendering, scraping deal listings and storing them in Supabase

Deals are displayed by category, with Dining as the primary focus.

### 4. Wardrobe (Dress)

The Wardrobe screen is a personal clothing management tool with three tabs:

- **Log an outfit**: photograph and record what was worn today
- **My wardrobe**: browse and manage catalogued clothing items
- **Suggestions**: request AI outfit recommendations that combine the user's wardrobe inventory, current weather, and style preferences

Outfit suggestions are generated by Claude, which receives the full wardrobe item list, weather data, and the user's style notes to construct contextually appropriate looks.

---

## Architecture and Technical Design

Polly is a **Next.js 14 application** using the App Router, deployed on **Vercel**. It is built in TypeScript throughout.

**Authentication** is handled by Clerk, which gates all screens and API routes. New users go through an onboarding flow that collects a birthday, profile photo, and style preferences, which are stored in Supabase and used to personalise AI outputs from day one.

**Data persistence** uses Supabase for all structured data (user profiles, wardrobe items, style articles, deals) and Supabase Storage for photo uploads (profile picture, outfit photos).

**AI** runs through the Anthropic SDK, calling Claude for outfit generation, style article enrichment, deal extraction, and wardrobe suggestions. All AI calls request strict JSON output, and the app includes robust parsing logic to handle imperfect model responses.

**The mobile experience** is a deliberate constraint. The app shell caps at 430px width, uses a fixed bottom navigation bar with safe-area insets, and ships a PWA manifest so it can be installed on an iPhone home screen and used in standalone mode. The theme colour (#C9848A — a warm rose) and serif typography give it an editorial, magazine-like feel rather than a utilitarian app aesthetic.

**Performance** is addressed through localStorage caching for the daily brief and profile data, so the home screen appears immediately on re-open without a network round-trip. Long-running refresh operations (style feed ingestion, deal scraping) are given extended Vercel function timeouts and can be triggered on demand rather than blocking the UI.

---

## Summary

Polly exists because generic tools are not personal enough to be truly useful. It is a single app, built for one life, that uses AI not as a novelty but as a filtering and synthesis layer — turning raw data from weather APIs, fashion RSS feeds, Hong Kong deal pages, and a personal wardrobe into a coherent, daily, actionable view of the world.

It is opinionated by design. It is curated by architecture. And it improves as its owner's data grows.

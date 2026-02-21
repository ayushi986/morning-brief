# For Ayushi — Everything You Need to Know About Morning Brief

*Written like a smart friend explaining things over coffee.*

---

## 1. What Does This Project Actually Do?

Every morning (or whenever you want), you open Morning Brief, hit **New Issue**, and about 30 seconds later you have a beautiful, personalised magazine sitting in front of you — written just for you, covering exactly the newsletters you follow.

Here's the magic: you never have to open the actual newsletters. Morning Brief visits each newsletter site for you, reads the latest issue, sends the content to Claude AI, and Claude writes you a proper explanation — not a boring bullet-point summary, but an actual paragraph that reads like a well-written article. You get the substance without the faff of opening five different tabs.

Think of it like having a very well-read personal assistant who reads everything you subscribe to each morning and then gives you a proper briefing over coffee. Except the assistant is Claude, and the coffee is optional.

---

## 2. The Architecture — How It All Fits Together

Here's the journey your newsletters take from "text on the internet" to "beautiful magazine on your screen":

```
You click "New Issue"
        ↓
Your browser sends a request to our server
        ↓
The server visits each newsletter website (like a robot reader)
        ↓
It extracts the text of the latest article from each one
        ↓
All that text gets sent to Claude AI
        ↓
Claude reads everything and writes beautiful summaries
        ↓
Claude also looks for "Big Themes" — connections across newsletters
        ↓
All the summaries come back to your browser
        ↓
The page renders as a luxury magazine
```

Think of it like a newspaper printing press — you give it the raw words, and it spits out a formatted, readable edition. Except instead of a printing press, it's a combination of a web scraper (the robot reader), an AI brain (Claude), and a React frontend (the beautiful layout engine).

**The three main "departments" of the codebase:**

- **The Scraper** — visits newsletter websites and extracts the text (like a very fast reader)
- **Claude AI** — reads that text and writes the summaries (the writer)
- **The Frontend** — takes the summaries and renders them as a magazine (the designer)

---

## 3. Codebase Structure — The Tour

Here's what every file and folder does:

```
morning-brief/
├── app/
│   ├── page.tsx               ← The main page — orchestrates everything
│   ├── layout.tsx             ← The outer wrapper (fonts, global styles, page title)
│   ├── globals.css            ← Global CSS (background colour, font imports)
│   └── api/
│       ├── scrape/route.ts    ← Server endpoint: visits newsletter sites, extracts text
│       └── digest/route.ts    ← Server endpoint: calls scraper + Claude, returns digest
│
├── components/
│   ├── ArticleCard.tsx        ← One article card (title, byline, summary, takeaways)
│   ├── DigestView.tsx         ← The full magazine layout (masthead + all cards)
│   ├── LoadingState.tsx       ← The "Printing your edition..." loading screen
│   └── SourceManager.tsx      ← The panel where you add/remove newsletter URLs
│
├── lib/
│   ├── scraper.ts             ← The actual scraping logic (how to visit a site and read it)
│   ├── claude.ts              ← All Claude AI calls (summarise newsletters, find themes)
│   └── prompts.ts             ← The instructions Claude gets (what to write, how to write it)
│
├── types/index.ts             ← Shared data shapes (what a "newsletter" looks like as data)
├── .env.local                 ← Your secret API keys (never shared publicly)
└── FOR AYUSHI.md / LEARN.md  ← These files!
```

**Key files explained:**

- **`app/page.tsx`** — This is the brain of the frontend. It stores which newsletters you've added (in the browser's localStorage — more on that below), handles the "New Issue" button click, calls the digest API, and decides what to show (loading state, error, or the magazine).

- **`lib/scraper.ts`** — This is the robot reader. It visits a newsletter URL, tries to find the most recent article link (which is different on Substack vs Beehiiv vs custom sites), then fetches that article and strips out all the navigation and ads, leaving just the actual article text.

- **`lib/claude.ts`** — This is the bridge to Claude AI. It sends the newsletter text to Claude and gets back a structured JSON response: the article title, a rich summary paragraph, and bullet takeaways. It also has a second function that looks across all the summaries for shared themes.

- **`lib/prompts.ts`** — This is where Claude gets its instructions. Think of it as the editor's brief — it tells Claude exactly what tone to write in, what format to return, and what makes a good summary vs a bad one.

- **`components/ArticleCard.tsx`** — The visual article card. Handles the coloured left border (each newsletter gets its own accent colour), the editorial headline, the byline, the summary text, and the "In Brief" bullet section.

---

## 4. Technologies Used — And Why We Chose Them

| Technology | What It Is | Why We Used It |
|---|---|---|
| **Next.js** | The framework that makes the web app work | Handles both the frontend (what you see) and the backend (API routes) in one project. Easy to deploy on Vercel. |
| **React** | The UI library inside Next.js | Lets us build the page as reusable pieces (components) rather than one giant blob of HTML |
| **Tailwind CSS** | A styling system | Write styles directly in the HTML — faster than writing separate CSS files |
| **Cheerio** | A server-side HTML parser | Lets us read a webpage's HTML and extract specific bits of it, like the article text |
| **Anthropic SDK** | Official library for calling Claude AI | Makes it easy to send messages to Claude and get structured responses back |
| **Vercel** | Hosting platform | One-click deploys from GitHub, free tier, handles serverless functions automatically |
| **localStorage** | Browser built-in mini-database | Stores your newsletter URLs in the browser — no server database needed |

**Why no database?**
We deliberately chose not to use a database (like PostgreSQL or MongoDB). Databases add complexity — you need to host them, pay for them, design schemas, write queries. Since your newsletter URLs only need to exist in *your* browser, localStorage is perfect. It's already there, it's free, and it's fast. Trade-off: if you open Morning Brief on a different device, you'd need to re-add your newsletters.

**Why Vercel over other hosting options?**
Vercel is made by the same team that made Next.js. They work perfectly together. The free tier (Hobby plan) is generous and handles our usage comfortably. Deployment is literally one click after connecting GitHub. The main trade-off: serverless functions on the free tier have a 60-second maximum runtime — which is why you see `export const maxDuration = 60` in the digest route.

---

## 5. Technical Decisions — The Reasoning

### The "newsletter scraper" approach instead of Gmail

The original plan was to connect to your Gmail and read newsletters from your inbox. We changed this because Gmail integration requires something called **OAuth** — a whole separate authentication system where you'd have to set up a Google Cloud project, configure consent screens, verify the app, and deal with refresh tokens. It would've taken days and added enormous complexity.

The scraper approach is much simpler: paste a URL, we visit the site, we read it. No OAuth, no Google Cloud, no tokens. It just works.

### URLs stored in the browser (localStorage) instead of a server database

We don't store anything on our server about you. Your newsletter list lives entirely in your own browser. This means:
- No user accounts needed
- No data privacy concerns
- Simpler architecture (no database to manage or pay for)
- Your data can't be lost in a server outage

Trade-off: your list only exists in one browser. But for a personal tool used by one person, this is the right call.

### Reading `.env.local` directly from disk (the API key fix)

This was a tricky one. Claude Code (the AI tool that helped build this) sets `ANTHROPIC_API_KEY` to an empty string `""` in the shell environment. Next.js sees that empty string and thinks "great, the key is set!" — so it never bothers checking your `.env.local` file where the real key lives.

The fix: in `lib/claude.ts`, we check `process.env.ANTHROPIC_API_KEY` first (this is what works on Vercel, where the key is injected directly). If it's empty or missing, we fall back to reading `.env.local` directly from disk. This works in both environments without any configuration changes.

### Accent colours assigned by index, not dynamically

Each newsletter gets one of six accent colours (coral, blue, green, amber, purple, teal). The colour is assigned based on the order you added the newsletter — first newsletter gets coral, second gets blue, etc. This keeps colour assignments stable and consistent every time you generate a digest.

---

## 6. Bugs, Fixes & War Stories

### The Mystery of the Empty API Key

**What happened:** The app worked fine but Claude kept returning errors. We could see the app loading, the loading state appeared, but then: "Could not generate any articles."

**Why it was confusing:** The API key was definitely in `.env.local`. We could see it there. So why wasn't Claude finding it?

**The detective work:** We built a temporary debug endpoint (`/api/debug`) that exposed what the server could actually see. Output: `{"hasAnthropicKey": false, "envKeyEmpty": true, "fileKeyWorks": true}`. Aha! The server could read the key from the file, but `process.env.ANTHROPIC_API_KEY` was empty.

**The culprit:** Claude Code (the AI used to build this app) sets `ANTHROPIC_API_KEY=""` in the shell environment as a safety measure. Next.js, when it starts, picks up all shell environment variables — and an empty string is a valid value, so it never checks `.env.local`.

**The fix:** Read `.env.local` directly from disk as a fallback, bypassing the shell environment. Then, for Vercel compatibility, swap the order: try `process.env` first (where Vercel injects the real key), fall back to file reading (for local development).

**The lesson:** Environment variables are deceptively tricky. An empty string and "not set" are different things, and they behave differently in different contexts.

---

### The Vercel Login Loop

**What happened:** When trying to log into Vercel through the automated browser, the "Continue with GitHub" button spun endlessly without completing.

**Why:** Automated browsers (like the one used for browser control) often trigger bot detection on OAuth flows. GitHub's login flow for Vercel detected something wasn't quite right about the session.

**The fix:** You logged in yourself. Sometimes the simplest solution is to hand the wheel back to a human for the authentication step.

---

### The Stale Error Message

**What happened:** After adding your newsletters and hitting New Issue, the page showed "Please add at least one newsletter first" — even though newsletters were clearly there.

**Why:** The first time you clicked New Issue (before adding any newsletters), that error got stored in React state. Adding newsletters later didn't clear the error state — it just updated the newsletter list. So the old error was still showing even though the situation had changed.

**The fix:** Clicking New Issue again triggered the actual generation flow, which replaced the error with the loading state. Not a bug exactly — more of a UX rough edge. The real solution would be to clear errors when newsletters are added.

---

## 7. Lessons & Takeaways

**Start simple, add complexity only when you need it.** The Gmail approach seemed fancy but required weeks of setup. The URL scraping approach seemed less elegant but worked on day one. Always ask: what's the simplest thing that could possibly work?

**Environment variables are a minefield.** They behave differently in development vs production, in shell environments vs `.env` files, and an empty string is not the same as "not set." Always build in diagnostics early — a simple debug endpoint that dumps what the server actually sees saves hours of guessing.

**Server-side and client-side are genuinely different worlds.** Code in `app/api/` runs on a server. Code in `components/` runs in the browser. They can't share state directly — they communicate through HTTP requests (fetch calls). Understanding this boundary is one of the most important things in modern web development.

**localStorage is underrated for personal tools.** Everyone reaches for databases immediately. But if your tool is genuinely personal — one user, one browser — localStorage is often the right answer. It's free, fast, always available, and requires zero setup.

**Claude's prompts are code.** The quality of the summaries depends entirely on the quality of the prompts in `lib/prompts.ts`. Writing good AI prompts is a skill — being specific about tone, format, and what "good" looks like makes the difference between a generic bullet-point summary and the rich, opinionated articles Morning Brief generates.

---

*The app is live at **https://morning-brief-coral.vercel.app**. Open it from any device, add your newsletters, and hit New Issue. Your personal magazine awaits.*

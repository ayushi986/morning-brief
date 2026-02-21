# LEARN.md — What This Project Teaches You

*Same spirit as FOR AYUSHI.md, but focused on what you can carry into your next project.*

---

## 1. The Big Ideas

### Big Idea #1: The Server / Client Split

Modern web apps live in two places simultaneously: the **server** (a computer somewhere in the internet, in our case Vercel's machines) and the **client** (your browser, on your device). They're separate environments that can't directly touch each other — they communicate by passing messages back and forth over HTTP.

In Morning Brief:
- **Server** (`app/api/` folder): visits newsletter websites, calls Claude AI, handles secrets like API keys
- **Client** (`components/` folder): renders the magazine, stores your newsletter URLs, handles button clicks

The rule of thumb: anything that needs to be kept secret (API keys, passwords) must live on the server. Anything the user sees and interacts with lives on the client.

### Big Idea #2: Web Scraping — The Web as a Data Source

The entire internet is readable if you know how. Every webpage is just HTML text — a structured document with tags like `<h1>`, `<p>`, `<a>`. Web scraping is the art of fetching that HTML and extracting the bits you want.

Cheerio (the library we use) lets you navigate HTML the same way you'd navigate a real webpage, but in code. The hard part isn't the code — it's that every website is structured differently. Substack puts articles in different places than Beehiiv. Building a robust scraper means writing detection logic for each platform.

### Big Idea #3: Prompts as Code

When you use Claude AI in a product, the prompt you write *is* the product. The same underlying model — given different instructions — produces radically different output. A vague prompt produces generic summaries. A specific prompt (with examples of good vs bad, with tone guidelines, with format requirements) produces the rich, editorial summaries Morning Brief generates.

This is a new kind of programming. Instead of telling a computer exactly what to do step by step, you're telling an intelligent system *what outcome you want* and trusting it to figure out the steps. The skill is being precise about outcomes.

---

## 2. New Tech, Explained Simply

### Next.js — The Framework That Does Everything

Plain HTML and CSS can make a webpage, but they can't make a *web app* — something that fetches data, responds to clicks, updates dynamically, and runs server-side logic. Next.js is the framework that bridges all of that.

The key insight about Next.js: it runs in two places. Files in `app/api/` run on the server (they can do things browsers can't — call databases, read files, use API keys). Files in `app/` and `components/` run in the browser. Next.js handles the communication between them.

Why Next.js over alternatives (like plain React, or Express)? Because it handles both frontend and backend in one project, deploys perfectly on Vercel, and has excellent defaults for performance.

### Tailwind CSS — Styles Without Leaving Your HTML

Traditional CSS: you write a file called `styles.css`, give things class names, and write CSS rules separately. Tailwind flips this: you write tiny utility classes directly on the HTML element. Instead of `class="article-title"` and then a separate CSS file that says `.article-title { font-size: 2rem; font-weight: bold; }`, you write `class="text-2xl font-bold"` directly.

This feels weird at first. Then it feels fast. You never context-switch between files, you always know exactly what a class does (the name describes the style directly), and nothing gets out of sync.

### localStorage — Your Browser's Mini-Database

Every browser comes with a tiny built-in storage system called `localStorage`. It's a simple key-value store — you can save a piece of text (with a name), and it stays there between page refreshes, between sessions, and even after closing and reopening the browser. It only gets cleared if the user explicitly clears their browser data.

```javascript
// Saving something
localStorage.setItem('newsletterUrls', JSON.stringify(['substack.com/...', 'beehiiv.com/...']));

// Reading it back later
const urls = JSON.parse(localStorage.getItem('newsletterUrls') || '[]');
```

For a personal tool that doesn't need multiple users or cross-device sync, localStorage is often the right answer. No server, no database, no setup — just works.

### Vercel — Deployment Without the Pain

Historically, putting a web app on the internet meant: rent a server, configure it, install software, manage security updates, set up a domain, deal with SSL certificates. Vercel handles all of that for you. You connect your GitHub repo, add your environment variables, and click Deploy. It builds your app, puts it on their servers, gives you an HTTPS URL, and redeploys automatically every time you push to GitHub.

The free tier (Hobby plan) is genuinely useful — it handles reasonable traffic, gives you 100GB of bandwidth per month, and supports serverless functions (which is how our API routes work).

---

## 3. How Engineers Think

### Start with the simplest thing that works

The original plan had Gmail integration. It sounded impressive. But it would've required OAuth, Google Cloud Console, consent screen verification, refresh tokens — a week of setup before writing a single line of app logic.

The scraping approach took one afternoon and produced better results. Good engineers ask: "What's the minimum viable version of this feature?" Then they build that first, and only add complexity when they genuinely need it.

### Diagnose before you fix

When the API key wasn't loading, the tempting move was to try different things until something worked — change the import, restart the server, check the file permissions. The better move was to build a diagnostic: a simple endpoint that reported exactly what the server could see. One API call produced a clear answer: `envKeyEmpty: true, fileKeyWorks: true`. Thirty seconds of diagnosis saved an hour of guessing.

This is a core engineering habit: before fixing, understand. Before understanding, measure.

### Design for both environments from day one

The API key had different behaviour in local development vs production (Vercel). The fix had to work in both places without requiring any configuration changes. The solution — try `process.env` first (works on Vercel), fall back to reading the file (works locally) — handles both cases with one piece of code.

When building anything that runs in multiple environments (local/production, browser/server, your machine/someone else's), think explicitly about how each environment differs and make your code handle both gracefully.

### Separate concerns cleanly

Notice that the prompts live in `lib/prompts.ts`, not inside `lib/claude.ts`. The Claude API calls live in `lib/claude.ts`, not inside the API routes. The API routes live in `app/api/`, not inside the components.

Each file does one thing. This matters when something breaks: you know exactly where to look. It also makes each part independently testable and improvable — want better summaries? Change `prompts.ts`. Want to support a new newsletter platform? Change `scraper.ts`. Nothing else needs to change.

---

## 4. Mistakes Made & Lessons Learned

### Mistake: Trusting that environment variables "just work"

**What we assumed:** `.env.local` would be the source of truth for environment variables in development.

**What actually happened:** The shell environment (set by Claude Code during development) injected an empty string for `ANTHROPIC_API_KEY`, and Next.js honoured the shell value over the `.env.local` file. An empty string is a valid value, so no warning was thrown — the app just silently failed to find the key.

**The lesson:** Never assume environment variables are where you think they are. Build diagnostic endpoints early. Understand that there's a hierarchy: shell environment → `.env.local` → defaults. Know where your values are actually coming from.

### Mistake: Designing for one environment (local dev) instead of two

**What happened:** The first fix for the API key problem worked perfectly locally but would have failed on Vercel. Vercel injects API keys directly into `process.env` — there's no `.env.local` file to read from.

**The fix:** Think through every environment your code will run in before writing the fix. The right solution reads `process.env` first (for Vercel), then falls back to file reading (for local dev with the shell override problem). Two lines of thought, one elegant solution.

**The lesson:** Production and development are different environments with different behaviours. Always ask: "Will this fix work in production, not just on my machine?"

### Mistake: Not clearing error state when inputs change

**What happened:** The stale "Please add at least one newsletter first" error persisted even after newsletters were added, because adding newsletters didn't clear the error state.

**The ideal fix:** In `app/page.tsx`, when the `newsletterUrls` state updates, clear any existing error. Or: clear errors at the start of every "New Issue" click, regardless.

**The lesson:** State in a UI can get out of sync with reality. Whenever something changes (user adds a newsletter, user deletes a source), think about what other state might need to be reset. Error messages especially — they're almost always stale the moment the user takes any action.

---

## 5. Patterns to Carry Forward

**The fallback chain pattern:**
```
try the ideal source
  → if empty/missing, try the fallback source
    → if still nothing, throw a clear error
```
This appears in the API key loading, in the newsletter scraping (try to find article links → fall back to homepage text), and in the Claude response parsing (use Claude's title → fall back to the source name). Build systems that degrade gracefully, not ones that crash on the first unexpected input.

**The async parallel pattern:**
When you have multiple independent tasks (scrape newsletter A, scrape newsletter B, scrape newsletter C), do them simultaneously instead of one-by-one:
```javascript
const results = await Promise.all(urls.map(url => scrapeNewsletter(url)));
```
This cuts your wait time from 3× to 1× the time of the slowest task. Always reach for `Promise.all` when tasks are independent.

**The separation-of-concerns pattern:**
Keep data fetching, AI processing, and UI rendering in separate files. Your components should receive clean data and just render it — they shouldn't be making API calls or parsing raw text. Your API routes should return clean, structured data — they shouldn't contain any UI logic. This makes everything easier to debug, test, and improve independently.

**The "write the prompt like you'd brief a writer" pattern:**
When writing Claude prompts, be as specific as you'd be when briefing a human writer:
- State the goal clearly ("write an engaging magazine article, not a dry summary")
- Give examples of good vs bad output
- Specify the format (JSON with specific fields)
- Define the tone ("warm, curious, conversational — never dry")
- Explain what to do with unusual situations ("if the content is very technical, translate it")

The more specific your brief, the better the output. Vague prompts produce mediocre results. Clear prompts produce great ones.

---

## 6. What to Google Next

If you want to go deeper on anything from this project:

- **"Next.js App Router tutorial"** — to understand the file-based routing system we used, and how server vs client components work
- **"Web scraping with Cheerio"** — to go deeper on how to navigate and extract from HTML
- **"React useState and useEffect"** — the two most fundamental React hooks, used throughout the frontend code
- **"Prompt engineering guide Anthropic"** — Anthropic's own guide to writing better Claude prompts
- **"localStorage vs sessionStorage vs cookies"** — to understand the different browser storage options and when to use each
- **"Vercel serverless functions"** — to understand how the API routes work under the hood (they're not traditional long-running servers — they spin up per request)
- **"Promise.all vs Promise.allSettled"** — the difference matters when some of your parallel tasks might fail (`.allSettled` continues even if some fail; `.all` stops on first failure)
- **"TypeScript interfaces and types"** — we used TypeScript throughout; understanding interfaces (like the ones in `types/index.ts`) is foundational

---

*The best way to learn all of this is to add a feature. Pick something small — maybe a delete button for newsletters, or a "copy link" button on each article — and build it. Reading code teaches you what exists. Building teaches you how it works.*

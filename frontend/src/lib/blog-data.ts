export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  tag: string;
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "semantic-search-vs-keywords",
    title: "Why semantic search makes keyword job filters look ancient",
    excerpt: "Boolean filters were a workaround for dumb search. With embeddings, you just say what you want.",
    author: "Maya Chen",
    date: "Jun 24, 2026",
    readTime: "6 min read",
    tag: "Engineering",
    body: [
      "For two decades, every job board has shipped the same UI: a search bar that does substring matching, plus a wall of checkboxes to compensate for it.",
      "The checkboxes exist because the search is bad. If 'senior react remote' returned the right roles, you wouldn't need to filter by seniority, framework, and location separately.",
      "Embeddings collapse that. The model reads each job once, stores a 1,536-dimensional vector, and ranks roles by cosine similarity to your query. 'Remote senior react roles on AI teams' becomes one search, not three filters.",
      "The real unlock isn't speed — it's that you can describe roles you couldn't have filtered for. 'Early-stage infra work where I'd touch Rust' has no checkbox. Semantic search just finds it.",
    ],
  },
  {
    slug: "resume-parsing-actually-works",
    title: "Resume parsing finally works — here's what changed",
    excerpt: "PDF-to-JSON used to be a hellscape of regex. LLMs turned it into a 200-line function.",
    author: "Sam Reyes",
    date: "Jun 17, 2026",
    readTime: "5 min read",
    tag: "AI",
    body: [
      "Every resume parser before 2023 was a regex graveyard. Date formats, two-column layouts, decorative dividers — each one needed bespoke logic, and the long tail never converged.",
      "Modern LLMs do not care. You hand them text, you hand them a JSON schema, and they hand you structured data. The schema is the spec; the model handles the formatting chaos.",
      "On jOBiON, parsing is a single Gemini call. The output drops straight into a vector index so we can rank jobs against your actual experience, not the keywords you remembered to put on the page.",
    ],
  },
  {
    slug: "hiring-funnel-metrics",
    title: "The four hiring-funnel metrics that actually predict hires",
    excerpt: "Most ATS dashboards measure noise. These four numbers correlate with closed offers.",
    author: "Ari Okafor",
    date: "Jun 10, 2026",
    readTime: "8 min read",
    tag: "Hiring",
    body: [
      "Recruiters drown in vanity metrics: pageviews, click-through, applicants-per-role. None of them predict whether you'll close a hire this quarter.",
      "Four metrics do: time-to-first-screen, screen-to-onsite rate, onsite-to-offer rate, and offer-acceptance rate. Each one isolates a single failure mode in your funnel.",
      "If your time-to-first-screen is over 5 days, your top candidates already accepted elsewhere. If your screen-to-onsite is under 30%, your sourcing channel is wrong. If your offers don't close, your comp band is.",
    ],
  },
  {
    slug: "remote-interview-loops",
    title: "How to design a remote interview loop candidates don't hate",
    excerpt: "Five rounds of unstructured Zooms is a brand-destroying experience. Here's a tighter shape.",
    author: "Jules Park",
    date: "Jun 03, 2026",
    readTime: "7 min read",
    tag: "Hiring",
    body: [
      "Candidates judge your company by your interview loop more than by your offer. Five back-to-back hours of generic Zoom is the worst marketing money can't buy.",
      "A good loop is three rounds: a 45-minute screen, a 2-hour deep-dive (paired coding or system design, not whiteboard trivia), and a 1-hour values & team conversation.",
      "Send candidates the rubric. Tell them who they'll meet and why. Pay for take-home work. None of this is novel — it's just rare.",
    ],
  },
];

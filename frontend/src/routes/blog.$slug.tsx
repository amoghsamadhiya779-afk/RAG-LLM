import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/lib/blog-data";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} — jOBiON Blog` },
          { name: "description", content: loaderData.post.excerpt },
          { property: "og:title", content: loaderData.post.title },
          { property: "og:description", content: loaderData.post.excerpt },
        ]
      : [{ title: "Article — jOBiON Blog" }],
  }),
  notFoundComponent: () => (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main className="container-page py-32 text-center">
        <p className="eyebrow">404</p>
        <h1 className="h-display mt-4 text-4xl">Article not found.</h1>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main className="container-page py-32 text-center">
        <h1 className="h-display text-3xl">Something went wrong.</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="mt-6 text-sm underline">Retry</button>
      </main>
      <SiteFooter />
    </div>
  ),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main>
        <article className="container-page max-w-3xl pt-20 pb-24">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>

          <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="outline">{post.tag}</Badge>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>

          <h1 className="h-display mt-5 text-4xl leading-tight md:text-5xl">{post.title}</h1>

          <div className="mt-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-xs font-semibold text-white">
              {post.author.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div className="text-sm">
              <div className="font-medium">{post.author}</div>
              <div className="text-xs text-muted-foreground">jOBiON team</div>
            </div>
          </div>

          <div className="mt-10 aspect-[2/1] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-pink-500/20">
            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
          </div>

          <div className="prose prose-invert mt-10 max-w-none">
            {post.body.map((para: string, i: number) => (
              <p key={i} className="mt-5 text-lg leading-relaxed text-muted-foreground first:mt-0">
                {para}
              </p>
            ))}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

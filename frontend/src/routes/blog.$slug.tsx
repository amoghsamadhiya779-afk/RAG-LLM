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
        <h1 className="h-display mt-4 text-h1">Article not found.</h1>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-small text-secondary hover:text-foreground">
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
        <h1 className="h-display text-h2">Something went wrong.</h1>
        <p className="mt-3 text-small text-secondary">{error.message}</p>
        <button onClick={reset} className="mt-6 text-small underline">Retry</button>
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
          <Link to="/blog" className="inline-flex items-center gap-2 text-small text-secondary hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>

          <div className="mt-8 flex items-center gap-3 text-micro text-secondary">
            <Badge variant="outline">{post.tag}</Badge>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>

          <h1 className="h-display mt-5 text-h1 leading-tight md:text-display">{post.title}</h1>

          <div className="mt-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-micro font-heading text-primary-foreground">
              {post.author.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div className="text-small">
              <div className="font-ui">{post.author}</div>
              <div className="text-micro text-secondary">jOBiON team</div>
            </div>
          </div>

          <div className="mt-10 aspect-[2/1] overflow-hidden rounded-lg border border-border bg-card">
            <div className="h-full w-full" />
          </div>

          <div className="prose prose-invert mt-10 max-w-none">
            {post.body.map((para: string, i: number) => (
              <p key={i} className="mt-5 text-body-lg leading-relaxed text-secondary first:mt-0">
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/lib/blog-data";
import { reveal, revealStagger, viewportOnce } from "@/lib/motion";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — jOBiON" },
      { name: "description", content: "Engineering, hiring, and AI notes from the jOBiON team." },
      { property: "og:title", content: "jOBiON Blog" },
      { property: "og:description", content: "Engineering, hiring, and AI notes from the jOBiON team." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="container-page pt-24 pb-12">
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="max-w-3xl">
            <motion.p variants={reveal} className="eyebrow">Blog</motion.p>
            <motion.h1 variants={reveal} className="h-display mt-4 text-display md:text-display">
              Notes on hiring, <span className="brand-gradient-text">search, and shipping.</span>
            </motion.h1>
            <motion.p variants={reveal} className="mt-5 text-body-lg text-secondary">
              What we're learning building an AI-native job board — and what we're seeing in the funnels of the companies using it.
            </motion.p>
          </motion.div>
        </section>

        <section className="container-page pb-12">
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="group block overflow-hidden rounded-lg border border-border bg-card"
          >
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-pink-500/30 md:aspect-auto">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute left-6 top-6"><Badge variant="secondary">Featured</Badge></div>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12">
                <div className="flex items-center gap-3 text-micro text-secondary">
                  <Badge variant="outline">{featured.tag}</Badge>
                  <span>{featured.date}</span>
                  <span>·</span>
                  <span>{featured.readTime}</span>
                </div>
                <h2 className="mt-5 text-h3 font-heading leading-tight tracking-tight md:text-h2">{featured.title}</h2>
                <p className="mt-4 text-secondary">{featured.excerpt}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-small font-ui text-foreground transition-transform group-hover:translate-x-0.5">
                  Read article <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </section>

        <section className="container-page pb-24">
          <motion.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={revealStagger} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <motion.div key={post.slug} variants={reveal}>
                <Link to="/blog/$slug" params={{ slug: post.slug }} className="group block h-full rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/30">
                  <div className="flex items-center gap-3 text-micro text-secondary">
                    <Badge variant="outline">{post.tag}</Badge>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="mt-4 text-body-lg font-heading leading-snug tracking-tight">{post.title}</h3>
                  <p className="mt-3 text-small text-secondary">{post.excerpt}</p>
                  <div className="mt-5 flex items-center justify-between text-micro text-secondary">
                    <span>{post.author}</span>
                    <span>{post.date}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

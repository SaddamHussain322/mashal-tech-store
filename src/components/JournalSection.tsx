import { BookOpen, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BLOG_POSTS } from '../data/blog';
import type { BlogPost } from '../types/store';

const BLOG_CATEGORIES: Array<'All' | BlogPost['category']> = [
  'All',
  'M Cloud',
  'Architecture',
  'Design Craft',
  'Deployment',
];

export function JournalSection() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | BlogPost['category']>('All');
  const [query, setQuery] = useState('');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BLOG_POSTS.filter((post) => {
      if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="border-b border-stone-200 pb-8">
        <p className="text-xs font-medium tracking-wide text-stone-500">
          Mashal Tech Journal · Engineering Notes &amp; Release Updates
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
          Editorial Updates &amp; Technical Dispatches
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
          Release notes from M Cloud, custom software scoping frameworks, visual system standards, and zero-cost modern deployment guides.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {BLOG_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-stone-950 text-white'
                      : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-950'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <label htmlFor="journal-search" className="sr-only">
              Search journal articles
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              id="journal-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm text-stone-950 placeholder:text-stone-400 focus:border-[#0284C7] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="mt-10 rounded-xl border border-stone-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-stone-300" aria-hidden="true" />
          <p className="text-sm font-medium text-stone-800">No articles match your search.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          {visiblePosts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => setActivePost(post)}
                className="aspect-[16/10] w-full overflow-hidden bg-stone-100 text-left"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              </button>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="font-medium text-[#E85D22]">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h2 className="mt-2 font-display text-xl font-bold leading-snug text-stone-950">
                    <button
                      type="button"
                      onClick={() => setActivePost(post)}
                      className="text-left hover:text-[#E85D22]"
                    >
                      {post.title}
                    </button>
                  </h2>

                  <p className="mt-2.5 text-sm leading-relaxed text-stone-600">{post.excerpt}</p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-xs">
                  <span className="text-stone-600">
                    By <strong className="font-semibold text-stone-900">{post.author}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePost(post)}
                    className="font-semibold text-stone-950 hover:text-[#E85D22]"
                  >
                    Read Article →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Article Reader Modal */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-modal-title"
        >
          <article className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
            <button
              type="button"
              onClick={() => setActivePost(null)}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:text-stone-950"
              aria-label="Close article"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-wrap items-center gap-2 pr-12 text-xs text-stone-500">
              <span className="font-semibold text-[#E85D22]">{activePost.category}</span>
              <span aria-hidden="true">·</span>
              <span>{activePost.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{activePost.readTime}</span>
            </div>

            <h2
              id="article-modal-title"
              className="mt-3 font-display text-2xl font-bold leading-tight text-stone-950 sm:text-3xl"
            >
              {activePost.title}
            </h2>
            <p className="mt-2 text-xs text-stone-500">
              {activePost.author} · {activePost.authorRole}
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
              <img
                src={activePost.image}
                alt={activePost.title}
                referrerPolicy="no-referrer"
                className="aspect-[16/9] w-full object-cover"
              />
            </div>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-700 sm:text-base">
              {activePost.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

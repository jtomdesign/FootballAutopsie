import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePostReadData } from "../hooks/usePostReadData";
import { usePostData } from "../hooks/usePostData";
import Spinner from "./Spinner";
import {
  RiChat4Line,
  RiUser3Line,
  RiTimeLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { formatDateTime, localizePost } from "../utils/helpers";
import { Container } from "./Container";
import SaveArticleButton, { ShareButtons } from "../components/user/SaveArticleButton";
import CommentsSection from "../components/user/CommentsSection";
import AdBanner from "../components/AdBanner";
import { useSEO, metaDescription, SITE_NAME, SITE_URL } from "../utils/seo";

const isHtml = str => typeof str === "string" && /<\w+[^>]*>/.test(str);

const RelatedCard = ({ post }) => {
  const lp = localizePost(post);
  return (
  <Link
    to={`/news/${post.slug}`}
    className="block bg-emerald-950/60 border border-emerald-900/60 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors"
  >
    <div
      className="aspect-[16/9] bg-emerald-900/40 bg-cover bg-center"
      style={{
        backgroundImage: post.featuredImage
          ? `url(${post.featuredImage})`
          : undefined,
      }}
    />
    <div className="p-3">
      <h4 className="font-serif text-gray-100 text-sm leading-snug line-clamp-2">
        {lp.title}
      </h4>
      <p className="text-gray-500 text-[0.65rem] mt-1.5 uppercase tracking-wider">
        {formatDateTime(post.created_at)}
      </p>
    </div>
  </Link>
  );
};

const ReadPost = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const { data: post, isLoading } = usePostReadData(slug);
  const { data: allPosts = [] } = usePostData();

  const lang = i18n.language;
  const lpost = localizePost(post, lang);
  const category =
    post?.Categories?.name ?? post?.Categories?.[0]?.name ?? null;

  useSEO({
    title: lpost?.title,
    description: metaDescription(lpost?.excerpt),
    path: `/news/${lpost?.slug ?? slug}`,
    image: lpost?.featuredImage || undefined,
    type: "article",
    publishedTime: lpost?.created_at || undefined,
    modifiedTime: lpost?.updated_at || undefined,
    jsonLd: lpost
      ? [
          {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: lpost.title,
            description: metaDescription(lpost.excerpt),
            image: lpost.featuredImage ? [lpost.featuredImage] : undefined,
            datePublished: lpost.created_at,
            dateModified: lpost.updated_at ?? lpost.created_at,
            inLanguage: lang?.startsWith("en") ? "en" : "fr",
            articleSection: category ?? undefined,
            keywords: category ?? undefined,
            author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            publisher: {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
              logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.jpg` },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${SITE_URL}/news/${lpost.slug}`,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Accueil",
                item: SITE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Actualités",
                item: `${SITE_URL}/news`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: lpost.title,
                item: `${SITE_URL}/news/${lpost.slug}`,
              },
            ],
          },
        ]
      : undefined,
  });

  if (isLoading) return <Spinner />;
  if (!post) {
    return (
      <Container>
        <div className="py-24 text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-3">
            {t("Article introuvable")}
          </h1>
          <Link to="/news" className="text-emerald-400 hover:underline">
            ← {t("Retour aux actualités")}
          </Link>
        </div>
      </Container>
    );
  }

  const related = (allPosts ?? [])
    .filter(p => p.id !== post.id)
    .slice(0, 3);

  return (
    <Container>
      <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] grid-cols-1 gap-10 py-8">
        <article className="max-w-3xl">
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold hover:text-emerald-300 mb-5"
          >
            <RiArrowLeftLine /> {t("Toutes les actualités")}
          </Link>

          <h1 className="font-serif text-gray-50 text-3xl sm:text-4xl lg:text-5xl leading-tight mb-5">
            {lpost.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-gray-400 text-xs italic mb-6">
            <span className="flex items-center gap-1.5 not-italic font-semibold text-gray-300">
              <RiUser3Line /> {lpost.authorId ?? t("Rédaction Football Autopsie")}
            </span>
            <span className="flex items-center gap-1.5">
              <RiTimeLine /> {lpost.readingTime ?? "—"} {t("min de lecture")}
            </span>
            <span>{formatDateTime(post.created_at)}</span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <SaveArticleButton postId={post.id} />
            <ShareButtons title={lpost.title} />
          </div>

          <AdBanner variant="leaderboard" className="mb-6" />

          {lpost.excerpt && (
            <p className="font-serif text-xl text-gray-300 leading-relaxed border-l-4 border-emerald-500 pl-5 mb-6">
              {lpost.excerpt}
            </p>
          )}

          {post.featuredImage && (
            <figure className="mb-6">
              <img
                className="w-full rounded-2xl"
                src={lpost.featuredImage}
                alt={lpost.title}
              />
              <figcaption className="text-gray-500 text-xs py-2 italic">
                {lpost.imageCredit
                  ? `${t("Crédit photo")} : ${lpost.imageCredit}`
                  : t("Image : Football Autopsie")}
              </figcaption>
            </figure>
          )}

          <div className="article-content">
            {isHtml(lpost.content) ? (
              <div dangerouslySetInnerHTML={{ __html: lpost.content }} />
            ) : (
              <p className="whitespace-pre-line">{lpost.content}</p>
            )}
          </div>

          <AdBanner variant="leaderboard" className="mb-8" />

          <CommentsSection postId={lpost.id} />
        </article>

        <aside className="lg:sticky lg:top-24 self-start">
          <AdBanner variant="rectangle" className="mb-6" />
          {related.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-emerald-400 mb-4">
                {t("À lire aussi")}
              </h3>
              <div className="flex flex-col gap-4">
                {related.map(p => (
                  <RelatedCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      </div>
    </Container>
  );
};

export default ReadPost;

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import FormRow from "../../ui/FormRow";
import Button from "../../ui/Button";
import RichTextEditor from "../../components/editor/RichTextEditor";
import { slugify, readingTimeFromHtml } from "../../utils/helpers";
import { getPostById, CreateEditPost } from "../../services/apiPosts";
import { useCategories } from "../../hooks/useCategories";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  RiArrowLeftLine,
  RiEyeLine,
  RiSaveLine,
  RiSendPlaneLine,
  RiCalendarLine,
} from "react-icons/ri";

const toLocalInput = iso => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const inputCls =
  "w-full border border-emerald-900/40 focus:ring-emerald-400 focus:ring-1 focus:outline-none py-3 px-4 rounded-xl text-sm text-gray-100 bg-emerald-900/40";

const STATUS_LABELS = {
  draft: "Brouillon",
  published: "Publié",
  scheduled: "Planifié",
  unpublished: "Dépublié",
};

const ArticleEditor = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [showEn, setShowEn] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState(false);
  const [featuredPreview, setFeaturedPreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const { data: categories = [] } = useCategories();
  const { data: post, isLoading } = useQuery({
    queryKey: ["Post", id],
    queryFn: () => getPostById(id),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      title_en: "",
      slug: "",
      excerpt: "",
      excerpt_en: "",
      status: "draft",
      isBreaking: false,
      categoryId: "",
      authorId: "",
      publishAt: "",
      imageCredit: "",
      featuredImage: null,
    },
  });

  const title = watch("title");
  const status = watch("status");

  useEffect(() => {
    if (!post) return;
    reset({
      title: post.title ?? "",
      title_en: post.title_en ?? "",
      slug: post.slug ?? "",
      excerpt: post.excerpt ?? "",
      excerpt_en: post.excerpt_en ?? "",
      status: post.status ?? "draft",
      isBreaking: !!post.isBreaking,
      categoryId: post.categoryId ?? "",
      authorId: post.authorId ?? "",
      publishAt: toLocalInput(post.publishAt),
      imageCredit: post.imageCredit ?? "",
    });
    setContent(post.content ?? "");
    setContentEn(post.content_en ?? "");
    setShowEn(!!(post.title_en || post.excerpt_en || post.content_en));
    setFeaturedPreview(post.featuredImage ?? null);
    setImageUrl(post.featuredImage ?? null);
    setSlugTouched(true);
  }, [post, reset]);

  // Auto slug from title until manually edited
  useEffect(() => {
    if (title && !slugTouched) {
      setValue("slug", slugify(title), { shouldValidate: false });
    }
  }, [title, slugTouched, setValue]);

  const readingTime = useMemo(
    () => readingTimeFromHtml(content),
    [content],
  );

  const saveMutation = useMutation({
    mutationFn: payload => CreateEditPost(payload, isEdit ? id : undefined),
    onSuccess: data => {
      toast.success(isEdit ? "Article mis à jour" : "Article enregistré");
      queryClient.invalidateQueries({ queryKey: ["Posts"] });
      queryClient.invalidateQueries({ queryKey: ["Post", id] });
      if (!isEdit && data?.slug) {
        navigate(`/dashboard/posts/${data.id}/modifier`, { replace: true });
      }
    },
    onError: err => toast.error(err.message),
  });

  const onSubmit = (data, overrideStatus) => {
    // react-hook-form returns a FileList for file inputs — unwrap it
    const rawImage = data.featuredImage;
    const imageField =
      rawImage instanceof FileList ? rawImage?.[0] : rawImage?.[0] ?? rawImage;
    const featuredImage =
      imageField instanceof File && imageField.size > 0
        ? imageField
        : imageUrl || "";

    const payload = {
      title: data.title.trim(),
      title_en: data.title_en?.trim() || null,
      slug: slugify(data.slug || data.title),
      excerpt: data.excerpt?.trim() || null,
      excerpt_en: data.excerpt_en?.trim() || null,
      content,
      content_en: contentEn || null,
      featuredImage,
      categoryId: data.categoryId === "" ? null : Number(data.categoryId),
      authorId: data.authorId === "" ? null : Number(data.authorId),
      readingTime: String(readingTime),
      isBreaking: !!data.isBreaking,
      imageCredit: data.imageCredit?.trim() || null,
      status: overrideStatus ?? data.status,
      publishAt:
        (overrideStatus ?? data.status) === "scheduled" && data.publishAt
          ? new Date(data.publishAt).toISOString()
          : null,
    };
    saveMutation.mutate(payload);
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400/20 border-t-emerald-800" />
      </div>
    );
  }

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/posts"
            className="p-2 rounded-full text-gray-400 hover:text-gray-100 hover:bg-emerald-500/10 transition-colors"
          >
            <RiArrowLeftLine className="text-xl" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-100">
              {isEdit ? "Modifier l'article" : "Nouvel article"}
            </h1>
            <p className="text-xs text-gray-400">
              {STATUS_LABELS[status] ?? status} · {readingTime} min de lecture
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="secondary"
            role="button"
            name={preview ? "Masquer l'aperçu" : "Aperçu"}
            icon={<RiEyeLine />}
            onClick={() => setPreview(p => !p)}
          />
          {isEdit && post?.status === "published" && (
            <a
              href={`/news/${post.slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-full border border-emerald-500/50 text-emerald-600 font-bold text-sm hover:bg-emerald-500/10 transition-colors"
            >
              Voir l'article
            </a>
          )}
        </div>
      </div>

      {preview ? (
        <div className="bg-emerald-950/60 rounded-3xl p-8 sm:p-12 article-content">
          <h1 className="!text-4xl !text-gray-50 font-serif mb-4">
            {watch("title") || "Titre de l'article"}
          </h1>
          {featuredPreview && (
            <img src={featuredPreview} alt="" className="rounded-2xl mb-6" />
          )}
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p className="text-gray-500">Aucun contenu pour le moment.</p>
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(data => onSubmit(data))}
          className="flex flex-col gap-5 bg-emerald-950/60 rounded-2xl p-5 lg:p-6"
        >
          <FormRow label="Titre" error={errors?.title?.message}>
            <input
              className={inputCls}
              type="text"
              placeholder="Titre de l'article"
              {...register("title", { required: "Le titre est requis" })}
            />
          </FormRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormRow label="Slug" error={errors?.slug?.message}>
              <input
                className={inputCls}
                type="text"
                placeholder="url-de-l-article"
                {...register("slug", { required: "Le slug est requis" })}
                onChange={e => {
                  setSlugTouched(true);
                  register("slug").onChange(e);
                }}
              />
            </FormRow>
            <FormRow label="Catégorie">
              <select
                className={inputCls}
                {...register("categoryId")}
              >
                <option value="">— Aucune —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormRow>
          </div>

          <FormRow label="Chapô / Extrait">
            <textarea
              rows={2}
              className={inputCls}
              placeholder="Résumé court affiché dans les listes d'articles"
              {...register("excerpt")}
            />
          </FormRow>

          <FormRow label="Image à la une">
            <div className="flex items-center gap-4 flex-wrap">
              <input
                type="file"
                accept="image/*"
                className="file:font-medium file:py-2 file:px-4 file:mr-3 file:rounded-full file:border-0 file:text-white file:bg-emerald-600 file:cursor-pointer text-sm text-gray-400"
                {...register("featuredImage")}
                onChange={e => {
                  register("featuredImage").onChange(e);
                  const f = e.target.files?.[0];
                  if (f) {
                    setFeaturedPreview(URL.createObjectURL(f));
                    setImageUrl(null);
                  }
                }}
              />
              {featuredPreview && (
                <img
                  src={featuredPreview}
                  alt="Aperçu"
                  className="h-16 w-24 object-cover rounded-lg border border-emerald-300"
                />
              )}
              <input
                type="text"
                className={`${inputCls} flex-1 min-w-48`}
                placeholder="Crédit photo / source (ex : Getty Images, Icon Sport)"
                {...register("imageCredit")}
              />
            </div>
          </FormRow>

          <div>
            <label className="font-bold text-sm text-gray-300 block mb-2">
              Contenu
            </label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          <div className="border border-emerald-900/40 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEn(o => !o)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <span>Traduction anglaise (optionnel)</span>
              <span className="text-emerald-500">{showEn ? "−" : "+"}</span>
            </button>
            {showEn && (
              <div className="flex flex-col gap-5 px-5 pb-5 pt-1 border-t border-emerald-900/40">
                <FormRow label="Titre (EN)">
                  <input
                    className={inputCls}
                    type="text"
                    placeholder="English title"
                    {...register("title_en")}
                  />
                </FormRow>
                <FormRow label="Chapô / Extrait (EN)">
                  <textarea
                    rows={2}
                    className={inputCls}
                    placeholder="Short English summary"
                    {...register("excerpt_en")}
                  />
                </FormRow>
                <div>
                  <label className="font-bold text-sm text-gray-300 block mb-2">
                    Contenu (EN)
                  </label>
                  <RichTextEditor content={contentEn} onChange={setContentEn} />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FormRow label="Statut">
              <select
                className={inputCls}
                {...register("status")}
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="scheduled">Planifié</option>
                <option value="unpublished">Dépublié</option>
              </select>
            </FormRow>
            <FormRow label="Date de publication">
              <input
                type="datetime-local"
                className={inputCls}
                {...register("publishAt")}
              />
            </FormRow>
            <FormRow label="ID Auteur">
              <input
                type="number"
                className={inputCls}
                placeholder="ex : 1"
                {...register("authorId")}
              />
            </FormRow>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isBreaking"
              {...register("isBreaking")}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            <label htmlFor="isBreaking" className="text-sm font-semibold text-gray-300 cursor-pointer">
              Marquer comme breaking news
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-emerald-900/40">
            <Button
              type="secondary"
              role="button"
              name="Brouillon"
              icon={<RiSaveLine />}
              onClick={handleSubmit(data => onSubmit(data, "draft"))}
            />
            {status === "scheduled" ? (
              <Button
                role="button"
                name="Planifier"
                icon={<RiCalendarLine />}
                onClick={handleSubmit(data => onSubmit(data, "scheduled"))}
              />
            ) : (
              <Button
                role="button"
                name="Publier"
                icon={<RiSendPlaneLine />}
                onClick={handleSubmit(data => onSubmit(data, "published"))}
              />
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default ArticleEditor;

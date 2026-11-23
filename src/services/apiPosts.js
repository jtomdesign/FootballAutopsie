import { supabase, supabaseUrl } from "./supabase";

const POSTS_BUCKET = "posts-images";

// ---------- Public reads ----------

/** Published articles for the public site (scheduled posts appear once due). */
export const getPublishedPosts = async function () {
  const now = new Date().toISOString();
  let { data, error } = await supabase
    .from("Posts")
    .select("*, Categories(*)")
    .or(
      `status.eq.published,and(status.eq.scheduled,publishAt.lte.${now})`,
    )
    .order("created_at", { ascending: false });

  // Fallback if the publishAt migration hasn't been applied yet
  if (error && /publishAt|column/i.test(error.message)) {
    ({ data, error } = await supabase
      .from("Posts")
      .select("*, Categories(*)")
      .eq("status", "published")
      .order("created_at", { ascending: false }));
  }

  if (error) throw new Error("Impossible de charger les articles");
  return data ?? [];
};

export const getPublishedPostBySlug = async function (slug) {
  const now = new Date().toISOString();
  let { data: post, error } = await supabase
    .from("Posts")
    .select("*, Categories(*)")
    .eq("slug", slug)
    .or(
      `status.eq.published,and(status.eq.scheduled,publishAt.lte.${now})`,
    )
    .maybeSingle();

  if (error && /publishAt|column/i.test(error.message)) {
    ({ data: post, error } = await supabase
      .from("Posts")
      .select("*, Categories(*)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle());
  }

  if (error) throw new Error("Article introuvable");
  return post;
};

// ---------- Admin reads ----------

export const getPosts = async function () {
  const { data: posts, error } = await supabase
    .from("Posts")
    .select("*, Categories(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Impossible de charger les articles");
  return posts ?? [];
};

export const getPostById = async function (id) {
  const { data, error } = await supabase
    .from("Posts")
    .select("*, Categories(*)")
    .eq("id", id)
    .single();
  if (error) throw new Error("Article introuvable");
  return data;
};

// ---------- Posts mutations ----------

/** Upload an image to the posts-images bucket and return its public URL. */
export const uploadPostImage = async function (file) {
  return uploadFeaturedImage(file);
};

const uploadFeaturedImage = async function (file) {
  const safeName = file.name.replaceAll("/", "");
  const imageName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
  const { error } = await supabase.storage
    .from(POSTS_BUCKET)
    .upload(imageName, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error("Échec de l'envoi de l'image");
  return `${supabaseUrl}/storage/v1/object/public/${POSTS_BUCKET}/${imageName}`;
};

/**
 * Create or update a post.
 * newPost.featuredImage may be a File (upload), an existing URL, or empty.
 */
export const CreateEditPost = async function (newPost, id) {
  const payload = { ...newPost };
  delete payload.featuredImageFile;

  let imagePath = payload.featuredImage;
  if (payload.featuredImage instanceof File) {
    imagePath = await uploadFeaturedImage(payload.featuredImage);
  }
  payload.featuredImage = imagePath || null;

  // Normalize empty strings to null for optional fields
  if (payload.categoryId === "") payload.categoryId = null;
  if (payload.authorId === "") payload.authorId = null;
  // Only send imageCredit when set — the column may not exist yet on
  // databases where the migration hasn't been run.
  if (!payload.imageCredit) delete payload.imageCredit;

  let query = supabase.from("Posts");
  if (!id) {
    query = query.insert([payload]);
  } else {
    query = query.update(payload).eq("id", id);
  }

  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message || "Impossible d'enregistrer l'article");
  return data;
};

export const deletePost = async function (id) {
  const { error } = await supabase.from("Posts").delete().eq("id", id);
  if (error) throw new Error("Impossible de supprimer l'article");
};

// ---------- Categories ----------

export const getCategories = async function () {
  const { data, error } = await supabase
    .from("Categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error("Impossible de charger les catégories");
  return data ?? [];
};

export const createCategory = async function (category) {
  const { data, error } = await supabase
    .from("Categories")
    .insert([category])
    .select()
    .single();
  if (error) throw new Error(error.message || "Impossible de créer la catégorie");
  return data;
};

export const updateCategory = async function ({ id, ...fields }) {
  const { data, error } = await supabase
    .from("Categories")
    .update(fields)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message || "Impossible de modifier la catégorie");
  return data;
};

export const deleteCategory = async function (id) {
  const { error } = await supabase.from("Categories").delete().eq("id", id);
  if (error) throw new Error("Impossible de supprimer la catégorie");
};

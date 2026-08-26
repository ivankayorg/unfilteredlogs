/* ==========================================================
   BLOG 001
   UNFILTERED LOG BLOG TYPES
   ========================================================== */


export type BlogAccent =
  | "orange"
  | "blue";


export type BlogPost = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  hero_image_url: string | null;
  accent_style: BlogAccent;
  published: boolean;
  is_highlighted: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};


export type SaveBlogPostInput = {
  id?: string | null;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  heroImageUrl?: string;
  accentStyle: BlogAccent;
  published: boolean;
  highlighted: boolean;
};

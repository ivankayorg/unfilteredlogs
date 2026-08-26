import {
  supabase,
} from "../lib/supabase";

import type {
  BlogPost,
  SaveBlogPostInput,
} from "../types/blog";


/* ==========================================================
   BLOG 001
   PUBLIC READS
   ========================================================== */


export async function getHighlightedBlogPost() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "blog_posts"
      )
      .select("*")
      .eq(
        "published",
        true
      )
      .eq(
        "is_highlighted",
        true
      )
      .order(
        "published_at",
        {
          ascending:
            false,
        }
      )
      .limit(1)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    BlogPost | null;
}


export async function getPublishedBlogPosts() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "blog_posts"
      )
      .select("*")
      .eq(
        "published",
        true
      )
      .order(
        "published_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as BlogPost[];
}


export async function getBlogPostBySlug(
  slug: string,
) {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "blog_posts"
      )
      .select("*")
      .eq(
        "slug",
        slug
      )
      .eq(
        "published",
        true
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data as
    BlogPost | null;
}


/* ==========================================================
   BLOG 002
   ADMIN
   ========================================================== */


export async function getAdminBlogPosts() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "blog_posts"
      )
      .select("*")
      .order(
        "updated_at",
        {
          ascending:
            false,
        }
      );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ) as BlogPost[];
}


export async function saveBlogPost(
  input:
    SaveBlogPostInput,
) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "admin_save_blog_post",
      {
        target_post:
          input.id ??
          null,

        post_title:
          input.title.trim(),

        post_slug:
          input.slug.trim(),

        post_excerpt:
          input.excerpt
            ?.trim() ||
          null,

        post_body:
          input.body.trim(),

        post_hero_image_url:
          input.heroImageUrl
            ?.trim() ||
          null,

        post_accent_style:
          input.accentStyle,

        post_published:
          input.published,

        post_highlighted:
          input.highlighted,
      }
    );

  if (error) {
    throw error;
  }

  return data as string;
}


export async function deleteBlogPost(
  blogPostId: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_delete_blog_post",
      {
        target_post:
          blogPostId,
      }
    );

  if (error) {
    throw error;
  }
}



/* ==========================================================
   BLOG 003
   HOMEPAGE FEATURE
   ========================================================== */


export async function setBlogPostHighlighted(
  blogPostId: string,
  highlighted: boolean,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_set_blog_highlight",
      {
        target_post:
          blogPostId,

        new_highlighted:
          highlighted,
      }
    );

  if (error) {
    throw error;
  }
}

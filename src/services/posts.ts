import { supabase } from "../lib/supabase";

import {
  parseYouTubeUrl,
} from "../lib/youtube";

import {
  attachPostEngagement,
} from "./engagement";

import type {
  CreateQuickPostInput,
  EditPostInput,
  GifAttachment,
  PostImageRecord,
  PostRecord,
} from "../types/post";


/* ==========================================================
   UNFILTERED LOGS
   POSTS SERVICE
   ========================================================== */


const POST_IMAGE_BUCKET =
  "post-images";

const MAX_IMAGE_BYTES =
  10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]);


/* ==========================================================
   HELPERS
   ========================================================== */


function cleanOptionalText(
  value?: string,
) {
  const cleaned =
    value?.trim() ?? "";

  return cleaned || null;
}


function getGifFields(
  gif?:
    GifAttachment | null,
) {
  return {
    gif_id:
      gif?.id ??
      null,

    gif_url:
      gif?.url ??
      null,

    gif_preview_url:
      gif?.previewUrl ??
      null,
  };
}


function getImageExtension(
  file: File,
) {
  const typeToExtension:
    Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

  return (
    typeToExtension[file.type] ??
    "jpg"
  );
}


async function getCurrentUser() {
  const {
    data: {
      user,
    },
    error,
  } =
    await supabase.auth
      .getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to post."
    );
  }

  return user;
}


/* ==========================================================
   STORAGE
   ========================================================== */


async function uploadPostImage(
  userId: string,
  file: File,
) {
  if (
    !ALLOWED_IMAGE_TYPES.has(
      file.type
    )
  ) {
    throw new Error(
      "UNFILTERED LOGS currently accepts JPG, PNG, WEBP, and GIF images."
    );
  }

  if (
    file.size >
    MAX_IMAGE_BYTES
  ) {
    throw new Error(
      "Image must be 10 MB or smaller."
    );
  }

  const extension =
    getImageExtension(file);

  const path =
    `${userId}/${crypto.randomUUID()}.${extension}`;

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from(
        POST_IMAGE_BUCKET
      )
      .upload(
        path,
        file,
        {
          cacheControl:
            "3600",

          upsert: false,
        }
      );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        POST_IMAGE_BUCKET
      )
      .getPublicUrl(
        path
      );

  return {
    imageUrl:
      data.publicUrl,

    storagePath:
      path,
  };
}


/* ==========================================================
   IMAGE GALLERY HYDRATION
   ========================================================== */


function legacyImageForPost(
  post: PostRecord,
): PostImageRecord[] {
  if (
    post.post_type !== "image" ||
    !post.image_url
  ) {
    return [];
  }

  return [{
    id: `legacy-${post.id}`,
    post_id: post.id,
    image_url: post.image_url,
    storage_path: null,
    position: 0,
  }];
}


async function attachPostImages(
  rows: PostRecord[],
): Promise<PostRecord[]> {
  if (rows.length === 0) {
    return [];
  }

  const postIds = rows.map((row) => row.id);

  const {
    data,
    error,
  } = await supabase
    .from("post_images")
    .select("id, post_id, image_url, storage_path, position")
    .in("post_id", postIds)
    .order("position", { ascending: true });

  if (error) {
    console.warn(
      "UNFILTERED LOGS IMAGE GALLERY LOAD ERROR; USING LEGACY IMAGE_URL:",
      error
    );

    return rows.map((row) => ({
      ...row,
      images: legacyImageForPost(row),
    }));
  }

  const imagesByPost = new Map<string, PostImageRecord[]>();

  for (const raw of data ?? []) {
    const image = raw as PostImageRecord;
    const existing = imagesByPost.get(image.post_id) ?? [];
    existing.push(image);
    imagesByPost.set(image.post_id, existing);
  }

  return rows.map((row) => {
    const gallery = imagesByPost.get(row.id) ?? [];

    return {
      ...row,
      images:
        gallery.length > 0
          ? gallery
          : legacyImageForPost(row),
    };
  });
}


async function setPostImages(
  postId: string,
  images: Array<{
    imageUrl: string;
    storagePath: string | null;
  }>,
) {
  const { error } = await supabase.rpc(
    "set_post_images",
    {
      target_post: postId,
      image_rows: images.map((image) => ({
        image_url: image.imageUrl,
        storage_path: image.storagePath,
      })),
    }
  );

  if (error) {
    throw new Error(
      `Could not save the image gallery. Apply migrations/20260830000100_post_image_galleries.sql first if the gallery migration has not been installed. ${error.message}`
    );
  }
}


async function removeStoredImages(
  storagePaths: string[],
) {
  const uniquePaths = Array.from(
    new Set(storagePaths.filter(Boolean))
  );

  if (uniquePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .remove(uniquePaths);

  if (error) {
    console.warn(
      "UNFILTERED LOGS IMAGE CLEANUP ERROR:",
      error
    );
  }
}


/* ==========================================================
   TAXONOMY HYDRATION
   ========================================================== */


async function attachTaxonomy(
  rows:
    PostRecord[],
): Promise<PostRecord[]> {
  if (
    rows.length === 0
  ) {
    return [];
  }

  const categoryIds =
    Array.from(
      new Set(
        rows
          .map(
            (
              row
            ) =>
              row.category_id
          )
          .filter(
            (
              value
            ):
              value is string =>
                Boolean(value)
          )
      )
    );

  const postIds =
    rows.map(
      (
        row
      ) =>
        row.id
    );


  const [
    categoriesResult,
    postTagsResult,
  ] =
    await Promise.all([
      categoryIds.length >
        0
        ? supabase
            .from(
              "post_categories"
            )
            .select(
              "id, name, slug"
            )
            .in(
              "id",
              categoryIds
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      supabase
        .from(
          "post_tags"
        )
        .select(
          "post_id, tag_id"
        )
        .in(
          "post_id",
          postIds
        ),
    ]);


  if (
    categoriesResult.error
  ) {
    console.warn(
      "UNFILTERED LOGS CATEGORY LOAD ERROR:",
      categoriesResult.error
    );
  }

  if (
    postTagsResult.error
  ) {
    console.warn(
      "UNFILTERED LOGS TAG LINK LOAD ERROR:",
      postTagsResult.error
    );
  }


  const categoryMap =
    new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
      }
    >();

  for (
    const category
    of categoriesResult.data ??
    []
  ) {
    categoryMap.set(
      category.id,
      category
    );
  }


  const tagIds =
    Array.from(
      new Set(
        (
          postTagsResult.data ??
          []
        ).map(
          (
            row
          ) =>
            row.tag_id
        )
      )
    );

  const {
    data:
      tagRows,
    error:
      tagsError,
  } =
    tagIds.length >
      0
      ? await supabase
          .from(
            "tags"
          )
          .select(
            "id, name, slug"
          )
          .in(
            "id",
            tagIds
          )
      : {
          data: [],
          error: null,
        };


  if (tagsError) {
    console.warn(
      "UNFILTERED LOGS TAG LOAD ERROR:",
      tagsError
    );
  }


  const tagMap =
    new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
      }
    >();

  for (
    const tag
    of tagRows ?? []
  ) {
    tagMap.set(
      tag.id,
      tag
    );
  }


  const tagsByPost =
    new Map<
      string,
      Array<{
        id: string;
        name: string;
        slug: string;
      }>
    >();

  for (
    const link
    of postTagsResult.data ??
    []
  ) {
    const tag =
      tagMap.get(
        link.tag_id
      );

    if (!tag) {
      continue;
    }

    const existing =
      tagsByPost.get(
        link.post_id
      ) ??
      [];

    existing.push(
      tag
    );

    tagsByPost.set(
      link.post_id,
      existing
    );
  }


  return rows.map(
    (
      row
    ) => ({
      ...row,

      category:
        row.category_id
          ? categoryMap.get(
              row.category_id
            ) ??
            null
          : null,

      tags:
        tagsByPost.get(
          row.id
        ) ??
        [],
    })
  );
}


/* ==========================================================
   CREATE POST
   ========================================================== */


async function attachProfiles(
  rows:
    Array<Record<string, any>>,
): Promise<PostRecord[]> {
  if (
    rows.length === 0
  ) {
    return [];
  }

  const userIds =
    Array.from(
      new Set(
        rows
          .map(
            (
              row
            ) =>
              row.user_id as
                string | undefined
          )
          .filter(
            (
              value
            ):
              value is string =>
                Boolean(value)
          )
      )
    );


  if (
    userIds.length === 0
  ) {
    return rows.map(
      (
        row
      ) => ({
        ...row,

        profiles:
          null,
      })
    ) as unknown as
      PostRecord[];
  }


  const {
    data:
      profileRows,
    error:
      profileError,
  } =
    await supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url"
      )
      .in(
        "id",
        userIds
      );


  if (profileError) {
    console.warn(
      "UNFILTERED LOGS PROFILE LOAD ERROR:",
      profileError
    );
  }


  const profileMap =
    new Map<
      string,
      {
        username:
          string;

        display_name:
          string;

        avatar_url:
          string | null;
      }
    >();


  for (
    const profile
    of profileRows ?? []
  ) {
    profileMap.set(
      profile.id,
      {
        username:
          profile.username,

        display_name:
          profile.display_name,

        avatar_url:
          profile.avatar_url,
      }
    );
  }


  return rows.map(
    (
      row
    ) => ({
      ...row,

      gif_id:
        row.gif_id ??
        null,

      gif_url:
        row.gif_url ??
        null,

      gif_preview_url:
        row.gif_preview_url ??
        null,

      moderation_status:
        row.moderation_status ??
        (
          row.published
            ? "approved"
            : "pending"
        ),

      submitted_at:
        row.submitted_at ??
        row.created_at ??
        null,

      moderated_at:
        row.moderated_at ??
        null,

      moderation_note:
        row.moderation_note ??
        null,

      front_page_pinned:
        Boolean(
          row.front_page_pinned
        ),

      front_page_pinned_at:
        row.front_page_pinned_at ??
        null,

      front_page_pinned_by:
        row.front_page_pinned_by ??
        null,

      front_page_visible:
        row.front_page_visible !==
        false,

      display_size:
        row.display_size ===
          "small" ||
        row.display_size ===
          "wide"
          ? row.display_size
          : "large",

      profiles:
        profileMap.get(
          row.user_id
        ) ??
        null,
    })
  ) as unknown as
    PostRecord[];
}


export async function createQuickPost(
  input:
    CreateQuickPostInput,
): Promise<PostRecord> {
  const user =
    await getCurrentUser();

  if (!input.categoryId) {
    throw new Error(
      "Choose a category."
    );
  }

  if (input.tagIds.length > 5) {
    throw new Error(
      "Choose no more than five tags."
    );
  }

  let payload:
    Record<string, unknown>;

  const uploadedImages: Array<{
    imageUrl: string;
    storagePath: string | null;
  }> = [];

  const optionalGif =
    input.gif
      ? getGifFields(input.gif)
      : {};

  if (input.postType === "youtube") {
    const parsed =
      parseYouTubeUrl(input.youtubeUrl);

    if (!parsed) {
      throw new Error(
        "That does not look like a valid YouTube URL."
      );
    }

    payload = {
      user_id: user.id,
      post_type: "youtube",
      category_id: input.categoryId,
      display_size: input.displaySize,
      title: cleanOptionalText(input.title),
      body: cleanOptionalText(input.body),
      youtube_url: parsed.canonicalUrl,
      youtube_id: parsed.youtubeId,
      video_type: parsed.videoType,
      image_url: null,
      ...optionalGif,
      published: true,
    };
  } else if (input.postType === "text") {
    const title = input.title.trim();
    const body = input.body.trim();

    if (!title) {
      throw new Error(
        "Give the post a title."
      );
    }

    if (title.length > 180) {
      throw new Error(
        "Titles are limited to 180 characters."
      );
    }

    if (!body) {
      throw new Error(
        "Write something first."
      );
    }

    if (body.length > 1500) {
      throw new Error(
        "Posts are limited to 1500 characters."
      );
    }

    payload = {
      user_id: user.id,
      post_type: "text",
      category_id: input.categoryId,
      display_size: input.displaySize,
      title,
      body,
      youtube_url: null,
      youtube_id: null,
      video_type: null,
      image_url: null,
      ...optionalGif,
      published: true,
    };
  } else {
    const files =
      input.images?.length
        ? input.images
        : input.image
          ? [input.image]
          : [];

    if (files.length > 10) {
      throw new Error(
        "Image posts are limited to 10 images."
      );
    }

    try {
      for (const file of files) {
        uploadedImages.push(
          await uploadPostImage(
            user.id,
            file
          )
        );
      }
    } catch (uploadError) {
      await removeStoredImages(
        uploadedImages
          .map((image) => image.storagePath)
          .filter((path): path is string => Boolean(path))
      );
      throw uploadError;
    }

    if (
      uploadedImages.length === 0 &&
      input.mainGif
    ) {
      uploadedImages.push({
        imageUrl: input.mainGif.url,
        storagePath: null,
      });
    }

    if (uploadedImages.length === 0) {
      throw new Error(
        "Pick at least one image or choose a GIF from GIPHY."
      );
    }

    payload = {
      user_id: user.id,
      post_type: "image",
      category_id: input.categoryId,
      display_size: input.displaySize,
      title: cleanOptionalText(input.title),
      body: cleanOptionalText(input.body),
      youtube_url: null,
      youtube_id: null,
      video_type: null,
      image_url: uploadedImages[0].imageUrl,
      ...optionalGif,
      published: true,
    };
  }

  const { data, error } =
    await supabase
      .from("posts")
      .insert(payload)
      .select("*")
      .single();

  if (error) {
    await removeStoredImages(
      uploadedImages
        .map((image) => image.storagePath)
        .filter((path): path is string => Boolean(path))
    );

    if (
      error.code === "23514" &&
      /posts_content_check/i.test(
        error.message ?? ""
      )
    ) {
      throw new Error(
        input.postType === "text"
          ? "That text post does not match the site's content rules. Make sure it has a body and stays within the allowed text length."
          : "That post is missing content required for its post type."
      );
    }

    throw error;
  }

  try {
    if (input.postType === "image") {
      await setPostImages(
        data.id,
        uploadedImages
      );
    }

    const { error: taxonomyError } =
      await supabase.rpc(
        "set_post_tags",
        {
          target_post: data.id,
          tag_ids: input.tagIds,
        }
      );

    if (taxonomyError) {
      throw taxonomyError;
    }
  } catch (postSetupError) {
    await supabase
      .from("posts")
      .delete()
      .eq("id", data.id)
      .eq("user_id", user.id);

    await removeStoredImages(
      uploadedImages
        .map((image) => image.storagePath)
        .filter((path): path is string => Boolean(path))
    );

    throw postSetupError;
  }

  const profiled =
    await attachProfiles([
      data as Record<string, any>,
    ]);

  const withImages =
    await attachPostImages(profiled);

  const attached =
    await attachTaxonomy(withImages);

  return {
    ...attached[0],
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  };
}


/* ==========================================================
   READ FEED
   ========================================================== */


export async function getFeedPosts() {
  const {
    data,
    error,
  } =
    await supabase
      .from("posts")
      .select("*")
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(50);


  if (error) {
    console.error(
      "UNFILTERED LOGS POSTS QUERY ERROR:",
      {
        message:
          error.message,

        code:
          error.code,

        details:
          error.details,

        hint:
          error.hint,
      }
    );

    throw error;
  }


  const profiledRecords =
    await attachProfiles(
      (
        data ??
        []
      ) as
        Array<
          Record<string, any>
        >
    );

  const withImages =
    await attachPostImages(
      profiledRecords
    );

  const records =
    await attachTaxonomy(
      withImages
    );

  const mainFeedRecords =
    records.filter(
      (
        post
      ) =>
        post.moderation_status !==
          "rejected"
    );

  return attachPostEngagement(
    mainFeedRecords
  );
}



/* ==========================================================
   READ ONE POST
   Used by /posts/:id
   ========================================================== */


export async function getPostById(
  postId:
    string,
):
Promise<
  PostRecord | null
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "posts"
      )
      .select(
        "*"
      )
      .eq(
        "id",
        postId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }


  const profiledRecords =
    await attachProfiles([
      data as
        Record<
          string,
          any
        >,
    ]);


  const withImages =
    await attachPostImages(
      profiledRecords
    );

  const attachedRecords =
    await attachTaxonomy(
      withImages
    );


  const visibleRecords =
    attachedRecords.filter(
      (
        post
      ) =>
        post.moderation_status !==
          "rejected"
    );


  if (
    visibleRecords.length ===
    0
  ) {
    return null;
  }


  const engaged =
    await attachPostEngagement(
      visibleRecords
    );


  return (
    engaged[0] ??
    null
  );
}



/* ==========================================================
   EDIT POST
   ========================================================== */


export async function updatePost(
  input:
    EditPostInput,
): Promise<PostRecord> {
  const user =
    await getCurrentUser();

  if (!input.categoryId) {
    throw new Error(
      "Choose a category."
    );
  }

  if (input.tagIds.length > 5) {
    throw new Error(
      "Choose no more than five tags."
    );
  }

  let youtubeUrl: string | null = null;
  let youtubeId: string | null = null;
  let videoType: string | null = null;
  let imageUrl = input.currentImageUrl ?? null;

  const newlyUploaded: Array<{
    imageUrl: string;
    storagePath: string | null;
  }> = [];

  let finalImages: Array<{
    imageUrl: string;
    storagePath: string | null;
  }> = [];

  let previousStoredPaths: string[] = [];

  if (input.postType === "youtube") {
    const parsed =
      parseYouTubeUrl(input.youtubeUrl ?? "");

    if (!parsed) {
      throw new Error(
        "That does not look like a valid YouTube URL."
      );
    }

    youtubeUrl = parsed.canonicalUrl;
    youtubeId = parsed.youtubeId;
    videoType = parsed.videoType;
  }

  if (input.postType === "text") {
    if (!input.title?.trim()) {
      throw new Error(
        "Give the post a title."
      );
    }

    if (!input.body?.trim()) {
      throw new Error(
        "Write something first."
      );
    }

    if (input.body.trim().length > 1500) {
      throw new Error(
        "Posts are limited to 1500 characters."
      );
    }
  }

  if (input.postType === "image") {
    const submittedImages =
      input.images ??
      (input.replacementImage
        ? [{ kind: "new" as const, file: input.replacementImage }]
        : input.currentImageUrl
          ? [{
              kind: "existing" as const,
              id: `legacy-${input.postId}`,
              imageUrl: input.currentImageUrl,
              storagePath: null,
            }]
          : []);

    if (submittedImages.length < 1) {
      throw new Error(
        "The image post needs at least one image."
      );
    }

    if (submittedImages.length > 10) {
      throw new Error(
        "Image posts are limited to 10 images."
      );
    }

    const {
      data: previousImages,
      error: previousImagesError,
    } = await supabase
      .from("post_images")
      .select("storage_path")
      .eq("post_id", input.postId);

    if (!previousImagesError) {
      previousStoredPaths =
        (previousImages ?? [])
          .map((row) => row.storage_path as string | null)
          .filter((path): path is string => Boolean(path));
    }

    try {
      for (const image of submittedImages) {
        if (image.kind === "existing") {
          finalImages.push({
            imageUrl: image.imageUrl,
            storagePath: image.storagePath,
          });
        } else {
          const uploaded =
            await uploadPostImage(
              user.id,
              image.file
            );

          newlyUploaded.push(uploaded);
          finalImages.push(uploaded);
        }
      }

      imageUrl = finalImages[0]?.imageUrl ?? null;

      if (!imageUrl) {
        throw new Error(
          "The image post needs at least one image."
        );
      }

      await setPostImages(
        input.postId,
        finalImages
      );
    } catch (galleryError) {
      await removeStoredImages(
        newlyUploaded
          .map((image) => image.storagePath)
          .filter((path): path is string => Boolean(path))
      );

      throw galleryError;
    }
  }

  const gifFields =
    input.gif
      ? getGifFields(input.gif)
      : {
          gif_id: null,
          gif_url: null,
          gif_preview_url: null,
        };

  const { error } =
    await supabase.rpc(
      "edit_post",
      {
        target_post: input.postId,
        new_title: cleanOptionalText(input.title),
        new_body: cleanOptionalText(input.body),
        new_youtube_url: youtubeUrl,
        new_youtube_id: youtubeId,
        new_video_type: videoType,
        new_image_url: imageUrl,
        new_category_id: input.categoryId,
        new_tag_ids: input.tagIds,
        new_gif_id: gifFields.gif_id,
        new_gif_url: gifFields.gif_url,
        new_gif_preview_url: gifFields.gif_preview_url,
      }
    );

  if (error) {
    throw error;
  }

  const { error: displaySizeError } =
    await supabase.rpc(
      "set_post_display_size",
      {
        target_post: input.postId,
        new_display_size: input.displaySize,
      }
    );

  if (displaySizeError) {
    throw displaySizeError;
  }

  if (input.postType === "image") {
    const keptPaths = new Set(
      finalImages
        .map((image) => image.storagePath)
        .filter((path): path is string => Boolean(path))
    );

    await removeStoredImages(
      previousStoredPaths.filter(
        (path) => !keptPaths.has(path)
      )
    );
  }

  const updated =
    await getPostById(
      input.postId
    );

  if (!updated) {
    throw new Error(
      "The post was updated, but UNFILTERED LOGS could not reload it."
    );
  }

  return updated;
}


/* ==========================================================
   DELETE POST
   ========================================================== */


export async function deletePost(
  postId: string,
) {
  const { data: imageRows } =
    await supabase
      .from("post_images")
      .select("storage_path")
      .eq("post_id", postId);

  const { error } =
    await supabase.rpc(
      "delete_post",
      {
        target_post: postId,
      }
    );

  if (error) {
    throw error;
  }

  await removeStoredImages(
    (imageRows ?? [])
      .map((row) => row.storage_path as string | null)
      .filter((path): path is string => Boolean(path))
  );
}


/* ==========================================================
   FRONT PAGE PIN
   Admin only. Enforced by database RPC.
   ========================================================== */


export async function setFrontPagePin(
  postId: string,
  pinned: boolean,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_set_front_page_pin",
      {
        target_post:
          postId,

        pinned,
      }
    );

  if (error) {
    throw error;
  }
}



/* ==========================================================
   FRONT PAGE VISIBILITY
   Admin only. Enforced by database RPC.
   ========================================================== */


export async function setFrontPageVisibility(
  postId: string,
  visible: boolean,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_set_front_page_visibility",
      {
        target_post:
          postId,

        visible,
      }
    );

  if (error) {
    throw error;
  }
}

import { supabase } from "../lib/supabase";

import type {
  PostRecord,
} from "../types/post";


/* ==========================================================
   UNFILTERED LOG
   POST ENGAGEMENT
   Likes + Comments + YouTube Gems
   ========================================================== */


export type YouTubeGem = {
  id: string;
  title: string;
  youtubeId: string;

  likeCount: number;
  commentCount: number;
  engagementScore: number;
};


function withZeroEngagement(
  posts:
    PostRecord[],
) {
  return posts.map(
    (
      post
    ) => ({
      ...post,

      like_count:
        post.like_count ??
        0,

      comment_count:
        post.comment_count ??
        0,

      liked_by_me:
        post.liked_by_me ??
        false,
    })
  );
}


export async function attachPostEngagement(
  posts:
    PostRecord[],
): Promise<PostRecord[]> {
  if (
    posts.length === 0
  ) {
    return [];
  }

  const postIds =
    posts.map(
      (
        post
      ) =>
        post.id
    );

  const [
    likesResult,
    commentsResult,
    sessionResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "post_likes"
        )
        .select(
          "post_id, user_id"
        )
        .in(
          "post_id",
          postIds
        ),

      supabase
        .from(
          "post_comments"
        )
        .select(
          "post_id"
        )
        .in(
          "post_id",
          postIds
        ),

      supabase.auth
        .getSession(),
    ]);


  if (
    likesResult.error ||
    commentsResult.error
  ) {
    const issue =
      likesResult.error ??
      commentsResult.error;

    console.warn(
      "UNFILTERED LOG ENGAGEMENT TABLES NOT READY:",
      issue
    );

    return withZeroEngagement(
      posts
    );
  }


  const currentUserId =
    sessionResult.data
      .session
      ?.user.id ??
    null;

  const likeCounts =
    new Map<
      string,
      number
    >();

  const commentCounts =
    new Map<
      string,
      number
    >();

  const likedByMe =
    new Set<string>();


  for (
    const like
    of likesResult.data ??
    []
  ) {
    likeCounts.set(
      like.post_id,
      (
        likeCounts.get(
          like.post_id
        ) ??
        0
      ) + 1
    );

    if (
      currentUserId &&
      like.user_id ===
        currentUserId
    ) {
      likedByMe.add(
        like.post_id
      );
    }
  }


  for (
    const comment
    of commentsResult.data ??
    []
  ) {
    commentCounts.set(
      comment.post_id,
      (
        commentCounts.get(
          comment.post_id
        ) ??
        0
      ) + 1
    );
  }


  return posts.map(
    (
      post
    ) => ({
      ...post,

      like_count:
        likeCounts.get(
          post.id
        ) ??
        0,

      comment_count:
        commentCounts.get(
          post.id
        ) ??
        0,

      liked_by_me:
        likedByMe.has(
          post.id
        ),
    })
  );
}


export async function togglePostLike(
  postId: string,
  currentlyLiked:
    boolean,
) {
  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth
      .getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "Sign in to like posts."
    );
  }


  if (currentlyLiked) {
    const {
      error,
    } =
      await supabase
        .from(
          "post_likes"
        )
        .delete()
        .eq(
          "post_id",
          postId
        )
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      throw error;
    }

    return false;
  }


  const {
    error,
  } =
    await supabase
      .from(
        "post_likes"
      )
      .insert({
        post_id:
          postId,

        user_id:
          user.id,
      });

  if (error) {
    throw error;
  }

  return true;
}


export async function getYouTubeGems(
  limit = 3,
): Promise<YouTubeGem[]> {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "get_youtube_gems",
      {
        result_limit:
          limit,
      }
    );

  if (error) {
    console.warn(
      "UNFILTERED LOG YOUTUBE GEMS ERROR:",
      error
    );

    return [];
  }


  return (
    data ??
    []
  ).map(
    (
      row:
        Record<string, any>
    ) => ({
      id:
        row.post_id,

      title:
        row.title ??
        "YouTube video",

      youtubeId:
        row.youtube_id,

      likeCount:
        Number(
          row.like_count ??
          0
        ),

      commentCount:
        Number(
          row.comment_count ??
          0
        ),

      engagementScore:
        Number(
          row.engagement_score ??
          0
        ),
    })
  );
}

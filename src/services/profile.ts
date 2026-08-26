import {
  supabase,
} from "../lib/supabase";

import {
  normalizeUsername,
  validateUsername,
} from "./auth";

import type {
  ProfileMicrologPost,
  UserPublicProfile,
} from "../types/profile";


/* ==========================================================
   UNFILTEREDLOG
   USER PROFILE / MICROLOG SERVICE
   ========================================================== */


const PROFILE_LOGO_BUCKET =
  "profile-logos";


const MAX_PROFILE_LOGO_BYTES =
  2 * 1024 * 1024;


const ALLOWED_PROFILE_LOGO_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ]);


function mapProfile(
  value:
    Record<
      string,
      unknown
    >,
): UserPublicProfile {
  return {
    id:
      String(
        value.id ??
        ""
      ),

    username:
      String(
        value.username ??
        ""
      ),

    display_name:
      String(
        value.display_name ??
        value.username ??
        ""
      ),

    avatar_url:
      typeof value.avatar_url ===
        "string"
        ? value.avatar_url
        : null,

    username_changed_at:
      typeof value.username_changed_at ===
        "string"
        ? value.username_changed_at
        : null,
  };
}


function mapMicrologPost(
  value:
    Record<
      string,
      unknown
    >,
): ProfileMicrologPost {
  return {
    id:
      String(
        value.id ??
        ""
      ),

    user_id:
      String(
        value.user_id ??
        ""
      ),

    body:
      String(
        value.body ??
        ""
      ),

    created_at:
      String(
        value.created_at ??
        ""
      ),

    updated_at:
      String(
        value.updated_at ??
        value.created_at ??
        ""
      ),
  };
}


export async function getMyProfile():
Promise<UserPublicProfile | null> {
  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, username, display_name, avatar_url, username_changed_at"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProfile(
    data
  );
}


export async function getPublicProfile(
  username:
    string,
):
Promise<UserPublicProfile | null> {
  const cleaned =
    username
      .trim()
      .replace(
        /^@/,
        ""
      );

  if (!cleaned) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, username, display_name, avatar_url, username_changed_at"
      )
      .ilike(
        "username",
        cleaned
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProfile(
    data
  );
}


export async function saveMyProfile(
  username:
    string,

  avatarUrl?:
    string | null,
):
Promise<UserPublicProfile> {
  const normalized =
    normalizeUsername(
      username
    );

  const validation =
    validateUsername(
      normalized
    );

  if (validation) {
    throw new Error(
      validation
    );
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "update_my_public_profile",
      {
        candidate_username:
          normalized,

        candidate_avatar_url:
          avatarUrl ??
          null,
      }
    );

  if (error) {
    throw error;
  }

  const first =
    Array.isArray(
      data
    )
      ? data[0]
      : data;

  if (!first) {
    throw new Error(
      "Profile update did not return a profile."
    );
  }

  return {
    id:
      first.profile_id,

    username:
      first.profile_username,

    display_name:
      first.profile_display_name,

    avatar_url:
      first.profile_avatar_url ??
      null,

    username_changed_at:
      first.profile_username_changed_at ??
      null,
  };
}


export async function uploadMyProfileLogo(
  file:
    File,
):
Promise<string> {
  if (
    !ALLOWED_PROFILE_LOGO_TYPES
      .has(
        file.type
      )
  ) {
    throw new Error(
      "Profile logos must be PNG, JPG, WEBP, or GIF."
    );
  }

  if (
    file.size >
    MAX_PROFILE_LOGO_BYTES
  ) {
    throw new Error(
      "Profile logos must be 2 MB or smaller."
    );
  }

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    throw new Error(
      "Sign in before uploading a profile logo."
    );
  }

  const path =
    `${user.id}/profile-logo`;

  const {
    error,
  } =
    await supabase.storage
      .from(
        PROFILE_LOGO_BUCKET
      )
      .upload(
        path,
        file,
        {
          upsert:
            true,

          contentType:
            file.type,

          cacheControl:
            "3600",
        }
      );

  if (error) {
    throw error;
  }

  const {
    data,
  } =
    supabase.storage
      .from(
        PROFILE_LOGO_BUCKET
      )
      .getPublicUrl(
        path
      );

  return `${data.publicUrl}?v=${Date.now()}`;
}


export async function getProfileMicrologPosts(
  userId:
    string,

  limit =
    50,
):
Promise<ProfileMicrologPost[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .select(
        "id, user_id, body, created_at, updated_at"
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(
        limit
      );

  if (error) {
    throw error;
  }

  return (
    data ??
    []
  ).map(
    (
      row
    ) =>
      mapMicrologPost(
        row
      )
  );
}


export async function getProfileMicrologPost(
  postId:
    string,
):
Promise<ProfileMicrologPost | null> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .select(
        "id, user_id, body, created_at, updated_at"
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

  return mapMicrologPost(
    data
  );
}


export async function createProfileMicrologPost(
  body:
    string,
):
Promise<ProfileMicrologPost> {
  const cleaned =
    body.trim();

  if (!cleaned) {
    throw new Error(
      "Write something first."
    );
  }

  if (
    cleaned.length >
    280
  ) {
    throw new Error(
      "Microlog posts are limited to 280 characters."
    );
  }

  const {
    data: {
      user,
    },
  } =
    await supabase.auth
      .getUser();

  if (!user) {
    throw new Error(
      "Sign in before posting."
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .insert({
        user_id:
          user.id,

        body:
          cleaned,
      })
      .select(
        "id, user_id, body, created_at, updated_at"
      )
      .single();

  if (error) {
    throw error;
  }

  return mapMicrologPost(
    data
  );
}


export async function deleteProfileMicrologPost(
  postId:
    string,
) {
  const {
    error,
  } =
    await supabase
      .from(
        "profile_posts"
      )
      .delete()
      .eq(
        "id",
        postId
      );

  if (error) {
    throw error;
  }
}

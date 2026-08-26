import { supabase } from "../lib/supabase";


/* ==========================================================
   UNFILTERED LOGS
   PUBLIC SITE STATS
   ========================================================== */


export type PublicSiteStats = {
  totalUsers: number;
  totalPosts: number;
  latestMember: string | null;
};


export async function getPublicSiteStats():
Promise<PublicSiteStats> {
  const [
    usersResult,
    postsResult,
    latestMemberResult,
  ] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        ),

      supabase
        .from("posts")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "published",
          true
        )
        .eq(
          "moderation_status",
          "approved"
        ),

      supabase
        .from("profiles")
        .select(
          "username, display_name, created_at"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle(),
    ]);


  if (usersResult.error) {
    throw usersResult.error;
  }

  if (postsResult.error) {
    throw postsResult.error;
  }

  if (latestMemberResult.error) {
    throw latestMemberResult.error;
  }


  const latestMember =
    latestMemberResult.data
      ?.username
      ?.trim() ||
    latestMemberResult.data
      ?.display_name
      ?.trim() ||
    null;


  return {
    totalUsers:
      usersResult.count ??
      0,

    totalPosts:
      postsResult.count ??
      0,

    latestMember,
  };
}

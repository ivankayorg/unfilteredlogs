import {
  supabase,
} from "../lib/supabase";


/* ==========================================================
   UNFILTEREDLOG
   HOMEPAGE RIGHT SIDEBAR SETTINGS
   ========================================================== */


export const DEFAULT_SIDEBAR_ORDER = [
  "welcome",
  "shoutbox",
  "online",
  "recent_comments",
  "editorial",
  "popular",
  "youtube_gems",
  "categories",
  "tags",
  "archives",
  "stats",
] as const;


export const DEFAULT_WELCOME_BODY =
  "A community blog for videos, GIFs, stories, images, links, and whatever else somebody thought was worth sharing.";


export const DEFAULT_WELCOME_NOTE =
  "No algorithmic feed. The front page is picked by humans.";


export type SidebarModuleKey =
  typeof DEFAULT_SIDEBAR_ORDER[number];


export type PromotedSidebarMember = {
  id: string;

  username: string;

  displayName: string;

  avatarUrl:
    string | null;
};


export type SidebarSettings = {
  moduleOrder:
    SidebarModuleKey[];

  welcomeBody:
    string;

  welcomeNote:
    string;

  promotedUserId:
    string | null;

  promotedMemberNote:
    string;

  promotedMember:
    PromotedSidebarMember | null;
};


function normalizeOrder(
  value:
    unknown,
):
SidebarModuleKey[] {
  const incoming =
    Array.isArray(
      value
    )
      ? value
      : [];

  const valid =
    incoming.filter(
      (
        item
      ):
        item is
          SidebarModuleKey =>
        typeof item ===
          "string" &&
        DEFAULT_SIDEBAR_ORDER.includes(
          item as
            SidebarModuleKey
        )
    );

  const unique =
    Array.from(
      new Set(
        valid
      )
    );

  for (
    const key of
    DEFAULT_SIDEBAR_ORDER
  ) {
    if (
      !unique.includes(
        key
      )
    ) {
      unique.push(
        key
      );
    }
  }

  return unique;
}


function cleanText(
  value:
    unknown,

  fallback:
    string,
) {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  const cleaned =
    value.trim();

  return (
    cleaned ||
    fallback
  );
}


function mapPromotedMember(
  value:
    Record<
      string,
      unknown
    >,
):
PromotedSidebarMember {
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

    displayName:
      String(
        value.display_name ??
        value.username ??
        ""
      ),

    avatarUrl:
      typeof value.avatar_url ===
        "string"
        ? value.avatar_url
        : null,
  };
}


async function getPromotedMemberById(
  id:
    string | null,
):
Promise<
  PromotedSidebarMember | null
> {
  if (!id) {
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
        "id, username, display_name, avatar_url"
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapPromotedMember(
    data
  );
}


export async function getPromotableSidebarMembers():
Promise<
  PromotedSidebarMember[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "id, username, display_name, avatar_url"
      )
      .not(
        "username",
        "is",
        null
      )
      .order(
        "username",
        {
          ascending:
            true,
        }
      );

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ).map(
    (
      value
    ) =>
      mapPromotedMember(
        value
      )
  );
}


export async function getSidebarSettings():
Promise<
  SidebarSettings
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "site_sidebar_settings"
      )
      .select(
        "module_order, welcome_body, welcome_note, promoted_user_id, promoted_user_note"
      )
      .eq(
        "id",
        "home"
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  const promotedUserId =
    typeof data
      ?.promoted_user_id ===
      "string"
      ? data.promoted_user_id
      : null;

  return {
    moduleOrder:
      normalizeOrder(
        data?.module_order
      ),

    welcomeBody:
      cleanText(
        data?.welcome_body,
        DEFAULT_WELCOME_BODY
      ),

    welcomeNote:
      cleanText(
        data?.welcome_note,
        DEFAULT_WELCOME_NOTE
      ),

    promotedUserId,

    promotedMemberNote:
      typeof data
        ?.promoted_user_note ===
        "string"
        ? data.promoted_user_note
        : "",

    promotedMember:
      await getPromotedMemberById(
        promotedUserId
      ),
  };
}


export async function getSidebarOrder():
Promise<
  SidebarModuleKey[]
> {
  const settings =
    await getSidebarSettings();

  return settings.moduleOrder;
}


export async function saveSidebarSettings(
  settings:
    Pick<
      SidebarSettings,
      | "moduleOrder"
      | "welcomeBody"
      | "welcomeNote"
      | "promotedUserId"
      | "promotedMemberNote"
    >,
) {
  const normalized =
    normalizeOrder(
      settings.moduleOrder
    );

  const welcomeBody =
    cleanText(
      settings.welcomeBody,
      DEFAULT_WELCOME_BODY
    );

  const welcomeNote =
    cleanText(
      settings.welcomeNote,
      DEFAULT_WELCOME_NOTE
    );

  const promotedUserId =
    settings.promotedUserId
      ?.trim() ||
    null;

  const promotedMemberNote =
    settings.promotedMemberNote
      .trim()
      .slice(
        0,
        500
      );

  const {
    error,
  } =
    await supabase
      .from(
        "site_sidebar_settings"
      )
      .upsert(
        {
          id:
            "home",

          module_order:
            normalized,

          welcome_body:
            welcomeBody,

          welcome_note:
            welcomeNote,

          promoted_user_id:
            promotedUserId,

          promoted_user_note:
            promotedMemberNote,

          updated_at:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "id",
        }
      );

  if (error) {
    throw error;
  }

  return {
    moduleOrder:
      normalized,

    welcomeBody,

    welcomeNote,

    promotedUserId,

    promotedMemberNote,

    promotedMember:
      await getPromotedMemberById(
        promotedUserId
      ),
  } satisfies
    SidebarSettings;
}


export async function saveSidebarOrder(
  moduleOrder:
    SidebarModuleKey[],
) {
  const current =
    await getSidebarSettings();

  const saved =
    await saveSidebarSettings({
      ...current,

      moduleOrder,
    });

  return saved.moduleOrder;
}

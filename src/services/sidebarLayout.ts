import { supabase } from "../lib/supabase";

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

export type SidebarSettings = {
  moduleOrder: SidebarModuleKey[];
  welcomeBody: string;
  welcomeNote: string;
};

function normalizeOrder(value: unknown): SidebarModuleKey[] {
  const incoming = Array.isArray(value) ? value : [];
  const valid = incoming.filter(
    (item): item is SidebarModuleKey =>
      typeof item === "string" &&
      DEFAULT_SIDEBAR_ORDER.includes(item as SidebarModuleKey)
  );

  const unique = Array.from(new Set(valid));

  for (const key of DEFAULT_SIDEBAR_ORDER) {
    if (!unique.includes(key)) unique.push(key);
  }

  return unique;
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned || fallback;
}

export async function getSidebarSettings(): Promise<SidebarSettings> {
  const { data, error } =
    await supabase
      .from("site_sidebar_settings")
      .select("module_order, welcome_body, welcome_note")
      .eq("id", "home")
      .maybeSingle();

  if (error) throw error;

  return {
    moduleOrder: normalizeOrder(data?.module_order),
    welcomeBody: cleanText(data?.welcome_body, DEFAULT_WELCOME_BODY),
    welcomeNote: cleanText(data?.welcome_note, DEFAULT_WELCOME_NOTE),
  };
}

export async function getSidebarOrder(): Promise<SidebarModuleKey[]> {
  const settings = await getSidebarSettings();
  return settings.moduleOrder;
}

export async function saveSidebarSettings(settings: SidebarSettings) {
  const normalized = normalizeOrder(settings.moduleOrder);
  const welcomeBody = cleanText(settings.welcomeBody, DEFAULT_WELCOME_BODY);
  const welcomeNote = cleanText(settings.welcomeNote, DEFAULT_WELCOME_NOTE);

  const { error } =
    await supabase
      .from("site_sidebar_settings")
      .upsert(
        {
          id: "home",
          module_order: normalized,
          welcome_body: welcomeBody,
          welcome_note: welcomeNote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

  if (error) throw error;

  return {
    moduleOrder: normalized,
    welcomeBody,
    welcomeNote,
  } satisfies SidebarSettings;
}

export async function saveSidebarOrder(moduleOrder: SidebarModuleKey[]) {
  const current = await getSidebarSettings();
  const saved = await saveSidebarSettings({
    ...current,
    moduleOrder,
  });
  return saved.moduleOrder;
}

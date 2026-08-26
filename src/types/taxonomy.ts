/* ==========================================================
   UNFILTERED LOGS
   CATEGORIES + TAGS
   ========================================================== */


export type PostCategory = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
};


export type PostTag = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
};


export type PostTaxonomy = {
  categories:
    PostCategory[];

  tags:
    PostTag[];
};


export type PostCategoryReference = {
  id: string;
  name: string;
  slug: string;
};


export type PostTagReference = {
  id: string;
  name: string;
  slug: string;
};

import {
  supabase,
} from "../lib/supabase";

import type {
  PostCategory,
  PostTag,
  PostTaxonomy,
} from "../types/taxonomy";


/* ==========================================================
   UNFILTERED LOGS
   TAXONOMY SERVICE
   ========================================================== */


function sortTaxonomy<
  T extends {
    sort_order:
      number;
    name: string;
  }
>(
  rows: T[],
) {
  return rows.sort(
    (
      left,
      right
    ) =>
      left.sort_order -
        right.sort_order ||
      left.name.localeCompare(
        right.name
      )
  );
}


export async function getActiveTaxonomy():
Promise<PostTaxonomy> {
  const [
    categoriesResult,
    tagsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "post_categories"
        )
        .select(
          "id, name, slug, active, sort_order"
        )
        .eq(
          "active",
          true
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "name",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "tags"
        )
        .select(
          "id, name, slug, active, sort_order"
        )
        .eq(
          "active",
          true
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "name",
          {
            ascending:
              true,
          }
        ),
    ]);


  if (
    categoriesResult.error
  ) {
    throw categoriesResult.error;
  }

  if (
    tagsResult.error
  ) {
    throw tagsResult.error;
  }


  return {
    categories:
      sortTaxonomy(
        (
          categoriesResult.data ??
          []
        ) as
          PostCategory[]
      ),

    tags:
      sortTaxonomy(
        (
          tagsResult.data ??
          []
        ) as
          PostTag[]
      ),
  };
}


export async function getAllTaxonomy():
Promise<PostTaxonomy> {
  const [
    categoriesResult,
    tagsResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "post_categories"
        )
        .select(
          "id, name, slug, active, sort_order"
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "name",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "tags"
        )
        .select(
          "id, name, slug, active, sort_order"
        )
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "name",
          {
            ascending:
              true,
          }
        ),
    ]);


  if (
    categoriesResult.error
  ) {
    throw categoriesResult.error;
  }

  if (
    tagsResult.error
  ) {
    throw tagsResult.error;
  }


  return {
    categories:
      sortTaxonomy(
        (
          categoriesResult.data ??
          []
        ) as
          PostCategory[]
      ),

    tags:
      sortTaxonomy(
        (
          tagsResult.data ??
          []
        ) as
          PostTag[]
      ),
  };
}


export async function createTaxonomyItem(
  kind:
    "category"
    | "tag",
  name: string,
) {
  const cleaned =
    name.trim();

  if (!cleaned) {
    throw new Error(
      "Give it a name."
    );
  }

  const {
    error,
  } =
    await supabase.rpc(
      "admin_create_taxonomy",
      {
        item_kind:
          kind,

        item_name:
          cleaned,
      }
    );

  if (error) {
    throw error;
  }
}


export async function updateTaxonomyItem(
  kind:
    "category"
    | "tag",
  id: string,
  name: string,
  active: boolean,
) {
  const cleaned =
    name.trim();

  if (!cleaned) {
    throw new Error(
      "The name cannot be empty."
    );
  }

  const {
    error,
  } =
    await supabase.rpc(
      "admin_update_taxonomy",
      {
        item_kind:
          kind,

        item_id:
          id,

        new_name:
          cleaned,

        new_active:
          active,
      }
    );

  if (error) {
    throw error;
  }
}


export async function deleteTaxonomyItem(
  kind:
    "category"
    | "tag",
  id: string,
) {
  const {
    error,
  } =
    await supabase.rpc(
      "admin_delete_taxonomy",
      {
        item_kind:
          kind,

        item_id:
          id,
      }
    );

  if (error) {
    throw error;
  }
}

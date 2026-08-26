import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  getAllTaxonomy,
  updateTaxonomyItem,
} from "../../services/taxonomy";

import type {
  PostCategory,
  PostTag,
} from "../../types/taxonomy";


/* ==========================================================
   UNFILTERED LOGS ADMIN
   CATEGORIES + TAGS
   ========================================================== */


type EditableCategory =
  PostCategory;

type EditableTag =
  PostTag;


type TaxonomyKind =
  | "category"
  | "tag";


export default function TaxonomyManager() {
  const [
    categories,
    setCategories,
  ] =
    useState<EditableCategory[]>(
      []
    );

  const [
    tags,
    setTags,
  ] =
    useState<EditableTag[]>(
      []
    );

  const [
    newCategory,
    setNewCategory,
  ] =
    useState("");

  const [
    newTag,
    setNewTag,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    working,
    setWorking,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  const activeCategories =
    useMemo(
      () =>
        categories.filter(
          (
            category
          ) =>
            category.active
        ),
      [
        categories,
      ]
    );


  const inactiveCategories =
    useMemo(
      () =>
        categories.filter(
          (
            category
          ) =>
            !category.active
        ),
      [
        categories,
      ]
    );


  const activeTags =
    useMemo(
      () =>
        tags.filter(
          (
            tag
          ) =>
            tag.active
        ),
      [
        tags,
      ]
    );


  const inactiveTags =
    useMemo(
      () =>
        tags.filter(
          (
            tag
          ) =>
            !tag.active
        ),
      [
        tags,
      ]
    );


  const load =
    async () => {
      setLoading(
        true
      );

      setError(
        null
      );

      try {
        const taxonomy =
          await getAllTaxonomy();

        setCategories(
          taxonomy.categories
        );

        setTags(
          taxonomy.tags
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load categories and tags."
        );
      } finally {
        setLoading(
          false
        );
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const create =
    async (
      kind:
        TaxonomyKind,
    ) => {
      const name =
        kind ===
          "category"
          ? newCategory
          : newTag;

      setWorking(
        `new-${kind}`
      );

      setError(
        null
      );

      try {
        await createTaxonomyItem(
          kind,
          name
        );

        if (
          kind ===
          "category"
        ) {
          setNewCategory(
            ""
          );
        } else {
          setNewTag(
            ""
          );
        }

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not create taxonomy item."
        );
      } finally {
        setWorking(
          null
        );
      }
    };


  const saveItem =
    async (
      kind:
        TaxonomyKind,
      item:
        EditableCategory |
        EditableTag,
    ) => {
      setWorking(
        item.id
      );

      setError(
        null
      );

      try {
        await updateTaxonomyItem(
          kind,
          item.id,
          item.name,
          item.active
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not save taxonomy item."
        );
      } finally {
        setWorking(
          null
        );
      }
    };


  const setActive =
    async (
      kind:
        TaxonomyKind,
      item:
        EditableCategory |
        EditableTag,
      active:
        boolean,
    ) => {
      setWorking(
        item.id
      );

      setError(
        null
      );

      try {
        await updateTaxonomyItem(
          kind,
          item.id,
          item.name,
          active
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : active
              ? "Could not reactivate taxonomy item."
              : "Could not deactivate taxonomy item."
        );
      } finally {
        setWorking(
          null
        );
      }
    };


  const remove =
    async (
      kind:
        TaxonomyKind,
      item:
        EditableCategory |
        EditableTag,
    ) => {
      const label =
        kind ===
          "category"
          ? "category"
          : "article tag";

      const warning =
        kind ===
          "category"
          ? `Permanently delete the category "${item.name}"?\n\nExisting posts will remain, but this category assignment will be removed from them.`
          : `Permanently delete the article tag "${item.name}"?\n\nExisting posts will remain, but this tag will be removed from them.`;

      if (
        !window.confirm(
          warning
        )
      ) {
        return;
      }

      setWorking(
        item.id
      );

      setError(
        null
      );

      try {
        await deleteTaxonomyItem(
          kind,
          item.id
        );

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : `Could not delete ${label}.`
        );
      } finally {
        setWorking(
          null
        );
      }
    };


  const updateCategoryName =
    (
      id:
        string,
      value:
        string,
    ) => {
      setCategories(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
                id
                ? {
                    ...item,

                    name:
                      value,
                  }
                : item
          )
      );
    };


  const updateTagName =
    (
      id:
        string,
      value:
        string,
    ) => {
      setTags(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
                id
                ? {
                    ...item,

                    name:
                      value,
                  }
                : item
          )
      );
    };


  const renderCategory =
    (
      category:
        EditableCategory,
    ) => (
      <div
        className={
          category.active
            ? "taxonomy-item"
            : "taxonomy-item inactive"
        }
        key={
          category.id
        }
      >
        <input
          value={
            category.name
          }
          maxLength={48}
          disabled={
            working ===
            category.id
          }
          onChange={
            (
              event
            ) => {
              updateCategoryName(
                category.id,
                event.target.value
              );
            }
          }
        />

        <button
          className="taxonomy-rename-save"
          type="button"
          title="Save name"
          aria-label="Save category name"
          disabled={
            working ===
            category.id
          }
          onClick={() => {
            void saveItem(
              "category",
              category
            );
          }}
        >
          <Save
            size={12}
          />
        </button>

        <button
          className={
            category.active
              ? "taxonomy-state active"
              : "taxonomy-state inactive"
          }
          type="button"
          title={
            category.active
              ? "Deactivate category"
              : "Reactivate category"
          }
          aria-label={
            category.active
              ? "Deactivate category"
              : "Reactivate category"
          }
          disabled={
            working ===
            category.id
          }
          onClick={() => {
            void setActive(
              "category",
              category,
              !category.active
            );
          }}
        >
          {category.active
            ? (
              <Check
                size={13}
              />
            )
            : (
              <X
                size={13}
              />
            )}
        </button>

        <button
          className="taxonomy-delete"
          type="button"
          title="Permanently delete category"
          aria-label="Permanently delete category"
          disabled={
            working ===
            category.id
          }
          onClick={() => {
            void remove(
              "category",
              category
            );
          }}
        >
          <Trash2
            size={12}
          />
        </button>
      </div>
    );


  const renderTag =
    (
      tag:
        EditableTag,
    ) => (
      <div
        className={
          tag.active
            ? "taxonomy-item"
            : "taxonomy-item inactive"
        }
        key={
          tag.id
        }
      >
        <input
          value={
            tag.name
          }
          maxLength={48}
          disabled={
            working ===
            tag.id
          }
          onChange={
            (
              event
            ) => {
              updateTagName(
                tag.id,
                event.target.value
              );
            }
          }
        />

        <button
          className="taxonomy-rename-save"
          type="button"
          title="Save name"
          aria-label="Save article tag name"
          disabled={
            working ===
            tag.id
          }
          onClick={() => {
            void saveItem(
              "tag",
              tag
            );
          }}
        >
          <Save
            size={12}
          />
        </button>

        <button
          className={
            tag.active
              ? "taxonomy-state active"
              : "taxonomy-state inactive"
          }
          type="button"
          title={
            tag.active
              ? "Deactivate article tag"
              : "Reactivate article tag"
          }
          aria-label={
            tag.active
              ? "Deactivate article tag"
              : "Reactivate article tag"
          }
          disabled={
            working ===
            tag.id
          }
          onClick={() => {
            void setActive(
              "tag",
              tag,
              !tag.active
            );
          }}
        >
          {tag.active
            ? (
              <Check
                size={13}
              />
            )
            : (
              <X
                size={13}
              />
            )}
        </button>

        <button
          className="taxonomy-delete"
          type="button"
          title="Permanently delete article tag"
          aria-label="Permanently delete article tag"
          disabled={
            working ===
            tag.id
          }
          onClick={() => {
            void remove(
              "tag",
              tag
            );
          }}
        >
          <Trash2
            size={12}
          />
        </button>
      </div>
    );


  return (
    <section className="admin-panel taxonomy-admin-panel">
      <header className="admin-panel-header">
        <div>
          <span className="admin-eyebrow">
            CONTROLLED VOCABULARY
          </span>

          <h2>
            Categories & tags
          </h2>
        </div>

        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => {
            void load();
          }}
        >
          <RefreshCw
            size={14}
          />

          Refresh
        </button>
      </header>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          Loading taxonomy...
        </div>
      ) : (
        <div className="taxonomy-admin-grid">
          <section className="taxonomy-admin-column">
            <div className="taxonomy-column-heading">
              <div>
                <strong>
                  Categories
                </strong>

                <span>
                  One category per post
                </span>
              </div>

              <span>
                {activeCategories.length}
                {" active · "}
                {inactiveCategories.length}
                {" deactivated"}
              </span>
            </div>

            <div className="taxonomy-create-row">
              <input
                value={
                  newCategory
                }
                onChange={
                  (
                    event
                  ) => {
                    setNewCategory(
                      event.target.value
                    );
                  }
                }
                placeholder="New category"
                maxLength={48}
              />

              <button
                type="button"
                disabled={
                  !newCategory.trim() ||
                  working ===
                    "new-category"
                }
                onClick={() => {
                  void create(
                    "category"
                  );
                }}
              >
                <Plus
                  size={13}
                />

                Add
              </button>
            </div>

            <div className="taxonomy-state-section">
              <div className="taxonomy-section-heading">
                <strong>
                  Active categories
                </strong>

                <span>
                  {activeCategories.length}
                </span>
              </div>

              <div className="taxonomy-item-list">
                {activeCategories.length ===
                  0 ? (
                  <div className="taxonomy-section-empty">
                    No active categories.
                  </div>
                ) : (
                  activeCategories.map(
                    renderCategory
                  )
                )}
              </div>
            </div>

            <div className="taxonomy-state-section deactivated">
              <div className="taxonomy-section-heading">
                <strong>
                  Deactivated categories
                </strong>

                <span>
                  {inactiveCategories.length}
                </span>
              </div>

              <div className="taxonomy-item-list">
                {inactiveCategories.length ===
                  0 ? (
                  <div className="taxonomy-section-empty">
                    No deactivated categories.
                  </div>
                ) : (
                  inactiveCategories.map(
                    renderCategory
                  )
                )}
              </div>
            </div>
          </section>

          <section className="taxonomy-admin-column">
            <div className="taxonomy-column-heading">
              <div>
                <strong>
                  Article tags
                </strong>

                <span>
                  Users may choose up to five
                </span>
              </div>

              <span>
                {activeTags.length}
                {" active · "}
                {inactiveTags.length}
                {" deactivated"}
              </span>
            </div>

            <div className="taxonomy-create-row">
              <input
                value={
                  newTag
                }
                onChange={
                  (
                    event
                  ) => {
                    setNewTag(
                      event.target.value
                    );
                  }
                }
                placeholder="New tag"
                maxLength={48}
              />

              <button
                type="button"
                disabled={
                  !newTag.trim() ||
                  working ===
                    "new-tag"
                }
                onClick={() => {
                  void create(
                    "tag"
                  );
                }}
              >
                <Plus
                  size={13}
                />

                Add
              </button>
            </div>

            <div className="taxonomy-state-section">
              <div className="taxonomy-section-heading">
                <strong>
                  Active article tags
                </strong>

                <span>
                  {activeTags.length}
                </span>
              </div>

              <div className="taxonomy-item-list">
                {activeTags.length ===
                  0 ? (
                  <div className="taxonomy-section-empty">
                    No active article tags.
                  </div>
                ) : (
                  activeTags.map(
                    renderTag
                  )
                )}
              </div>
            </div>

            <div className="taxonomy-state-section deactivated">
              <div className="taxonomy-section-heading">
                <strong>
                  Deactivated article tags
                </strong>

                <span>
                  {inactiveTags.length}
                </span>
              </div>

              <div className="taxonomy-item-list">
                {inactiveTags.length ===
                  0 ? (
                  <div className="taxonomy-section-empty">
                    No deactivated article tags.
                  </div>
                ) : (
                  inactiveTags.map(
                    renderTag
                  )
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

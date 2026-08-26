import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type Session,
} from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import {
  BookOpen,
  Play,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  ExternalLink,
  EyeOff,
  Flame,
  Hash,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";

import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";
import QuickPostDialog from "./components/posts/QuickPostDialog";
import EditPostDialog from "./components/posts/EditPostDialog";
import PostComments from "./components/posts/PostComments";

import {
  deletePost,
  getFeedPosts,
  setFrontPagePin,
  setFrontPageVisibility,
} from "./services/posts";

import {
  getYouTubeGems,
  togglePostLike,
  type YouTubeGem,
} from "./services/engagement";

import {
  getMyAccess,
} from "./services/admin";

import {
  getShoutboxMessages,
  postShoutboxMessage,
  subscribeToShoutbox,
  type ShoutboxMessage,
} from "./services/shoutbox";

import {
  getRecentComments,
  subscribeToOnlineUsers,
  subscribeToRecentComments,
  type OnlineUser,
  type RecentCommentItem,
} from "./services/communitySidebar";

import {
  DEFAULT_SIDEBAR_ORDER,
  DEFAULT_WELCOME_BODY,
  DEFAULT_WELCOME_NOTE,
  getSidebarSettings,
  type PromotedSidebarMember,
  type SidebarModuleKey,
} from "./services/sidebarLayout";

import {
  getActiveTaxonomy,
} from "./services/taxonomy";

import {
  getHighlightedBlogPost,
} from "./services/blog";

import type {
  UserRole,
} from "./types/admin";

import type {
  BlogPost,
} from "./types/blog";

import type {
  PostDisplaySize,
  PostRecord,
} from "./types/post";

import type {
  PostCategory,
  PostTag,
  PostTagReference,
} from "./types/taxonomy";

import "./AppV2.css";

type PostType =
  | "short"
  | "video"
  | "image"
  | "gallery"
  | "link"
  | "text";


type TimeFilter =
  | "all"
  | "today"
  | "week"
  | "month";


type ContentFilter =
  | "all"
  | "videos"
  | "photos"
  | "discussions";


const POSTS_PER_PAGE =
  10;


type Post = {
  id: number | string;
  userId: string;

  sourceRecord:
    PostRecord;

  title: string;

  author: string;

  authorUsername:
    string | null;

  avatar: string;
  published: string;
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  likedByMe: boolean;
  type: PostType;
  description?: string;
  image?: string;
  youtubeId?: string;
  gifUrl?: string;
  source?: string;
  tag?: string;

  categoryId?:
    string;

  categorySlug?:
    string;

  articleTags:
    PostTagReference[];

  moderationStatus?:
    | "pending"
    | "approved"
    | "rejected";

  frontPagePinned:
    boolean;

  frontPagePinnedAt:
    string | null;

  frontPageVisible:
    boolean;

  displaySize:
    PostDisplaySize;
};

function formatPostDate(
  value: string,
) {
  const date =
    new Date(value);

  return date.toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


function getTextPostBackground(
  postId: string,
) {
  return `https://picsum.photos/seed/unfilteredlogs-${postId}/1200/800`;
}


function mapPostRecord(
  post: PostRecord,
): Post {
  const author =
    post.profiles
      ?.display_name ??
    "UNFILTERED LOGS User";

  const authorUsername =
    post.profiles
      ?.username?.trim() ||
    null;

  const avatar =
    author
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "U";

  if (
    post.post_type ===
    "youtube"
  ) {
    return {
      id:
        post.id,

      userId:
        post.user_id,

      sourceRecord:
        post,

      title:
        post.title ??
        (
          post.video_type ===
          "short"
            ? "YouTube Short"
            : "YouTube video"
        ),

      author,
      authorUsername,
      avatar,

      published:
        formatPostDate(
          post.created_at
        ),

      createdAt:
        post.created_at,

      views: 0,

      likes:
        post.like_count ??
        0,

      comments:
        post.comment_count ??
        0,

      likedByMe:
        post.liked_by_me ??
        false,

      type:
        post.video_type ===
        "short"
          ? "short"
          : "video",

      tag:
        post.category
          ?.name ??
        "VIDEO",

      categoryId:
        post.category
          ?.id,

      categorySlug:
        post.category
          ?.slug,

      articleTags:
        post.tags ??
        [],

      moderationStatus:
        post.moderation_status,

      frontPagePinned:
        Boolean(
          post.front_page_pinned
        ),

      frontPagePinnedAt:
        post.front_page_pinned_at ??
        null,

      frontPageVisible:
        post.front_page_visible !==
        false,

      displaySize:
        post.display_size ??
        "large",

      description:
        post.body ??
        undefined,

      gifUrl:
        post.gif_url ??
        undefined,

      youtubeId:
        post.youtube_id ??
        undefined,

      image:
        post.youtube_id
          ? `https://i.ytimg.com/vi/${post.youtube_id}/hqdefault.jpg`
          : undefined,
    };
  }

  if (
    post.post_type ===
    "image"
  ) {
    return {
      id:
        post.id,

      userId:
        post.user_id,

      sourceRecord:
        post,

      title:
        post.title ??
        "Image post",

      author,
      authorUsername,
      avatar,

      published:
        formatPostDate(
          post.created_at
        ),

      createdAt:
        post.created_at,

      views: 0,

      likes:
        post.like_count ??
        0,

      comments:
        post.comment_count ??
        0,

      likedByMe:
        post.liked_by_me ??
        false,

      type:
        "image",

      tag:
        post.category
          ?.name ??
        "IMAGE",

      categoryId:
        post.category
          ?.id,

      categorySlug:
        post.category
          ?.slug,

      articleTags:
        post.tags ??
        [],

      moderationStatus:
        post.moderation_status,

      frontPagePinned:
        Boolean(
          post.front_page_pinned
        ),

      frontPagePinnedAt:
        post.front_page_pinned_at ??
        null,

      frontPageVisible:
        post.front_page_visible !==
        false,

      displaySize:
        post.display_size ??
        "large",

      description:
        post.body ??
        undefined,

      gifUrl:
        post.gif_url ??
        undefined,

      image:
        post.image_url ??
        undefined,
    };
  }

  return {
    id:
      post.id,

    userId:
      post.user_id,

    sourceRecord:
      post,

    title:
      post.title ??
      "Untitled nonsense",

    author,
    authorUsername,
    avatar,

    published:
      formatPostDate(
        post.created_at
      ),

    createdAt:
      post.created_at,

    views: 0,

    likes:
      post.like_count ??
      0,

    comments:
      post.comment_count ??
      0,

    likedByMe:
      post.liked_by_me ??
      false,

    type:
      "text",

    tag:
      post.category
        ?.name ??
      "TEXT",

    categoryId:
      post.category
        ?.id,

    categorySlug:
      post.category
        ?.slug,

    articleTags:
      post.tags ??
      [],

    moderationStatus:
      post.moderation_status,

    frontPagePinned:
      Boolean(
        post.front_page_pinned
      ),

    frontPagePinnedAt:
      post.front_page_pinned_at ??
      null,

    frontPageVisible:
      post.front_page_visible !==
      false,

    displaySize:
      post.display_size ??
      "large",

    description:
      post.body ??
      undefined,

    gifUrl:
      post.gif_url ??
      undefined,

    image:
      getTextPostBackground(
        post.id
      ),
  };
}


function getPostTypeLabel(post: Post) {
  if (post.type === "short") return "SHORT";
  if (post.type === "video") return "VIDEO";
  if (post.type === "image" || post.type === "gallery") return "IMAGE";
  if (post.type === "link") return "LINK";
  return "TEXT";
}

function MediaStage({ post }: { post: Post }) {
  if (post.type === "short") {
    return post.youtubeId ? (
      <div className="short-stage">
        <iframe
          src={`https://www.youtube.com/embed/${post.youtubeId}?rel=0&modestbranding=1`}
          title={post.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    ) : (
      <div className="media-unavailable">Video unavailable</div>
    );
  }

  if (post.type === "video") {
    return post.youtubeId ? (
      <div className="video-stage">
        <iframe
          src={`https://www.youtube.com/embed/${post.youtubeId}?rel=0&modestbranding=1`}
          title={post.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    ) : (
      <div className="media-unavailable">Video unavailable</div>
    );
  }

  if (post.type === "image" || post.type === "gallery") {
    return (
      <div className="photo-stage">
        {post.image ? <img src={post.image} alt={post.title} /> : null}
      </div>
    );
  }

  if (post.type === "link") {
    return (
      <a className="link-card" href="#external">
        {post.image && (
          <div className="link-image">
            <img src={post.image} alt="" />
            <span className="external-badge">
              <ExternalLink size={15} />
            </span>
          </div>
        )}

        <div className="link-copy">
          <span className="link-source">{post.source}</span>
          <strong>{post.title}</strong>
          {post.description && <p>{post.description}</p>}
          <span className="visit-link">
            Visit link <ChevronRight size={15} />
          </span>
        </div>
      </a>
    );
  }

  return null;
}

function FrontPageCard({
  post,
  session,
  onToggleLike,
  onEdit,
  onDelete,
  onToggleFrontPagePin,
  onToggleFrontPageVisibility,
  isStaff,
  isAdmin,
  singlePinned,
}: {
  post: Post;
  session: Session | null;
  onToggleLike: (post: Post) => void;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onToggleFrontPagePin: (post: Post) => void;
  onToggleFrontPageVisibility: (post: Post) => void;
  isStaff: boolean;
  isAdmin: boolean;
  singlePinned: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = session?.user.id === post.userId;
  const canEdit = Boolean(isOwner || isAdmin);
  const canDelete = Boolean(isOwner || isStaff);
  const isVideo = post.type === "video" || post.type === "short";
  const mediaUrl = post.gifUrl ?? (post.type === "text" ? undefined : post.image);
  const pinnedYouTube =
    isVideo &&
    Boolean(post.youtubeId);

  const singlePinnedVideo =
    singlePinned &&
    pinnedYouTube;

  return (
    <article
      className={
        singlePinnedVideo
          ? "featured-post single-pinned-video"
          : "featured-post"
      }
      id={`featured-${post.id}`}
    >
      <div className="featured-preview">
        {pinnedYouTube ? (
          <a
            className="featured-video-teaser"
            href={`/posts/${post.id}`}
            aria-label={`Open ${post.title}`}
          >
            {mediaUrl ? (
              <img
                src={mediaUrl}
                alt=""
              />
            ) : (
              <span>
                VIDEO
              </span>
            )}

            <span
              className="featured-video-teaser-play"
              aria-hidden="true"
            >
              <Play
                size={14}
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
          </a>
        ) : mediaUrl ? (
          <img src={mediaUrl} alt={post.title} />
        ) : (
          <div className="featured-text-preview">
            <span>“</span>
            <p>{post.description ?? post.title}</p>
          </div>
        )}

        <span className={`type-badge type-${post.type === "short" ? "video" : post.type}`}>
          {post.gifUrl ? "GIF" : getPostTypeLabel(post)}
        </span>

        {(canEdit || canDelete || isAdmin) && (
          <div className="featured-menu-wrap">
            <button
              className="featured-menu-button"
              type="button"
              aria-label="Featured post menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              •••
            </button>

            {menuOpen && (
              <div className="post-menu-dropdown featured-menu-dropdown">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(post);
                    }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                )}

                {isAdmin && post.moderationStatus === "approved" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleFrontPageVisibility(post);
                    }}
                  >
                    <EyeOff size={13} />
                    {post.frontPageVisible ? "Hide from front page" : "Show on front page"}
                  </button>
                )}

                {isAdmin && post.moderationStatus === "approved" && post.frontPageVisible && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleFrontPagePin(post);
                    }}
                  >
                    <Pin size={13} /> Remove from front page
                  </button>
                )}

                {canDelete && (
                  <button
                    className="danger"
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(post);
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="featured-info">
        <a className="featured-title" href={`/posts/${post.id}`}>
          {post.title}
        </a>

        {singlePinnedVideo && (
          <p className="featured-context">
            {post.description?.trim() ||
              "Open the post to watch the full video and join the discussion."}
          </p>
        )}

        <div className="featured-meta">
          <span>
            by{" "}
            {post.authorUsername ? (
              <a
                href={`/u/${encodeURIComponent(post.authorUsername)}`}
              >
                {post.author}
              </a>
            ) : (
              <span>
                {post.author}
              </span>
            )}
          </span>
          <span>{post.published}</span>
        </div>

        <div className="featured-stats">
          <button
            className={post.likedByMe ? "mini-action liked" : "mini-action"}
            type="button"
            onClick={() => onToggleLike(post)}
          >
            ♥ LIKE · {post.likes}
          </button>

          <a
            className="mini-action"
            href={`/posts/${post.id}`}
            aria-label={`Open ${post.comments} comments on ${post.title}`}
          >
            💬 COMMENTS · {post.comments}
          </a>
        </div>
      </div>

    </article>
  );
}

function PostCard({
  post,
  session,
  onToggleLike,
  onCommentCountChanged,
  onEdit,
  onDelete,
  onToggleFrontPagePin,
  onToggleFrontPageVisibility,
  isStaff,
  isAdmin,
}: {
  post: Post;
  session: Session | null;
  onToggleLike: (post: Post) => void;
  onCommentCountChanged: (postId: string, count: number) => void;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onToggleFrontPagePin: (post: Post) => void;
  onToggleFrontPageVisibility: (post: Post) => void;
  isStaff: boolean;
  isAdmin: boolean;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = session?.user.id === post.userId;
  const canEdit = Boolean(isOwner || isAdmin);
  const canDelete = Boolean(isOwner || isStaff);

  const sharePost = async () => {
    const url = `${window.location.origin}/posts/${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Sharing is optional. Closing the native share sheet is not an error state.
    }
  };

  return (
    <article className="blog-post" id={`post-${post.id}`}>
      <div className="post-titlebar">
        <div className="post-titlewrap">
          <div className="post-title-badges">
            <span className={`type-badge type-${post.type === "short" ? "video" : post.type}`}>
              {getPostTypeLabel(post)}
            </span>

            {post.frontPagePinned && (
              <span className="status-badge front-page-status">
                <Pin size={10} /> FRONT PAGE
              </span>
            )}

            {post.moderationStatus === "pending" && (
              <span className="status-badge pending-status">PENDING</span>
            )}

            {post.moderationStatus === "rejected" && (
              <span className="status-badge rejected-status">REJECTED</span>
            )}
          </div>

          <a className="post-title" href={`/posts/${post.id}`}>
            {post.title}
          </a>
        </div>

        {(canEdit || canDelete || isAdmin) && (
          <div className="post-menu-wrap">
            <button
              className="post-menu"
              type="button"
              aria-label="Post menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              •••
            </button>

            {menuOpen && (
              <div className="post-menu-dropdown">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(post);
                    }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                )}

                {isAdmin && post.moderationStatus === "approved" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleFrontPageVisibility(post);
                    }}
                  >
                    <EyeOff size={13} />
                    {post.frontPageVisible ? "Hide from front page" : "Show on front page"}
                  </button>
                )}

                {isAdmin && post.moderationStatus === "approved" && post.frontPageVisible && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleFrontPagePin(post);
                    }}
                  >
                    <Pin size={13} />
                    {post.frontPagePinned ? "Remove from front page" : "Post to front page"}
                  </button>
                )}

                {canDelete && (
                  <button
                    className="danger"
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(post);
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="post-byline">
        <span className="mini-avatar">{post.avatar}</span>
        <span>
          posted by{" "}
          {post.authorUsername ? (
            <a
              href={`/u/${encodeURIComponent(post.authorUsername)}`}
            >
              {post.author}
            </a>
          ) : (
            <span>
              {post.author}
            </span>
          )}
          <em>
            {" "}· {post.published}
          </em>
        </span>
        <a className="permalink" href={`/posts/${post.id}`}>
          permalink
        </a>
      </div>

      {post.type !== "text" && (
        <div className="post-media">
          <MediaStage post={post} />
        </div>
      )}

      {post.description && <p className="post-body">{post.description}</p>}

      {post.gifUrl && (
        <div className="post-gif-attachment">
          <img src={post.gifUrl} alt="Attached reaction GIF" loading="lazy" />
          <span>GIF</span>
        </div>
      )}

      {(post.tag || post.articleTags.length > 0) && (
        <div className="tag-row">
          <span>Filed under:</span>
          {post.tag && <button type="button">{post.tag}</button>}
          {post.articleTags.map((articleTag) => (
            <button type="button" key={articleTag.id}>
              #{articleTag.name}
            </button>
          ))}
        </div>
      )}

      <footer className="post-footer">
        <button
          className={post.likedByMe ? "post-action reacted" : "post-action"}
          type="button"
          onClick={() => onToggleLike(post)}
        >
          <span
            className="post-action-icon"
            aria-hidden="true"
          >
            {post.likedByMe ? "♥" : "♡"}
          </span>

          <span>
            {post.likedByMe
              ? "LIKED"
              : "LIKE"} · {post.likes}
          </span>
        </button>

        <button
          className={commentsOpen ? "post-action active" : "post-action"}
          type="button"
          onClick={() => setCommentsOpen((current) => !current)}
        >
          <span
            className="post-action-icon"
            aria-hidden="true"
          >
            💬
          </span>

          <span>
            {post.comments === 1
              ? "1 COMMENT"
              : `${post.comments} COMMENTS`}
          </span>
        </button>

        <button className="post-action" type="button" onClick={() => void sharePost()}>
          <span
            className="post-action-icon share"
            aria-hidden="true"
          >
            ↗
          </span>

          <span>
            SHARE
          </span>
        </button>
      </footer>

      {commentsOpen && (
        <div className="classic-comments-shell">
          <PostComments
            postId={String(post.id)}
            session={session}
            onCountChanged={(count) => onCommentCountChanged(String(post.id), count)}
            isStaff={isStaff}
          />
        </div>
      )}
    </article>
  );
}

function RailModule({
  title,
  icon,
  children,
  order,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  order?: number;
}) {
  return (
    <section
      className="side-box rail-module"
      style={
        order === undefined
          ? undefined
          : { order }
      }
    >
      <div className="side-title rail-heading">
        <span className="side-title-icon">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="side-content rail-body">{children}</div>
    </section>
  );
}

function App() {
  const [filterOpen, setFilterOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState(() =>
      new URLSearchParams(
        window.location.search
      ).get("q") ?? ""
    );

  const [
    timeFilter,
    setTimeFilter,
  ] =
    useState<TimeFilter>(
      "all"
    );

  const [
    contentFilter,
    setContentFilter,
  ] =
    useState<ContentFilter>(
      "all"
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("all");

  const [
    tagFilter,
    setTagFilter,
  ] =
    useState("all");

  const [
    filterCategories,
    setFilterCategories,
  ] =
    useState<PostCategory[]>(
      []
    );

  const [
    filterTags,
    setFilterTags,
  ] =
    useState<PostTag[]>(
      []
    );

  const [
    categoriesExpanded,
    setCategoriesExpanded,
  ] =
    useState(false);

  const [
    filterTagsExpanded,
    setFilterTagsExpanded,
  ] =
    useState(false);

  const [
    sidebarOrder,
    setSidebarOrder,
  ] =
    useState<SidebarModuleKey[]>(
      [
        ...DEFAULT_SIDEBAR_ORDER,
      ]
    );

  const [
    welcomeBody,
    setWelcomeBody,
  ] =
    useState(
      DEFAULT_WELCOME_BODY
    );

  const [
    welcomeNote,
    setWelcomeNote,
  ] =
    useState(
      DEFAULT_WELCOME_NOTE
    );

  const [
    promotedMember,
    setPromotedMember,
  ] =
    useState<
      PromotedSidebarMember | null
    >(
      null
    );

  const [
    promotedMemberNote,
    setPromotedMemberNote,
  ] =
    useState(
      ""
    );

  const [
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  const [
    postDialogOpen,
    setPostDialogOpen,
  ] =
    useState(false);

  const [
    editingPost,
    setEditingPost,
  ] =
    useState<PostRecord | null>(
      null
    );

  const [
    livePosts,
    setLivePosts,
  ] =
    useState<Post[]>([]);

  const [
    highlightedBlogPost,
    setHighlightedBlogPost,
  ] =
    useState<BlogPost | null>(
      null
    );

  const [
    youtubeGems,
    setYoutubeGems,
  ] =
    useState<YouTubeGem[]>(
      []
    );

  const [
    session,
    setSession,
  ] = useState<Session | null>(
    null
  );

  const [
    authReady,
    setAuthReady,
  ] = useState(false);

  const [
    accessRole,
    setAccessRole,
  ] =
    useState<UserRole | null>(
      null
    );

  const [
    shoutboxMessages,
    setShoutboxMessages,
  ] =
    useState<ShoutboxMessage[]>(
      []
    );

  const [
    shoutboxInput,
    setShoutboxInput,
  ] =
    useState("");

  const [
    shoutboxPosting,
    setShoutboxPosting,
  ] =
    useState(false);


  const [
    onlineUsers,
    setOnlineUsers,
  ] =
    useState<OnlineUser[]>(
      []
    );

  const [
    recentComments,
    setRecentComments,
  ] =
    useState<RecentCommentItem[]>(
      []
    );


  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) {
          return;
        }

        setSession(
          data.session
        );

        setAuthReady(true);
      });

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!mounted) {
            return;
          }

          setSession(
            nextSession
          );

          setAuthReady(true);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    const loadRecentComments =
      async () => {
        try {
          const comments =
            await getRecentComments();

          if (mounted) {
            setRecentComments(
              comments
            );
          }
        } catch (error) {
          console.warn(
            "UNFILTERED LOGS RECENT COMMENTS ERROR:",
            error
          );
        }
      };

    void loadRecentComments();

    const unsubscribe =
      subscribeToRecentComments(
        () => {
          void loadRecentComments();
        }
      );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    const loadShoutbox =
      async () => {
        try {
          const messages =
            await getShoutboxMessages();

          if (mounted) {
            setShoutboxMessages(
              messages
            );
          }
        } catch (error) {
          console.warn(
            "UNFILTERED LOGS SHOUTBOX LOAD ERROR:",
            error
          );
        }
      };

    void loadShoutbox();

    const unsubscribe =
      subscribeToShoutbox(
        () => {
          void loadShoutbox();
        }
      );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);


  useEffect(() => {
    let mounted = true;
    let cleanup:
      (() => void) |
      null =
        null;

    void subscribeToOnlineUsers(
      session,
      (
        users
      ) => {
        if (mounted) {
          setOnlineUsers(
            users
          );
        }
      }
    )
      .then(
        (
          unsubscribe
        ) => {
          if (!mounted) {
            unsubscribe();
            return;
          }

          cleanup =
            unsubscribe;
        }
      )
      .catch(
        (
          error
        ) => {
          console.warn(
            "UNFILTERED LOGS PRESENCE ERROR:",
            error
          );

          if (mounted) {
            setOnlineUsers(
              []
            );
          }
        }
      );

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [session]);


  useEffect(() => {
    let mounted = true;

    if (!session) {
      setAccessRole(
        null
      );

      return () => {
        mounted = false;
      };
    }

    void getMyAccess()
      .then(
        (
          access
        ) => {
          if (!mounted) {
            return;
          }

          setAccessRole(
            access?.role ??
            null
          );
        }
      )
      .catch(() => {
        if (mounted) {
          setAccessRole(
            null
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [session]);


  useEffect(() => {
    let mounted = true;

    void getActiveTaxonomy()
      .then(
        (
          taxonomy
        ) => {
          if (!mounted) {
            return;
          }

          setFilterCategories(
            taxonomy.categories
          );

          setFilterTags(
            taxonomy.tags
          );
        }
      )
      .catch(
        (
          error
        ) => {
          console.warn(
            "UNFILTERED LOGS FILTER TAXONOMY ERROR:",
            error
          );
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    void getSidebarSettings()
      .then(
        (settings) => {
          if (mounted) {
            setSidebarOrder(
              settings.moduleOrder
            );

            setWelcomeBody(
              settings.welcomeBody
            );

            setWelcomeNote(
              settings.welcomeNote
            );

            setPromotedMember(
              settings.promotedMember
            );

            setPromotedMemberNote(
              settings.promotedMemberNote
            );
          }
        }
      )
      .catch(
        (error) => {
          console.warn(
            "UNFILTERED LOGS SIDEBAR ORDER ERROR:",
            error
          );
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    void getHighlightedBlogPost()
      .then(
        (
          post
        ) => {
          if (mounted) {
            setHighlightedBlogPost(
              post
            );
          }
        }
      )
      .catch(
        (
          error
        ) => {
          console.warn(
            "UNFILTERED LOGS BLOG HIGHLIGHT ERROR:",
            error
          );
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    if (!authReady) {
      return;
    }

    let mounted = true;

    void getFeedPosts()
      .then(
        (
          records
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "UNFILTERED LOGS POSTS LOADED:",
            records.length
          );

          setLivePosts(
            records.map(
              mapPostRecord
            )
          );
        }
      )
      .catch(
        (
          error
        ) => {
          console.error(
            "UNFILTERED LOGS FEED ERROR:",
            error
          );

          if (mounted) {
            setLivePosts([]);
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    authReady,
    session?.user.id,
  ]);


  useEffect(() => {
    let mounted = true;

    void getYouTubeGems(
      3
    ).then(
      (
        gems
      ) => {
        if (mounted) {
          setYoutubeGems(
            gems
          );
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, []);


  const refreshYouTubeGems =
    () => {
      void getYouTubeGems(
        3
      ).then(
        setYoutubeGems
      );
    };


  const openQuickPost =
    () => {
      if (!session) {
        window.location.assign(
          "/login"
        );

        return;
      }

      setPostDialogOpen(
        true
      );
    };


  const handlePostCreated =
    (
      post:
        PostRecord
    ) => {
      const mapped =
        mapPostRecord(
          post
        );

      setLivePosts(
        (
          current
        ) => [
          mapped,

          ...current.filter(
            (
              item
            ) =>
              item.id !==
              mapped.id
          ),
        ]
      );
    };


  const handlePostEdited =
    (
      updated:
        PostRecord
    ) => {
      const mapped =
        mapPostRecord(
          updated
        );

      setLivePosts(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
                mapped.id
                ? mapped
                : item
          )
      );

      setEditingPost(
        null
      );

      refreshYouTubeGems();
    };


  const handleDeletePost =
    async (
      post:
        Post
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${post.title}"? This cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deletePost(
          String(
            post.id
          )
        );

        setLivePosts(
          (
            current
          ) =>
            current.filter(
              (
                item
              ) =>
                item.id !==
                post.id
            )
        );

        refreshYouTubeGems();
      } catch (
        error
      ) {
        console.error(
          "UNFILTERED LOGS POST DELETE ERROR:",
          error
        );

        const message =
          error &&
          typeof error ===
            "object" &&
          "message" in error
            ? String(
                (
                  error as {
                    message:
                      unknown;
                  }
                ).message
              )
            : "UNFILTERED LOGS could not delete the post.";

        window.alert(
          message
        );
      }
    };


  const handleToggleFrontPagePin =
    async (
      post: Post,
    ) => {
      if (
        accessRole !==
        "admin"
      ) {
        return;
      }

      const nextPinned =
        !post.frontPagePinned;

      if (nextPinned) {
        const pinnedCount =
          livePosts.filter(
            (item) =>
              item.id !== post.id &&
              item.moderationStatus === "approved" &&
              item.frontPageVisible &&
              item.frontPagePinned
          ).length;

        if (pinnedCount >= 3) {
          window.alert(
            "The front page already has three posts. Remove one before posting another to the front page."
          );

          return;
        }
      }

      try {
        await setFrontPagePin(
          String(
            post.id
          ),
          nextPinned
        );

        setLivePosts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                  post.id
                  ? {
                      ...item,

                      frontPagePinned:
                        nextPinned,

                      frontPagePinnedAt:
                        nextPinned
                          ? new Date().toISOString()
                          : null,
                    }
                  : item
            )
        );
      } catch (
        error
      ) {
        console.error(
          "UNFILTERED LOGS FRONT PAGE PIN ERROR:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Could not update front page pin."
        );
      }
    };


  const handleToggleFrontPageVisibility =
    async (
      post: Post,
    ) => {
      if (
        accessRole !==
        "admin"
      ) {
        return;
      }

      const nextVisible =
        !post.frontPageVisible;

      try {
        await setFrontPageVisibility(
          String(
            post.id
          ),
          nextVisible
        );

        setLivePosts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                  post.id
                  ? {
                      ...item,

                      frontPageVisible:
                        nextVisible,

                      frontPagePinned:
                        nextVisible
                          ? item.frontPagePinned
                          : false,

                      frontPagePinnedAt:
                        nextVisible
                          ? item.frontPagePinnedAt
                          : null,
                    }
                  : item
            )
        );
      } catch (
        error
      ) {
        console.error(
          "UNFILTERED LOGS FRONT PAGE VISIBILITY ERROR:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Could not update front page visibility."
        );
      }
    };


  const handleToggleLike =
    async (
      post: Post,
    ) => {
      if (!session) {
        window.location.assign(
          "/login"
        );

        return;
      }

      try {
        const liked =
          await togglePostLike(
            String(
              post.id
            ),
            post.likedByMe
          );

        setLivePosts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                  post.id
                  ? {
                      ...item,

                      likedByMe:
                        liked,

                      likes:
                        Math.max(
                          0,
                          item.likes +
                            (
                              liked
                                ? 1
                                : -1
                            )
                        ),
                    }
                  : item
            )
        );

        refreshYouTubeGems();
      } catch (
        error
      ) {
        console.error(
          "UNFILTERED LOGS LIKE ERROR:",
          error
        );
      }
    };


  const handleCommentCountChanged =
    (
      postId: string,
      count: number,
    ) => {
      setLivePosts(
        (
          current
        ) =>
          current.map(
            (
              post
            ) =>
              String(
                post.id
              ) === postId
                ? {
                    ...post,
                    comments:
                      count,
                  }
                : post
          )
      );

      refreshYouTubeGems();
    };


  const submitShoutboxMessage =
    async () => {
      const body =
        shoutboxInput.trim();

      if (!body) {
        return;
      }

      if (!session) {
        window.location.assign(
          "/login"
        );

        return;
      }

      setShoutboxPosting(
        true
      );

      try {
        await postShoutboxMessage(
          body
        );

        setShoutboxInput("");

        const messages =
          await getShoutboxMessages();

        setShoutboxMessages(
          messages
        );
      } catch (error) {
        console.error(
          "UNFILTERED LOGS SHOUTBOX POST ERROR:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Could not post shout."
        );
      } finally {
        setShoutboxPosting(
          false
        );
      }
    };


  const signOut =
    async () => {
      await supabase.auth.signOut();

      window.location.assign(
        "/"
      );
    };




  const filteredPosts =
    useMemo(
      () => {
        const now =
          Date.now();

        const normalizedSearch =
          searchQuery.trim().toLowerCase();

        return livePosts.filter(
          (
            post
          ) => {
            const created =
              new Date(
                post.createdAt
              ).getTime();

            let matchesTime =
              true;

            if (
              timeFilter ===
              "today"
            ) {
              const startOfToday =
                new Date();

              startOfToday.setHours(
                0,
                0,
                0,
                0
              );

              matchesTime =
                created >=
                startOfToday.getTime();
            } else if (
              timeFilter ===
              "week"
            ) {
              matchesTime =
                created >=
                now -
                  7 *
                    24 *
                    60 *
                    60 *
                    1000;
            } else if (
              timeFilter ===
              "month"
            ) {
              matchesTime =
                created >=
                now -
                  30 *
                    24 *
                    60 *
                    60 *
                    1000;
            }

            let matchesContent =
              true;

            if (
              contentFilter ===
              "videos"
            ) {
              matchesContent =
                post.type ===
                  "video" ||
                post.type ===
                  "short";
            } else if (
              contentFilter ===
              "photos"
            ) {
              matchesContent =
                post.type ===
                  "image" ||
                post.type ===
                  "gallery";
            } else if (
              contentFilter ===
              "discussions"
            ) {
              matchesContent =
                post.type ===
                  "text";
            }

            const matchesCategory =
              categoryFilter ===
                "all" ||
              post.categoryId ===
                categoryFilter;

            const matchesTag =
              tagFilter ===
                "all" ||
              post.articleTags.some(
                (
                  articleTag
                ) =>
                  articleTag.id ===
                  tagFilter
              );

            const matchesSearch =
              !normalizedSearch ||
              [
                post.title,
                post.description ?? "",
                post.author,
                post.tag ?? "",
                ...post.articleTags.map(
                  (articleTag) => articleTag.name
                ),
              ]
                .join(" ")
                .toLowerCase()
                .includes(normalizedSearch);

            return (
              matchesTime &&
              matchesContent &&
              matchesCategory &&
              matchesTag &&
              matchesSearch
            );
          }
        );
      },
      [
        livePosts,
        timeFilter,
        contentFilter,
        categoryFilter,
        tagFilter,
        searchQuery,
      ]
    );


  const activeFilterCount =
    (
      timeFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      contentFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      categoryFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      tagFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      searchQuery.trim()
        ? 1
        : 0
    );


  const pinnedFrontPagePosts =
    useMemo(
      () =>
        livePosts
          .filter(
            (post) =>
              post.moderationStatus === "approved" &&
              post.frontPageVisible &&
              post.frontPagePinned
          )
          .sort(
            (left, right) =>
              new Date(
                right.frontPagePinnedAt ?? right.createdAt
              ).getTime() -
              new Date(
                left.frontPagePinnedAt ?? left.createdAt
              ).getTime()
          )
          .slice(0, 3),
      [livePosts]
    );


  const magazineSourcePosts =
    useMemo(
      () =>
        activeFilterCount ===
          0
          ? filteredPosts.filter(
              (
                post
              ) =>
                post.frontPageVisible &&
                !post.frontPagePinned
            )
          : filteredPosts,
      [
        activeFilterCount,
        filteredPosts,
      ]
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        magazineSourcePosts.length /
          POSTS_PER_PAGE
      )
    );


  const paginatedPosts =
    useMemo(
      () => {
        const start =
          (
            currentPage -
            1
          ) *
          POSTS_PER_PAGE;

        return magazineSourcePosts.slice(
          start,
          start +
            POSTS_PER_PAGE
        );
      },
      [
        magazineSourcePosts,
        currentPage,
      ]
    );





  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


  useEffect(() => {
    setCurrentPage(
      1
    );
  }, [
    timeFilter,
    contentFilter,
    categoryFilter,
    tagFilter,
    searchQuery,
  ]);


  const goToPage =
    (
      page:
        number
    ) => {
      const nextPage =
        Math.min(
          totalPages,
          Math.max(
            1,
            page
          )
        );

      setCurrentPage(
        nextPage
      );

      window.setTimeout(
        () => {
          document
            .querySelector(
              ".feed-column"
            )
            ?.scrollIntoView(
              {
                behavior:
                  "smooth",

                block:
                  "start",
              }
            );
        },
        0
      );
    };


  const approvedRailPosts =
    useMemo(
      () =>
        livePosts.filter(
          (
            post
          ) =>
            post.moderationStatus ===
              "approved"
        ),
      [
        livePosts,
      ]
    );


  const categoryPostCounts =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();

        for (
          const post
          of approvedRailPosts
        ) {
          if (
            !post.categoryId
          ) {
            continue;
          }

          counts.set(
            post.categoryId,
            (
              counts.get(
                post.categoryId
              ) ??
              0
            ) + 1
          );
        }

        return counts;
      },
      [
        approvedRailPosts,
      ]
    );


  const railCategories =
    useMemo(
      () =>
        [...filterCategories].sort(
          (
            left,
            right
          ) =>
            (
              categoryPostCounts.get(
                right.id
              ) ??
              0
            ) -
              (
                categoryPostCounts.get(
                  left.id
                ) ??
                0
              ) ||
            left.name.localeCompare(
              right.name
            )
        ),
      [
        filterCategories,
        categoryPostCounts,
      ]
    );


  const tagPostCounts =
    useMemo(
      () => {
        const counts =
          new Map<
            string,
            number
          >();

        for (
          const post
          of approvedRailPosts
        ) {
          for (
            const articleTag
            of post.articleTags
          ) {
            counts.set(
              articleTag.id,
              (
                counts.get(
                  articleTag.id
                ) ??
                0
              ) + 1
            );
          }
        }

        return counts;
      },
      [
        approvedRailPosts,
      ]
    );


  const railTags =
    useMemo(
      () =>
        [...filterTags].sort(
          (
            left,
            right
          ) =>
            (
              tagPostCounts.get(
                right.id
              ) ??
              0
            ) -
              (
                tagPostCounts.get(
                  left.id
                ) ??
                0
              ) ||
            left.sort_order -
              right.sort_order ||
            left.name.localeCompare(
              right.name
            )
        ),
      [
        filterTags,
        tagPostCounts,
      ]
    );


  const popularPosts =
    useMemo(
      () =>
        [...approvedRailPosts]
          .filter((post) => post.frontPageVisible)
          .sort(
            (left, right) =>
              right.likes + right.comments * 2 -
              (left.likes + left.comments * 2)
          )
          .slice(0, 5),
      [approvedRailPosts]
    );


  const archiveRows =
    useMemo(
      () => {
        const counts = new Map<string, number>();

        for (const post of approvedRailPosts) {
          const date = new Date(post.createdAt);
          const label = date.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          });

          counts.set(label, (counts.get(label) ?? 0) + 1);
        }

        return Array.from(counts.entries()).slice(0, 6);
      },
      [approvedRailPosts]
    );


  const siteTotals =
    useMemo(
      () => ({
        logs: approvedRailPosts.length,
        reactions: approvedRailPosts.reduce(
          (total, post) => total + post.likes,
          0
        ),
        comments: approvedRailPosts.reduce(
          (total, post) => total + post.comments,
          0
        ),
        categories: filterCategories.length,
      }),
      [approvedRailPosts, filterCategories.length]
    );


  const scrollToFeed =
    () => {
      window.setTimeout(
        () => {
          document
            .querySelector(
              ".feed-column"
            )
            ?.scrollIntoView(
              {
                behavior:
                  "smooth",

                block:
                  "start",
              }
            );
        },
        0
      );
    };


  const sidebarModuleOrder =
    (
      key:
        SidebarModuleKey
    ) => {
      const index =
        sidebarOrder.indexOf(
          key
        );

      return index === -1
        ? sidebarOrder.length
        : index;
    };


  const clearFilters =
    () => {
      setTimeFilter(
        "all"
      );

      setContentFilter(
        "all"
      );

      setCategoryFilter(
        "all"
      );

      setTagFilter(
        "all"
      );

      setSearchQuery(
        ""
      );
    };




  return (
    <div className="classic-site roffle-app">
      <SiteHeader
        session={session}
        authReady={authReady}
        accessRole={accessRole}
        activeSection="home"
        onPost={openQuickPost}
        onSignOut={() => {
          void signOut();
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={setSearchQuery}
      />

      <main className="site-width page-body">
        {activeFilterCount === 0 && pinnedFrontPagePosts.length > 0 && (
          <section className="featured-box">
            <div className="box-heading">
              <strong>POSTED TO THE FRONT PAGE</strong>
              <span>selected by the moderators</span>
            </div>

            <div
              className={`featured-strip pinned-count-${Math.min(
                pinnedFrontPagePosts.length,
                3
              )}`}
            >
              {pinnedFrontPagePosts.map((post) => (
                <FrontPageCard
                  key={post.id}
                  post={post}
                  session={session}
                  onToggleLike={handleToggleLike}
                  onEdit={(selected) => setEditingPost(selected.sourceRecord)}
                  onDelete={(selected) => {
                    void handleDeletePost(selected);
                  }}
                  onToggleFrontPagePin={handleToggleFrontPagePin}
                  onToggleFrontPageVisibility={handleToggleFrontPageVisibility}
                  isStaff={accessRole === "moderator" || accessRole === "admin"}
                  isAdmin={accessRole === "admin"}
                  singlePinned={pinnedFrontPagePosts.length === 1}
                />
              ))}
            </div>
          </section>
        )}

        <div className="layout-columns">
          <section className="main-column feed-column">
            <div className="feed-heading">
              <div>
                <h1>Recent Logs</h1>
                <span>Newest posts from everybody.</span>
              </div>

              <div className="feed-heading-actions">
                <div className="view-controls">
                  <button
                    className={contentFilter === "all" ? "active" : ""}
                    type="button"
                    onClick={() => setContentFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={contentFilter === "videos" ? "active" : ""}
                    type="button"
                    onClick={() => setContentFilter("videos")}
                  >
                    Video
                  </button>
                  <button
                    className={contentFilter === "photos" ? "active" : ""}
                    type="button"
                    onClick={() => setContentFilter("photos")}
                  >
                    Images
                  </button>
                  <button
                    className={contentFilter === "discussions" ? "active" : ""}
                    type="button"
                    onClick={() => setContentFilter("discussions")}
                  >
                    Text
                  </button>
                </div>

                <button
                  className={filterOpen ? "advanced-filter open" : "advanced-filter"}
                  type="button"
                  onClick={() => setFilterOpen((current) => !current)}
                >
                  <SlidersHorizontal size={13} /> Filter
                  <span
                    className={
                      activeFilterCount > 0
                        ? "filter-count"
                        : "filter-count empty"
                    }
                    aria-hidden={
                      activeFilterCount === 0
                    }
                  >
                    {activeFilterCount > 0
                      ? activeFilterCount
                      : "#"}
                  </span>
                </button>
              </div>
            </div>

            {filterOpen && (
              <div className="filter-panel classic-filter-panel">
                <div className="filter-panel-top">
                  <div>
                    <strong>Filter posts</strong>
                    <span>{filteredPosts.length} of {livePosts.length} matching</span>
                  </div>

                  {activeFilterCount > 0 && (
                    <button className="filter-clear" type="button" onClick={clearFilters}>
                      Clear
                    </button>
                  )}
                </div>

                <div className="filter-row">
                  <span className="filter-label">Time</span>
                  <div className="filter-options">
                    {([
                      ["all", "All time"],
                      ["today", "Today"],
                      ["week", "Last week"],
                      ["month", "Last month"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        className={timeFilter === value ? "selected" : ""}
                        type="button"
                        onClick={() => setTimeFilter(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-row">
                  <span className="filter-label">Category</span>
                  <div className="filter-options">
                    <button
                      className={categoryFilter === "all" ? "selected" : ""}
                      type="button"
                      onClick={() => setCategoryFilter("all")}
                    >
                      All
                    </button>
                    {filterCategories.map((category) => (
                      <button
                        key={category.id}
                        className={categoryFilter === category.id ? "selected" : ""}
                        type="button"
                        onClick={() => setCategoryFilter(category.id)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-row filter-tags-row">
                  <span className="filter-label">Tags</span>
                  <div className="filter-options">
                    <button
                      className={tagFilter === "all" ? "selected" : ""}
                      type="button"
                      onClick={() => setTagFilter("all")}
                    >
                      All
                    </button>

                    {(filterTagsExpanded
                      ? filterTags
                      : filterTags.slice(0, 10)
                    ).map((articleTag) => (
                      <button
                        key={articleTag.id}
                        className={tagFilter === articleTag.id ? "selected" : ""}
                        type="button"
                        onClick={() => setTagFilter(articleTag.id)}
                      >
                        #{articleTag.name}
                      </button>
                    ))}

                    {filterTags.length > 10 && (
                      <button
                        className="filter-more-button"
                        type="button"
                        onClick={() =>
                          setFilterTagsExpanded(
                            (current) =>
                              !current
                          )
                        }
                      >
                        {filterTagsExpanded
                          ? "<< LESS"
                          : "MORE >>"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="post-stack">
              {magazineSourcePosts.length === 0 ? (
                <div className="empty-state">
                  {activeFilterCount > 0
                    ? "No posts match those filters."
                    : "No posts yet. Somebody has to post first."}
                </div>
              ) : (
                paginatedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    session={session}
                    onToggleLike={handleToggleLike}
                    onCommentCountChanged={handleCommentCountChanged}
                    onEdit={(selected) => setEditingPost(selected.sourceRecord)}
                    onDelete={(selected) => {
                      void handleDeletePost(selected);
                    }}
                    onToggleFrontPagePin={handleToggleFrontPagePin}
                    onToggleFrontPageVisibility={handleToggleFrontPageVisibility}
                    isStaff={accessRole === "moderator" || accessRole === "admin"}
                    isAdmin={accessRole === "admin"}
                  />
                ))
              )}
            </div>

            {magazineSourcePosts.length > 0 && (
              <div className="pager">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  ← Newer
                </button>

                <span>
                  Page {currentPage} of {totalPages} · {magazineSourcePosts.length} posts
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  Older →
                </button>
              </div>
            )}
          </section>

          <aside className="sidebar right-rail">
            <RailModule
              title={
                promotedMember
                  ? "MEMBER SPOTLIGHT"
                  : "WELCOME TO UNFILTERED LOGS"
              }
              order={
                sidebarModuleOrder(
                  "welcome"
                )
              }
            >
              {promotedMember ? (
                <div className="featured-member-card">
                  <div className="featured-member-identity">
                    <a
                      className="featured-member-avatar"
                      href={`/u/${promotedMember.username}`}
                      aria-label={`Open @${promotedMember.username}'s member page`}
                    >
                      <img
                        className={
                          !promotedMember.avatarUrl
                            ? "ul-avatar-fallback-image"
                            : undefined
                        }
                        src={
                          promotedMember.avatarUrl ??
                          "/ul-avatar-fallback.png"
                        }
                        alt=""
                        onError={
                          (
                            event
                          ) => {
                            const image =
                              event.currentTarget;

                            if (
                              image.dataset
                                .ulFallback ===
                              "true"
                            ) {
                              return;
                            }

                            image.dataset
                              .ulFallback =
                              "true";

                            image.classList
                              .add(
                                "ul-avatar-fallback-image"
                              );

                            image.src =
                              "/ul-avatar-fallback.png";
                          }
                        }
                      />
                    </a>

                    <div className="featured-member-copy">
                      <span className="featured-member-kicker">
                        MEATSPACE PICK
                      </span>

                      <a
                        className="featured-member-username"
                        href={`/u/${promotedMember.username}`}
                      >
                        @{promotedMember.username}
                      </a>
                    </div>
                  </div>

                  {promotedMemberNote && (
                    <div className="featured-member-reason">
                      <span>
                        WHY WE PICKED THEM
                      </span>

                      <p>
                        {promotedMemberNote}
                      </p>
                    </div>
                  )}

                  <a
                    className="featured-member-link"
                    href={`/u/${promotedMember.username}`}
                  >
                    VIEW THEIR PAGE »
                  </a>
                </div>
              ) : (
                <>
                  <p>
                    {welcomeBody}
                  </p>

                  <p className="small-note">
                    {welcomeNote}
                  </p>

                  {!session && (
                    <a href="/login">
                      Create an account »
                    </a>
                  )}
                </>
              )}
            </RailModule>

            <RailModule title="SHOUTBOX" order={sidebarModuleOrder("shoutbox")}>
              <div className="production-shoutbox">
                <div className="shout-list" aria-live="polite">
                  {shoutboxMessages.length === 0 ? (
                    <p className="shout-empty">No shouts yet. Be the first.</p>
                  ) : (
                    shoutboxMessages.map((message) => (
                      <p key={message.id}>
                        <span className="shout-line">
                          {message.profile?.username ? (
                            <a
                              className="shout-user-link"
                              href={`/u/${encodeURIComponent(message.profile.username)}`}
                            >
                              {message.profile.username}:
                            </a>
                          ) : (
                            <strong>
                              {message.profile?.display_name ??
                                "member"}:
                            </strong>
                          )}

                          <span className="shout-time">
                            {new Date(message.created_at).toLocaleTimeString(
                              undefined,
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </span>

                        <span className="shout-message">
                          {message.body}
                        </span>
                      </p>
                    ))
                  )}
                </div>

                <div className="shout-form">
                  <input
                    value={shoutboxInput}
                    maxLength={280}
                    disabled={!session || shoutboxPosting}
                    onChange={(event) =>
                      setShoutboxInput(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void submitShoutboxMessage();
                      }
                    }}
                    placeholder={
                      session
                        ? "say something..."
                        : "sign in to shout..."
                    }
                    aria-label="Shoutbox message"
                  />

                  <button
                    type="button"
                    disabled={
                      !session ||
                      shoutboxPosting ||
                      !shoutboxInput.trim()
                    }
                    onClick={() => {
                      void submitShoutboxMessage();
                    }}
                  >
                    {shoutboxPosting
                      ? "..."
                      : "Go"}
                  </button>
                </div>
              </div>
            </RailModule>

            <RailModule title="WHO'S ONLINE" order={sidebarModuleOrder("online")}>
              <div className="production-online-users">
                <div className="online-summary">
                  <strong>
                    {onlineUsers.length}
                  </strong>{" "}
                  {onlineUsers.length === 1
                    ? "member"
                    : "members"}{" "}
                  online
                </div>

                <div className="online-user-list">
                  {onlineUsers.length === 0 ? (
                    <span className="online-more">
                      Nobody signed in right now.
                    </span>
                  ) : (
                    onlineUsers
                      .slice(0, 12)
                      .map(
                        (
                          user
                        ) => (
                          <span
                            className="online-user"
                            key={
                              user.user_id
                            }
                          >
                            <span className="online-dot" />
                            {user.username ??
                              user.display_name ??
                              "member"}
                          </span>
                        )
                      )
                  )}

                  {onlineUsers.length > 12 && (
                    <span className="online-more">
                      +{onlineUsers.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            </RailModule>

            <RailModule title="RECENT COMMENTS" order={sidebarModuleOrder("recent_comments")}>
              <div className="production-recent-comments">
                {recentComments.length === 0 ? (
                  <div className="rail-taxonomy-empty">
                    No comments yet.
                  </div>
                ) : (
                  recentComments.map(
                    (
                      comment
                    ) => (
                      <a
                        className="recent-comment-row"
                        href={`/posts/${comment.post_id}`}
                        key={
                          comment.id
                        }
                      >
                        <div className="recent-comment-meta">
                          <strong>
                            {comment.username ??
                              comment.display_name ??
                              "member"}
                          </strong>

                          <span>
                            {new Date(
                              comment.created_at
                            ).toLocaleTimeString(
                              undefined,
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>

                        <p>
                          {comment.body?.trim() ||
                            (comment.gif_url
                              ? "[GIF]"
                              : "Comment")}
                        </p>

                        {comment.post_title && (
                          <small>
                            on {comment.post_title}
                          </small>
                        )}
                      </a>
                    )
                  )
                )}
              </div>
            </RailModule>

            {highlightedBlogPost?.published && highlightedBlogPost.is_highlighted && (
              <RailModule title="FROM EDITORIAL" icon={<BookOpen size={13} />} order={sidebarModuleOrder("editorial")}>
                <article className="editorial-side-preview">
                  {highlightedBlogPost.hero_image_url && (
                    <a
                      className="editorial-side-image"
                      href={`/blog/${highlightedBlogPost.slug}`}
                    >
                      <img
                        src={highlightedBlogPost.hero_image_url}
                        alt=""
                      />
                    </a>
                  )}

                  <div className="editorial-side-copy">
                    <span className="editorial-side-date">
                      {highlightedBlogPost.published_at
                        ? new Date(highlightedBlogPost.published_at).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "Editorial"}
                    </span>

                    <a
                      className="editorial-side-title"
                      href={`/blog/${highlightedBlogPost.slug}`}
                    >
                      {highlightedBlogPost.title}
                    </a>

                    {highlightedBlogPost.excerpt && (
                      <p>
                        {highlightedBlogPost.excerpt}
                      </p>
                    )}

                    <a
                      className="editorial-side-read"
                      href={`/blog/${highlightedBlogPost.slug}`}
                    >
                      Read full article »
                    </a>
                  </div>
                </article>
              </RailModule>
            )}

            <RailModule title="POPULAR POSTS" icon={<Flame size={13} />} order={sidebarModuleOrder("popular")}>
              {popularPosts.length === 0 ? (
                <div className="rail-taxonomy-empty">Nothing popular yet.</div>
              ) : (
                <ol className="popular-list">
                  {popularPosts.map((post, index) => (
                    <li key={post.id}>
                      <span>{index + 1}.</span>
                      <a href={`/posts/${post.id}`}>{post.title}</a>
                      <strong>{post.likes + post.comments}</strong>
                    </li>
                  ))}
                </ol>
              )}
            </RailModule>

            <RailModule title="YOUTUBE GEMS" icon={<Play size={13} />} order={sidebarModuleOrder("youtube_gems")}>
              {youtubeGems.length === 0 ? (
                <div className="rail-taxonomy-empty">No YouTube gems yet.</div>
              ) : (
                <div className="gem-list">
                  {youtubeGems.map((gem) => (
                    <a className="gem" href={`/posts/${gem.id}`} key={gem.id}>
                      <div className="gem-image">
                        <img
                          src={`https://i.ytimg.com/vi/${gem.youtubeId}/hqdefault.jpg`}
                          alt=""
                        />
                        <span>▶</span>
                      </div>
                      <div>
                        <strong>{gem.title}</strong>
                        <small>♥ {gem.likeCount} · 💬 {gem.commentCount}</small>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </RailModule>

            <RailModule title="CATEGORIES" icon={<Hash size={13} />} order={sidebarModuleOrder("categories")}>
              <div className="archive-list category-list classic-category-list">
                <button
                  className={categoryFilter === "all" ? "selected" : ""}
                  type="button"
                  onClick={() => {
                    setCategoryFilter("all");
                    scrollToFeed();
                  }}
                >
                  <span>All categories</span>
                  <strong>{approvedRailPosts.length}</strong>
                </button>

                {(categoriesExpanded ? railCategories : railCategories.slice(0, 6)).map((category) => (
                  <button
                    key={category.id}
                    className={categoryFilter === category.id ? "selected" : ""}
                    type="button"
                    onClick={() => {
                      setCategoryFilter((current) => current === category.id ? "all" : category.id);
                      scrollToFeed();
                    }}
                  >
                    <span>{category.name}</span>
                    <strong>{categoryPostCounts.get(category.id) ?? 0}</strong>
                  </button>
                ))}

                {railCategories.length > 6 && (
                  <button
                    className="category-more-toggle"
                    type="button"
                    onClick={() => setCategoriesExpanded((current) => !current)}
                  >
                    {categoriesExpanded ? "Less" : "More"}
                  </button>
                )}
              </div>
            </RailModule>

            <RailModule title="TAGS" icon={<Hash size={13} />} order={sidebarModuleOrder("tags")}>
              {railTags.length === 0 ? (
                <div className="rail-taxonomy-empty">No tags yet.</div>
              ) : (
                <div className="tag-cloud">
                  {railTags.map((articleTag, index) => (
                    <button
                      type="button"
                      key={articleTag.id}
                      className={`tag-size-${(index % 3) + 1} ${tagFilter === articleTag.id ? "active" : ""}`}
                      onClick={() => {
                        setTagFilter((current) => current === articleTag.id ? "all" : articleTag.id);
                        scrollToFeed();
                      }}
                    >
                      {articleTag.name}
                    </button>
                  ))}
                </div>
              )}
            </RailModule>

            <RailModule title="ARCHIVES" icon={<Clock size={13} />} order={sidebarModuleOrder("archives")}>
              {archiveRows.length === 0 ? (
                <div className="rail-taxonomy-empty">No archives yet.</div>
              ) : (
                <div className="archive-list">
                  {archiveRows.map(([label, count]) => (
                    <span className="archive-row" key={label}>
                      <span>{label}</span>
                      <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              )}
            </RailModule>

            <RailModule title="SITE STATS" order={sidebarModuleOrder("stats")}>
              <dl className="classic-stats">
                <div><dt>Posts</dt><dd>{siteTotals.logs}</dd></div>
                <div><dt>Reactions</dt><dd>{siteTotals.reactions}</dd></div>
                <div><dt>Comments</dt><dd>{siteTotals.comments}</dd></div>
                <div><dt>Categories</dt><dd>{siteTotals.categories}</dd></div>
              </dl>
            </RailModule>
          </aside>
        </div>
      </main>

      <QuickPostDialog
        open={postDialogOpen}
        onClose={() => setPostDialogOpen(false)}
        onPosted={handlePostCreated}
      />

      <EditPostDialog
        open={Boolean(editingPost)}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSaved={handlePostEdited}
      />

      <SiteFooter />
    </div>
  );
}

export default App;
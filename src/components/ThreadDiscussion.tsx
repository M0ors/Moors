"use client";

import { useState } from "react";
import { togglePinPost } from "@/app/actions/threads";
import { Avatar } from "@/components/Avatar";
import { PostActions } from "@/components/PostActions";
import { PostImage } from "@/components/PostImage";
import { ReplyForm } from "@/components/ReplyForm";
import { Username } from "@/components/Username";
import { VoteButtons } from "@/components/VoteButtons";
import { censorText } from "@/lib/censor";
import { shouldBlurAvatar } from "@/lib/nsfw";
import type { PostNode } from "@/lib/posts";

type Props = {
  threadId: string;
  threadAuthorId: string;
  posts: PostNode[];
  currentUserId: string | null;
  isAdmin: boolean;
  canViewNsfwProfiles: boolean;
  canReply: boolean;
  threadIsAnonymous: boolean;
  userVotes: Record<string, number>;
  redirectTo: string;
};

const MAX_INDENT = 5;

function resolveBadge(author: PostNode["profiles"]) {
  const badge = Array.isArray(author?.display_badge)
    ? author?.display_badge[0]
    : author?.display_badge;
  return badge ?? null;
}

function PostItem({
  post,
  threadId,
  threadAuthorId,
  depth,
  currentUserId,
  isAdmin,
  canViewNsfwProfiles,
  canReply,
  threadIsAnonymous,
  userVotes,
  redirectTo,
  replyTo,
  setReplyTo,
}: {
  post: PostNode;
  threadId: string;
  threadAuthorId: string;
  depth: number;
  currentUserId: string | null;
  isAdmin: boolean;
  canViewNsfwProfiles: boolean;
  canReply: boolean;
  threadIsAnonymous: boolean;
  userVotes: Record<string, number>;
  redirectTo: string;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
}) {
  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const isAuthor = Boolean(currentUserId && post.author_id === currentUserId);
  const canPin = Boolean(
    currentUserId && (isAdmin || currentUserId === threadAuthorId)
  );
  const indent = Math.min(depth, MAX_INDENT);
  const bodyText = post.body.trim();
  const blurAvatar = shouldBlurAvatar({
    nsfwEnabled: author?.nsfw_enabled,
    isAdmin: author?.is_admin,
    viewerCanNsfw: canViewNsfwProfiles,
  });
  const canPreviewPending = isAuthor || isAdmin;
  const showAsAnon =
    threadIsAnonymous &&
    post.author_id === threadAuthorId &&
    !isAuthor &&
    !isAdmin;
  const badge = resolveBadge(author);

  return (
    <li
      className={`border rounded p-4 ${depth > 0 ? "border-l-4 border-l-neutral-300" : ""} ${
        post.is_pinned ? "bg-neutral-50" : ""
      }`}
      style={{ marginLeft: indent * 24 }}
    >
      <div className="text-sm text-neutral-600 mb-2 flex items-center gap-2 flex-wrap">
        {!showAsAnon ? (
          <Avatar
            username={author?.username}
            avatarUrl={author?.avatar_url}
            size={24}
            blurred={blurAvatar}
          />
        ) : null}
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          {showAsAnon ? (
            <span>Anonymous</span>
          ) : (
            <Username
              username={author?.username}
              isAdmin={author?.is_admin}
              color={author?.username_color}
              countryCode={author?.country_code}
              href={author?.username ? `/u/${author.username}` : null}
              badge={
                badge && (!badge.is_nsfw || canViewNsfwProfiles) ? badge : null
              }
            />
          )}
          {post.is_pinned ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
              Pinned
            </span>
          ) : null}
          <span>· {new Date(post.created_at).toLocaleString()}</span>
        </span>
      </div>

      {bodyText ? (
        <p className="whitespace-pre-wrap">
          {censorText(bodyText, canViewNsfwProfiles)}
        </p>
      ) : null}

      <PostImage
        imageUrl={post.image_url}
        imageApproved={post.image_approved}
        canPreviewPending={canPreviewPending}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <VoteButtons
          targetType="post"
          targetId={post.id}
          likeCount={post.like_count}
          dislikeCount={post.dislike_count}
          userVote={userVotes[post.id] ?? null}
          redirectTo={redirectTo}
          canVote={Boolean(currentUserId)}
        />
        {currentUserId && canReply ? (
          <button
            type="button"
            className="!bg-white !text-neutral-900 !px-2 !py-1 text-sm"
            onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
          >
            Reply
          </button>
        ) : null}
        {canPin ? (
          <form action={togglePinPost}>
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="thread_id" value={threadId} />
            <input
              type="hidden"
              name="is_pinned"
              value={post.is_pinned ? "false" : "true"}
            />
            <button type="submit" className="!bg-white !text-neutral-900 !px-2 !py-1 text-sm">
              {post.is_pinned ? "Unpin" : "Pin"}
            </button>
          </form>
        ) : null}
        <PostActions
          postId={post.id}
          threadId={threadId}
          body={bodyText || post.body}
          canEdit={isAuthor}
          canDelete={isAuthor || isAdmin}
        />
      </div>

      {replyTo === post.id && currentUserId && canReply ? (
        <div className="mt-4 pl-3 border-l-2 border-neutral-300">
          <ReplyForm
            threadId={threadId}
            parentId={post.id}
            autoFocus
            onCancel={() => setReplyTo(null)}
          />
        </div>
      ) : null}

      {post.children.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {post.children.map((child) => (
            <PostItem
              key={child.id}
              post={child}
              threadId={threadId}
              threadAuthorId={threadAuthorId}
              depth={depth + 1}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              canViewNsfwProfiles={canViewNsfwProfiles}
              canReply={canReply}
              threadIsAnonymous={threadIsAnonymous}
              userVotes={userVotes}
              redirectTo={redirectTo}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ThreadDiscussion({
  threadId,
  threadAuthorId,
  posts,
  currentUserId,
  isAdmin,
  canViewNsfwProfiles,
  canReply,
  threadIsAnonymous,
  userVotes,
  redirectTo,
}: Props) {
  const [replyTo, setReplyTo] = useState<string | null>(null);

  return (
    <div>
      <ul className="space-y-4">
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            threadId={threadId}
            threadAuthorId={threadAuthorId}
            depth={0}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            canViewNsfwProfiles={canViewNsfwProfiles}
            canReply={canReply}
            threadIsAnonymous={threadIsAnonymous}
            userVotes={userVotes}
            redirectTo={redirectTo}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
          />
        ))}
      </ul>

      {currentUserId && canReply ? (
        <div className="mt-8">
          <h2 className="font-medium mb-3">Reply to thread</h2>
          <ReplyForm threadId={threadId} />
        </div>
      ) : currentUserId && !canReply ? (
        <p className="mt-8 text-sm text-neutral-600">
          Only the original poster can reply in this sub-board.
        </p>
      ) : null}
    </div>
  );
}

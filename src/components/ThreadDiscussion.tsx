"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { togglePinPost } from "@/app/actions/threads";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar } from "@/components/Avatar";
import { PostActions } from "@/components/PostActions";
import { ReplyForm } from "@/components/ReplyForm";
import { VoteButtons } from "@/components/VoteButtons";
import type { PostNode } from "@/lib/posts";

type Props = {
  threadId: string;
  threadAuthorId: string;
  posts: PostNode[];
  currentUserId: string | null;
  isAdmin: boolean;
  userVotes: Record<string, number>;
  redirectTo: string;
};

const MAX_INDENT = 5;

function PostItem({
  post,
  threadId,
  threadAuthorId,
  depth,
  currentUserId,
  isAdmin,
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

  return (
    <li
      className={`border rounded p-4 ${depth > 0 ? "border-l-4 border-l-neutral-300" : ""} ${
        post.is_pinned ? "bg-neutral-50" : ""
      }`}
      style={{ marginLeft: indent * 24 }}
    >
      <div className="text-sm text-neutral-600 mb-2 flex items-center gap-2 flex-wrap">
        <Avatar username={author?.username} avatarUrl={author?.avatar_url} size={24} />
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          {author?.username ? (
            <Link href={`/u/${author.username}`}>{author.username}</Link>
          ) : (
            "unknown"
          )}
          {author?.is_admin ? <AdminBadge /> : null}
          {post.is_pinned ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
              Pinned
            </span>
          ) : null}
          <span>· {new Date(post.created_at).toLocaleString()}</span>
        </span>
      </div>

      {bodyText ? <p className="whitespace-pre-wrap">{bodyText}</p> : null}

      {post.image_url ? (
        <Image
          src={post.image_url}
          alt="Post attachment"
          width={800}
          height={600}
          className="mt-3 max-w-full h-auto rounded border"
        />
      ) : null}

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
        {currentUserId ? (
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

      {replyTo === post.id && currentUserId ? (
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
            userVotes={userVotes}
            redirectTo={redirectTo}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
          />
        ))}
      </ul>

      {currentUserId ? (
        <div className="mt-8">
          <h2 className="font-medium mb-3">Reply to thread</h2>
          <ReplyForm threadId={threadId} />
        </div>
      ) : null}
    </div>
  );
}

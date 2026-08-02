"use client";

import { useState } from "react";
import Image from "next/image";
import { AdminBadge } from "@/components/AdminBadge";
import { Avatar } from "@/components/Avatar";
import { PostActions } from "@/components/PostActions";
import { ReplyForm } from "@/components/ReplyForm";
import type { PostNode } from "@/lib/posts";

type Props = {
  threadId: string;
  posts: PostNode[];
  currentUserId: string | null;
  isAdmin: boolean;
};

const MAX_INDENT = 5;

function PostItem({
  post,
  threadId,
  depth,
  currentUserId,
  isAdmin,
  replyTo,
  setReplyTo,
}: {
  post: PostNode;
  threadId: string;
  depth: number;
  currentUserId: string | null;
  isAdmin: boolean;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
}) {
  const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const isAuthor = Boolean(currentUserId && post.author_id === currentUserId);
  const indent = Math.min(depth, MAX_INDENT);
  const bodyText = post.body.trim();

  return (
    <li
      className={`border rounded p-4 ${depth > 0 ? "border-l-4 border-l-neutral-300" : ""}`}
      style={{ marginLeft: indent * 24 }}
    >
      <div className="text-sm text-neutral-600 mb-2 flex items-center gap-2 flex-wrap">
        <Avatar username={author?.username} avatarUrl={author?.avatar_url} size={24} />
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          {author?.username ?? "unknown"}
          {author?.is_admin ? <AdminBadge /> : null}
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
        {currentUserId ? (
          <button
            type="button"
            className="!bg-white !text-neutral-900 !px-2 !py-1 text-sm"
            onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
          >
            Reply
          </button>
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
              depth={depth + 1}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
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
  posts,
  currentUserId,
  isAdmin,
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
            depth={0}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
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

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { createComment, acceptAnswer } from "../../actions";

interface Profile {
  id: string;
  display_name: string;
  department: string;
  graduation_year: number | null;
  reputation_points: number;
  avatar_url: string | null;
  role: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_accepted: boolean;
  created_at: string;
  profiles?: Profile | null;
}

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: "discussion" | "announcement" | "event" | "resource" | "club_update" | "qa";
  created_at: string;
  profiles?: Profile | null;
}

interface PostThreadProps {
  post: Post;
  comments: Comment[];
  currentUserId: string | null;
}

export default function PostThread({ post, comments, currentUserId }: PostThreadProps) {
  const [rootCommentInput, setRootCommentInput] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const isPostAuthor = currentUserId === post.user_id;
  const isQA = post.category === "qa";

  // Organize comments tree: Level 1 (parent_id = null), Level 2 (nested replies)
  const rootComments = comments.filter((c) => c.parent_id === null);
  const replies = comments.filter((c) => c.parent_id !== null);

  // Group root comments to put accepted ones at the top
  const sortedRootComments = [...rootComments].sort((a, b) => {
    if (a.is_accepted && !b.is_accepted) return -1;
    if (!a.is_accepted && b.is_accepted) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const handlePostRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCommentInput.trim()) return;

    startTransition(async () => {
      try {
        await createComment(post.id, rootCommentInput, null);
        setRootCommentInput("");
        window.location.reload();
      } catch (err) {
        console.error("Failed to add comment:", err);
      }
    });
  };

  const handlePostReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    startTransition(async () => {
      try {
        await createComment(post.id, replyInput, parentId);
        setReplyInput("");
        setActiveReplyId(null);
        window.location.reload();
      } catch (err) {
        console.error("Failed to add reply:", err);
      }
    });
  };

  const handleAcceptAnswer = (commentId: string) => {
    startTransition(async () => {
      try {
        await acceptAnswer(commentId, post.id);
        window.location.reload();
      } catch (err) {
        console.error("Failed to accept answer:", err);
      }
    });
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 select-none font-sans relative">
      
      {/* Header */}
      <div className="text-center mb-6 max-w-xl">
        <h1 className="font-display text-4xl font-bold tracking-wide text-ink">
          Campus Discussion
        </h1>
        <p className="font-hand text-lg text-ink-soft mt-1">
          Bulletin board thread details
        </p>
      </div>

      {/* Main Double-Wide Card */}
      <div 
        className="relative w-full max-w-2xl p-8 bg-pod-surface border border-pod-border text-ink pod-aura blob-shape shadow-lg overflow-hidden"
        style={{ "--aura-gradient": "linear-gradient(135deg, #B98CF0, #F08CD8)" } as React.CSSProperties}
      >
        
        {/* Back Link */}
        <div className="absolute top-4 right-4">
          <Link href="/community" className="font-sans text-xs text-ink-soft hover:underline">
            Back to board
          </Link>
        </div>

        {/* Main Post Section */}
        <div className="space-y-4 pb-6 border-b border-pod-border relative">
          <div>
            <span className="font-mono text-[9px] text-purple-500 uppercase tracking-widest block font-bold mb-1">
              Category: {post.category}
            </span>
            <h2 className="font-display text-2xl font-bold tracking-wide leading-tight">
              {post.title}
            </h2>
            <span className="font-sans text-[10px] text-ink-soft mt-1 block">
              Posted by {post.profiles?.display_name} • {new Date(post.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <p className="font-sans text-xs text-ink leading-relaxed whitespace-pre-line bg-base p-4 border border-pod-border rounded-xl">
            {post.content}
          </p>
        </div>

        {/* Comment Input Form */}
        {currentUserId && (
          <form onSubmit={handlePostRootComment} className="my-6 space-y-3">
            <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider block">
              Leave a Reply
            </span>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Write your comment reply..."
                value={rootCommentInput}
                onChange={(e) => setRootCommentInput(e.target.value)}
                className="flex-1 bg-base border border-pod-border rounded-full px-4 py-2 outline-none text-xs focus:ring-2 focus:ring-purple-350/30"
              />
              <button
                type="submit"
                disabled={isPending}
                className="shrink-0 px-5 bg-gradient-violet text-white rounded-full text-xs font-semibold hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                Comment
              </button>
            </div>
          </form>
        )}

        {/* Comments Feed Area */}
        <div className="space-y-6 mt-8">
          <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider block border-b border-dashed border-pod-border pb-2">
            Discussion Feed ({comments.length})
          </span>

          {sortedRootComments.length === 0 ? (
            <div className="text-center font-hand text-ink-soft italic py-6">
              No replies yet. Be the first to start the discussion!
            </div>
          ) : (
            <div className="space-y-6">
              {sortedRootComments.map((comment) => {
                const commentReplies = replies.filter((r) => r.parent_id === comment.id);

                return (
                  <div
                    key={comment.id}
                    className={`p-4 border border-pod-border rounded-2xl relative flex flex-col justify-between transition-all ${
                      comment.is_accepted
                        ? "bg-green-500/5 border-green-300 ring-1 ring-green-300/30 scale-[1.01]"
                        : "bg-base/30"
                    }`}
                  >
                    
                    {/* Solved Answer Stamp */}
                    {comment.is_accepted && (
                      <div className="absolute -top-2.5 right-4 bg-green-600 text-white font-sans text-[8.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs select-none pointer-events-none">
                        ✔ Solved Answer
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold">
                          {comment.profiles?.display_name} ({comment.profiles?.role})
                        </span>
                        <span className="text-ink-soft">
                          {new Date(comment.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="font-sans text-xs text-ink whitespace-pre-line leading-relaxed">
                        {comment.content}
                      </p>
                    </div>

                    {/* Comment Controls: Accept Q&A, Reply Toggle */}
                    <div className="flex gap-4 mt-3 pt-3 border-t border-pod-border text-[10px]">
                      {currentUserId && (
                        <button
                          onClick={() => {
                            setActiveReplyId(activeReplyId === comment.id ? null : comment.id);
                            setReplyInput("");
                          }}
                          className="font-sans text-purple-600 hover:text-amber-500 cursor-pointer underline font-semibold"
                        >
                          Reply
                        </button>
                      )}

                      {isQA && isPostAuthor && !comment.is_accepted && (
                        <button
                          onClick={() => handleAcceptAnswer(comment.id)}
                          className="font-sans text-green-600 hover:text-green-700 cursor-pointer underline font-bold"
                        >
                          ✔ Mark as Accepted Answer
                        </button>
                      )}
                    </div>

                    {/* Inline Reply input */}
                    {activeReplyId === comment.id && (
                      <form
                        onSubmit={(e) => handlePostReply(e, comment.id)}
                        className="mt-3 pt-3 border-t border-dashed border-pod-border flex gap-2"
                      >
                        <input
                          type="text"
                          placeholder="Write reply..."
                          value={replyInput}
                          onChange={(e) => setReplyInput(e.target.value)}
                          className="flex-1 bg-base border border-pod-border rounded-full px-3 py-1 text-xs focus:ring-2 focus:ring-purple-300/30 outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="shrink-0 px-4 bg-gradient-violet text-white rounded-full text-[10px] font-semibold hover:opacity-95"
                        >
                          Reply
                        </button>
                      </form>
                    )}

                    {/* Recursive Level 2 replies nested list */}
                    {commentReplies.length > 0 && (
                      <div className="mt-4 pl-4 border-l border-dashed border-pod-border space-y-4">
                        {commentReplies.map((rep) => (
                          <div key={rep.id} className="p-3 bg-base border border-pod-border rounded-xl">
                            <div className="flex justify-between items-center text-[9px] mb-1">
                              <span className="font-bold text-ink/80">
                                {rep.profiles?.display_name} ({rep.profiles?.role})
                              </span>
                              <span className="text-ink-soft">
                                {new Date(rep.created_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="font-sans text-xs text-ink-soft leading-relaxed">
                              {rep.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

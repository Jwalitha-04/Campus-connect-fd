"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { playSprite } from "@/utils/audio";
import { createPost, toggleReaction } from "./actions";

interface Profile {
  id: string;
  display_name: string;
  role: string;
}

interface Reaction {
  id: string;
  user_id: string;
  post_id: string;
  reaction_type: "heart" | "pin" | "check";
}

interface Comment {
  id: string;
}

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: "discussion" | "announcement" | "event" | "resource" | "club_update" | "qa";
  created_at: string;
  profiles?: Profile | null;
  post_reactions?: Reaction[] | null;
  comments?: Comment[] | null;
}

const CATEGORIES = [
  { value: "all", label: "All Topics" },
  { value: "discussion", label: "💬 Discussion" },
  { value: "announcement", label: "📢 Announcement" },
  { value: "qa", label: "❓ Q&A Thread" },
  { value: "resource", label: "📎 Study Resource" },
  { value: "event", label: "📅 Campus Event" },
  { value: "club_update", label: "🏛️ Club Update" },
];


function RisoCommunityPostCard({
  post,
  currentUser,
  isPending,
  onReactionClick,
  index
}: {
  post: CommunityPost;
  currentUser: any;
  isPending: boolean;
  onReactionClick: (postId: string, reactionType: "heart" | "pin" | "check") => void;
  index: number;
}) {
  const [tornTabs, setTornTabs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userReactions = post.post_reactions || [];
  const heartActive = userReactions.some((r) => r.reaction_type === "heart" && r.user_id === currentUser?.id);
  const pinActive = userReactions.some((r) => r.reaction_type === "pin" && r.user_id === currentUser?.id);
  const checkActive = userReactions.some((r) => r.reaction_type === "check" && r.user_id === currentUser?.id);

  const isResource = post.category === "resource";
  const isFreshInk = mounted && (new Date().getTime() - new Date(post.created_at).getTime()) < 120 * 60 * 1000;

  const handleTear = (label: string, href: string) => {
    playSprite("tear");
    setTornTabs((prev) => [...prev, label]);
    setTimeout(() => {
      window.location.href = href;
    }, 600);
  };

  const rotation = index % 3 === 0 ? "rotate-0.5" : index % 3 === 1 ? "-rotate-0.5" : "rotate-1";

  return (
    <div
      className={`break-inside-avoid relative p-5 pt-8 pb-3 bg-riso-violet-paper border-2 border-ink-black text-ink-black animate-press-print-in shadow-[3px_3px_0px_rgba(30,27,24,0.18)] flex flex-col group hover:shadow-[5px_5px_0px_rgba(30,27,24,0.28)] transition-all hover:scale-[1.01] duration-300 ${rotation}`}
      style={{ "--section-ink": "var(--riso-violet)" } as React.CSSProperties}
    >
      {/* Staple */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-staple-snap">
        <svg width="20" height="10" viewBox="0 0 20 10">
          <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Stamp */}
      <div className="absolute top-6 right-6 text-riso-violet/20 stamp-circle select-none font-bold">
        ZINE #{index + 1}
      </div>

      {/* Category & Pin */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-paper-stock bg-riso-violet border border-ink-black shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
          {post.category}
        </span>
        <div className="flex gap-1.5 items-center">
          {isFreshInk && (
            <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-riso-orange bg-riso-orange-paper border border-dashed border-riso-orange/40 px-1.5 py-0.5 animate-pulse">
              💧 Fresh Ink
            </span>
          )}
          {pinActive && (
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-riso-orange bg-riso-violet-paper border border-dashed border-riso-orange/40 px-2 py-0.5 animate-pulse">
              📌 Pinned
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <Link href={`/community/post/${post.id}`} className="relative block">
        <h3 className="font-display text-lg uppercase leading-tight mb-2 text-ink-black hover:opacity-85 tracking-tight relative z-10">
          {post.title}
          <span 
            className="absolute inset-0 select-none pointer-events-none font-display text-lg uppercase leading-tight text-riso-violet"
            style={{
              transform: "translate(var(--misalign-offset, 1.5px), var(--misalign-offset, 1.5px))",
              opacity: "calc(var(--ink-opacity, 0.75) * 0.45)",
              color: "var(--section-ink, var(--riso-violet))",
              zIndex: -1
            }}
          >
            {post.title}
          </span>
        </h3>
      </Link>

      {/* Content */}
      <p className="font-sans text-xs text-ink-black/75 leading-relaxed line-clamp-4 mb-4 whitespace-pre-line">
        {post.content}
      </p>

      {isResource && (
        <div className="mb-4 text-[9px] font-mono text-ink-black/60 bg-paper-stock border border-dashed border-ink-black/20 p-2 text-center">
          📎 Attached Study Resource File
        </div>
      )}

      {/* Meta details */}
      <div className="mt-auto border-t border-dashed border-ink-black/30 pt-3 flex justify-between items-center text-[10px] mb-4">
        <div className="flex flex-col">
          <span className="font-bold">{post.profiles?.display_name || "Campus Member"} ({post.profiles?.role || "student"})</span>
          <span className="text-ink-black/50 font-mono text-[9px]">
            {new Date(post.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Reactions block */}
      {currentUser && (
        <div className="flex justify-between gap-1.5 border-t border-dashed border-ink-black/25 mt-1 pt-3 mb-4">
          <button
            onClick={() => onReactionClick(post.id, "heart")}
            disabled={isPending}
            className={`flex-1 py-1 border text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              heartActive
                ? "bg-riso-orange/15 border-riso-orange text-riso-orange shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
                : "border-dashed border-ink-black/35 hover:bg-ink-black/5"
            }`}
          >
            <span>❤️</span>
            <span>{userReactions.filter((r) => r.reaction_type === "heart").length}</span>
          </button>

          <button
            onClick={() => onReactionClick(post.id, "pin")}
            disabled={isPending}
            className={`flex-1 py-1 border text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              pinActive
                ? "bg-riso-violet/15 border-riso-violet text-riso-violet shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
                : "border-dashed border-ink-black/35 hover:bg-ink-black/5"
            }`}
          >
            <span>📌</span>
            <span>{userReactions.filter((r) => r.reaction_type === "pin").length}</span>
          </button>

          <button
            onClick={() => onReactionClick(post.id, "check")}
            disabled={isPending}
            className={`flex-1 py-1 border text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              checkActive
                ? "bg-success-ink/15 border-success-ink text-success-ink shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
                : "border-dashed border-ink-black/35 hover:bg-ink-black/5"
            }`}
          >
            <span>✔</span>
            <span>{userReactions.filter((r) => r.reaction_type === "check").length}</span>
          </button>
        </div>
      )}

      {/* Perforated join/reply fringe */}
      <div className="perf-line pt-3 flex justify-between gap-1 overflow-hidden">
        {["JOIN", "STUB"].map((tab) => {
          const isTorn = tornTabs.includes(tab);
          const targetHref = `/community/post/${post.id}`;
          return (
            <button
              key={tab}
              disabled={isTorn}
              onClick={() => handleTear(tab, targetHref)}
              className={`flex-1 min-h-[44px] text-center font-mono text-[9px] font-bold border border-dashed border-ink-black/30 bg-paper-stock text-ink-black py-2 px-1 transition-all ${
                isTorn 
                  ? "animate-tab-tear pointer-events-none opacity-0" 
                  : "hover:bg-ink-black/5 cursor-pointer hover:border-ink-black"
              }`}
            >
              {isTorn ? "TORN" : (
                <div className="flex flex-col items-center">
                  <span>{tab}</span>
                  <span className="text-[7.5px] font-normal text-ink-black/60">Replies ({post.comments?.length || 0})</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CommunityBoardPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  // Print Adjustments
  const [inkDensity, setInkDensity] = useState(0.8);
  const [misalignment, setMisalignment] = useState(1.5);

  // Live Preview Form bindings
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("discussion");

  // Weekly edition print simulator state
  const [zineModalOpen, setZineModalOpen] = useState(false);
  const [zineStep, setZineStep] = useState<"idle" | "press_start" | "drum_spin" | "stamp_plate" | "ready">("idle");
  const [zineProgress, setZineProgress] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Form State
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function initPage() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      fetchPosts();
    }
    initPage();
  }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(*), post_reactions(*), comments(id)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as CommunityPost[]);
    }
    setLoading(false);
  }

  // Filter posts
  useEffect(() => {
    let result = posts;

    if (activeCategory !== "all") {
      result = result.filter((post) => post.category === activeCategory);
    }

    if (search.trim() !== "") {
      const query = search.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(result);
  }, [posts, activeCategory, search]);

  const handlePostSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as any;

    if (!title || !content || !category) {
      setFormError("All fields are required.");
      return;
    }

    startTransition(async () => {
      try {
        const form = new FormData();
        form.append("title", title);
        form.append("content", content);
        form.append("category", category);
        const result = await createPost(form);
        if (result.error) {
          setFormError(result.error);
        } else {
          setFormSuccess(true);
          setNewTitle("");
          setNewContent("");
          formEl.reset();
          fetchPosts();
        }
      } catch (err: any) {
        setFormError(err.message);
      }
    });
  };

  const handleReactionClick = async (postId: string, reactionType: "heart" | "pin" | "check") => {
    if (!currentUser) return;

    startTransition(async () => {
      try {
        await toggleReaction(postId, reactionType);
        fetchPosts();
      } catch (err) {
        console.error("Failed to toggle reaction:", err);
      }
    });
  };

  const handleStartZinePress = () => {
    playSprite("bloom");
    setZineModalOpen(true);
    setZineStep("press_start");
    setZineProgress(0);

    setTimeout(() => {
      setZineStep("drum_spin");
      playSprite("thock");
      
      let prog = 0;
      const interval = setInterval(() => {
        prog += 5;
        setZineProgress(prog);
        if (prog >= 40) {
          clearInterval(interval);
          setZineStep("stamp_plate");
          playSprite("thock");
          
          const intervalStamp = setInterval(() => {
            prog += 6;
            setZineProgress(prog);
            if (prog >= 85) {
              clearInterval(intervalStamp);
              setZineStep("ready");
              playSprite("tear");
              setZineProgress(100);
            }
          }, 120);
        }
      }, 80);
    }, 1200);
  };

  return (
    <div className="w-full min-h-screen p-6 flex flex-col font-sans select-none relative max-w-7xl mx-auto">
      
      {/* Riso Zine Printer Running Press Overlay Modal */}
      {zineModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div className="relative w-full max-w-4xl p-6 md:p-8 bg-paper-stock border-2 border-ink-black text-ink-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Close */}
            <button
              onClick={() => setZineModalOpen(false)}
              className="absolute top-4 right-4 font-mono text-xs font-bold border border-ink-black px-2 py-1 bg-paper-stock hover:bg-ink-black/5 active:translate-y-0.5 cursor-pointer shadow-[1px_1px_0px_rgba(0,0,0,0.15)]"
            >
              CLOSE PRESS
            </button>

            {zineStep !== "ready" ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="w-16 h-16 border-4 border-dashed border-riso-violet border-t-transparent animate-spin" />
                <div className="text-center space-y-2">
                  <h3 className="font-display text-2xl uppercase tracking-wide">
                    {zineStep === "press_start" && "Initializing Risograph Edition..."}
                    {zineStep === "drum_spin" && "Inking Drum Spinning (Paper Feed)..."}
                    {zineStep === "stamp_plate" && "Stamping Violet Riso Plates..."}
                  </h3>
                  <p className="font-hand text-lg text-riso-violet animate-pulse">
                    Please do not touch the cylinders.
                  </p>
                </div>
                <div className="w-full max-w-md bg-paper-stock border-2 border-ink-black h-6 p-0.5 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                  <div 
                    className="bg-riso-violet h-full transition-all duration-100" 
                    style={{ width: `${zineProgress}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-bold">{zineProgress}% complete</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="font-display text-3xl uppercase tracking-tight text-riso-violet">
                    🖨️ WEEKLY ZINE RUN COMPLETE
                  </h3>
                  <p className="font-hand text-lg text-ink-black/70">
                    Your community news publication is fresh off the press bed!
                  </p>
                </div>

                {/* Zine Layout Booklet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-2 border-ink-black p-6 bg-[#FAF7F2] shadow-[3px_3px_0px_rgba(0,0,0,0.18)] min-h-[400px]">
                  
                  {/* Left Booklet Page: Cover */}
                  <div className="border-r border-dashed border-ink-black/30 pr-0 md:pr-6 flex flex-col justify-between">
                    <div>
                      <div className="border-b border-ink-black pb-3 mb-4">
                        <span className="font-mono text-[9px] font-bold text-riso-orange tracking-widest block uppercase">
                          Risograph Edition • Vol. 1
                        </span>
                        <h4 className="font-display text-3.5xl uppercase leading-none tracking-tight text-ink-black mt-1">
                          CAMPUS<br/>CHRONICLE
                        </h4>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="font-sans text-xs italic leading-relaxed text-ink-black/85">
                          "This zine aggregates the latest thoughts, announcement bulletins, Q&As, and study attachments published by our student community."
                        </p>
                        
                        <div className="p-4 bg-riso-yellow-paper border border-dashed border-ink-black/40 text-xs font-mono space-y-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.1)]">
                          <strong className="block text-[10px] text-ink-black/60 uppercase tracking-wider">Board Statistics</strong>
                          <div>📰 Total Bulletins: {posts.length}</div>
                          <div>💬 Attached Resources: {posts.filter(p => p.category === 'resource').length}</div>
                          <div>❓ Pending Q&As: {posts.filter(p => p.category === 'qa').length}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-ink-black/20 flex justify-between items-center">
                      <div className="stamp-circle text-riso-violet border-riso-violet w-14 h-14 select-none font-bold text-[7px] leading-tight">
                        WEEKLY<br/>RUN
                      </div>
                      <span className="font-mono text-[8px] opacity-50">Page 1</span>
                    </div>
                  </div>

                  {/* Right Booklet Page: Hot Bulletins */}
                  <div className="flex flex-col justify-between pl-0 md:pl-2">
                    <div>
                      <div className="border-b border-ink-black pb-3 mb-4">
                        <h5 className="font-display text-sm uppercase tracking-wider text-riso-violet">
                          FEATURED DISCUSSIONS
                        </h5>
                      </div>

                      <div className="space-y-4">
                        {posts.slice(0, 3).map((p, idx) => (
                          <div key={p.id} className="text-xs">
                            <span className="font-mono text-[9px] font-bold uppercase text-riso-orange mr-1.5">
                              #{idx + 1}
                            </span>
                            <span className="font-display text-xs uppercase tracking-tight text-ink-black">
                              {p.title}
                            </span>
                            <p className="font-sans text-[10px] text-ink-black/70 line-clamp-2 mt-0.5">
                              {p.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-ink-black/20 flex justify-between items-center">
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 border-2 border-ink-black bg-riso-violet text-paper-stock font-mono text-[10px] font-bold uppercase hover:bg-riso-violet/90 active:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.18)]"
                      >
                        🖨️ SEND TO PRINTER
                      </button>
                      <span className="font-mono text-[8px] opacity-50">Page 2</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-2 border-ink-black pb-6 -rotate-0.5">
        <div className="text-center md:text-left pl-16">
          <Link href="/">
            <h1 className="riso-ghost-color font-display text-4.5xl uppercase leading-none tracking-tight text-ink-black hover:opacity-85 transition-opacity" data-text="Community Press Run" style={{ "--section-ink": "var(--riso-violet)" } as React.CSSProperties}>
              Community Press Run
            </h1>
          </Link>
          <p className="font-hand text-xl text-riso-violet mt-2">
            {"\"Drift and discuss notice bulletins, Q&As, and club updates\""}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            onClick={handleStartZinePress}
            className="font-mono text-xs font-bold text-white bg-riso-violet hover:bg-riso-violet/90 px-3.5 py-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.15)] border-2 border-ink-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            🖨️ RUN WEEKLY EDITION
          </button>
          <Link
            href="/"
            className="font-mono text-xs font-bold text-riso-violet hover:underline border border-dashed border-riso-violet px-3 py-1.5 hover:bg-riso-violet/5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.1)] flex items-center"
          >
            ← BACK TO RUNS
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 pt-4">
        
        {/* Left Column: Post Form & Sidebar Filters */}
        <aside className="w-full lg:w-72 space-y-6">
          
          {/* Post Form */}
          <div className="p-6 bg-riso-orange-paper border-2 border-ink-black text-ink-black shadow-[3px_3px_0px_rgba(30,27,24,0.2)]">
            <span className="font-mono text-[10px] font-bold text-ink-black/60 uppercase tracking-wider block mb-3 border-b border-dashed border-ink-black/30 pb-2">
              Publish Board Bulletin
            </span>
            <form onSubmit={handlePostSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 border border-dashed border-red-500 text-red-500 text-xs font-mono">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 border border-dashed border-success-ink text-success-ink text-xs font-mono font-bold">
                  🎉 Notice printed!
                </div>
              )}

              <div>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Bulletin Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 text-xs font-mono focus:border-solid focus:border-riso-violet focus:ring-1 focus:ring-riso-violet"
                />
              </div>

              <div>
                <textarea
                  name="content"
                  required
                  placeholder="Write details..."
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 text-xs font-mono focus:border-solid focus:border-riso-violet focus:ring-1 focus:ring-riso-violet resize-none"
                />
              </div>

              <div>
                <select
                  name="category"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 text-xs font-mono focus:border-solid focus:border-riso-violet focus:ring-1 focus:ring-riso-violet"
                >
                  <option value="discussion" className="bg-paper-stock">💬 Discussion</option>
                  <option value="announcement" className="bg-paper-stock">📢 Announcement</option>
                  <option value="qa" className="bg-paper-stock">❓ Q&A Thread</option>
                  <option value="resource" className="bg-paper-stock">📎 Study Resource</option>
                  <option value="event" className="bg-paper-stock">📅 Campus Event</option>
                  <option value="club_update" className="bg-paper-stock">🏛️ Club Update</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center min-h-[40px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-paper-stock text-ink-black hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? "PRINTING..." : "PRINT NOTICE"}
              </button>
            </form>
          </div>

          {/* Live Preview Card */}
          {(newTitle || newContent) && (
            <div className="p-5 bg-riso-violet-paper border-2 border-ink-black text-ink-black shadow-[2px_2px_0px_rgba(30,27,24,0.15)] flex flex-col relative rotate-0.5 animate-pulse">
              <span className="font-mono text-[7px] font-bold text-ink-black/40 uppercase tracking-widest block mb-2">
                🖨️ Live Press Preview
              </span>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-riso-violet text-paper-stock border border-ink-black">
                  {newCategory}
                </span>
                <span className="font-mono text-[7px] font-bold text-riso-orange uppercase tracking-wider">
                  💧 fresh ink
                </span>
              </div>
              <h4 className="font-display text-sm uppercase leading-tight mb-1 text-ink-black tracking-tight relative">
                {newTitle || "Untitled bulletin"}
              </h4>
              <p className="font-sans text-[10px] text-ink-black/70 leading-normal line-clamp-3 mb-2 whitespace-pre-line">
                {newContent || "Start typing details to preview..."}
              </p>
              <div className="border-t border-dashed border-ink-black/20 pt-2 flex justify-between items-center text-[8px]">
                <span className="font-bold">You (student)</span>
                <span className="text-ink-black/45 font-mono">Today</span>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="p-6 bg-riso-yellow-paper border-2 border-ink-black text-ink-black shadow-[3px_3px_0px_rgba(30,27,24,0.2)] space-y-6">
            <div>
              <span className="font-mono text-[10px] font-bold text-ink-black/60 uppercase tracking-wider block mb-3 border-b border-dashed border-ink-black/30 pb-2">
                Search Notice
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-1.5 font-mono text-xs focus:border-solid focus:border-riso-violet focus:ring-1 focus:ring-riso-violet"
              />
            </div>

            <div>
              <span className="font-mono text-[10px] font-bold text-ink-black/60 uppercase tracking-wider block mb-3 border-b border-dashed border-ink-black/30 pb-2">
                Interactive Press Bed Adjustments
              </span>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] font-bold text-ink-black/60">
                    <span>PLATE ALIGNMENT</span>
                    <span>{misalignment}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="6" 
                    step="0.5"
                    value={misalignment}
                    onChange={(e) => setMisalignment(parseFloat(e.target.value))}
                    className="w-full accent-riso-violet cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] font-bold text-ink-black/60">
                    <span>INK DENSITY</span>
                    <span>{Math.round(inkDensity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="1.5" 
                    step="0.1"
                    value={inkDensity}
                    onChange={(e) => setInkDensity(parseFloat(e.target.value))}
                    className="w-full accent-riso-violet cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5 flex flex-col">
              <span className="font-mono text-[10px] font-bold text-ink-black/60 uppercase tracking-wider block mb-1.5">
                Categories
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`text-left text-xs py-1.5 px-3 border border-dashed transition-all cursor-pointer font-mono ${
                    activeCategory === cat.value ? "border-solid border-2 border-ink-black bg-riso-violet text-paper-stock shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.15)]" : "border-transparent hover:border-ink-black/30 text-ink-black/70"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* Right Column: Feed Grid */}
        <main 
          className="flex-1"
          style={{ 
            "--ink-opacity": inkDensity,
            "--misalign-offset": `${misalignment}px`
          } as React.CSSProperties}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-dashed border-riso-violet border-t-transparent animate-spin mb-4" />
              <span className="font-hand text-lg text-riso-violet animate-pulse">
                Running the press...
              </span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-paper-stock border-2 border-dashed border-ink-black/30">
              <span className="font-hand text-xl text-ink-black/60 italic block">
                No active bulletin notices printed.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 pb-4">
              {filteredPosts.map((post, idx) => (
                <RisoCommunityPostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  isPending={isPending}
                  onReactionClick={handleReactionClick}
                  index={idx}
                />
              ))}
            </div>
          )}

        </main>

      </div>
    </div>
  );
}





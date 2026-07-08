"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { playSprite } from "@/utils/audio";
import { addSkillListing, createSwapMatch } from "./actions";

interface Profile {
  id: string;
  display_name: string;
  department: string;
  avatar_url: string | null;
  reputation_points: number;
}

interface SkillListing {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  type: "offering" | "wanting";
  proficiency_level: string;
  availability: string;
  created_at: string;
  profiles?: Profile | null;
}

interface SwapMatch {
  id: string;
  proposer_id: string;
  receiver_id: string;
  status: "pending" | "active" | "completed" | "cancelled";
  proposer_skill_id: string;
  receiver_skill_id: string;
  created_at: string;
  proposer_profile?: Profile | null;
  receiver_profile?: Profile | null;
  proposer_skill?: { name: string } | null;
  receiver_skill?: { name: string } | null;
}

const CATEGORIES = ["Programming", "Mathematics", "Languages", "Physics & Chemistry", "Music & Arts", "Business", "Other"];

// Riso Skill Listing Card with Tear-Off SWAP Tab
function RisoSkillListingCard({ 
  listing, 
  currentUser, 
  onPropose,
  index
}: { 
  listing: SkillListing; 
  currentUser: any; 
  onPropose: (listingId: string, userId: string) => Promise<void>;
  index: number;
}) {
  const [tornTabs, setTornTabs] = useState<string[]>([]);
  const isOwnListing = listing.user_id === currentUser?.id;
  const isVerified = (listing.profiles?.reputation_points || 0) >= 100;

  const handleTear = async (label: string) => {
    playSprite("tear");
    setTornTabs((prev) => [...prev, label]);
    setTimeout(async () => {
      await onPropose(listing.id, listing.user_id);
    }, 600);
  };

  const rotation = index % 3 === 0 ? "rotate-0.5" : index % 3 === 1 ? "-rotate-0.5" : "rotate-1";

  return (
    <div
      className={`break-inside-avoid relative p-5 pt-8 pb-3 bg-riso-marine-paper border-2 border-ink-black text-ink-black animate-press-print-in shadow-[3px_3px_0px_rgba(30,27,24,0.18)] flex flex-col group hover:shadow-[5px_5px_0px_rgba(30,27,24,0.28)] transition-all hover:scale-[1.01] duration-300 ${rotation}`}
      style={{ "--section-ink": "var(--riso-marine)" } as React.CSSProperties}
    >
      {/* Staple */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-staple-snap">
        <svg width="20" height="10" viewBox="0 0 20 10">
          <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Stamp */}
      <div className="absolute top-6 right-6 text-riso-marine/20 stamp-circle select-none font-bold">
        SWAP #{index + 1}
      </div>

      {/* Tags */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-paper-stock bg-riso-marine border border-ink-black shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
          {listing.category}
        </span>
        {isVerified && (
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-success-ink bg-riso-marine-paper border border-dashed border-success-ink/40 px-2 py-0.5">
            ⭐ Verified
          </span>
        )}
      </div>

      {/* Headline */}
      <h3 className="font-display text-lg uppercase leading-tight mb-2 text-ink-black tracking-tight">
        {listing.name}
      </h3>

      {/* Description */}
      <p className="font-sans text-xs text-ink-black/75 leading-relaxed line-clamp-3 mb-4">
        {listing.description}
      </p>

      {/* Meta details */}
      <div className="mt-auto border-t border-dashed border-ink-black/30 pt-3 space-y-1 relative text-[10px] mb-4">
        <div className="flex justify-between">
          <span className="font-mono uppercase text-ink-black/50">Level</span>
          <span className="font-sans font-bold capitalize">{listing.proficiency_level}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-mono uppercase text-ink-black/50">Times</span>
          <span className="font-sans font-bold line-clamp-1 max-w-[120px] text-right">{listing.availability}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-dashed border-ink-black/20">
          <span className="font-mono uppercase text-ink-black/50">By</span>
          <span className="font-sans font-bold">{listing.profiles?.display_name || "Campus Member"}</span>
        </div>
      </div>

      {/* Proposal Actions */}
      {!isOwnListing ? (
        <div className="perf-line pt-3 flex justify-between gap-1 overflow-hidden">
          {["SWAP", "STUB"].map((tab) => {
            const isTorn = tornTabs.includes(tab);
            return (
              <button
                key={tab}
                disabled={isTorn}
                onClick={() => handleTear(tab)}
                className={`flex-1 min-h-[44px] text-center font-mono text-[9px] font-bold border border-dashed border-ink-black/30 bg-paper-stock text-ink-black py-2 px-1 transition-all ${
                  isTorn 
                    ? "animate-tab-tear pointer-events-none opacity-0" 
                    : "hover:bg-ink-black/5 cursor-pointer hover:border-ink-black"
                }`}
              >
                {isTorn ? "TORN" : (
                  <div className="flex flex-col items-center">
                    <span>{tab}</span>
                    <span className="text-[7.5px] font-normal text-ink-black/60">#{listing.id.slice(0, 4)}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="perf-line pt-3 text-center text-[9px] font-mono text-ink-black/50">
          YOUR FLYER
        </div>
      )}
    </div>
  );
}

export default function SkillSwapBoardPage() {
  const [activeTab, setActiveTab] = useState<"offering" | "wanting" | "suggestions">("offering");
  const [listings, setListings] = useState<SkillListing[]>([]);
  const [suggestions, setSuggestions] = useState<SwapMatch[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    async function initPage() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        fetchSuggestions(user.id);
      }
      fetchListings();
    }
    initPage();
  }, []);

  async function fetchListings() {
    const { data, error } = await supabase
      .from("skills")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setListings(data as SkillListing[]);
    }
  }

  async function fetchSuggestions(userId: string) {
    const { data, error } = await supabase
      .from("swap_matches")
      .select(`
        id,
        proposer_id:user_a_id,
        receiver_id:user_b_id,
        proposer_skill_id:skill_offered_by_a,
        receiver_skill_id:skill_offered_by_b,
        status,
        created_at,
        proposer_profile:profiles!swap_matches_user_a_id_fkey(*),
        receiver_profile:profiles!swap_matches_user_b_id_fkey(*),
        proposer_skill:skills!swap_matches_skill_offered_by_a_fkey(name),
        receiver_skill:skills!swap_matches_skill_offered_by_b_fkey(name)
      `)
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mappedSuggestions = (data as any[]).map((item) => ({
        id: item.id,
        proposer_id: item.proposer_id,
        receiver_id: item.receiver_id,
        proposer_skill_id: item.proposer_skill_id,
        receiver_skill_id: item.receiver_skill_id,
        status: item.status,
        created_at: item.created_at,
        proposer_profile: Array.isArray(item.proposer_profile) ? item.proposer_profile[0] : item.proposer_profile,
        receiver_profile: Array.isArray(item.receiver_profile) ? item.receiver_profile[0] : item.receiver_profile,
        proposer_skill: Array.isArray(item.proposer_skill) ? item.proposer_skill[0] : item.proposer_skill,
        receiver_skill: Array.isArray(item.receiver_skill) ? item.receiver_skill[0] : item.receiver_skill,
      }));
      setSuggestions(mappedSuggestions as SwapMatch[]);
    }
  }

  const handlePostListing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const type = formData.get("type") as "offering" | "wanting";
    const proficiency_level = formData.get("proficiency_level") as string;
    const availability = formData.get("availability") as string;

    if (!name || !description || !category || !type || !proficiency_level || !availability) {
      setFormError("All fields are required.");
      return;
    }

    try {
      const form = new FormData();
      form.append("name", name);
      form.append("description", description);
      form.append("category", category);
      form.append("type", type);
      form.append("proficiency_level", proficiency_level);
      form.append("availability", availability);
      const result = await addSkillListing(form);
      if (result.error) {
        setFormError(result.error);
      } else {
        setFormSuccess(true);
        formEl.reset();
        fetchListings();
      }
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleProposeMatch = async (receiverSkillId: string, receiverId: string) => {
    const userSkills = listings.filter((l) => l.user_id === currentUser?.id);
    if (userSkills.length === 0) {
      alert("You need to publish at least one skill listing before proposing a swap match!");
      return;
    }

    const proposerSkill = userSkills[0]; // pick first for simplicity

    try {
      await createSwapMatch(receiverId, proposerSkill.id, receiverSkillId);
      alert("Skill Swap Match proposal sent successfully!");
      if (currentUser) {
        fetchSuggestions(currentUser.id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to propose match.");
    }
  };

  // Filter listings
  const filteredListings = listings.filter((listing) => {
    if (listing.type !== activeTab) return false;
    if (categoryFilter !== "all" && listing.category !== categoryFilter) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        listing.name.toLowerCase().includes(q) ||
        listing.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen p-6 flex flex-col font-sans select-none relative max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-2 border-ink-black pb-6 -rotate-0.5">
        <div className="text-center md:text-left pl-16">
          <Link href="/">
            <h1 className="riso-ghost-color font-display text-4.5xl uppercase leading-none tracking-tight text-ink-black hover:opacity-85 transition-opacity" data-text="Skill Swap Press Run" style={{ "--section-ink": "var(--riso-marine)" } as React.CSSProperties}>
              Skill Swap Press Run
            </h1>
          </Link>
          <p className="font-hand text-xl text-riso-marine mt-2">
            {"\"Barter your knowledge: teach what you offer, study what you want\""}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <button
            onClick={() => setActiveTab(activeTab === "suggestions" ? "offering" : "suggestions")}
            className={`flex items-center justify-center min-h-[44px] px-6 border-2 border-ink-black font-mono font-bold text-xs uppercase tracking-wider bg-riso-yellow-paper cursor-pointer active:translate-y-0.5 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.15)] ${
              activeTab === "suggestions" ? "text-riso-orange border-riso-orange" : "text-riso-marine border-riso-marine"
            }`}
          >
            Suggested Swaps ({suggestions.length})
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 pt-4">
        
        {/* Left Column: Side Controls & Form */}
        <aside className="w-full lg:w-72 space-y-6">
          
          {/* Post Skill Listing Card */}
          <div className="p-6 bg-riso-violet-paper border-2 border-ink-black text-ink-black shadow-[3px_3px_0px_rgba(30,27,24,0.2)]">
            <span className="font-mono text-[10px] font-bold text-ink-black/60 uppercase tracking-wider block mb-3 border-b border-dashed border-ink-black/30 pb-2">
              Publish Swap Offer
            </span>
            <form onSubmit={handlePostListing} className="space-y-4">
              {formError && (
                <div className="p-3 border border-dashed border-red-500 text-red-500 text-xs font-mono">
                  ⚠️ {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 border border-dashed border-success-ink text-success-ink text-xs font-mono font-bold">
                  🎉 Skill offer printed!
                </div>
              )}

              <div>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Skill (e.g. Next.js, Piano)"
                  className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 text-xs font-mono focus:border-solid focus:border-riso-marine focus:ring-1 focus:ring-riso-marine"
                />
              </div>

              <div>
                <textarea
                  name="description"
                  required
                  placeholder="Describe details..."
                  rows={2}
                  className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 text-xs font-mono focus:border-solid focus:border-riso-marine focus:ring-1 focus:ring-riso-marine resize-none"
                />
              </div>

              <div>
                <select
                  name="category"
                  required
                  className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 text-xs font-mono focus:border-solid focus:border-riso-marine focus:ring-1 focus:ring-riso-marine"
                >
                  <option value="" className="bg-paper-stock">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-paper-stock">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 px-2">
                <label className="flex items-center space-x-1.5 text-xs cursor-pointer font-mono text-ink-black/70">
                  <input type="radio" name="type" value="offering" defaultChecked className="accent-riso-marine cursor-pointer" />
                  <span>Offering</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs cursor-pointer font-mono text-ink-black/70">
                  <input type="radio" name="type" value="wanting" className="accent-riso-marine cursor-pointer" />
                  <span>Wanting</span>
                </label>
              </div>

              <div>
                <select
                  name="proficiency_level"
                  required
                  className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 text-xs font-mono focus:border-solid focus:border-riso-marine focus:ring-1 focus:ring-riso-marine"
                >
                  <option value="beginner" className="bg-paper-stock">Beginner</option>
                  <option value="intermediate" className="bg-paper-stock">Intermediate</option>
                  <option value="advanced" className="bg-paper-stock">Advanced</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  name="availability"
                  required
                  placeholder="Availability (e.g. Mon 4-6pm)"
                  className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 text-xs font-mono focus:border-solid focus:border-riso-marine focus:ring-1 focus:ring-riso-marine"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center min-h-[40px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-paper-stock text-ink-black hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                PRINT LISTING
              </button>
            </form>
          </div>

          {/* Filtering */}
          <div className="p-6 bg-riso-yellow-paper border-2 border-ink-black text-ink-black shadow-[3px_3px_0px_rgba(30,27,24,0.2)]">
            <span className="font-mono text-[10px] font-bold text-ink-black/60 uppercase tracking-wider block mb-3 border-b border-dashed border-ink-black/30 pb-2">
              Filter Options
            </span>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-1.5 font-mono text-xs focus:border-solid focus:border-riso-marine focus:ring-1 focus:ring-riso-marine"
              />
            </div>

            {/* Categories */}
            <div className="space-y-1.5 flex flex-col">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`text-left text-xs py-1 px-3 border border-dashed transition-all cursor-pointer font-mono ${
                  categoryFilter === "all" ? "border-solid border-2 border-ink-black bg-riso-marine text-paper-stock shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.15)]" : "border-transparent hover:border-ink-black/30 text-ink-black/70"
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-left text-xs py-1 px-3 border border-dashed transition-all cursor-pointer font-mono ${
                    categoryFilter === cat ? "border-solid border-2 border-ink-black bg-riso-marine text-paper-stock shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.15)]" : "border-transparent hover:border-ink-black/30 text-ink-black/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Column: Listings view */}
        <main className="flex-1">
          {activeTab === "suggestions" ? (
            /* Suggestions tab */
            <div className="space-y-6">
              <h2 className="font-display text-2.5xl uppercase leading-none text-ink-black">
                Suggested Swap Matches ({suggestions.length})
              </h2>

              {suggestions.length === 0 ? (
                <div className="text-center py-20 bg-paper-stock border-2 border-dashed border-ink-black/30">
                  <span className="font-hand text-xl text-ink-black/60 italic">
                    No matching trades found. Send swap proposals first!
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggestions.map((match) => {
                    const isProposer = match.proposer_id === currentUser?.id;
                    const otherProfile = isProposer ? match.receiver_profile : match.proposer_profile;
                    const matchStatus = match.status;

                    return (
                      <div
                        key={match.id}
                        className="p-5 pt-8 pb-3 bg-paper-stock border-2 border-ink-black text-ink-black animate-press-print-in shadow-[2px_2px_0px_rgba(32,29,26,0.15)] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-paper-stock bg-riso-violet border border-ink-black">
                              Proposed Trade
                            </span>
                            <span className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                              matchStatus === "active" ? "text-success-ink border-success-ink bg-success-ink/5" :
                              matchStatus === "pending" ? "text-riso-yellow border-riso-yellow bg-riso-yellow/5" :
                              matchStatus === "completed" ? "text-ink-black/40 border-ink-black/40 bg-ink-black/5" :
                              "text-red-500 border-red-500 bg-red-500/5"
                            }`}>
                              {matchStatus}
                            </span>
                          </div>

                          <h3 className="font-display text-lg uppercase leading-tight mb-3">
                            {isProposer ? `You Proposed a Swap to ${otherProfile?.display_name || "Someone"}` : `${otherProfile?.display_name || "Someone"} Proposed a Swap`}
                          </h3>

                          <div className="text-xs space-y-1.5 font-mono text-ink-black/80 bg-paper-stock border border-dashed border-ink-black/35 p-3">
                            <div>
                              <strong className="text-ink-black uppercase text-[10px]">Teaching:</strong> {match.proposer_skill?.name}
                            </div>
                            <div>
                              <strong className="text-ink-black uppercase text-[10px]">Studying:</strong> {match.receiver_skill?.name}
                            </div>
                          </div>
                        </div>

                        {(matchStatus === "active" || matchStatus === "pending" || matchStatus === "completed") && (
                          <Link
                            href={`/skill-swap/match/${match.id}`}
                            className="w-full flex items-center justify-center min-h-[38px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-paper-stock hover:bg-ink-black/5 active:translate-y-0.5 transition-all mt-4"
                          >
                            Enter Match Chat Portal →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Standard Listing Board offering/wanting lists */
            <div className="space-y-6">
              
              {/* Tab Selector */}
              <div className="flex space-x-3 mb-6 bg-paper-stock p-1 border-2 border-ink-black max-w-xs shadow-[2px_2px_0px_rgba(30,27,24,0.18)]">
                <button
                  onClick={() => setActiveTab("offering")}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-dashed transition-all cursor-pointer font-mono ${
                    activeTab === "offering" ? "border-solid border-2 border-ink-black bg-riso-marine text-paper-stock" : "border-transparent hover:border-ink-black/30 text-ink-black/70"
                  }`}
                >
                  Offerings
                </button>
                <button
                  onClick={() => setActiveTab("wanting")}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border border-dashed transition-all cursor-pointer font-mono ${
                    activeTab === "wanting" ? "border-solid border-2 border-ink-black bg-riso-marine text-paper-stock" : "border-transparent hover:border-ink-black/30 text-ink-black/70"
                  }`}
                >
                  Wantings
                </button>
              </div>

              {filteredListings.length === 0 ? (
                <div className="text-center py-20 bg-paper-stock border-2 border-dashed border-ink-black/30">
                  <span className="font-hand text-xl text-ink-black/60 italic block">
                    No active listings match your filters.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-1 pb-4">
                  {filteredListings.map((listing, idx) => (
                    <RisoSkillListingCard
                      key={listing.id}
                      listing={listing}
                      currentUser={currentUser}
                      onPropose={handleProposeMatch}
                      index={idx}
                    />
                  ))}
                </div>
              )}

            </div>
          )}
        </main>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { updateClaimStatus } from "@/app/lost-found/claim/actions";

interface Profile {
  id: string;
  display_name: string;
  department: string;
  graduation_year: number | null;
  reputation_points: number;
  avatar_url: string | null;
}

interface LostFoundItem {
  id: string;
  title: string;
  type: "lost" | "found";
  category: string;
  location: string;
  date_lost_found: string;
  verification_question: string | null;
}

interface LostFoundItem {
  id: string;
  title: string;
  type: "lost" | "found";
  category: string;
  location: string;
  date_lost_found: string;
  verification_question: string | null;
  finder?: Profile | null;
}

interface Claim {
  id: string;
  answer: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  claimant: Profile | null;
  item: LostFoundItem | null;
}

interface ClaimsDashboardProps {
  initialReceivedClaims: Claim[];
  initialMadeClaims: Claim[];
}

export default function ClaimsDashboard({ 
  initialReceivedClaims, 
  initialMadeClaims 
}: ClaimsDashboardProps) {
  const [receivedClaims, setReceivedClaims] = useState<Claim[]>(initialReceivedClaims);
  const [madeClaims, setMadeClaims] = useState<Claim[]>(initialMadeClaims);
  const [activeTab, setActiveTab] = useState<"received" | "made">("received");
  
  const [selectedReceivedId, setSelectedReceivedId] = useState<string | null>(
    initialReceivedClaims.length > 0 ? initialReceivedClaims[0].id : null
  );
  const [selectedMadeId, setSelectedMadeId] = useState<string | null>(
    initialMadeClaims.length > 0 ? initialMadeClaims[0].id : null
  );

  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const activeClaims = activeTab === "received" ? receivedClaims : madeClaims;
  const selectedClaimId = activeTab === "received" ? selectedReceivedId : selectedMadeId;
  const setSelectedClaimId = activeTab === "received" ? setSelectedReceivedId : setSelectedMadeId;

  const selectedClaim = activeClaims.find((c) => c.id === selectedClaimId);

  const handleDecision = (status: "approved" | "rejected") => {
    if (!selectedClaimId) return;

    setDecision(status);

    startTransition(async () => {
      try {
        await updateClaimStatus(selectedClaimId, status);
        // Remove from list or update local state
        setReceivedClaims((prev) => prev.filter((c) => c.id !== selectedClaimId));
        // Reset state
        const remaining = receivedClaims.filter((c) => c.id !== selectedClaimId);
        setSelectedReceivedId(remaining.length > 0 ? remaining[0].id : null);
        setDecision(null);
      } catch (err) {
        console.error("Failed to update claim status:", err);
        setDecision(null);
      }
    });
  };

  const handleTabChange = (tab: "received" | "made") => {
    setActiveTab(tab);
  };

  return (
    <div className="w-full min-h-screen bg-cork-bg p-6 flex flex-col font-sans select-none relative">
      
      {/* Notice Board Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-chalk-ink/20 pb-6">
        <div>
          <Link href="/">
            <h1 className="font-display text-4xl font-bold tracking-wide text-chalk-ink hover:opacity-85 transition-opacity">
              {activeTab === "received" ? "Claims Received" : "Claims Made"}
            </h1>
          </Link>
          <p className="font-hand text-xl text-chalk-ink/75 mt-1">
            {activeTab === "received" 
              ? "\"Review responses to your found bulletins and verify ownership\""
              : "\"Track the status of your claims and check finder decisions\""
            }
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <Link
            href="/lost-found"
            className="ticket-clip flex items-center justify-center min-h-[42px] bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold uppercase tracking-wider text-[10px] shadow-sm transition-all active:translate-y-[2px] px-6 cursor-pointer"
          >
            Go to Notice Board
          </Link>
        </div>
      </div>

      {/* Riso-themed Tabs */}
      <div className="flex gap-4 mb-6 border-b border-dashed border-chalk-ink/20 pb-4 max-w-5xl mx-auto w-full">
        <button
          onClick={() => handleTabChange("received")}
          className={`px-6 py-2 font-mono font-bold text-xs uppercase tracking-wider border-2 border-ink-black shadow-[2px_2px_0px_#201D1A] transition-all cursor-pointer active:translate-y-0.5 ${
            activeTab === "received" 
              ? "bg-amber-500 text-ink-black" 
              : "bg-paper-cream/60 hover:bg-white/40 text-chalk-ink"
          }`}
        >
          Claims Received ({receivedClaims.length})
        </button>
        <button
          onClick={() => handleTabChange("made")}
          className={`px-6 py-2 font-mono font-bold text-xs uppercase tracking-wider border-2 border-ink-black shadow-[2px_2px_0px_#201D1A] transition-all cursor-pointer active:translate-y-0.5 ${
            activeTab === "made" 
              ? "bg-amber-500 text-ink-black" 
              : "bg-paper-cream/60 hover:bg-white/40 text-chalk-ink"
          }`}
        >
          Claims Made ({madeClaims.length})
        </button>
      </div>

      {activeClaims.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20 bg-paper-cream/40 border border-dashed border-paper-border rounded-sm max-w-2xl mx-auto w-full">
          <div className="text-center">
            <span className="font-hand text-2xl text-gray-500 italic block">
              {activeTab === "received" 
                ? "No pending claims to review."
                : "You haven't claimed any items yet."
              }
            </span>
            <p className="font-sans text-xs text-gray-400 mt-2">
              {activeTab === "received"
                ? "Any claim tickets submitted for your reported items will appear here."
                : "Go search the notice board and file a claim ticket for any lost items!"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto w-full">
          
          {/* Left Column: Claims List */}
          <div className="w-full lg:w-80 space-y-4">
            <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest block px-1">
              {activeTab === "received" ? "Inbox" : "Outbox"} ({activeClaims.length})
            </span>
            <div className="space-y-3">
              {activeClaims.map((claim) => (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  className={`p-4 bg-paper-cream border border-paper-border text-chalk-ink shadow-sm cursor-pointer rounded-sm transition-all relative ${
                    selectedClaimId === claim.id
                      ? "border-amber-500 shadow-md ring-1 ring-amber-500/20 scale-[1.01]"
                      : "hover:bg-white/40 opacity-90"
                  }`}
                >
                  <div className="absolute top-2 right-2">
                    {activeTab === "received" ? (
                      <span className="font-mono text-[8px] text-red-500 bg-red-50 px-1 py-0.5 rounded-sm">
                        {claim.item?.type === "found" ? "CLAIM" : "INFO"}
                      </span>
                    ) : (
                      <span className={`font-mono text-[8px] px-1 py-0.5 rounded-sm uppercase ${
                        claim.status === "approved"
                          ? "text-green-600 bg-green-50"
                          : claim.status === "rejected"
                          ? "text-red-600 bg-red-50"
                          : "text-amber-600 bg-amber-50"
                      }`}>
                        {claim.status}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-sm line-clamp-1 pr-8">
                    {claim.item?.title}
                  </h3>
                  <p className="font-hand text-xs text-gray-500 mt-1">
                    {activeTab === "received" 
                      ? `From: ${claim.claimant?.display_name}`
                      : `Finder: ${claim.item?.finder?.display_name || "Campus Member"}`
                    }
                  </p>
                  <span className="font-mono text-[9px] text-sky-400 block mt-2">
                    {new Date(claim.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Claim Details Card */}
          <div className="flex-1">
            {selectedClaim && (
              <div className="relative p-8 bg-paper-cream border border-paper-border text-chalk-ink shadow-paper-lift dark:shadow-paper-lift-dark rounded-sm overflow-hidden min-h-[450px] flex flex-col justify-between">
                
                {/* SVG Push Pin */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C9.23858 2 7 4.23858 7 7C7 9.38268 8.66635 11.3752 10.9 11.884V16.5C10.9 17.0523 11.3477 17.5 11.9 17.5C12.4523 17.5 12.9 17.0523 12.9 16.5V11.884C15.1336 11.3752 16.8 9.38268 16.8 7C16.8 4.23858 14.7614 2 12 2Z"
                      fill="var(--pin-brass)"
                    />
                  </svg>
                </div>

                {/* Animated Decision Stamps (Only for received claims that you update in real time) */}
                {activeTab === "received" && decision && (
                  <div className="absolute inset-0 bg-paper-cream/80 flex items-center justify-center z-20 animate-stamp-in select-none pointer-events-none">
                    <div
                      className={`text-3xl font-display font-extrabold uppercase tracking-widest border-4 px-6 py-3 rounded-md transform -rotate-12 ${
                        decision === "approved"
                          ? "border-green-600 text-green-600"
                          : "border-red-600 text-red-600"
                      }`}
                    >
                      {decision === "approved" ? "Approved" : "Rejected"}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Item Section */}
                  <div>
                    <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest block mb-1">
                      Target bulletin notice
                    </span>
                    <h2 className="font-display text-xl font-bold tracking-wide">
                      {selectedClaim.item?.title}
                    </h2>
                    <p className="font-hand text-xs text-gray-500 mt-1 italic">
                      {activeTab === "received" 
                        ? `Posted by you in ${selectedClaim.item?.location} on ${selectedClaim.item?.date_lost_found}`
                        : `Posted by ${selectedClaim.item?.finder?.display_name || "Campus Member"} in ${selectedClaim.item?.location} on ${selectedClaim.item?.date_lost_found}`
                      }
                    </p>
                  </div>

                  {/* Profile Info block */}
                  {activeTab === "received" ? (
                    /* Claimant Profile Info (for received claims) */
                    <div className="p-4 bg-white/40 border border-paper-border rounded-sm relative flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full border border-sky-200 overflow-hidden bg-white/60">
                        {selectedClaim.claimant?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedClaim.claimant.avatar_url}
                            alt={selectedClaim.claimant.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-hand text-lg text-gray-400">
                            ?
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-sans">
                          {selectedClaim.claimant?.display_name} (Claimant)
                        </h4>
                        <span className="font-hand text-xs text-red-500 block">
                          {selectedClaim.claimant?.department} • Graduating {selectedClaim.claimant?.graduation_year || "N/A"}
                        </span>
                        <span className="font-mono text-[9px] text-amber-600 block mt-0.5">
                          Reputation: {selectedClaim.claimant?.reputation_points} pts
                        </span>
                      </div>
                      <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-red-400 opacity-20" />
                    </div>
                  ) : (
                    /* Finder Profile Info (for made claims) */
                    selectedClaim.item?.finder && (
                      <div className="p-4 bg-white/40 border border-paper-border rounded-sm relative flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full border border-sky-200 overflow-hidden bg-white/60">
                          {selectedClaim.item.finder.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedClaim.item.finder.avatar_url}
                              alt={selectedClaim.item.finder.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-hand text-lg text-gray-400">
                              ?
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold font-sans">
                            {selectedClaim.item.finder.display_name} (Finder)
                          </h4>
                          <p className="font-hand text-[10px] text-gray-500 block">
                            Wait for the finder to review your claim ticket details.
                          </p>
                        </div>
                        <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-red-400 opacity-20" />
                      </div>
                    )
                  )}

                  {/* Question & Answer Lined Card */}
                  <div className="space-y-4 pt-4 border-t border-sky-100 dark:border-amber-900/10 relative">
                    <div>
                      <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest block">
                        Verification Question
                      </span>
                      <p className="font-sans text-xs font-bold leading-normal text-chalk-ink mt-1">
                        &quot;{selectedClaim.item?.verification_question || "No question provided."}&quot;
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest block">
                        {activeTab === "received" ? "Claimant's Submitted Answer" : "Your Submitted Answer"}
                      </span>
                      <p className="font-hand text-base text-sky-600 dark:text-amber-200 leading-relaxed italic bg-white/30 p-3 border border-paper-border rounded-sm mt-1">
                        &quot;{selectedClaim.answer}&quot;
                      </p>
                    </div>

                    <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-red-400 opacity-20" />
                  </div>
                </div>

                {/* Footer Decisions / Statuses */}
                {activeTab === "received" ? (
                  /* Incoming Claims decision buttons */
                  <div className="flex gap-4 mt-8 border-t border-sky-100 dark:border-amber-900/20 pt-6">
                    <button
                      onClick={() => handleDecision("rejected")}
                      disabled={isPending}
                      className="flex-1 py-3 px-4 rounded-sm border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-sans font-bold uppercase tracking-wider text-xs shadow-sm transition-all active:translate-y-[1px] cursor-pointer disabled:opacity-50"
                    >
                      ❌ Reject Claim
                    </button>
                    <button
                      onClick={() => handleDecision("approved")}
                      disabled={isPending}
                      className="flex-1 py-3 px-4 rounded-sm bg-green-600 hover:bg-green-700 text-white font-sans font-bold uppercase tracking-wider text-xs shadow-md transition-all active:translate-y-[1px] cursor-pointer disabled:opacity-50"
                    >
                      🏆 Approve & Verify (+20 Pts)
                    </button>
                  </div>
                ) : (
                  /* Outgoing Claims statuses */
                  selectedClaim.status === "pending" ? (
                    <div className="mt-8 border-t border-sky-100 dark:border-amber-900/20 pt-6 text-center">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-600 border border-dashed border-amber-500/50 px-4 py-2 bg-amber-500/5 rounded-none">
                        ⏳ Claim Ticket Pending Evaluation
                      </span>
                      <p className="font-sans text-[11px] text-gray-500 mt-2.5 max-w-sm mx-auto leading-relaxed">
                        The finder is currently reviewing your verification answer. If approved, the item will be marked returned, and you can coordinate pickup.
                      </p>
                    </div>
                  ) : selectedClaim.status === "approved" ? (
                    <div className="mt-8 border-t border-sky-100 dark:border-amber-900/20 pt-6 text-center relative space-y-4">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                        <div className="text-4xl font-display font-black border-4 border-green-600 text-green-600 px-6 py-2 uppercase transform -rotate-12">
                          APPROVED
                        </div>
                      </div>
                      <div className="relative z-10 space-y-3">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-green-600 border border-dashed border-green-600/50 px-4 py-2 bg-green-600/5 rounded-none inline-block">
                          🎉 Claim Ticket Approved
                        </span>
                        <p className="font-sans text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                          Ownership verified! Please coordinate with the finder to retrieve your item.
                        </p>
                        <div className="pt-2">
                          <a
                            href={`https://meet.jit.si/CampusConnect-Claim-${selectedClaim.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center min-h-[38px] px-6 bg-gradient-teal text-white font-sans font-bold text-xs uppercase shadow-md hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer"
                          >
                            🎥 Join Online Meeting Room
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 border-t border-sky-100 dark:border-amber-900/20 pt-6 text-center relative">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                        <div className="text-4xl font-display font-black border-4 border-red-600 text-red-600 px-6 py-2 uppercase transform -rotate-12">
                          REJECTED
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-600 border border-dashed border-red-600/50 px-4 py-2 bg-red-600/5 rounded-none">
                        ❌ Claim Ticket Rejected
                      </span>
                      <p className="font-sans text-[11px] text-gray-500 mt-2.5 max-w-sm mx-auto leading-relaxed">
                        The finder could not verify ownership based on your answer. You can submit another claim on the board with more details.
                      </p>
                    </div>
                  )
                )}

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

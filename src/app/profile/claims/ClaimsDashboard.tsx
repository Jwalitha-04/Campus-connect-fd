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
    <div className="w-full min-h-screen bg-[#F2EEE4] bg-riso-run p-6 flex flex-col font-sans select-none relative text-[#201D1A]">
      
      {/* Notice Board Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-dashed border-[#201D1A]/30 pb-6">
        <div>
          <Link href="/">
            <h1 className="font-serif text-3xl font-black uppercase tracking-widest text-[#201D1A] hover:opacity-85 transition-opacity">
              {activeTab === "received" ? "CLAIMS RECEIVED" : "CLAIMS MADE"}
            </h1>
          </Link>
          <p className="font-mono text-[10px] uppercase font-bold text-[#201D1A]/60 mt-2 tracking-widest">
            {activeTab === "received" 
              ? "Review responses to your found bulletins and verify ownership"
              : "Track the status of your claims and check finder decisions"
            }
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <Link
            href="/lost-found"
            className="flex items-center justify-center min-h-[42px] border-2 border-[#201D1A] hover:bg-[#201D1A]/5 text-[#201D1A] font-sans font-bold uppercase tracking-wider text-[10px] shadow-[2px_2px_0px_#201D1A] transition-all active:translate-y-[2px] active:shadow-none px-6 cursor-pointer"
          >
            ← BACK TO BOARD
          </Link>
        </div>
      </div>

      {/* Riso-themed Tabs */}
      <div className="flex gap-4 mb-6 border-b border-dashed border-[#201D1A]/20 pb-4 max-w-5xl mx-auto w-full">
        <button
          onClick={() => handleTabChange("received")}
          className={`px-6 py-2 font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#201D1A] shadow-[2px_2px_0px_#201D1A] transition-all cursor-pointer active:translate-y-0.5 ${
            activeTab === "received" 
              ? "bg-[#8C2A2A] text-[#F2EEE4] shadow-none translate-y-0.5" 
              : "bg-[#EFEAD8] hover:bg-[#8C2A2A]/5 text-[#201D1A]"
          }`}
        >
          Claims Received ({receivedClaims.length})
        </button>
        <button
          onClick={() => handleTabChange("made")}
          className={`px-6 py-2 font-mono font-bold text-xs uppercase tracking-wider border-2 border-[#201D1A] shadow-[2px_2px_0px_#201D1A] transition-all cursor-pointer active:translate-y-0.5 ${
            activeTab === "made" 
              ? "bg-[#8C2A2A] text-[#F2EEE4] shadow-none translate-y-0.5" 
              : "bg-[#EFEAD8] hover:bg-[#8C2A2A]/5 text-[#201D1A]"
          }`}
        >
          Claims Made ({madeClaims.length})
        </button>
      </div>

      {activeClaims.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20 bg-[#EFEAD8] border-2 border-dashed border-[#201D1A]/30 max-w-2xl mx-auto w-full">
          <div className="text-center">
            <span className="font-serif font-black text-2xl text-[#201D1A]/60 uppercase block">
              {activeTab === "received" 
                ? "NO PENDING CLAIMS"
                : "NO CLAIMS SUBMITTED"
              }
            </span>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#201D1A]/40 mt-4">
              {activeTab === "received"
                ? "Any claim tickets submitted for your items will appear here."
                : "Search the notice board to file a claim ticket."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto w-full">
          
          {/* Left Column: Claims List */}
          <div className="w-full lg:w-80 space-y-4">
            <span className="font-mono text-[9px] font-bold text-[#8C2A2A] uppercase tracking-widest block px-1">
              {activeTab === "received" ? "INBOX" : "OUTBOX"} ({activeClaims.length})
            </span>
            <div className="space-y-3">
              {activeClaims.map((claim) => (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  className={`p-4 bg-[#EFEAD8] border-2 border-[#201D1A] shadow-[3px_3px_0px_#201D1A] cursor-pointer rounded-none transition-all relative ${
                    selectedClaimId === claim.id
                      ? "border-[#8C2A2A] shadow-[3px_3px_0px_#8C2A2A] scale-[1.01]"
                      : "hover:bg-[#201D1A]/5"
                  }`}
                >
                  <div className="absolute top-3 right-3">
                    {activeTab === "received" ? (
                      <span className="font-mono text-[8px] font-bold border border-[#8C2A2A] text-[#8C2A2A] bg-transparent px-1.5 py-0.5 uppercase tracking-wider">
                        {claim.item?.type === "found" ? "CLAIM" : "INFO"}
                      </span>
                    ) : (
                      <span className={`font-mono text-[8px] font-bold border px-1.5 py-0.5 uppercase tracking-wider ${
                        claim.status === "approved"
                          ? "border-[#1B8555] text-[#1B8555] bg-transparent"
                          : claim.status === "rejected"
                          ? "border-[#8C2A2A] text-[#8C2A2A] bg-transparent"
                          : "border-[#D97706] text-[#D97706] bg-transparent"
                      }`}>
                        {claim.status}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif font-black text-sm uppercase tracking-wide line-clamp-1 pr-12 text-[#201D1A]">
                    {claim.item?.title}
                  </h3>
                  <p className="font-mono text-[10px] font-bold text-[#201D1A]/60 mt-1 uppercase">
                    {activeTab === "received" 
                      ? `FROM: ${claim.claimant?.display_name}`
                      : `FINDER: ${claim.item?.finder?.display_name || "Campus Member"}`
                    }
                  </p>
                  <span className="font-mono text-[9px] font-bold text-[#8C2A2A] block mt-2 uppercase tracking-wider">
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
              <div className="relative p-8 bg-[#EFEAD8] border-2 border-[#201D1A] text-[#201D1A] shadow-[4px_4px_0px_#201D1A] min-h-[450px] flex flex-col justify-between animate-press-print-in">
                
                {/* Vintage Tape */}
                <div className="absolute -top-3 -left-4 w-12 h-5 rotate-15 washi-tape-orange z-10" />

                {/* Animated Decision Stamps (Only for received claims that you update in real time) */}
                {activeTab === "received" && decision && (
                  <div className="absolute inset-0 bg-[#EFEAD8]/80 flex items-center justify-center z-20 animate-stamp-thud select-none pointer-events-none">
                    <div
                      className={`text-3xl font-serif font-black uppercase tracking-widest border-4 px-6 py-3 transform -rotate-12 ${
                        decision === "approved"
                          ? "border-[#1B8555] text-[#1B8555]"
                          : "border-[#8C2A2A] text-[#8C2A2A]"
                      }`}
                    >
                      {decision === "approved" ? "APPROVED" : "REJECTED"}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Item Section */}
                  <div className="border-b-2 border-dashed border-[#201D1A]/30 pb-4">
                    <span className="font-mono text-[9px] font-bold text-[#8C2A2A] uppercase tracking-widest block mb-2 border border-[#8C2A2A] px-2 py-0.5 w-max">
                      TARGET BULLETIN NOTICE
                    </span>
                    <h2 className="font-serif text-2xl font-black uppercase tracking-wider">
                      {selectedClaim.item?.title}
                    </h2>
                    <p className="font-mono text-[10px] font-bold text-[#201D1A]/60 mt-1 uppercase tracking-wider">
                      {activeTab === "received" 
                        ? `POSTED BY YOU IN ${selectedClaim.item?.location} ON ${selectedClaim.item?.date_lost_found}`
                        : `POSTED BY ${selectedClaim.item?.finder?.display_name || "CAMPUS MEMBER"} IN ${selectedClaim.item?.location} ON ${selectedClaim.item?.date_lost_found}`
                      }
                    </p>
                  </div>

                  {/* Profile Info block */}
                  {activeTab === "received" ? (
                    /* Claimant Profile Info (for received claims) */
                    <div className="p-4 bg-transparent border-2 border-dashed border-[#201D1A]/30 relative flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#8C2A2A] overflow-hidden bg-[#F2EEE4] flex items-center justify-center shadow-[1.5px_1.5px_0px_#8C2A2A]">
                        {selectedClaim.claimant?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedClaim.claimant.avatar_url}
                            alt={selectedClaim.claimant.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="font-serif font-black text-xl text-[#8C2A2A]">?</div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-black uppercase tracking-wider">
                          {selectedClaim.claimant?.display_name} <span className="text-[#8C2A2A]">(CLAIMANT)</span>
                        </h4>
                        <span className="font-mono text-[10px] font-bold text-[#201D1A]/70 uppercase tracking-widest block mt-0.5">
                          {selectedClaim.claimant?.department} • GRAD {selectedClaim.claimant?.graduation_year || "N/A"}
                        </span>
                        <span className="font-mono text-[9px] font-bold text-[#8C2A2A] uppercase tracking-widest block mt-1 border border-[#8C2A2A] px-1 py-0.5 w-max">
                          REP: {selectedClaim.claimant?.reputation_points} PTS
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Finder Profile Info (for made claims) */
                    selectedClaim.item?.finder && (
                      <div className="p-4 bg-transparent border-2 border-dashed border-[#201D1A]/30 relative flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#8C2A2A] overflow-hidden bg-[#F2EEE4] flex items-center justify-center shadow-[1.5px_1.5px_0px_#8C2A2A]">
                          {selectedClaim.item.finder.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedClaim.item.finder.avatar_url}
                              alt={selectedClaim.item.finder.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="font-serif font-black text-xl text-[#8C2A2A]">?</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-serif text-sm font-black uppercase tracking-wider">
                            {selectedClaim.item.finder.display_name} <span className="text-[#8C2A2A]">(FINDER)</span>
                          </h4>
                          <p className="font-mono text-[10px] font-bold text-[#201D1A]/60 uppercase tracking-widest block mt-1">
                            AWAITING FINDER REVIEW...
                          </p>
                        </div>
                      </div>
                    )
                  )}

                  {/* Question & Answer Lined Card */}
                  <div className="space-y-4 pt-4 border-t-2 border-dashed border-[#201D1A]/30 relative">
                    <div>
                      <span className="font-mono text-[9px] font-bold text-[#8C2A2A] uppercase tracking-widest block">
                        VERIFICATION QUESTION
                      </span>
                      <p className="font-serif text-sm font-bold uppercase tracking-wider text-[#201D1A] mt-1">
                        &quot;{selectedClaim.item?.verification_question || "NO QUESTION PROVIDED."}&quot;
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-[9px] font-bold text-[#8C2A2A] uppercase tracking-widest block mb-1">
                        {activeTab === "received" ? "CLAIMANT'S SUBMITTED ANSWER" : "YOUR SUBMITTED ANSWER"}
                      </span>
                      <p className="font-mono text-xs font-bold text-[#201D1A] leading-relaxed bg-[#F2EEE4] p-4 border border-dashed border-[#201D1A]/40 typewriter-caret uppercase">
                        &quot;{selectedClaim.answer}&quot;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Decisions / Statuses */}
                {activeTab === "received" ? (
                  /* Incoming Claims decision buttons */
                  <div className="flex gap-4 mt-8 border-t-2 border-[#201D1A] pt-6">
                    <button
                      onClick={() => handleDecision("rejected")}
                      disabled={isPending}
                      className="flex-1 min-h-[42px] border-2 border-[#201D1A] text-[#201D1A] hover:bg-[#201D1A]/5 font-sans font-bold uppercase tracking-wider text-xs shadow-[2px_2px_0px_#201D1A] transition-all active:translate-y-[2px] active:shadow-none cursor-pointer disabled:opacity-50"
                    >
                      ❌ REJECT
                    </button>
                    <button
                      onClick={() => handleDecision("approved")}
                      disabled={isPending}
                      className="flex-[2] min-h-[42px] border-2 border-[#1B8555] bg-[#1B8555] hover:bg-[#1B8555]/90 text-[#F2EEE4] font-sans font-bold uppercase tracking-wider text-xs shadow-[2px_2px_0px_#201D1A] transition-all active:translate-y-[2px] active:shadow-none cursor-pointer disabled:opacity-50"
                    >
                      🏆 VERIFY (+20 PTS)
                    </button>
                  </div>
                ) : (
                  /* Outgoing Claims statuses */
                  selectedClaim.status === "pending" ? (
                    <div className="mt-8 border-t-2 border-[#201D1A] pt-6 text-center">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#D97706] border-2 border-dashed border-[#D97706] px-4 py-2 inline-block">
                        ⏳ PENDING EVALUATION
                      </span>
                      <p className="font-mono text-[10px] font-bold text-[#201D1A]/60 mt-3 max-w-sm mx-auto leading-relaxed uppercase">
                        THE FINDER IS CURRENTLY REVIEWING YOUR ANSWER. IF APPROVED, YOU CAN COORDINATE PICKUP.
                      </p>
                    </div>
                  ) : selectedClaim.status === "approved" ? (
                    <div className="mt-8 border-t-2 border-[#201D1A] pt-6 text-center relative space-y-4">
                      <div className="relative z-10 space-y-3">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1B8555] border-2 border-dashed border-[#1B8555] px-4 py-2 inline-block">
                          🎉 TICKET APPROVED
                        </span>
                        <p className="font-mono text-[10px] font-bold text-[#201D1A]/70 max-w-sm mx-auto leading-relaxed uppercase">
                          OWNERSHIP VERIFIED! COORDINATE WITH THE FINDER TO RETRIEVE YOUR ITEM.
                        </p>
                        <div className="pt-2">
                          <a
                            href={`https://meet.jit.si/CampusConnect-Claim-${selectedClaim.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center min-h-[42px] px-6 border-2 border-[#1B8555] bg-[#1B8555] text-[#F2EEE4] font-sans font-bold text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#201D1A] hover:opacity-95 transition-all active:translate-y-[2px] active:shadow-none cursor-pointer"
                          >
                            🎥 JOIN ONLINE MEETING
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 border-t-2 border-[#201D1A] pt-6 text-center relative">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#8C2A2A] border-2 border-dashed border-[#8C2A2A] px-4 py-2 inline-block">
                        ❌ TICKET REJECTED
                      </span>
                      <p className="font-mono text-[10px] font-bold text-[#201D1A]/60 mt-3 max-w-sm mx-auto leading-relaxed uppercase">
                        THE FINDER COULD NOT VERIFY OWNERSHIP. YOU CAN SUBMIT ANOTHER CLAIM WITH MORE DETAILS.
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

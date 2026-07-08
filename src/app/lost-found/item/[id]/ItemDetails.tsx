"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import ClaimModal from "@/components/shared/ClaimModal";
import { createClient } from "@/utils/supabase/client";
import { playSprite } from "@/utils/audio";
import { resolveLostItem, getSuggestedMatches, extendItem, generateHandoverPin, verifyHandoverPin, updateItemStatusAction } from "@/app/lost-found/actions";

interface Profile {
  id: string;
  display_name: string;
  department: string;
  graduation_year: number | null;
  reputation_points: number;
  avatar_url: string | null;
  role: string;
}

interface LostFoundItem {
  id: string;
  user_id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  images: string[];
  date_lost_found: string;
  time_lost_found: string | null;
  location: string;
  contact_info: string;
  status: string;
  verification_question: string | null;
  profiles?: Profile | null;
  color?: string | null;
  brand?: string | null;
  item_type?: string | null;
  drop_off_location?: string | null;
  handover_preference?: "hold" | "drop_off" | "time_limited" | null;
  handover_limit_time?: string | null;
  handover_limit_location?: string | null;
  warning_sent?: boolean;
  handover_pin?: string | null;
  handover_pin_expires_at?: string | null;
  created_at: string;
}

interface ItemDetailsProps {
  item: LostFoundItem;
  currentUserId: string | null;
}

function HalftonePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative overflow-hidden w-full h-full filter grayscale contrast-[1.4]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-cover mix-blend-multiply" />
      <div className="absolute inset-0 mix-blend-color bg-riso-orange" />
    </div>
  );
}

export default function ItemDetails({ item, currentUserId }: ItemDetailsProps) {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [resolving, setResolving] = useState(false);
  
  const [extending, setExtending] = useState(false);
  const [isApprovedClaimant, setIsApprovedClaimant] = useState(false);
  const [approvedClaimId, setApprovedClaimId] = useState<string | null>(null);
  const [activePin, setActivePin] = useState<string | null>(item.handover_pin || null);
  const [pinExpiresAt, setPinExpiresAt] = useState<string | null>(item.handover_pin_expires_at || null);
  const [countdown, setCountdown] = useState<string>("");
  const [inputPin, setInputPin] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [generatingPin, setGeneratingPin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function checkClaim() {
      if (!currentUserId) return;
      const { data } = await supabase
        .from("claims")
        .select("id, claimant_id")
        .eq("item_id", item.id)
        .eq("status", "approved")
        .maybeSingle();
      if (data) {
        setApprovedClaimId(data.id);
        if (data.claimant_id === currentUserId) {
          setIsApprovedClaimant(true);
        }
      }
    }
    checkClaim();
  }, [currentUserId, item.id]);

  useEffect(() => {
    if (!pinExpiresAt) return;

    const interval = setInterval(() => {
      const distance = new Date(pinExpiresAt).getTime() - Date.now();
      if (distance < 0) {
        setCountdown("Expired");
        setActivePin(null);
        setPinExpiresAt(null);
        clearInterval(interval);
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pinExpiresAt]);

  const handleExtend = async () => {
    setExtending(true);
    const res = await extendItem(item.id);
    if (res.error) {
      alert(res.error);
    } else {
      alert("Notice extended successfully by 14 days!");
      window.location.reload();
    }
    setExtending(false);
  };

  const handleGeneratePin = async () => {
    setGeneratingPin(true);
    const res = await generateHandoverPin(item.id);
    if (res.error) {
      alert(res.error);
    } else if (res.pin && res.expiresAt) {
      setActivePin(res.pin);
      setPinExpiresAt(res.expiresAt);
    }
    setGeneratingPin(false);
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin.length !== 4) {
      alert("PIN must be 4 digits.");
      return;
    }
    setVerifyingPin(true);
    const res = await verifyHandoverPin(item.id, inputPin);
    if (res.error) {
      alert(res.error);
    } else {
      playSprite("stamp");
      alert("Handover verified successfully! Exchange resolved and finder points rewarded.");
      window.location.reload();
    }
    setVerifyingPin(false);
  };

  const isOwner = currentUserId === item.user_id;
  const isReturned = item.status === "returned";

  const createdDate = new Date(item.created_at);
  const daysElapsed = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const showWarning = isOwner && (daysElapsed >= 25 || !!item.warning_sent);

  const isReceiver = (item.type === "lost" && isOwner) || (item.type === "found" && isApprovedClaimant);
  const isGiver = (item.type === "found" && isOwner) || (item.type === "lost" && !isOwner && currentUserId !== null);

  const handleResolveLost = async () => {
    if (confirm("Are you sure you want to mark this item as found and close this notice?")) {
      setResolving(true);
      const result = await resolveLostItem(item.id);
      if (result?.error) {
        alert(result.error);
      } else {
        playSprite("stamp");
        alert("Notice resolved successfully! The item is now marked as found/returned.");
      }
      setResolving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "active" | "in_transit" | "at_drop_point") => {
    if (confirm(`Are you sure you want to mark this item as ${newStatus === "in_transit" ? "In Transit" : "Dropped Off"}?`)) {
      const result = await updateItemStatusAction(item.id, newStatus);
      if (result?.error) {
        alert(result.error);
      } else {
        playSprite("stamp");
        window.location.reload();
      }
    }
  };

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const verificationUrl = `${siteUrl}/lost-found/verify/${item.id}`;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 select-none font-sans relative max-w-2xl mx-auto">
      
      {/* Claim Submission Modal */}
      {showClaimModal && item.verification_question && (
        <ClaimModal
          itemId={item.id}
          question={item.verification_question}
          onClose={() => setShowClaimModal(false)}
        />
      )}

      {/* Notice Board Header */}
      <div className="text-center mb-6">
        <h1 className="font-display text-4xl uppercase leading-none text-ink-black">
          Notice Press Run
        </h1>
        <p className="font-hand text-lg text-riso-orange mt-2">
          &quot;Bulletin Notice Detail Card&quot;
        </p>
      </div>

      {/* Expiration Warning Banner */}
      {showWarning && !isReturned && (
        <div className="w-full p-4 border border-dashed border-red-500 bg-paper-stock text-red-500 mb-6 text-xs font-mono flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-lg">⏳</span>
            <div>
              <p className="font-bold uppercase">Notice Expiring Soon</p>
              <p className="font-normal text-[11px] text-red-500/80 mt-0.5 leading-normal">
                Is your item still missing? Click extend to keep it active for another 14 days.
              </p>
            </div>
          </div>
          <button
            onClick={handleExtend}
            disabled={extending}
            className="shrink-0 border-2 border-red-500 font-mono text-[10px] font-bold px-4 py-2 bg-paper-stock text-red-500 hover:bg-red-500/5 cursor-pointer transition-all disabled:opacity-50"
          >
            {extending ? "EXTENDING..." : "EXTEND RUN"}
          </button>
        </div>
      )}

      {/* Double-Wide Pod Card */}
      <div 
        className="relative w-full p-8 bg-paper-stock border-2 border-ink-black text-ink-black shadow-[4px_4px_0px_rgba(32,29,26,0.15)] animate-press-print-in overflow-hidden"
      >
        {/* Staple */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* Confirmed Hand-Off Overlay */}
        {isReturned && (
          <div className="absolute inset-0 bg-paper-stock/20 backdrop-blur-xs flex items-center justify-center z-25 pointer-events-none select-none">
            <div className="font-display text-3xl uppercase border-4 border-success-ink text-success-ink px-6 py-3 bg-paper-stock transform -rotate-6 shadow-md animate-stamp-thud">
              Returned & Solved
            </div>
          </div>
        )}

        {item.status === "in_transit" && (
          <div className="absolute inset-0 bg-paper-stock/20 backdrop-blur-xs flex items-center justify-center z-25 pointer-events-none select-none">
            <div className="font-display text-3xl uppercase border-4 border-[#8C2A2A] text-[#8C2A2A] px-6 py-3 bg-paper-stock transform -rotate-6 shadow-md animate-stamp-thud">
              In Transit
            </div>
          </div>
        )}

        {item.status === "at_drop_point" && (
          <div className="absolute inset-0 bg-paper-stock/20 backdrop-blur-xs flex items-center justify-center z-25 pointer-events-none select-none">
            <div className="font-display text-3xl uppercase border-4 border-sky-600 text-sky-600 px-6 py-3 bg-paper-stock transform -rotate-6 shadow-md animate-stamp-thud">
              At Drop Point
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="absolute top-4 right-4">
          <Link
            href="/lost-found"
            className="font-mono text-[10px] font-bold uppercase text-red-500 hover:underline"
          >
            [Back]
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          
          {/* Left Column: Image Carousel / Info */}
          <div className="space-y-6">
            {item.images && item.images.length > 0 ? (
              <div className="space-y-2">
                <div className="w-full h-64 border border-ink-black overflow-hidden bg-paper-stock">
                  <HalftonePhoto src={item.images[0]} alt={item.title} />
                </div>
                {item.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {item.images.slice(1).map((imgUrl: string, index: number) => (
                      <div
                        key={imgUrl}
                        className="w-16 h-16 border border-dashed border-ink-black overflow-hidden flex-shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt={`${item.title} preview ${index}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 border border-dashed border-ink-black/45 flex flex-col items-center justify-center text-ink-black/60 bg-paper-stock">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">No photo printed</span>
              </div>
            )}

            {/* Reporter Meta Info */}
            <div className="p-4 border border-dashed border-ink-black/40 bg-paper-stock">
              <span className="font-mono text-[9px] font-bold text-ink-black/50 uppercase tracking-wider block mb-2">
                Printed By
              </span>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 overflow-hidden border border-ink-black bg-paper-stock">
                  {item.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.profiles.avatar_url}
                      alt={item.profiles.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-display text-lg text-ink-black">
                      {item.profiles?.display_name ? item.profiles.display_name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans">
                    {item.profiles?.display_name || "Campus Member"}
                  </h4>
                  <span className="font-mono text-[9px] font-bold text-riso-orange uppercase tracking-wide block mt-0.5">
                    {item.profiles?.role || "Student"} • {item.profiles?.department || "Undeclared"}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Listing Details & QR Code */}
          <div className="flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              <div>
                <span className={`inline-block py-1 px-3 text-[9px] font-mono font-bold uppercase tracking-wider border border-ink-black text-paper-stock mb-2 ${
                  item.type === "lost" ? "bg-riso-orange" : "bg-success-ink"
                }`}>
                  {item.type === "lost" ? "Lost Notice" : "Found Notice"}
                </span>
                {item.status.startsWith("Secured at") && (
                  <span className="inline-block py-1 px-3 text-[9px] font-mono font-bold uppercase tracking-wider border border-ink-black bg-riso-marine text-paper-stock mb-2 ml-2 animate-pulse">
                    Secured
                  </span>
                )}
                {item.status === "in_transit" && (
                  <span className="inline-block py-1 px-3 text-[9px] font-mono font-bold uppercase tracking-wider border border-ink-black bg-[#8C2A2A] text-paper-stock mb-2 ml-2 animate-pulse">
                    In Transit
                  </span>
                )}
                {item.status === "at_drop_point" && (
                  <span className="inline-block py-1 px-3 text-[9px] font-mono font-bold uppercase tracking-wider border border-ink-black bg-sky-600 text-paper-stock mb-2 ml-2">
                    At Drop Point
                  </span>
                )}
                <h2 className="font-display text-2xl uppercase leading-none tracking-tight">
                  {item.title}
                </h2>
              </div>

              {item.status.startsWith("Secured at") && (
                <div className="p-4 border border-dashed border-riso-marine bg-paper-stock flex items-start space-x-3 text-riso-marine text-xs font-mono font-bold">
                  <span className="text-base shrink-0">🏢</span>
                  <div>
                    <p className="uppercase text-[10px]">Secured at Drop-off Hub</p>
                    <p className="font-normal text-[9px] text-riso-marine/90 mt-1 leading-normal">
                      This item was deposited at: <span className="font-bold">{item.status.substring(11)}</span>.
                      Show this page to collect it.
                    </p>
                  </div>
                </div>
              )}

              <p className="font-sans text-xs text-ink-black/85 leading-relaxed italic">
                &quot;{item.description}&quot;
              </p>

              {/* Attributes */}
              <div className="py-3 border-t border-dashed border-ink-black/30 space-y-2 relative text-xs font-mono">
                {item.drop_off_location && (
                  <div className="flex justify-between border-b border-dashed border-ink-black/20 pb-1 text-success-ink font-bold">
                    <span className="uppercase tracking-wider">Drop-off Hub</span>
                    <span>{item.drop_off_location}</span>
                  </div>
                )}

                {item.handover_preference && (
                  <div className="flex justify-between border-b border-dashed border-ink-black/20 pb-1 text-[#8C2A2A] font-bold">
                    <span className="uppercase tracking-wider">Handover</span>
                    <span>
                      {item.handover_preference === "hold"
                        ? "Hold & arrange pickup"
                        : item.handover_preference === "drop_off"
                        ? `Drop off at ${item.drop_off_location || "selected hub"}`
                        : `Hold until ${item.handover_limit_time}, then drop at ${item.handover_limit_location}`
                      }
                    </span>
                  </div>
                )}

                {item.status.startsWith("Secured at") && (
                  <div className="flex justify-between border-b border-dashed border-ink-black/20 pb-1 text-riso-marine font-bold">
                    <span className="uppercase tracking-wider">Security Status</span>
                    <span>{item.status}</span>
                  </div>
                )}

                <div className="flex justify-between border-b border-dashed border-ink-black/20 pb-1">
                  <span className="text-ink-black/50 uppercase tracking-wider">Zone Location</span>
                  <span className="font-bold">{item.location}</span>
                </div>

                <div className="flex justify-between border-b border-dashed border-ink-black/20 pb-1">
                  <span className="text-ink-black/50 uppercase tracking-wider">Date {item.type === "lost" ? "Lost" : "Found"}</span>
                  <span className="font-bold">
                    {new Date(item.date_lost_found).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {item.time_lost_found && (
                  <div className="flex justify-between border-b border-dashed border-ink-black/20 pb-1">
                    <span className="text-ink-black/50 uppercase tracking-wider">Approx Time</span>
                    <span className="font-bold">{item.time_lost_found.slice(0, 5)}</span>
                  </div>
                )}

                {item.color && (
                  <div className="flex justify-between border-b border-dashed border-ink-black/20 pb-1">
                    <span className="text-ink-black/50 uppercase tracking-wider">Color</span>
                    <span className="font-bold">{item.color}</span>
                  </div>
                )}

                {item.brand && (
                  <div className="flex justify-between border-b border-dashed border-ink-black/20 pb-1">
                    <span className="text-ink-black/50 uppercase tracking-wider">Brand / Make</span>
                    <span className="font-bold">{item.brand}</span>
                  </div>
                )}

                <div className="flex justify-between pb-1">
                  <span className="text-ink-black/50 uppercase tracking-wider">Contact Info</span>
                  <span className="font-bold text-right break-all max-w-[150px]">{item.contact_info}</span>
                </div>
              </div>
            </div>

            {/* QR Code and Claim Action */}
            <div className="space-y-4">
              
              {/* QR Code */}
              <div className="flex items-center space-x-4 p-4 border border-dashed border-ink-black/40 bg-paper-stock">
                <div className="bg-white p-2 border border-ink-black flex-shrink-0">
                  <QRCode value={verificationUrl} size={80} />
                </div>
                <div className="space-y-1 font-mono text-[9px]">
                  <span className="font-bold text-riso-orange uppercase tracking-wider block">
                    Verification QR
                  </span>
                  <p className="text-ink-black/60 leading-tight">
                    Show this QR code at the physical verification desk to claim hand-off.
                  </p>
                </div>
              </div>

              {/* Online meeting room for coordination */}
              {approvedClaimId && (isOwner || isApprovedClaimant) && (
                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-success-ink bg-paper-stock space-y-2">
                  <span className="font-mono text-[9px] font-bold text-success-ink uppercase tracking-wider block text-center">
                    Online Coordination Meeting
                  </span>
                  <p className="font-sans text-[10px] text-ink-black/70 text-center leading-tight">
                    Join the online coordination call to arrange pickup details:
                  </p>
                  <a
                    href={`https://meet.jit.si/CampusConnect-Claim-${approvedClaimId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center min-h-[38px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-success-ink text-paper-stock hover:opacity-90 transition-all cursor-pointer text-center"
                  >
                    🎥 Join Meeting Room
                  </a>
                </div>
              )}

              {/* Claim Action Button */}
              {isReturned ? (
                <div className="w-full flex items-center justify-center min-h-[46px] border border-dashed border-ink-black/30 text-ink-black/50 font-mono font-bold uppercase text-xs cursor-not-allowed">
                  Item Handed Off
                </div>
              ) : item.type === "lost" ? (
                isOwner ? (
                  <button
                    type="button"
                    onClick={handleResolveLost}
                    disabled={resolving}
                    className="w-full flex items-center justify-center min-h-[46px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-paper-stock text-ink-black hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {resolving ? "RESOLVING..." : "MARK AS RESOLVED"}
                  </button>
                ) : (
                  <div className="w-full p-4 border border-dashed border-riso-orange bg-paper-stock/40 text-[10px] font-mono text-riso-orange font-bold text-center leading-normal">
                    🔒 Only the reporter can resolve this notice. Please contact the owner to hand-off.
                  </div>
                )
              ) : isOwner ? (
                <div className="space-y-3 w-full">
                  <Link
                    href="/profile/claims"
                    className="w-full flex items-center justify-center min-h-[46px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-paper-stock text-ink-black hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer text-center"
                  >
                    REVIEW RECEIVED CLAIMS
                  </Link>

                  {/* Finder Escrow Action Controls */}
                  {!isReturned && (item.handover_preference === "drop_off" || item.handover_preference === "time_limited") && (
                    <div className="p-4 border border-dashed border-ink-black/40 bg-paper-stock/60 space-y-3">
                      <span className="font-mono text-[9px] font-bold text-ink-black/50 uppercase tracking-wider block">
                        Escrow Status Controls
                      </span>
                      <div className="flex gap-2">
                        {item.status === "active" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus("in_transit")}
                            className="flex-1 py-2 px-3 border border-ink-black bg-paper-stock hover:bg-ink-black/5 font-mono text-[10px] font-bold uppercase transition-all active:scale-[0.98] cursor-pointer"
                          >
                            Mark "In Transit"
                          </button>
                        )}
                        {(item.status === "active" || item.status === "in_transit") && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus("at_drop_point")}
                            className="flex-1 py-2 px-3 border border-ink-black bg-[#8C2A2A] text-white hover:opacity-95 font-mono text-[10px] font-bold uppercase transition-all active:scale-[0.98] cursor-pointer"
                          >
                            Mark "Dropped Off"
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : item.verification_question ? (
                <button
                  type="button"
                  onClick={() => setShowClaimModal(true)}
                  className="w-full flex items-center justify-center min-h-[46px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-paper-stock text-ink-black hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  TEAR CLAIM TICKET
                </button>
              ) : (
                <div className="w-full flex items-center justify-center min-h-[46px] border border-dashed border-ink-black text-ink-black font-mono text-xs uppercase cursor-pointer">
                  No verification question required
                </div>
              )}

              {/* Handover Verification Protocol UI */}
              {!isReturned && (
                <div className="border-t border-dashed border-ink-black/30 pt-4 mt-2 space-y-4">
                  {isReceiver && (
                    <div className="p-4 border border-dashed border-riso-violet bg-paper-stock space-y-3 font-mono">
                      <div>
                        <span className="text-[10px] font-bold text-riso-violet uppercase tracking-wider block">
                          Secure Handover PIN
                        </span>
                        <p className="text-[9px] text-ink-black/60 mt-0.5 leading-snug">
                          Generate a secure temporary code to show to the finder during the physical handover.
                        </p>
                      </div>
                      
                      {activePin ? (
                        <div className="text-center py-2 space-y-1 border border-dashed border-riso-violet bg-paper-stock">
                          <div className="text-3xl font-extrabold tracking-widest text-riso-violet">
                            {activePin}
                          </div>
                          <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide">
                            Expires in: {countdown}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGeneratePin}
                          disabled={generatingPin}
                          className="w-full flex items-center justify-center min-h-[38px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-paper-stock text-ink-black hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {generatingPin ? "GENERATING..." : "GENERATE PIN"}
                        </button>
                      )}
                    </div>
                  )}

                  {isGiver && (
                    <form onSubmit={handleVerifyPin} className="p-4 border border-dashed border-riso-violet bg-paper-stock space-y-3 font-mono">
                      <div>
                        <span className="text-[10px] font-bold text-riso-violet uppercase tracking-wider block">
                          Verify Handover PIN
                        </span>
                        <p className="text-[9px] text-ink-black/60 mt-0.5 leading-snug">
                          Input the 4-digit code shown on the receiver's phone to resolve this bulletin.
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={inputPin}
                          onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 1234"
                          required
                          className="flex-1 bg-paper-stock border border-dashed border-ink-black px-3 py-1.5 focus:border-solid focus:border-riso-violet focus:ring-1 focus:ring-riso-violet outline-none text-center font-mono font-bold tracking-widest text-sm"
                        />
                        <button
                          type="submit"
                          disabled={verifyingPin}
                          className="px-4 py-1.5 border-2 border-ink-black bg-paper-stock hover:bg-ink-black/5 font-mono font-bold text-xs uppercase active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {verifyingPin ? "VERIFYING..." : "VERIFY"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* AI-Suggested Matches Section */}
      {item.status === "active" && (
        <div className="w-full max-w-2xl mt-6">
          <AISuggestedMatches itemId={item.id} />
        </div>
      )}
    </div>
  );
}

function AISuggestedMatches({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await getSuggestedMatches(itemId);
        if (res.error) {
          setError(res.error);
        } else if (res.matches) {
          setMatches(res.matches);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load matches");
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [itemId]);

  if (loading) {
    return (
      <div className="w-full p-6 bg-paper-stock border-2 border-ink-black text-ink-black text-center font-mono">
        <div className="animate-pulse text-xs font-bold uppercase tracking-wider text-riso-violet">
          🤖 Scanning board for matching notices...
        </div>
      </div>
    );
  }

  if (error || matches.length === 0) {
    return null;
  }

  return (
    <div className="p-6 bg-paper-stock border-2 border-ink-black text-ink-black space-y-4 shadow-[2px_2px_0px_rgba(32,29,26,0.15)]">
      <div className="flex items-center space-x-2 border-b border-dashed border-ink-black pb-3 font-mono">
        <span className="text-xl">🤖</span>
        <div>
          <h3 className="font-display font-bold text-sm uppercase tracking-wider">
            Possible Matches Found!
          </h3>
          <p className="text-[9px] text-ink-black/60 mt-0.5">
            AI has detected these matching notices on the board
          </p>
        </div>
      </div>

      <div className="space-y-3 font-mono">
        {matches.slice(0, 3).map((match) => (
          <div
            key={match.id}
            className="p-4 border border-dashed border-ink-black bg-paper-stock/40 flex items-start space-x-4 hover:border-solid hover:border-riso-violet transition-all"
          >
            {match.images && match.images.length > 0 ? (
              <div className="w-14 h-14 bg-white border border-ink-black flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={match.images[0]}
                  alt={match.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 border border-dashed border-ink-black flex flex-col items-center justify-center flex-shrink-0 text-[8px] text-ink-black/50 font-bold">
                NO PHOTO
              </div>
            )}
            
            <div className="flex-1 min-w-0 font-mono text-[10px]">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-sans font-bold text-xs truncate max-w-[200px]">
                  {match.title}
                </h4>
                <span className="px-2 py-0.5 bg-riso-violet border border-ink-black text-paper-stock text-[8px] font-bold shrink-0">
                  {match.score}% MATCH
                </span>
              </div>
              
              <p className="text-ink-black/60 mt-0.5">
                Reported in {match.location} • By {match.profiles?.display_name || "Campus Member"}
              </p>
              
              <p className="text-riso-violet font-bold italic mt-1 leading-relaxed text-[9px]">
                Why: {match.reason}
              </p>

              <Link
                href={`/lost-found/item/${match.id}`}
                className="inline-block text-[9px] text-riso-violet font-bold hover:underline mt-1.5"
              >
                View Notice →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

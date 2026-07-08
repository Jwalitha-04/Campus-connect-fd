"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Html5QrcodeScanner } from "html5-qrcode";
import { createClient } from "@/utils/supabase/client";
import { overrideHandoff, directHandoffResolve, confirmDropOff } from "../actions";

interface Profile {
  id: string;
  display_name: string;
  department: string;
}

interface Claim {
  id: string;
  item_id: string;
  answer: string;
  status: string;
  claimant: Profile | null;
  item: {
    id: string;
    title: string;
    location: string;
  } | null;
}

export default function QRDeskPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [scannedItem, setScannedItem] = useState<{ id: string; title: string; location: string; status: string; drop_off_location?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setScanResult(decodedText);
        await loadClaimData(decodedText);
      },
      (error) => {
        // Scans continually
      }
    );

    return () => {
      scanner.clear().catch((err) => console.warn("Failed to clear scanner on unmount:", err));
    };
  }, []);

  const loadClaimData = async (text: string) => {
    setLoading(true);
    let itemId = text;

    if (text.includes("/lost-found/verify/")) {
      const parts = text.split("/lost-found/verify/");
      itemId = parts[parts.length - 1];
    }

    const supabase = createClient();

    // 1. Fetch item details
    const { data: itemData, error: itemError } = await supabase
      .from("lost_found_items")
      .select("id, title, location, status, drop_off_location")
      .eq("id", itemId)
      .single();

    if (itemError || !itemData) {
      alert("Scanned QR code does not match any items in the database.");
      setScanResult(null);
      setLoading(false);
      return;
    }

    setScannedItem(itemData);

    // 2. Fetch all claims for this item
    const { data: claimsData, error: claimsError } = await supabase
      .from("claims")
      .select(`
        id,
        item_id,
        answer,
        status,
        claimant:profiles(id, display_name, department)
      `)
      .eq("item_id", itemId)
      .order("created_at", { ascending: false });

    if (!claimsError && claimsData) {
      setClaims(claimsData as any[]);
      // Pre-select first pending claim if any, else first claim
      const pendingClaim = claimsData.find(c => c.status === "pending");
      if (pendingClaim) {
        setSelectedClaimId(pendingClaim.id);
        setClaim({ ...pendingClaim, item: itemData } as any);
      } else if (claimsData.length > 0) {
        setSelectedClaimId(claimsData[0].id);
        setClaim({ ...claimsData[0], item: itemData } as any);
      } else {
        setSelectedClaimId(null);
        setClaim(null);
      }
    } else {
      setClaims([]);
      setSelectedClaimId(null);
      setClaim(null);
    }
    setLoading(false);
  };

  const selectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    const found = claims.find(c => c.id === claimId);
    if (found) {
      setClaim({ ...found, item: scannedItem } as any);
    } else {
      setClaim(null);
    }
  };

  const handleOverride = () => {
    if (!claim) return;

    startTransition(async () => {
      try {
        await overrideHandoff(claim.id, claim.item_id);
        alert("Verification successful! Item status updated to RETURNED.");
        setScanResult(null);
        setScannedItem(null);
        setClaims([]);
        setClaim(null);
        window.location.reload();
      } catch (err) {
        console.error("Override failed:", err);
      }
    });
  };

  const handleDirectResolve = () => {
    if (!scannedItem) return;

    startTransition(async () => {
      try {
        await directHandoffResolve(scannedItem.id);
        alert("Verification successful! Item status updated to RETURNED.");
        setScanResult(null);
        setScannedItem(null);
        setClaims([]);
        setClaim(null);
        window.location.reload();
      } catch (err) {
        console.error("Direct resolve failed:", err);
      }
    });
  };

  const handleConfirmDropOff = () => {
    if (!scannedItem || !scannedItem.drop_off_location) return;

    startTransition(async () => {
      try {
        await confirmDropOff(scannedItem.id, scannedItem.drop_off_location!);
        alert(`Drop-off confirmed! Item status updated to Secured.`);
        setScanResult(null);
        setScannedItem(null);
        setClaims([]);
        setClaim(null);
        window.location.reload();
      } catch (err) {
        console.error("Drop-off confirmation failed:", err);
      }
    });
  };

  return (
    <div className="w-full min-h-screen p-6 flex flex-col font-sans select-none relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-pod-border pb-6">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-wide text-ink drop-shadow-sm">
            Handoff Verification Desk
          </h1>
          <p className="font-hand text-xl text-ink-soft mt-1">
            "Scan claimant QR codes to confirm physical item hand-offs"
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/admin/dashboard"
            className="font-sans text-xs text-ink-soft hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        
        {/* Left Card: Camera Reader */}
        <div 
          className="p-6 bg-pod-surface border border-pod-border text-ink pod-aura blob-shape shadow-sm"
          style={{ "--aura-gradient": "linear-gradient(135deg, #FF9A5A, #FFC93C)" } as React.CSSProperties}
        >
          <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-4 text-center">
            Camera QR Reader
          </span>

          <div id="qr-reader" className="w-full bg-white border border-dashed border-pod-border rounded-xl overflow-hidden shadow-inner" />

          {scanResult && (
            <button
              onClick={() => {
                setScanResult(null);
                setScannedItem(null);
                setClaims([]);
                setClaim(null);
                window.location.reload();
              }}
              className="mt-4 w-full py-2.5 bg-base border border-pod-border hover:bg-black/5 text-xs font-semibold uppercase rounded-full cursor-pointer"
            >
              Reset Scanner
            </button>
          )}
        </div>

        {/* Right Card: Claimant Details */}
        <div 
          className="p-6 bg-pod-surface border border-pod-border text-ink pod-aura blob-shape shadow-lg flex flex-col justify-between min-h-[300px]"
          style={{ "--aura-gradient": "linear-gradient(135deg, #FF9A5A, #FFC93C)" } as React.CSSProperties}
        >
          <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-4">
            Claimant Ticket details
          </span>

          {loading ? (
            <div className="flex-1 flex items-center justify-center font-hand text-lg animate-pulse">
              Pulling ticket details...
            </div>
          ) : scannedItem ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              {/* Item Info Header */}
              <div className="border-b border-pod-border pb-3 flex justify-between items-start">
                <div>
                  <span className="font-sans text-[9px] font-semibold text-ink-soft uppercase block">Scanned Item</span>
                  <h4 className="font-display text-base font-bold text-ink">{scannedItem.title}</h4>
                  <p className="text-[10px] text-ink-soft">Posted in {scannedItem.location}</p>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                  scannedItem.status === "returned" 
                    ? "bg-green-100 text-green-700" 
                    : scannedItem.status.startsWith("Secured at")
                      ? "bg-teal-100 text-teal-700 animate-pulse"
                      : "bg-amber-100 text-amber-700"
                }`}>
                  {scannedItem.status.startsWith("Secured at") ? "Secured" : scannedItem.status}
                </span>
              </div>

              {/* Drop-off Confirmation Panel */}
              {(scannedItem.status === "active" || scannedItem.status === "in_transit") && scannedItem.drop_off_location && (
                <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200/50 rounded-2xl flex flex-col gap-2.5 text-xs text-teal-800 dark:text-teal-300">
                  <div>
                    <span className="font-sans text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Drop-Off Hub Setup</span>
                    <p className="mt-0.5">This item is registered to be dropped off at: <span className="font-bold">{scannedItem.drop_off_location}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmDropOff}
                    disabled={isPending}
                    className="w-full flex items-center justify-center min-h-[40px] rounded-full bg-gradient-teal text-white font-sans font-semibold text-xs shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Confirming..." : `Confirm Drop-Off at ${scannedItem.drop_off_location}`}
                  </button>
                </div>
              )}

              {/* Claims List Section */}
              {claims.length > 0 ? (
                <div className="space-y-2">
                  <span className="font-sans text-[9px] font-semibold text-ink-soft uppercase block">Claim Tickets</span>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pb-1">
                    {claims.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectClaim(c.id)}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium flex items-center space-x-1.5 cursor-pointer transition-all ${
                          selectedClaimId === c.id
                            ? "bg-purple-600 text-white border-purple-700"
                            : "bg-white dark:bg-black/20 text-ink border-pod-border hover:bg-black/5"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          c.status === "approved" ? "bg-green-500" : c.status === "rejected" ? "bg-red-500" : "bg-amber-400 animate-pulse"
                        }`} />
                        <span>{c.claimant?.display_name || "Member"}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 rounded-xl text-center text-[10px] text-amber-800 dark:text-amber-300">
                  ⚠️ No claims submitted online for this item.
                </div>
              )}

              {/* Selected Claim / Direct Handoff Details */}
              {claim ? (
                <div className="space-y-3 pt-2 border-t border-pod-border">
                  <div>
                    <span className="font-sans text-[9px] font-semibold text-ink-soft uppercase block">Claimant Details</span>
                    <h5 className="font-sans text-xs font-bold text-ink">{claim.claimant?.display_name}</h5>
                    <p className="text-[10px] text-red-500 font-semibold">{claim.claimant?.department} Department</p>
                  </div>

                  <div>
                    <span className="font-sans text-[9px] font-semibold text-ink-soft uppercase block">Verification Answer</span>
                    <p className="font-sans text-xs text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-black/30 border border-pod-border p-3 rounded-xl italic leading-relaxed">
                      &quot;{claim.answer}&quot;
                    </p>
                  </div>

                  {claim.status === "pending" ? (
                    <button
                      onClick={handleOverride}
                      disabled={isPending}
                      className="w-full flex items-center justify-center min-h-[42px] rounded-full bg-gradient-teal text-white font-sans font-semibold text-xs shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer mt-2"
                    >
                      {isPending ? "Confirming..." : "Approve Claim & Confirm Handoff"}
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-slate-100 dark:bg-slate-800/40 text-slate-500 rounded-full text-center text-xs font-semibold">
                      Claim is {claim.status.toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-3 border-t border-pod-border flex flex-col items-center">
                  <p className="text-[10px] text-ink-soft text-center mb-3">
                    If the owner has arrived physically, you can resolve the item directly without a claim ticket.
                  </p>
                  <button
                    onClick={handleDirectResolve}
                    disabled={isPending || scannedItem.status === "returned"}
                    className="w-full flex items-center justify-center min-h-[42px] rounded-full bg-gradient-amber text-white font-sans font-semibold text-xs shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {isPending ? "Resolving..." : scannedItem.status === "returned" ? "Item Already Returned" : "Direct Handoff (No Claim Ticket)"}
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center font-sans text-xs text-ink-soft italic">
              Wait for camera scanner to capture an item QR code payload.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

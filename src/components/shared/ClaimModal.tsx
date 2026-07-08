"use client";

import React, { useActionState, useState, useEffect } from "react";
import { submitClaim } from "@/app/lost-found/claim/actions";
import { playSprite } from "@/utils/audio";

interface ClaimModalProps {
  itemId: string;
  question: string;
  onClose: () => void;
}

export default function ClaimModal({ itemId, question, onClose }: ClaimModalProps) {
  const [state, formAction, isPending] = useActionState(submitClaim, null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setSuccess(true);
      playSprite("stamp");
      const timer = setTimeout(() => {
        onClose();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 bg-ink-black/30 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      
      {/* Perforated Questionnaire Sheet */}
      <div 
        className="relative w-full max-w-md p-8 bg-paper-stock border-2 border-ink-black text-ink-black shadow-[4px_4px_0px_rgba(32,29,26,0.25)] animate-press-print-in"
        style={{ "--section-ink": "var(--riso-orange)" } as React.CSSProperties}
      >
        
        {/* Staple */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* Close Button */}
        {!success && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 font-mono text-[10px] font-bold uppercase text-red-500 hover:underline cursor-pointer"
          >
            [Cancel]
          </button>
        )}

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="font-display text-2.5xl uppercase border-4 border-success-ink text-success-ink px-6 py-2.5 inline-block transform -rotate-6 animate-stamp-thud">
              SUBMITTED
            </div>
            <p className="font-mono text-xs text-ink-black/60">
              Your response is printed and awaiting finder review.
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="itemId" value={itemId} />

            <div className="text-center border-b border-dashed border-ink-black/30 pb-3">
              <h2 className="font-display text-xl uppercase leading-none">
                File Notice Claim
              </h2>
              <p className="font-mono text-[10px] text-ink-black/60 mt-1.5">
                Provide verification details to prove ownership
              </p>
            </div>

            {state?.error && (
              <div className="p-3 border border-dashed border-red-500 text-red-500 text-xs font-mono">
                ⚠️ {state.error}
              </div>
            )}

            {/* Question description */}
            <div className="space-y-2 py-1 relative">
              <span className="font-mono text-[9px] font-bold text-ink-black/50 uppercase tracking-wider block">
                Verification Question
              </span>
              <p className="font-sans text-xs font-bold leading-normal text-ink-black">
                &quot;{question}&quot;
              </p>
            </div>

            {/* Answer textarea */}
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-ink-black/50 uppercase tracking-wider mb-1">
                Your Answer
              </span>
              <textarea
                name="answer"
                required
                rows={3}
                placeholder="Describe details only the true owner would know..."
                className="w-full bg-paper-stock border border-dashed border-ink-black outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange resize-none"
              />
            </div>

            {/* Submit ticket */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center min-h-[46px] border-2 border-ink-black font-mono font-bold text-xs uppercase bg-paper-stock text-ink-black hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              {isPending ? "PRINTING..." : "SUBMIT CLAIM ANSWER"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { login, signInWithGoogle } from "@/app/auth/actions";

const topNotices = [
  "📌 Lost Wallet Near Library",
  "📚 Calculus Notes Available",
  "🎮 Chess Club Tournament Friday",
  "💼 Internship Opportunity Posted",
  "🔑 Found Bike Key",
  "📱 iPhone Charger Found",
  "🎓 Study Group Looking for Members",
  "🎸 Guitar Swap Available"
];

const bottomNotices = [
  "📢 Ink Run #0042 Ready for Press",
  "📌 Lost ID Card near Commons",
  "🔑 Found Keys in Hall B",
  "📚 Notes Available for CS101",
  "🎓 Event Today: Zine Making Shop",
  "💼 Internship: Web Dev Assistant",
  "🎸 Skill Swap: Learn Screenprinting",
  "📰 Today's Notice Runs Active"
];

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  const [state, formAction, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  // Perforated bottom edge clip path (repeating 1% zigzag)
  const cardClipPath = "polygon(0 0, 100% 0, 100% 97%, 99% 98%, 98% 97%, 97% 98%, 96% 97%, 95% 98%, 94% 97%, 93% 98%, 92% 97%, 91% 98%, 90% 97%, 89% 98%, 88% 97%, 87% 98%, 86% 97%, 85% 98%, 84% 97%, 83% 98%, 82% 97%, 81% 98%, 80% 97%, 79% 98%, 78% 97%, 77% 98%, 76% 97%, 75% 98%, 74% 97%, 73% 98%, 72% 97%, 71% 98%, 70% 97%, 69% 98%, 68% 97%, 67% 98%, 66% 97%, 65% 98%, 64% 97%, 63% 98%, 62% 97%, 61% 98%, 60% 97%, 59% 98%, 58% 97%, 56% 97%, 55% 98%, 54% 97%, 53% 98%, 52% 97%, 51% 98%, 50% 97%, 49% 98%, 48% 97%, 47% 98%, 46% 97%, 45% 98%, 44% 97%, 43% 98%, 42% 97%, 41% 98%, 40% 97%, 39% 98%, 38% 97%, 37% 98%, 36% 97%, 35% 98%, 34% 97%, 33% 98%, 32% 97%, 31% 98%, 30% 97%, 29% 98%, 28% 97%, 27% 98%, 26% 97%, 25% 98%, 24% 97%, 23% 98%, 22% 97%, 21% 98%, 20% 97%, 19% 98%, 18% 97%, 17% 98%, 16% 97%, 15% 98%, 14% 97%, 13% 98%, 12% 97%, 11% 98%, 10% 97%, 9% 98%, 8% 97%, 7% 98%, 6% 97%, 5% 98%, 4% 97%, 3% 98%, 2% 97%, 1% 98%, 0 97%)";

  const renderTicker = (items: string[], reverse = false) => {
    return (
      <div className="relative w-full h-full overflow-hidden flex items-center">
        {/* Left Fading Edge */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#8C2A2A] to-transparent pointer-events-none z-20" />
        
        {/* Right Fading Edge */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#8C2A2A] to-transparent pointer-events-none z-20" />
        
        {/* Scrolling Text Container */}
        <div 
          className="animate-ticker hover:[animation-play-state:paused] flex whitespace-nowrap font-mono text-[9px] tracking-widest uppercase py-1 select-none"
          style={{ animationDuration: "45s", animationDirection: reverse ? "reverse" : "normal" }}
        >
          {/* First run */}
          <div className="flex items-center">
            {items.map((item, idx) => (
              <span key={`a-${idx}`} className="mx-6 flex items-center gap-1.5">{item}</span>
            ))}
          </div>
          {/* Second run for seamless infinite loop */}
          <div className="flex items-center">
            {items.map((item, idx) => (
              <span key={`b-${idx}`} className="mx-6 flex items-center gap-1.5">{item}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#F2EEE4] flex flex-col items-center justify-start py-16 px-4 font-sans select-none relative">
      
      {/* Ticker Banner at Top */}
      <div className="fixed top-0 left-0 right-0 h-8 bg-[#8C2A2A] text-[#F2EEE4] overflow-hidden flex items-center border-b border-[#201D1A] z-40 select-none">
        {renderTicker(topNotices, false)}
      </div>

      {/* Ticker Banner at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#8C2A2A] text-[#F2EEE4] overflow-hidden flex items-center border-t border-[#201D1A] z-40 select-none">
        {renderTicker(bottomNotices, true)}
      </div>

      {/* Wrapper containing aligned card - Wider Card (max-w-[500px]) */}
      <div className="relative w-full max-w-[500px] my-8 z-10">
        
        {/* Staples: positioned as siblings to the card to prevent clip-path cutting */}
        <div className="absolute -top-[5px] left-[15%] z-20">
          <svg width="24" height="10" viewBox="0 0 24 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8 V2 H20 V8" stroke="#4A4844" strokeWidth="2.5" strokeLinecap="square" fill="none" />
          </svg>
        </div>

        <div className="absolute -top-[5px] right-[15%] z-20">
          <svg width="24" height="10" viewBox="0 0 24 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8 V2 H20 V8" stroke="#4A4844" strokeWidth="2.5" strokeLinecap="square" fill="none" />
          </svg>
        </div>

        {/* Hand-stamped verified badge: sibling of card to float on top of clipped bottom-right edge */}
        <div 
          className="absolute -bottom-4 -right-4 z-30 select-none pointer-events-none opacity-90"
          style={{ transform: "rotate(-10deg)" }}
        >
          <div className="w-[84px] h-[84px] rounded-full border-[3px] border-[#8C2A2A] border-double flex flex-col items-center justify-center text-[#8C2A2A] leading-none bg-[#F2EEE4] p-1 text-center shadow-sm">
            <span className="font-display font-black text-[9px] tracking-wide">VERIFIED</span>
            <span className="text-[7px] tracking-widest font-mono font-bold mt-0.5">CAMPUS</span>
            <span className="text-[6px] tracking-wider text-[#8C2A2A]/85 mt-0.5">RISO RUN</span>
          </div>
        </div>

        {/* Main Riso card with 2px black border and flat 2px offset maroon print shadow */}
        <div 
          className="relative px-8 pt-[16px] pb-12 bg-[#F2EEE4] border-2 border-[#201D1A] text-[#201D1A] rounded-none shadow-[2px_2px_0px_#8C2A2A] animate-press-print-in"
          style={{
            backgroundImage: "radial-gradient(rgba(32,29,26,0.12) 0.8px, transparent 0.8px)",
            backgroundSize: "3px 3px",
            clipPath: cardClipPath
          }}
        >
          
          {/* Edition / Stub Number positioned inside the card at top-right corner with 12px padding */}
          <div className="absolute top-[12px] right-[12px] font-mono text-[10px] text-[#201D1A]/50 tracking-wider">
            No. 0042
          </div>

          {/* Clean tag: solid 1.5px dashed border with very light maroon tint */}
          <div className="flex justify-center mt-2">
            <div className="border-[1.5px] border-dashed border-[#8C2A2A] bg-[#8C2A2A]/5 px-4 py-1.5 inline-block select-none">
              <span className="font-mono text-[9px] font-bold tracking-[0.08em] uppercase text-[#8C2A2A]">
                FIND IT. SWAP IT.
              </span>
            </div>
          </div>

          {/* Card Header & Headline - Whitespace reduced by 25% */}
          <div 
            className="text-center border-b-2 border-dashed border-[rgba(32,29,26,0.25)] pb-4 flex flex-col items-center"
            style={{ marginTop: "14px" }}
          >
            <div className="relative inline-block select-none text-center">
              {/* Ghost Layer: #8C2A2A at 60% opacity, offset 2.5px down-right */}
              <div className="absolute left-[2.5px] top-[2.5px] text-[#8C2A2A] opacity-60 font-serif font-black uppercase text-[40px] leading-[0.95] select-none pointer-events-none whitespace-pre">
                {"CAMPUS\nCONNECT"}
              </div>
              {/* Key Layer */}
              <h1 className="relative font-serif font-black uppercase text-[40px] leading-[0.95] text-[#201D1A] z-10 whitespace-pre">
                {"CAMPUS\nCONNECT"}
              </h1>
            </div>
            
            <p 
              className="font-mono text-xs text-[#201D1A]/80 font-bold uppercase tracking-widest"
              style={{ marginTop: "6px" }}
            >
              sign in to check the board
            </p>
          </div>

          {/* Action Form */}
          <div style={{ marginTop: "16px" }}>
            <form 
              action={formAction} 
              className="space-y-6"
            >
              {state?.error && (
                <div className="p-3 border border-dashed border-[#8C2A2A] text-[#8C2A2A] text-xs font-mono font-bold">
                  ⚠️ {state.error}
                </div>
              )}
              {searchParams?.error && (
                <div className="p-3 border border-dashed border-[#8C2A2A] text-[#8C2A2A] text-xs font-mono font-bold">
                  ⚠️ Google Auth Error: {searchParams.error}
                </div>
              )}

              {/* Email field */}
              <div className="flex flex-col relative">
                <span className="font-mono text-xs font-bold text-[#201D1A] uppercase tracking-wider">
                  Campus Email
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="username@campus.edu"
                  required
                  className="w-full bg-transparent border-b-2 border-dashed border-[rgba(32,29,26,0.5)] outline-none py-2.5 font-mono text-sm text-[#201D1A] font-extrabold placeholder-[#201D1A]/50 focus:border-solid focus:border-[#201D1A] typewriter-caret"
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col relative">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-[#201D1A] uppercase tracking-wider">
                    Password
                  </span>
                  <Link
                    href="/auth/forgot-password"
                    className="font-mono text-xs text-[#8C2A2A] underline font-bold hover:text-[#a63c3c] transition-colors"
                  >
                    forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="w-full bg-transparent border-b-2 border-dashed border-[rgba(32,29,26,0.5)] outline-none py-2.5 pr-14 font-mono text-sm text-[#201D1A] font-extrabold placeholder-[#201D1A]/50 focus:border-solid focus:border-[#201D1A] typewriter-caret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 bottom-2 px-2 py-1.5 font-mono text-xs font-bold text-[#8C2A2A] uppercase hover:underline focus:outline-none cursor-pointer select-none"
                  >
                    {showPassword ? "hide" : "show"}
                  </button>
                </div>
              </div>

              {/* Submit Button with Jagged Clip Path & Ink Bleed Halo */}
              <button
                type="submit"
                disabled={isPending}
                style={{ 
                  clipPath: "polygon(0 0, 95% 0, 98% 12%, 95% 25%, 98% 37%, 95% 50%, 98% 62%, 95% 75%, 98% 87%, 95% 100%, 0 100%)",
                  filter: "drop-shadow(0px 0px 1.5px rgba(140, 42, 42, 0.75))"
                }}
                className="w-full flex items-center justify-center min-h-[48px] bg-[#8C2A2A] text-[#F2EEE4] font-sans font-bold text-xs uppercase hover:translate-y-[2px] active:translate-y-[3px] transition-all cursor-pointer disabled:opacity-50 rounded-none border-none"
              >
                <span>{isPending ? "authenticating..." : "ACCESS NOTICE BOARD"}</span>
              </button>

            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center my-6">
            <div className="flex-grow border-t-2 border-dashed border-[rgba(32,29,26,0.25)]" />
            <span className="font-mono text-xs text-[#201D1A] font-bold px-3 select-none lowercase">or</span>
            <div className="flex-grow border-t-2 border-dashed border-[rgba(32,29,26,0.25)]" />
          </div>

          {/* Google Sign In Form */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center min-h-[44px] border border-dashed border-[rgba(32,29,26,0.4)] bg-transparent text-[#201D1A] font-mono text-sm lowercase font-bold tracking-wider shadow-[2px_2px_0px_rgba(32,29,26,0.15)] hover:bg-[#201D1A]/5 hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#8C2A2A] transition-all cursor-pointer gap-2 rounded-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" style={{ filter: "grayscale(100%) brightness(40%) sepia(20%)" }}>
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.15C3.27 21.35 7.37 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24A7.18 7.18 0 0 1 5 12c0-.79.13-1.57.38-2.34V6.51H1.29A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.29 5.39l3.98-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.37 0 3.27 2.65 1.29 6.51l3.98 3.15c.95-2.85 3.6-4.91 6.73-4.91z"
                />
              </svg>
              <span>continue with google</span>
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs font-mono text-[#201D1A]/60 border-t-2 border-dashed border-[rgba(32,29,26,0.25)] pt-4">
            need an account?{" "}
            <Link
              href="/auth/signup"
              className="font-sans font-bold text-[#8C2A2A] text-sm underline hover:text-[#a63c3c] transition-colors"
            >
              sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

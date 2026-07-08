"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { signup } from "@/app/auth/actions";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Business Administration",
  "Physics & Mathematics",
  "Literature & Languages",
  "Design & Fine Arts",
  "Other",
];

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

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, null);
  const [showPassword, setShowPassword] = useState(false);

  // Perforated bottom edge clip path (repeating 1% zigzag)
  const cardClipPath = "polygon(0 0, 100% 0, 100% 97%, 99% 98%, 98% 97%, 97% 98%, 96% 97%, 95% 98%, 94% 97%, 93% 98%, 92% 97%, 91% 98%, 90% 97%, 89% 98%, 88% 97%, 87% 98%, 86% 97%, 85% 98%, 84% 97%, 83% 98%, 82% 97%, 81% 98%, 80% 97%, 79% 98%, 78% 97%, 76% 97%, 75% 98%, 74% 97%, 73% 98%, 72% 97%, 71% 98%, 70% 97%, 69% 98%, 68% 97%, 67% 98%, 66% 97%, 65% 98%, 64% 97%, 63% 98%, 62% 97%, 61% 98%, 60% 97%, 59% 98%, 58% 97%, 56% 97%, 55% 98%, 54% 97%, 53% 98%, 52% 97%, 51% 98%, 50% 97%, 49% 98%, 48% 97%, 47% 98%, 46% 97%, 45% 98%, 44% 97%, 43% 98%, 42% 97%, 41% 98%, 40% 97%, 39% 98%, 38% 97%, 37% 98%, 36% 97%, 35% 98%, 34% 97%, 33% 98%, 32% 97%, 31% 98%, 30% 97%, 29% 98%, 28% 97%, 27% 98%, 26% 97%, 25% 98%, 24% 97%, 23% 98%, 22% 97%, 21% 98%, 20% 97%, 19% 98%, 18% 97%, 17% 98%, 16% 97%, 15% 98%, 14% 97%, 13% 98%, 12% 97%, 11% 98%, 10% 97%, 9% 98%, 8% 97%, 7% 98%, 6% 97%, 5% 98%, 4% 97%, 3% 98%, 2% 97%, 1% 98%, 0 97%)";

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
        
        {/* Metal Paper Clip at top-left corner holding the form card */}
        <div className="absolute -top-[14px] left-[32px] z-30 select-none pointer-events-none transform -rotate-12">
          <svg width="24" height="42" viewBox="0 0 24 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M12 38 C17 38 21 34 21 29 L21 9 C21 5 17 2 12 2 C7 2 3 5 3 9 L3 29 C3 32.5 5.5 35 9 35 C12.5 35 15 32.5 15 29 L15 9 C15 7.5 13.5 6 12 6 C10.5 6 9 7.5 9 9 L9 29" 
              stroke="#5A5855" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none" 
            />
          </svg>
        </div>

        {/* Hand-stamped verified badge: sibling of card to float on top of clipped bottom-right edge */}
        <div 
          className="absolute -bottom-4 -right-4 z-30 select-none pointer-events-none opacity-90"
          style={{ transform: "rotate(-10deg)" }}
        >
          <div className="w-[84px] h-[84px] rounded-full border-[3px] border-[#8C2A2A] border-double flex flex-col items-center justify-center text-[#8C2A2A] leading-none bg-[#EFEAD8] p-1 text-center shadow-sm">
            <span className="font-display font-black text-[9px] tracking-wide">VERIFIED</span>
            <span className="text-[7px] tracking-widest font-mono font-bold mt-0.5">CAMPUS</span>
            <span className="text-[6px] tracking-wider text-[#8C2A2A]/85 mt-0.5">RISO RUN</span>
          </div>
        </div>

        {/* Approved stamp effect watermark on the sheet */}
        <div 
          className="absolute bottom-[136px] left-[60px] z-20 select-none pointer-events-none opacity-20 border-[3px] border-[#8C2A2A] border-dashed rounded-xs px-3 py-1 font-display font-black text-[#8C2A2A] text-center tracking-widest text-[11px] leading-tight"
          style={{ transform: "rotate(-8deg)" }}
        >
          <div>APPROVED</div>
          <div className="text-[6px] font-mono tracking-wider font-bold">CAMPUS EXCHANGE</div>
        </div>

        {/* Main Riso card with 2px black border and flat 2px offset maroon print shadow */}
        {/* DESIGN SHIFT: Uses light Manila stock (#EFEAD8) and ruled ledger paper grid instead of dot matrix */}
        <div 
          className="relative pl-12 pr-8 pt-[16px] pb-12 bg-[#EFEAD8] border-2 border-[#201D1A] text-[#201D1A] rounded-none shadow-[2px_2px_0px_#8C2A2A] animate-press-print-in"
          style={{
            backgroundImage: "linear-gradient(rgba(140, 42, 42, 0.08) 1px, transparent 1px)",
            backgroundSize: "100% 28px",
            clipPath: cardClipPath
          }}
        >
          
          {/* Vertical notebook red margin line */}
          <div className="absolute left-[36px] top-0 bottom-0 w-[1.5px] bg-[#8C2A2A]/25 pointer-events-none" />

          {/* Student ID Stamp: Detailed Top Right Info Block */}
          <div className="absolute top-[12px] right-[12px] font-mono text-[8px] text-[#201D1A]/50 tracking-wider text-right leading-tight select-none">
            <div>STUDENT REGISTRATION</div>
            <div className="font-bold text-[9px] text-[#8C2A2A]/70">No. 0002</div>
            <div>VERIFIED BY CAMPUS</div>
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
              pin your profile to the board
            </p>
          </div>

          {/* Registration Progress Indicator Panel */}
          <div className="text-center font-mono text-[9px] text-[#201D1A]/50 tracking-widest uppercase my-3 select-none">
            <div className="text-[#8C2A2A]/40 mb-1">□ □ □ □ □ □ □ □ □ □</div>
            <div className="font-bold text-[#201D1A]/70">BOARD ENTRY FORM</div>
            <div className="text-[8px] mt-0.5">Step 1 of 1</div>
          </div>

          {/* Action Form */}
          <div className="mt-2">
            <form 
              action={formAction} 
              className="space-y-6"
            >
              {state?.error && (
                <div className="p-3 border border-dashed border-[#8C2A2A] text-[#8C2A2A] text-xs font-mono font-bold">
                  ⚠️ {state.error}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col relative">
                <span className="font-mono text-xs font-bold text-[#201D1A] uppercase tracking-wider">
                  Full Name
                </span>
                <input
                  name="fullName"
                  type="text"
                  placeholder="Jwalitha Murari"
                  required
                  className="w-full bg-transparent border-b-2 border-dashed border-[rgba(32,29,26,0.5)] outline-none py-2.5 font-mono text-sm text-[#201D1A] font-extrabold placeholder-[#201D1A]/50 focus:border-solid focus:border-[#201D1A] typewriter-caret"
                />
              </div>

              {/* Stamped Department Selector styled like [ Department ▼ ] */}
              <div className="flex flex-col relative">
                <span className="font-mono text-xs font-bold text-[#201D1A] uppercase tracking-wider">
                  Department
                </span>
                <div className="flex items-center gap-1.5 font-mono text-sm text-[#201D1A] font-extrabold border-b-2 border-dashed border-[rgba(32,29,26,0.5)]">
                  <span className="select-none text-[#201D1A]/60">[</span>
                  <select
                    name="department"
                    required
                    defaultValue=""
                    className="flex-grow bg-transparent outline-none py-2.5 font-mono text-sm text-[#201D1A] font-extrabold focus:border-solid focus:border-[#201D1A] cursor-pointer appearance-none"
                  >
                    <option value="" disabled className="bg-[#EFEAD8] text-[#201D1A]/55 font-mono">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-[#EFEAD8] text-[#201D1A] font-mono text-xs">
                        {dept}
                      </option>
                    ))}
                  </select>
                  <span className="select-none text-[#8C2A2A] text-[9px] pr-1">▼</span>
                  <span className="select-none text-[#201D1A]/60">]</span>
                </div>
              </div>

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
                <span className="font-mono text-xs font-bold text-[#201D1A] uppercase tracking-wider">
                  Password
                </span>
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

              {/* PIN MY PROFILE submit button with Jagged Clip Path */}
              <button
                type="submit"
                disabled={isPending}
                style={{ 
                  clipPath: "polygon(0 0, 95% 0, 98% 12%, 95% 25%, 98% 37%, 95% 50%, 98% 62%, 95% 75%, 98% 87%, 95% 100%, 0 100%)",
                  filter: "drop-shadow(0px 0px 1.5px rgba(140, 42, 42, 0.75))"
                }}
                className="w-full flex items-center justify-between min-h-[48px] bg-[#8C2A2A] text-[#F2EEE4] font-sans font-bold text-xs uppercase hover:translate-y-[2px] active:translate-y-[3px] transition-all cursor-pointer disabled:opacity-50 rounded-none border-none px-6"
              >
                <span>{isPending ? "Submitting Registration..." : "PIN MY PROFILE"}</span>
                <div className="h-6 border-r border-dashed border-[#F2EEE4]/40 mx-4" />
                <span className="font-mono text-[10px] normal-case opacity-90 tracking-normal">
                  No. 0002
                </span>
              </button>

            </form>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs font-mono text-[#201D1A]/60 border-t-2 border-dashed border-[rgba(32,29,26,0.25)] pt-4">
            Already on the board?{" "}
            <Link
              href="/auth/login"
              className="font-sans font-bold text-[#8C2A2A] text-sm underline hover:text-[#a63c3c] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { isAudioEnabled, toggleAudio, playSprite } from "@/utils/audio";

export default function AmbientOverlay({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hour, setHour] = useState<number>(12); // Default to midday
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    const currentHour = new Date().getHours();
    setHour(currentHour);

    setSoundOn(isAudioEnabled());

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest(".riso-card") ||
        target.closest("button")
      ) {
        playSprite("thock");
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const handleToggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    toggleAudio(newState);
    if (newState) {
      setTimeout(() => playSprite("bloom"), 50);
    }
  };

  let variableOverrides = `
    --paper-stock: #F2EEE4;
    --riso-orange-paper: #FFF7F7;
    --riso-marine-paper: #FFF7F7;
    --riso-violet-paper: #FFF7F7;
    --riso-yellow-paper: #FFFDF0;
    --ink-black: #201D1A;
    --riso-orange: #8C2A2A;
    --riso-marine: #8C2A2A;
    --riso-violet: #8C2A2A;
    --riso-yellow: #8C2A2A;
  `;

  const isLandingPage = pathname === "/";

  return (
    <div className={`relative w-full min-h-screen flex flex-col bg-paper-stock bg-riso-run`}>
      {/* Global CSS injection for time-of-day parameters */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${variableOverrides}
        }
      `}} />

      {/* Styled Custom Avatar Circle "N" */}
      {!isLandingPage && (
        <div className="fixed top-12 left-8 z-50 select-none">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#8C2A2A] bg-[#F2EEE4] text-[#8C2A2A] flex items-center justify-center shadow-[1.5px_1.5px_0px_#8C2A2A] font-serif font-black text-lg">
            N
          </div>
        </div>
      )}

      {/* Children content */}
      <div className="relative flex-1 z-10">{children}</div>

      {/* Styled Themed Audio Controller */}
      {!isLandingPage && (
        <div className="fixed bottom-12 left-8 z-50 select-none">
          <button
            onClick={handleToggleSound}
            className="w-12 h-12 rounded-full border-2 border-dashed border-[#8C2A2A] bg-[#F2EEE4] text-[#8C2A2A] hover:bg-[#8C2A2A]/5 active:translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-center shadow-[1.5px_1.5px_0px_#8C2A2A] focus:outline-none font-mono text-[9px] font-bold uppercase text-center leading-none"
            title="Toggle Board Audio"
          >
            {soundOn ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm">🔊</span>
                <span className="text-[7px] mt-0.5">ON</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm">🔇</span>
                <span className="text-[7px] mt-0.5">OFF</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

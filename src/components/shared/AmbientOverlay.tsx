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

  const isMorning = hour >= 6 && hour < 11;
  const isMidday = hour >= 11 && hour < 16;
  const isEvening = hour >= 16 && hour < 19;
  const isNight = hour >= 19 || hour < 6;

  let variableOverrides = "";
  if (isMorning) {
    variableOverrides = `
      --paper-stock: #FAF7F2;
      --riso-orange-paper: #FFF9F9;
      --riso-marine-paper: #FFF9F9;
      --riso-violet-paper: #FFF9F9;
      --riso-yellow-paper: #FFFDF5;
      --ink-black: #2E2824;
      --riso-orange: #9E3535;
      --riso-marine: #9E3535;
      --riso-violet: #9E3535;
      --riso-yellow: #9E3535;
    `;
  } else if (isMidday) {
    variableOverrides = `
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
  } else if (isEvening) {
    variableOverrides = `
      --paper-stock: #ECE6D9;
      --riso-orange-paper: #FFF1F1;
      --riso-marine-paper: #FFF1F1;
      --riso-violet-paper: #FFF1F1;
      --riso-yellow-paper: #FFFBE0;
      --ink-black: #1B1816;
      --riso-orange: #7C2424;
      --riso-marine: #7C2424;
      --riso-violet: #7C2424;
      --riso-yellow: #7C2424;
    `;
  } else if (isNight) {
    variableOverrides = `
      --paper-stock: #181614;
      --riso-orange-paper: #2D1A1A;
      --riso-marine-paper: #2D1A1A;
      --riso-violet-paper: #2D1A1A;
      --riso-yellow-paper: #2D1A1A;
      --ink-black: #F2EEE4;
      --riso-orange: #A63C3C;
      --riso-marine: #A63C3C;
      --riso-violet: #A63C3C;
      --riso-yellow: #A63C3C;
      --success-ink: #2DB57B;
    `;
  }

  const isLandingPage = pathname === "/";

  return (
    <div className={`relative w-full min-h-screen flex flex-col bg-paper-stock bg-riso-run ${isNight ? "dark" : ""}`}>
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

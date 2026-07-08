"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { isAudioEnabled, toggleAudio, playSprite } from "@/utils/audio";

export default function WelcomeLanding() {
  const [soundOn, setSoundOn] = useState(false);
  const [activeIcon, setActiveIcon] = useState("/central_sketch_logo.png");

  useEffect(() => {
    setSoundOn(isAudioEnabled());
  }, []);

  const handleToggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    toggleAudio(newState);
    if (newState) {
      setTimeout(() => playSprite("bloom"), 50);
    }
  };

  return (
    <div 
      className="w-full min-h-screen bg-[#F2EEE4] bg-riso-run text-[#201D1A] flex flex-col select-none relative overflow-y-auto"
    >
      {/* Fixed Paper Noise Overlay (viewport-fixed, enhanced density) */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay animate-noise z-30"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
      />
      
      {/* Self-contained custom style block for animations and complex morphing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes noise-jitter {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1.5%); }
          20% { transform: translate(-2%, 1%); }
          30% { transform: translate(1.5%, -2%); }
          40% { transform: translate(-1.5%, 1.5%); }
          50% { transform: translate(2%, -1%); }
          60% { transform: translate(1%, 2%); }
          70% { transform: translate(-2%, -2%); }
          80% { transform: translate(1.5%, 1.5%); }
          90% { transform: translate(-1%, 1%); }
          100% { transform: translate(0, 0); }
        }
        .animate-noise {
          animation: noise-jitter 0.6s steps(4) infinite;
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor-blink {
          animation: cursor-blink 0.9s step-end infinite;
        }
        .cta-button-morph {
          clip-path: polygon(0 0, 92% 0, 96% 25%, 92% 50%, 96% 75%, 92% 100%, 0 100%);
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .cta-button-morph:hover {
          clip-path: polygon(0 0, 94% 0, 98% 25%, 94% 50%, 98% 75%, 94% 100%, 0 100%);
        }
        .stamp-hover {
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.25s ease, opacity 0.25s ease;
        }
        .stamp-hover:hover {
          transform: scale(1.08) rotate(3deg);
          opacity: 0.92;
          filter: drop-shadow(2px 3px 2px rgba(140, 42, 42, 0.35));
        }
        .stamp-badge-hover {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s ease;
        }
        .stamp-badge-hover:hover {
          transform: scale(1.12) rotate(-6deg);
          filter: drop-shadow(3px 4px 2px rgba(140, 42, 42, 0.4));
        }
        @keyframes ephemera-float {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-5px) translateX(3px) rotate(1.5deg); }
        }
        .animate-ephemera {
          animation: ephemera-float 6s ease-in-out infinite;
        }
        .sketch-mask-keys {
          mask-image: radial-gradient(circle at center left, black 40%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center left, black 40%, transparent 80%);
        }
        .sketch-mask-building {
          mask-image: radial-gradient(circle at bottom left, black 45%, transparent 85%);
          -webkit-mask-image: radial-gradient(circle at bottom left, black 45%, transparent 85%);
        }
        .sketch-mask-telescope {
          mask-image: radial-gradient(circle at center right, black 40%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center right, black 40%, transparent 80%);
        }
        .woodcut-mask {
          mask-image: radial-gradient(circle at center, black 65%, transparent 90%);
          -webkit-mask-image: radial-gradient(circle at center, black 65%, transparent 90%);
        }

      `}} />

      {/* Hero Section Container (First Fold) */}
      <div className="relative w-full min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 overflow-hidden border-b border-dashed border-[#201D1A]/20">

        {/* Background Sketch: Campus Library Building */}
        <div className="absolute bottom-[-20px] left-[-20px] w-96 md:w-[500px] lg:w-[620px] xl:w-[750px] opacity-[0.16] pointer-events-none mix-blend-multiply z-0 select-none sketch-mask-building">
          <img src="/campus_building.png" alt="" className="w-full h-auto object-contain" />
        </div>

        {/* Background Sketch: Telescope */}
        <div className="absolute top-1/2 right-[-5%] -translate-y-1/2 w-72 md:w-[420px] lg:w-[520px] xl:w-[620px] opacity-[0.16] pointer-events-none mix-blend-multiply z-0 select-none sketch-mask-telescope">
          <img src="/telescope.png" alt="" className="w-full h-auto object-contain" />
        </div>



        {/* Anchored Custom Avatar Circle "N" (shifted for breathing room & alignment) */}
        <div className="absolute top-12 left-8 z-20 select-none">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#8C2A2A] bg-[#F2EEE4] text-[#8C2A2A] flex items-center justify-center shadow-[1.5px_1.5px_0px_#8C2A2A] font-serif font-black text-lg">
            N
          </div>
        </div>

        {/* Anchored Themed Audio Controller (shifted for breathing room & alignment) */}
        <div className="absolute bottom-12 left-8 z-20 select-none">
          <button
            onClick={handleToggleSound}
            className="w-10 h-10 rounded-full border-2 border-dashed border-[#8C2A2A] bg-[#F2EEE4] text-[#8C2A2A] hover:bg-[#8C2A2A]/5 active:translate-y-0.5 transition-all cursor-pointer flex flex-col items-center justify-center shadow-[1.5px_1.5px_0px_#8C2A2A] focus:outline-none font-mono text-[9px] font-bold uppercase text-center leading-none"
            title="Toggle Board Audio"
          >
            {soundOn ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs">🔊</span>
                <span className="text-[5px] mt-0.5">ON</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs">🔇</span>
                <span className="text-[5px] mt-0.5">OFF</span>
              </div>
            )}
          </button>
        </div>

        {/* Registration Marks (+) in 4 corners */}
        <div className="absolute top-4 left-4 text-[#8C2A2A] font-mono text-sm select-none pointer-events-none">+</div >
        <div className="absolute top-4 right-4 text-[#8C2A2A] font-mono text-sm select-none pointer-events-none">+</div >
        <div className="absolute bottom-4 left-4 text-[#8C2A2A] font-mono text-sm select-none pointer-events-none">+</div >
        <div className="absolute bottom-4 right-4 text-[#8C2A2A] font-mono text-sm select-none pointer-events-none">+</div >

        {/* Top Header Row */}
        <div className="flex justify-between items-center w-full pt-4 md:pt-6 pb-1 z-10 font-mono text-[10px] sm:text-xs">
          {/* Shifted right slightly on the left block to clear top-left avatar */}
          <div className="flex items-center gap-2.5 font-mono text-[10px] sm:text-xs font-bold pl-16 text-[#8C2A2A] uppercase tracking-wider">
            <Link href="/" className="hover:underline transition-colors">nav</Link>
            <span className="text-[#8C2A2A]/30">/</span>
            <Link href="#how-it-works" className="hover:underline transition-colors">faq</Link>
            <span className="text-[#8C2A2A]/30">/</span>
            <Link href="/lost-found" className="hover:underline transition-colors">browse</Link>
            <span className="text-[#8C2A2A]/30">/</span>
            <Link href="/community" className="hover:underline transition-colors">community</Link>
          </div>
          
          <Link 
            href="/login"
            className="border-2 border-dashed border-[#8C2A2A] rounded-full px-4 py-1.5 font-mono text-xs font-bold text-[#8C2A2A] uppercase hover:bg-[#8C2A2A]/5 active:translate-y-0.5 transition-all duration-150 cursor-pointer stamp-hover"
          >
            LOG IN
          </Link>
        </div>

        {/* Dashed Horizontal Line */}
        <div className="w-full border-b border-dashed border-[#201D1A]/30 my-3 z-10" />

        {/* Vertical Left Margin Text */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 [writing-mode:vertical-lr] rotate-180 font-mono text-[9px] uppercase tracking-[0.25em] text-[#201D1A]/40 select-none">
          PRINTED ON CAMPUS
        </div>

        {/* Vertical Right Margin Text */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 [writing-mode:vertical-lr] font-mono text-[9px] uppercase tracking-[0.25em] text-[#201D1A]/40 select-none">
          EDITION 03 · 2026
        </div>

        {/* Center Content Group */}
        <div className="flex flex-col items-center justify-center my-auto py-2 relative select-none z-10">
          
          {/* Tilted Stamp Badge (Campus Exchange) - slightly overlaps title with shadow */}
          <div 
            className="absolute top-[13%] right-[-15px] sm:right-[-20px] w-[90px] h-[90px] rounded-full border-2 border-dashed border-[#8C2A2A] flex flex-col items-center justify-center text-[#8C2A2A] p-1.5 text-center select-none -rotate-12 transition-transform duration-500 z-20 cursor-pointer stamp-badge-hover"
            style={{ pointerEvents: "auto", filter: "drop-shadow(1.5px 2.5px 1px rgba(140, 42, 42, 0.25))" }}
          >
            <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-widest leading-none">CAMPUS</span>
            <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-widest leading-none mt-0.5">EXCHANGE</span>
            <span className="font-mono text-[7px] sm:text-[8px] tracking-widest leading-none mt-1.5">EST. 2026</span>
          </div>

          <span className="font-mono text-xs font-bold tracking-[0.15em] uppercase text-[#8C2A2A] mb-3 mt-4 flex items-center">
            FIND IT. SWAP IT.
          </span>

          <div className="relative inline-block select-none text-center mb-1">
            {/* Ghost Layer: #8C2A2A at 55% opacity */}
            <div className="absolute left-[3px] top-[3px] text-[#8C2A2A] opacity-55 font-serif font-black uppercase text-[42px] sm:text-[54px] leading-[0.95] select-none pointer-events-none whitespace-pre tracking-wide">
              {"CAMPUS\nCONNECT"}
            </div>
            {/* Key Layer */}
            <h1 className="relative font-serif font-black uppercase text-[42px] sm:text-[54px] leading-[0.95] text-[#201D1A] z-10 whitespace-pre tracking-wide">
              {"CAMPUS\nCONNECT"}
            </h1>
          </div>

          <div className="w-32 h-[3px] bg-[#201D1A] my-4" />

          {/* Central Sketch Icon */}
          <div className="h-[70px] my-2 relative select-none z-10 flex items-center justify-center">
            <img src={activeIcon} alt="Campus Connect Logo" className="h-full w-auto object-contain opacity-[0.90]" />
          </div>

        </div>

        {/* Bottom Call To Action Block */}
        <div className="relative flex flex-col items-center w-full z-10 pb-2">
          
          {/* Ink Spatter behind button's right edge (resized & opacity boosted) */}
          <div className="absolute left-[calc(50%+142px)] top-[2px] w-[40px] h-[50px] opacity-65 text-[#8C2A2A] z-0 pointer-events-none select-none animate-ephemera">
            <svg viewBox="0 0 40 50" fill="currentColor" className="w-full h-full">
              <circle cx="6" cy="10" r="2" />
              <circle cx="16" cy="6" r="1.2" />
              <circle cx="8" cy="24" r="2.5" />
              <circle cx="24" cy="12" r="1.2" />
              <circle cx="20" cy="28" r="2" />
              <circle cx="32" cy="36" r="2.5" />
              <circle cx="14" cy="42" r="1.2" />
              <circle cx="26" cy="22" r="1.2" />
              <circle cx="35" cy="28" r="2" />
            </svg>
          </div>
          {/* Editorial quote that fits the project zine style */}
          <p className="font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#201D1A]/60 text-center w-full max-w-md mx-auto mb-5 leading-relaxed select-none z-10">
            “What one hand loses, another hand finds.”
          </p>

          <Link
            href="/login"
            style={{ 
              filter: "drop-shadow(3px 4px 0px #201D1A)"
            }}
            className="group w-full max-w-[280px] flex items-center justify-center min-h-[52px] bg-[#8C2A2A] text-[#F2EEE4] font-sans font-bold text-sm tracking-wider uppercase hover:translate-y-[-3px] active:translate-y-[1px] transition-all duration-300 cursor-pointer rounded-none border-none py-3 px-6 cta-button-morph relative z-10"
          >
            <span className="flex items-center gap-1.5">
              GET STARTED
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </span>
          </Link>

          <span className="font-serif italic text-[#201D1A]/60 text-xs text-center mt-4">
            lost today. found tomorrow.
          </span>
        </div>
      </div>

      {/* Section 2: Below the Fold Content */}
      <div className="w-full bg-[#F2EEE4] py-16 px-6 sm:px-10 md:px-12 flex flex-col items-center relative z-10">
        
        {/* Live Swap Ticker */}
        <div className="w-full border-y border-dashed border-[#201D1A]/30 py-4 overflow-hidden bg-[#F2EEE4] z-10 relative select-none">
          <div className="animate-ticker whitespace-nowrap flex gap-12 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-[#201D1A]">
            {/* First copy */}
            <span>🔄 CS101 Calculus Textbook swapped for Desk Lamp</span>
            <span>🔄 Chem Lab Coat swapped for Safety Goggles</span>
            <span>🔄 Retro Casio Watch swapped for Mechanical Keyboard</span>
            <span>🔄 Drafting Board swapped for Dorm Rug</span>
            <span>🔄 Lost Keys near Union found & returned</span>
            <span>🔄 Scientific Calculator swapped for Desk Organizer</span>
            {/* Second copy for infinite loop */}
            <span>🔄 CS101 Calculus Textbook swapped for Desk Lamp</span>
            <span>🔄 Chem Lab Coat swapped for Safety Goggles</span>
            <span>🔄 Retro Casio Watch swapped for Mechanical Keyboard</span>
            <span>🔄 Drafting Board swapped for Dorm Rug</span>
            <span>🔄 Lost Keys near Union found & returned</span>
            <span>🔄 Scientific Calculator swapped for Desk Organizer</span>
          </div>
        </div>

        {/* Category Filters Banner */}
        <div className="mt-12 w-full max-w-4xl text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#8C2A2A] mb-4">
            Ready to browse? Select a category
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              { label: "Textbooks", href: "/lost-found?category=textbooks", icon: "📚", woodcut: "/category_books.png" },
              { label: "Lab Gear", href: "/lost-found?category=lab-gear", icon: "🧪", woodcut: "/category_microscope.png" },
              { label: "Electronics", href: "/lost-found?category=electronics", icon: "🔌", woodcut: "/category_laptop.png" },
              { label: "Dorm Decor", href: "/lost-found?category=dorm-decor", icon: "🛏️", woodcut: "/category_lamp.png" },
              { label: "Lost & Found", href: "/lost-found", icon: "🔑", woodcut: "/category_keys.png" },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                onMouseEnter={() => setActiveIcon(cat.woodcut)}
                onMouseLeave={() => setActiveIcon("/central_sketch_logo.png")}
                className="px-4 py-2 bg-[#F2EEE4] border-2 border-[#201D1A] rounded-none font-mono text-xs font-bold text-[#201D1A] hover:bg-[#8C2A2A] hover:text-[#F2EEE4] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-[2px_2px_0px_#201D1A]"
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Exclusive .edu Verification Callout */}
        <div className="mt-16 w-full max-w-3xl border-2 border-dashed border-[#8C2A2A] p-6 bg-[#8C2A2A]/5 relative text-center">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F2EEE4] px-4 font-mono text-xs font-bold uppercase text-[#8C2A2A] tracking-widest border border-dashed border-[#8C2A2A]">
            🔒 Exclusive Community
          </div>
          <h3 className="font-serif font-black text-lg sm:text-xl text-[#201D1A] mt-2 mb-1">
            CAMPUS EMAIL REQUIRED
          </h3>
          <p className="font-mono text-xs text-[#201D1A]/85 max-w-xl mx-auto leading-relaxed">
            To keep our campus exchanges safe and secure, registration is strictly limited to users with a verified university email account (<span className="text-[#8C2A2A] font-bold">.edu</span> or official institution domain).
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mt-24 w-full max-w-5xl">
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-center uppercase tracking-wide text-[#201D1A] mb-2">
            HOW IT WORKS
          </h2>
          <p className="font-mono text-xs text-[#201D1A]/60 text-center uppercase tracking-widest mb-12">
            Simple exchanges in three quick steps
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "SNAP IT",
                desc: "Take a quick photo of your unused textbooks, gear, or dorm decor, and post it in seconds.",
                tag: "List your item",
                icon: "📸"
              },
              {
                step: "02",
                title: "MATCH IT",
                desc: "Connect with classmates looking for what you have, or browse their listings for a swap.",
                tag: "Find a match",
                icon: "🤝"
              },
              {
                step: "03",
                title: "SWAP IT",
                desc: "Coordinate a meetup at one of our verified Safe Exchange Zones on campus to trade.",
                tag: "Meet safely",
                icon: "🏫"
              }
            ].map((item) => (
              <div key={item.step} className="border-2 border-[#201D1A] p-6 relative bg-[#F2EEE4] shadow-[4px_4px_0px_#201D1A]">
                {/* Step number badge */}
                <div className="absolute -top-3.5 -left-3.5 w-8 h-8 rounded-full bg-[#8C2A2A] text-[#F2EEE4] font-mono text-xs font-bold flex items-center justify-center border-2 border-[#201D1A] shadow-[1.5px_1.5px_0px_#201D1A]">
                  {item.step}
                </div>
                <div className="text-3xl mb-4 text-center mt-2">{item.icon}</div>
                <h4 className="font-serif font-black text-lg text-[#201D1A] text-center mb-1 uppercase tracking-wide">
                  {item.title}
                </h4>
                <p className="font-mono text-[10px] font-bold text-[#8C2A2A] uppercase text-center mb-3 tracking-widest">
                  {item.tag}
                </p>
                <p className="font-mono text-xs text-[#201D1A]/70 text-center leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Campus Listings */}
        <div className="mt-28 w-full max-w-5xl">
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-center uppercase tracking-wide text-[#201D1A] mb-2">
            RECENT SWAP POSTINGS
          </h2>
          <p className="font-mono text-xs text-[#201D1A]/60 text-center uppercase tracking-widest mb-12">
            Browse recent flyers posted by students this week
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "organic chemistry ii",
                cat: "textbook",
                desc: "Wade (8th Edition). Crisp pages, no highlights. Looking for CS102 study notes or drafting board.",
                img: "/category_books.png",
                postNo: "#0042",
                date: "2 hrs ago"
              },
              {
                title: "ti-84 plus calculator",
                cat: "electronics",
                desc: "Standard graphing calculator, battery cover intact. Swap for dorm rug or desk organizer.",
                img: "/category_laptop.png",
                postNo: "#0039",
                date: "4 hrs ago"
              },
              {
                title: "brass task lamp",
                cat: "dorm decor",
                desc: "Adjustable neck, includes warm LED bulb. Swap for organic chemistry guide or safety goggles.",
                img: "/category_lamp.png",
                postNo: "#0035",
                date: "1 day ago"
              }
            ].map((item) => (
              <div key={item.title} className="border border-[#201D1A]/30 p-5 bg-[#F2EEE4] relative flex flex-col justify-between hover:border-[#8C2A2A] hover:shadow-[3px_3px_0px_#8C2A2A] transition-all duration-200">
                {/* Faint Pencil-drawn border on Thumbnail */}
                <div className="w-full h-40 border border-dashed border-[#201D1A]/30 bg-[#F2EEE4] flex items-center justify-center p-4 mb-4 relative overflow-hidden mix-blend-multiply opacity-80">
                  <img src={item.img} alt={item.title} className="max-h-full max-w-full object-contain" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[9px] font-bold text-[#8C2A2A] uppercase tracking-wider bg-[#8C2A2A]/5 px-2 py-0.5">
                      {item.cat}
                    </span>
                    <span className="font-mono text-[9px] text-[#201D1A]/50 font-bold uppercase">
                      {item.postNo}
                    </span>
                  </div>
                  <h4 className="font-serif font-black text-md text-[#201D1A] uppercase tracking-wide mb-2 line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="font-mono text-xs text-[#201D1A]/70 leading-relaxed mb-4 line-clamp-3">
                    {item.desc}
                  </p>
                </div>
                
                <div className="flex justify-between items-center border-t border-dashed border-[#201D1A]/20 pt-3">
                  <span className="font-mono text-[9px] text-[#201D1A]/60 uppercase font-bold">
                    🕒 {item.date}
                  </span>
                  <Link
                    href="/login"
                    className="font-mono text-[10px] font-bold text-[#8C2A2A] hover:underline uppercase tracking-wider"
                  >
                    CLAIM SWAP →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safe Exchange Zones */}
        <div className="mt-28 w-full max-w-5xl mb-12">
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-center uppercase tracking-wide text-[#201D1A] mb-2">
            SAFE EXCHANGE ZONES
          </h2>
          <p className="font-mono text-xs text-[#201D1A]/60 text-center uppercase tracking-widest mb-12">
            Verified, well-lit meetup locations on campus
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Map Card */}
            <div className="border-2 border-[#201D1A] bg-[#F2EEE4] p-6 flex flex-col justify-between shadow-[4px_4px_0px_#201D1A] relative min-h-[300px]">
              <div className="absolute top-3 right-3 bg-[#1B8555] text-[#F2EEE4] font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                ✓ SECURE ZONE
              </div>
              <div>
                <h4 className="font-serif font-black text-lg text-[#201D1A] mb-2 uppercase">
                  📍 Campus Meeting Spots
                </h4>
                <p className="font-mono text-xs text-[#201D1A]/70 leading-relaxed mb-4">
                  To ensure safety, we recommend conducting swaps at verified locations. These spots are monitored, brightly lit, and highly active.
                </p>
              </div>

              {/* Styled Mock SVG Map */}
              <div className="w-full h-44 bg-[#F2EEE4] border border-dashed border-[#201D1A]/40 relative overflow-hidden flex items-center justify-center">
                {/* Abstract Campus Map Lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#201D1A" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#201D1A" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="85%" y1="0" x2="85%" y2="100%" stroke="#201D1A" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#201D1A" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#201D1A" strokeWidth="2" strokeDasharray="4 4" />
                  
                  <rect x="15%" y="40%" width="25%" height="25%" fill="none" stroke="#201D1A" strokeWidth="2" />
                  <rect x="60%" y="10%" width="20%" height="45%" fill="none" stroke="#201D1A" strokeWidth="2" />
                </svg>

                {/* Map Pins */}
                <div className="absolute top-[50%] left-[25%] flex flex-col items-center">
                  <span className="text-xl animate-bounce">📍</span>
                  <span className="bg-[#201D1A] text-[#F2EEE4] font-mono text-[8px] px-1 py-0.5 uppercase tracking-wider font-bold">Student Union</span>
                </div>
                
                <div className="absolute top-[30%] left-[70%] flex flex-col items-center">
                  <span className="text-xl animate-bounce" style={{ animationDelay: "0.5s" }}>📍</span>
                  <span className="bg-[#201D1A] text-[#F2EEE4] font-mono text-[8px] px-1 py-0.5 uppercase tracking-wider font-bold">Main Library</span>
                </div>
              </div>
            </div>

            {/* Location Details Card */}
            <div className="flex flex-col gap-4">
              {[
                {
                  name: "Student Union Lobby",
                  desc: "Located on the first floor near the information desk. Extremely high foot traffic and security presence.",
                  hours: "7:00 AM - 11:00 PM",
                  features: "Cameras • Staffed • Public Wi-Fi"
                },
                {
                  name: "University Library Plaza",
                  desc: "The open plaza right outside the main library entrance. Well-lit at night and always busy with students.",
                  hours: "Open 24 Hours",
                  features: "Emergency Blue Light • 24/7 Security"
                },
                {
                  name: "Campus Quad Commons",
                  desc: "The central grassy area outside the administration building. Best for daytime swaps between classes.",
                  hours: "6:00 AM - 9:00 PM",
                  features: "Outdoor Seating • High Visibility"
                }
              ].map((loc) => (
                <div key={loc.name} className="border-2 border-[#201D1A] p-4 bg-[#F2EEE4] shadow-[3px_3px_0px_#201D1A] flex flex-col justify-between">
                  <div>
                    <h5 className="font-serif font-black text-md text-[#8C2A2A] uppercase mb-1">
                      {loc.name}
                    </h5>
                    <p className="font-mono text-xs text-[#201D1A]/80 mb-2 leading-relaxed">
                      {loc.desc}
                    </p>
                  </div>
                  <div className="flex justify-between items-center border-t border-dashed border-[#201D1A]/20 pt-2 font-mono text-[9px] text-[#201D1A]/60 uppercase font-bold">
                    <span>🕒 {loc.hours}</span>
                    <span>🛡️ {loc.features}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

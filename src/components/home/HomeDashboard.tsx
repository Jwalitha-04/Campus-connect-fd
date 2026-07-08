"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/utils/supabase/client";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  department: string | null;
  graduation_year: number | null;
  reputation_points: number | null;
  bio: string | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  created_at: string;
}

interface HomeDashboardProps {
  profile: Profile | null;
  initialNotifications: Notification[] | null;
}

export default function HomeDashboard({ profile, initialNotifications }: HomeDashboardProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications || []);
  const [lostFoundCount, setLostFoundCount] = useState<number | null>(null);
  const [skillsCount, setSkillsCount] = useState<number | null>(null);
  const [postsCount, setPostsCount] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to new notifications in real-time on the homepage
  useEffect(() => {
    const supabase = createClient();
    let channel: any;

    async function setupRealtimeNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`home_notifications_${user.id}_${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as any;
            setNotifications((prev) => [newNotif, ...prev]);
          }
        )
        .subscribe();
    }

    setupRealtimeNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Fetch counts from database for live counts on the flyer cards
  useEffect(() => {
    const supabase = createClient();
    async function fetchCounts() {
      try {
        const { count: lfTotal } = await supabase
          .from("lost_found_items")
          .select("*", { count: "exact", head: true });
        
        const { count: skTotal } = await supabase
          .from("skills")
          .select("*", { count: "exact", head: true });
        
        const { count: poTotal } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true });

        setLostFoundCount(lfTotal || 0);
        setSkillsCount(skTotal || 0);
        setPostsCount(poTotal || 0);
      } catch (err) {
        console.error("Failed to fetch counts:", err);
      }
    }
    fetchCounts();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F2EEE4] flex flex-col p-4 md:p-8 font-sans max-w-7xl mx-auto gap-8 select-none text-[#201D1A]">
      
      {/* HEADER SECTION (Printed Header Card - paper-stock, solid border, no rounded corners, grain texture) */}
      <header className="w-full bg-[#F2EEE4] bg-riso-run border-2 border-[#201D1A] rounded-none p-5 md:p-6 shadow-[3px_3px_0px_#201D1A] flex flex-col md:grid md:grid-cols-3 gap-6 items-center relative z-20 -rotate-0.5">
        
        {/* Left Col: Profile Slip */}
        <div className="flex items-center w-full justify-start border-b border-dashed border-[#201D1A]/30 md:border-0 pb-4 md:pb-0">
          
          {/* Dashed-border Circle Avatar */}
          <div className="relative w-14 h-14 md:w-16 md:h-16 border-2 border-dashed border-[#8C2A2A] rounded-full bg-[#F2EEE4] overflow-hidden shrink-0 mr-4 shadow-[1.5px_1.5px_0px_#8C2A2A] flex items-center justify-center">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profile Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="font-serif font-black text-2xl text-[#8C2A2A]">
                {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-sm md:text-base font-black uppercase tracking-wider text-[#201D1A] whitespace-nowrap">
                {profile?.display_name || "Campus Member"}
              </h2>
              {/* Role Tag: small dashed-border rectangle tag, maroon text and border */}
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#8C2A2A] border border-dashed border-[#8C2A2A] px-2 py-0.5 shrink-0 bg-transparent rounded-none">
                {profile?.role || "student"}
              </span>
            </div>
            
            {/* Metadata row: Space Mono, muted ink color */}
            <p className="text-[11px] font-mono text-ink-soft mt-0.5 whitespace-nowrap" style={{ color: "rgba(32, 29, 26, 0.6)" }}>
              {profile?.department || "No Department"}
            </p>
            
            <div className="flex items-center gap-3 mt-1 text-[10px] text-ink-soft font-mono" style={{ color: "rgba(32, 29, 26, 0.6)" }}>
              <span>Grad: <strong className="font-bold">{profile?.graduation_year || "Faculty/Staff"}</strong></span>
              <span className="w-1 h-1 bg-[#201D1A]/40 rounded-full"></span>
              <span>Rep: <strong className="font-bold">{profile?.reputation_points || 0} pts</strong></span>
            </div>

            {/* Navigation links: Edit Profile & Claims Dashboard */}
            <div className="flex flex-col gap-1.5 mt-2">
              <Link
                href="/profile/edit"
                className="text-[10px] font-mono font-bold tracking-wide uppercase text-[#8C2A2A] hover:underline flex items-center gap-1.5 w-max"
              >
                <svg className="w-3 h-3 text-[#8C2A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </Link>
              <Link
                href="/profile/claims"
                className="text-[10px] font-mono font-bold tracking-wide uppercase text-[#8C2A2A] hover:underline flex items-center gap-1.5 w-max"
              >
                <svg className="w-3.5 h-3.5 text-[#8C2A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Claims & Tickets
              </Link>
            </div>
          </div>
        </div>

        {/* Middle Col: Riso Press Branding (Campus Connect + small ghost misregistration offset) */}
        <div className="text-center flex flex-col items-center">
          <div className="relative inline-block select-none text-center">
            {/* Key Layer */}
            <h1 className="relative font-serif font-black uppercase text-3xl md:text-4xl leading-none text-[#201D1A] z-10 tracking-wide whitespace-nowrap">
              CAMPUS CONNECT
            </h1>
            {/* Ghost Layer */}
            <div 
              className="absolute inset-0 text-[#8C2A2A] opacity-55 font-serif font-black uppercase text-3xl md:text-4xl leading-none tracking-wide select-none pointer-events-none whitespace-nowrap"
              style={{ transform: "translate(2px, 2px)" }}
            >
              CAMPUS CONNECT
            </div>
          </div>
          {/* Tagline: Space Mono, uppercase/sentence case, muted maroon */}
          <p className="font-mono text-[9px] md:text-[10px] text-[#8C2A2A] uppercase tracking-wider mt-3.5">
            The campus print room — flyers run daily
          </p>
        </div>

        {/* Right Col: Notifications & Logout Controls */}
        <div className="flex items-center justify-end w-full gap-4 md:border-0 pt-4 md:pt-0 border-t border-dashed border-[#201D1A]/30">
          
          {/* Notifications Dropdown Wrapper */}
          <div className="relative" ref={dropdownRef}>
            {/* Notification bell icon: dashed border square, transparent background, ink-black icon */}
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2.5 border border-dashed border-[#201D1A] bg-transparent hover:bg-ink-black/5 transition-all cursor-pointer flex items-center justify-center text-[#201D1A] rounded-none shadow-none"
              aria-label="Toggle notifications"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-riso-orange text-paper-stock font-mono text-[9px] font-bold flex items-center justify-center border border-[#201D1A]">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-80 max-w-sm bg-paper-stock border-2 border-[#201D1A] shadow-[3px_3px_0px_rgba(30,27,24,0.25)] p-4 origin-top-right z-50">
                <div className="flex items-center justify-between border-b border-dashed border-[#201D1A] pb-2.5 mb-2.5">
                  <h3 className="font-display uppercase text-xs text-[#201D1A]">
                    Recent runs
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => setNotifications([])}
                      className="text-[10px] font-bold uppercase text-red-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#201D1A]/60 italic font-mono">
                      Press idle. No updates.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-2.5 border border-dashed border-[#201D1A]/40 text-xs flex flex-col gap-1 hover:bg-ink-black/5 transition-colors bg-paper-stock"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[#201D1A] truncate max-w-[170px]">{notif.title}</span>
                          <span className="text-[9px] text-[#201D1A]/50 font-mono">
                            {new Date(notif.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-[#201D1A]/75 leading-snug">{notif.message}</p>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => setNotifOpen(false)}
                            className="text-[10px] text-riso-violet font-bold uppercase hover:underline mt-1 w-max"
                          >
                            View flyer →
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
 
          {/* Logout Action (Sign Out button restyled as dashed border rectangle, maroon border/text, transparent bg) */}
          <form action={logout}>
            <button
              type="submit"
              className="border-2 border-dashed border-[#8C2A2A] rounded-none px-4 py-1.5 font-mono text-xs font-bold text-[#8C2A2A] uppercase bg-transparent hover:bg-[#8C2A2A]/5 hover:scale-105 active:translate-y-0.5 transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-none"
            >
              <svg className="w-3.5 h-3.5 text-[#8C2A2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>

      </header>

      {/* BIOME SECTIONS (Flyer Wall) */}
      <main className="w-full mt-4">
        {/* Subheader: Space Mono, uppercase, maroon, letter-spacing 0.08em */}
        <h3 className="text-center font-mono text-xs text-[#8C2A2A] uppercase mb-6" style={{ letterSpacing: "0.08em" }}>
          All print presses are loaded and running.
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
          
          {/* LOST & FOUND RISO FLYER */}
          <div 
            className="relative w-full p-6 pt-8 pb-4 bg-riso-orange-paper border-2 border-[#201D1A] text-[#201D1A] animate-press-print-in shadow-[3px_3px_0px_rgba(30,27,24,0.2)] hover:shadow-[5px_5px_0px_rgba(30,27,24,0.3)] hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[350px] cursor-pointer rotate-0"
            style={{ "--section-ink": "var(--riso-orange)" } as React.CSSProperties}
          >
            {/* Staple graphic */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-staple-snap">
              <svg width="20" height="10" viewBox="0 0 20 10" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>

            {/* Washi Tape corner strips */}
            <div className="absolute -top-3 -left-4 w-12 h-5 rotate-15 washi-tape-orange z-10" />
            <div className="absolute -top-2.5 -right-3 w-10 h-5 -rotate-25 washi-tape-yellow z-10" />

            {/* Rubber Stamp */}
            <div className="absolute top-6 right-6 text-riso-orange/30 stamp-circle select-none font-bold">
              RUN #01
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-dashed border-[#201D1A]/40 pb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-riso-orange border border-riso-orange/40 px-2 py-0.5">
                  Lost & Found
                </span>
                <span className="font-mono text-[9px] text-[#201D1A]/60">Press Run #01</span>
              </div>
              
              <h2 className="font-display text-[20px] sm:text-2xl uppercase leading-none mb-3 text-[#201D1A]">
                <span className={lostFoundCount && lostFoundCount > 0 ? "text-[#8C2A2A]" : "text-ink-soft opacity-60"}>
                  {lostFoundCount !== null ? lostFoundCount : 0}
                </span>{" "}
                active listings
              </h2>
              
              <p className="font-sans text-xs leading-relaxed" style={{ color: "rgba(32, 29, 26, 0.6)" }}>
                Misplaced keys, chargers, or notebooks? Or found something? 
                Enter here to report listings, search findings, and tear off stubs to claim items.
              </p>
            </div>

            <Link
              href="/lost-found"
              className="w-full flex items-center justify-center min-h-[46px] border border-dashed border-riso-orange font-mono font-bold text-xs tracking-wider uppercase bg-paper-stock text-riso-orange hover:bg-riso-orange/5 active:translate-y-0.5 transition-all mt-6 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.1)]"
            >
              Enter Press Run →
            </Link>
          </div>

          {/* SKILL SWAP RISO FLYER */}
          <div 
            className="relative w-full p-6 pt-8 pb-4 bg-riso-marine-paper border-2 border-[#201D1A] text-[#201D1A] animate-press-print-in shadow-[3px_3px_0px_rgba(30,27,24,0.2)] hover:shadow-[5px_5px_0px_rgba(30,27,24,0.3)] hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[350px] cursor-pointer rotate-0"
            style={{ "--section-ink": "var(--riso-marine)" } as React.CSSProperties}
          >
            {/* Staple graphic */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-staple-snap">
              <svg width="20" height="10" viewBox="0 0 20 10" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>

            {/* Washi Tape corner strips */}
            <div className="absolute -top-3.5 -left-3 w-11 h-5 -rotate-12 washi-tape-marine z-10" />
            <div className="absolute -top-2.5 -right-4.5 w-12 h-5 rotate-35 washi-tape-orange z-10" />

            {/* Rubber Stamp */}
            <div className="absolute top-6 right-6 text-riso-marine/30 stamp-circle select-none font-bold">
              RUN #02
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-dashed border-[#201D1A]/40 pb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-riso-marine border border-riso-marine/40 px-2 py-0.5">
                  Skill Swap
                </span>
                <span className="font-mono text-[9px] text-[#201D1A]/60">Press Run #02</span>
              </div>
              
              <h2 className="font-display text-[20px] sm:text-2xl uppercase leading-none mb-3 text-[#201D1A]">
                <span className={skillsCount && skillsCount > 0 ? "text-[#8C2A2A]" : "text-ink-soft opacity-60"}>
                  {skillsCount !== null ? skillsCount : 0}
                </span>{" "}
                active trades
              </h2>
              
              <p className="font-sans text-xs leading-relaxed" style={{ color: "rgba(32, 29, 26, 0.6)" }}>
                Want to learn coding, sketching, or Spanish? Share your skills with other students, 
                exchange lessons, and tear off trade stubs to schedule sessions.
              </p>
            </div>

            <Link
              href="/skill-swap"
              className="w-full flex items-center justify-center min-h-[46px] border border-dashed border-riso-marine font-mono font-bold text-xs tracking-wider uppercase bg-paper-stock text-riso-marine hover:bg-riso-marine/5 active:translate-y-0.5 transition-all mt-6 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.1)]"
            >
              Enter Press Run →
            </Link>
          </div>

          {/* COMMUNITY RISO ZINE */}
          <div 
            className="relative w-full p-6 pt-8 pb-4 bg-riso-violet-paper border-2 border-[#201D1A] text-[#201D1A] animate-press-print-in shadow-[3px_3px_0px_rgba(30,27,24,0.2)] hover:shadow-[5px_5px_0px_rgba(30,27,24,0.3)] hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[350px] cursor-pointer rotate-0"
            style={{ "--section-ink": "var(--riso-violet)" } as React.CSSProperties}
          >
            {/* Staple graphic */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-staple-snap">
              <svg width="20" height="10" viewBox="0 0 20 10" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>

            {/* Washi Tape corner strips */}
            <div className="absolute -top-3 -left-4 w-12 h-5 rotate-25 washi-tape-violet z-10" />
            <div className="absolute -top-3.5 -right-3 w-10 h-5 -rotate-15 washi-tape-marine z-10" />

            {/* Rubber Stamp */}
            <div className="absolute top-6 right-6 text-riso-violet/30 stamp-circle select-none font-bold">
              RUN #03
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-dashed border-[#201D1A]/40 pb-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-riso-violet border border-riso-violet/40 px-2 py-0.5">
                  Community
                </span>
                <span className="font-mono text-[9px] text-[#201D1A]/60">Press Run #03</span>
              </div>
              
              <h2 className="font-display text-[20px] sm:text-2xl uppercase leading-none mb-3 text-[#201D1A]">
                <span className={postsCount && postsCount > 0 ? "text-[#8C2A2A]" : "text-ink-soft opacity-60"}>
                  {postsCount !== null ? postsCount : 0}
                </span>{" "}
                bulletin posts
              </h2>
              
              <p className="font-sans text-xs leading-relaxed" style={{ color: "rgba(32, 29, 26, 0.6)" }}>
                Connect with campus clubs, announcements, and zines. Post flyers about events 
                or study circles, and tear off stubs to join threads and discussions.
              </p>
            </div>

            <Link
              href="/community"
              className="w-full flex items-center justify-center min-h-[46px] border border-dashed border-riso-violet font-mono font-bold text-xs tracking-wider uppercase bg-paper-stock text-riso-violet hover:bg-riso-violet/5 active:translate-y-0.5 transition-all mt-6 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.1)]"
            >
              Enter Press Run →
            </Link>
          </div>

        </div>
      </main>
      
    </div>
  );
}

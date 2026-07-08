"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { playSprite } from "@/utils/audio";
import StringOverlay from "@/components/matching/StringOverlay";

interface LostFoundItem {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  images: string[];
  date_lost_found: string;
  location: string;
  status: string;
  drop_off_location?: string | null;
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "books", label: "Books & Study Material" },
  { value: "documents", label: "IDs & Documents" },
  { value: "clothing", label: "Clothing & Accessories" },
  { value: "keys", label: "Keys" },
  { value: "other", label: "Other" },
];

const LOCATIONS = [
  "Library",
  "Cafeteria",
  "Hostel",
  "Auditorium",
  "Parking Area",
  "Academic Blocks",
  "Sports Complex",
];

// Halftone duotone image helper
function HalftonePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative overflow-hidden w-full h-full filter grayscale contrast-[1.4]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-cover mix-blend-multiply" />
      <div className="absolute inset-0 mix-blend-color bg-riso-orange" />
    </div>
  );
}

// Riso Flyer Card with Tear-Off tabs & colored background stock
function RisoFlyerCard({ item, index }: { item: LostFoundItem; index: number }) {
  const [tornTabs, setTornTabs] = useState<string[]>([]);
  const isReturned = item.status === "returned";
  const isEscrow = item.status === "in_transit" || item.status === "at_drop_point";
  const isInactive = isReturned || isEscrow;
  
  const handleTear = (label: string, href: string) => {
    if (isInactive || href === "#") return;
    playSprite("tear");
    setTornTabs((prev) => [...prev, label]);
    setTimeout(() => {
      window.location.href = href;
    }, 600);
  };

  const tabs = [
    { label: "INSPECT", href: `/lost-found/item/${item.id}` },
    { 
      label: isInactive ? "RESOLVED" : "CLAIM", 
      href: isInactive ? "#" : `/lost-found/item/${item.id}?action=claim` 
    },
    { label: "STUB", href: "#" }
  ];

  const rotation = index % 3 === 0 ? "rotate-0.5" : index % 3 === 1 ? "-rotate-0.5" : "rotate-1";

  return (
    <div
      id={`item-${item.type}-${item.id}`}
      className={`break-inside-avoid relative p-5 pt-8 pb-3 bg-riso-orange-paper border-2 border-[#201D1A] text-[#201D1A] animate-press-print-in shadow-[3px_3px_0px_rgba(30,27,24,0.18)] flex flex-col group hover:shadow-[5px_5px_0px_rgba(30,27,24,0.28)] transition-all hover:scale-[1.01] duration-300 ${rotation}`}
      style={{ "--section-ink": "var(--riso-orange)" } as React.CSSProperties}
    >
      {/* Staple snap */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-staple-snap z-10">
        <svg width="20" height="10" viewBox="0 0 20 10">
          <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Washi Tapes */}
      <div className="absolute -top-3.5 -left-3.5 w-12 h-5 rotate-15 washi-tape-orange z-10" />
      <div className="absolute -top-2.5 -right-3 w-10 h-5 -rotate-25 washi-tape-yellow z-10" />

      {/* Rubber Stamp */}
      <div className="absolute top-6 right-6 text-riso-orange/20 stamp-circle select-none font-bold">
        L&F #{index + 1}
      </div>

      {/* Claimed overlay stamp */}
      {isReturned && (
        <div className="absolute inset-0 bg-[#F2EEE4]/40 flex items-center justify-center z-20 pointer-events-none select-none animate-stamp-in">
          <div className="border-4 border-dashed border-[#8C2A2A] text-[#8C2A2A] bg-[#F2EEE4]/95 px-6 py-3 font-display font-black text-2xl uppercase tracking-widest transform -rotate-12 shadow-sm">
            Claimed
          </div>
        </div>
      )}

      {/* In Transit overlay stamp */}
      {item.status === "in_transit" && (
        <div className="absolute inset-0 bg-[#F2EEE4]/40 flex items-center justify-center z-20 pointer-events-none select-none animate-stamp-in">
          <div className="border-4 border-dashed border-[#8C2A2A] text-[#8C2A2A] bg-[#F2EEE4]/95 px-6 py-3 font-display font-black text-2xl uppercase tracking-widest transform -rotate-12 shadow-sm">
            In Transit
          </div>
        </div>
      )}

      {/* At Drop Point overlay stamp */}
      {item.status === "at_drop_point" && (
        <div className="absolute inset-0 bg-[#F2EEE4]/40 flex items-center justify-center z-20 pointer-events-none select-none animate-stamp-in">
          <div className="border-4 border-dashed border-sky-600 text-sky-600 bg-[#F2EEE4]/95 px-6 py-3 font-display font-black text-2xl uppercase tracking-widest transform -rotate-12 shadow-sm">
            At Drop Point
          </div>
        </div>
      )}

      {/* Category chip and status */}
      <div className="flex justify-between items-start mb-3">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-paper-stock bg-riso-orange border border-[#201D1A]">
          {item.type.toUpperCase()}: {item.category}
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#201D1A]/60">
          {item.status.startsWith("Secured at") ? "Secured" : item.status}
        </span>
      </div>

      {/* Riso photo treatment */}
      {item.images && item.images.length > 0 && (
        <div className="w-full h-40 overflow-hidden mb-4 border border-[#201D1A] shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.1)]">
          <HalftonePhoto src={item.images[0]} alt={item.title} />
        </div>
      )}

      {/* Title */}
      <h3 className="font-display text-lg uppercase leading-tight mb-2 text-[#201D1A] tracking-tight">
        {item.title}
      </h3>

      {/* Description */}
      <p className="font-sans text-xs text-[#201D1A]/75 leading-relaxed line-clamp-3 mb-4">
        {item.description}
      </p>

      {/* Details */}
      <div className="mt-auto border-t border-dashed border-[#201D1A]/30 pt-3 space-y-1 relative mb-4">
        <div className="flex justify-between text-[10px]">
          <span className="font-mono uppercase text-[#201D1A]/50">Zone</span>
          <span className="font-sans font-bold">{item.location}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="font-mono uppercase text-[#201D1A]/50">Date</span>
          <span className="font-sans font-bold">
            {new Date(item.date_lost_found).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        {item.drop_off_location && (
          <div className="flex justify-between text-[10px] text-success-ink font-bold">
            <span className="font-mono uppercase">Hub</span>
            <span className="font-sans text-right truncate max-w-[150px]">{item.drop_off_location}</span>
          </div>
        )}
      </div>

      {/* Perforated fringe tab strip */}
      <div className="perf-line pt-3 flex justify-between gap-1 overflow-hidden">
        {tabs.map((tab) => {
          const isTorn = tornTabs.includes(tab.label);
          const isDisabled = isTorn || (isInactive && tab.label !== "INSPECT");
          return (
            <button
              key={tab.label}
              disabled={isDisabled}
              onClick={() => handleTear(tab.label, tab.href)}
              className={`flex-1 min-h-[44px] text-center font-mono text-[9px] font-bold border border-dashed border-[#201D1A]/30 bg-paper-stock text-[#201D1A] py-2 px-1 transition-all ${
                isTorn 
                  ? "animate-tab-tear pointer-events-none opacity-0" 
                  : isDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-ink-black/5 cursor-pointer hover:border-[#201D1A]"
              }`}
              aria-label={`${tab.label} this flyer`}
            >
              {isTorn ? "TORN" : (
                <div className="flex flex-col items-center">
                  <span>{tab.label}</span>
                  <span className="text-[7.5px] font-normal text-[#201D1A]/60">#{item.id.slice(0, 4)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default function LostFoundBoardPage() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<{ lostId: string; foundId: string }[]>([]);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();
        if (data?.matches) {
          setMatches(data.matches);
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      }
    }
    fetchMatches();
  }, [items]);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "lost" | "found">("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  useEffect(() => {
    async function fetchItems() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("lost_found_items")
        .select("*")
        .or("status.eq.active,status.eq.returned,status.ilike.Secured at %")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setItems(data as LostFoundItem[]);
      }
      setLoading(false);
    }
    fetchItems();
  }, []);

  // Filter items
  useEffect(() => {
    let result = items;

    // Filter by type
    if (selectedType !== "all") {
      result = result.filter((item) => item.type === selectedType);
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Filter by location
    if (selectedLocations.length > 0) {
      result = result.filter((item) => selectedLocations.includes(item.location));
    }

    // Filter by search query
    if (search.trim() !== "") {
      const query = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    setFilteredItems(result);
  }, [items, selectedType, selectedCategory, selectedLocations, search]);

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  return (
    <div className="w-full min-h-screen p-6 flex flex-col font-sans select-none relative max-w-7xl mx-auto">
      
      {/* Notice Board Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-2 border-[#201D1A] pb-6 -rotate-0.5">
        <div className="text-center md:text-left pl-16">
          <Link href="/">
            <h1 className="riso-ghost-color font-display text-4.5xl uppercase leading-none tracking-tight text-[#201D1A] hover:opacity-85 transition-opacity" data-text="Lost & Found Press Run" style={{ "--section-ink": "var(--riso-orange)" } as React.CSSProperties}>
              Lost & Found Press Run
            </h1>
          </Link>
          <p className="font-hand text-xl text-riso-orange mt-2">
            {"\"Lost & Found notice desk — find your items or report findings\""}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/lost-found/report"
            className="flex items-center justify-center min-h-[46px] border-2 border-[#201D1A] font-mono font-bold text-xs uppercase tracking-wider px-8 bg-riso-yellow-paper text-[#201D1A] hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.15)]"
          >
            PRINT NEW FLYER
          </Link>
        </div>
      </div>

      {/* Main content area */}
      <div ref={boardRef} className="flex flex-col lg:flex-row gap-8 relative pt-4">
        <StringOverlay matches={matches} boardRef={boardRef} />
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 p-6 bg-riso-yellow-paper border-2 border-[#201D1A] text-[#201D1A] shadow-[3px_3px_0px_rgba(30,27,24,0.2)] self-start relative">
          
          {/* Washi tape at top of sidebar */}
          <div className="absolute -top-3.5 -left-4 w-14 h-5 rotate-12 washi-tape-marine z-10" />

          <div className="space-y-6">
            
            {/* Search */}
            <div>
              <span className="font-mono text-[10px] font-bold text-[#201D1A]/60 uppercase tracking-wider block mb-2">
                Search Bulletins
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-1.5 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
              />
            </div>

            {/* Notice Type tabs */}
            <div>
              <span className="font-mono text-[10px] font-bold text-[#201D1A]/60 uppercase tracking-wider block mb-2">
                Notice Type
              </span>
              <div className="flex flex-col space-y-2">
                {[
                  { value: "all", label: "All Items" },
                  { value: "lost", label: "🔴 Lost Reports" },
                  { value: "found", label: "🟢 Found Reports" },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSelectedType(t.value as any)}
                    className={`text-left text-xs font-bold uppercase tracking-wider py-1.5 px-3 border border-dashed transition-all cursor-pointer ${
                      selectedType === t.value
                        ? "border-solid border-2 border-[#201D1A] bg-riso-orange text-paper-stock shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.15)]"
                        : "border-transparent hover:border-[#201D1A]/30 text-[#201D1A]/70"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <span className="font-mono text-[10px] font-bold text-[#201D1A]/60 uppercase tracking-wider block mb-2">
                Category
              </span>
              <div className="flex flex-col space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className="flex items-center space-x-2 text-xs cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.value}
                      checked={selectedCategory === cat.value}
                      onChange={() => setSelectedCategory(cat.value)}
                      className="accent-riso-orange cursor-pointer"
                    />
                    <span className="font-mono text-[#201D1A]/80">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <span className="font-mono text-[10px] font-bold text-[#201D1A]/60 uppercase tracking-wider block mb-2">
                Locations
              </span>
              <div className="flex flex-col space-y-1.5">
                {LOCATIONS.map((loc) => (
                  <label
                    key={loc}
                    className="flex items-center space-x-2 text-xs cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(loc)}
                      onChange={() => toggleLocation(loc)}
                      className="accent-riso-orange cursor-pointer"
                    />
                    <span className="font-mono text-[#201D1A]/80">{loc}</span>
                  </label>
                ))}
              </div>
            </div>
            
          </div>
        </aside>

        {/* Board Listings Grid */}
        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-dashed border-riso-orange border-t-transparent animate-spin mb-4" />
              <span className="font-hand text-lg text-riso-orange animate-pulse">
                Running the press...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-paper-stock border-2 border-dashed border-[#201D1A]/40">
              <span className="font-hand text-xl text-[#201D1A]/60 italic block">
                Press is idle. Nothing's run yet.
              </span>
              <Link
                href="/lost-found/report"
                className="font-mono font-bold text-xs text-riso-orange hover:underline mt-2 block"
              >
                PRINT THE FIRST FLYER!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-1 pb-4">
              {filteredItems.map((item, idx) => (
                <RisoFlyerCard key={item.id} item={item} index={idx} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

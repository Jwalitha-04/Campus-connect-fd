"use client";

import React, { useState, useActionState, useEffect } from "react";
import Link from "next/link";
import ImageUploader from "@/components/shared/ImageUploader";
import { reportItem, analyzeImageWithAI } from "@/app/lost-found/actions";

const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "books", label: "Books & Study Material" },
  { value: "documents", label: "IDs & Documents" },
  { value: "clothing", label: "Clothing & Accessories" },
  { value: "keys", label: "Keys" },
  { value: "other", label: "Other Items" },
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

// Helper to generate a random UUID on the client
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ReportItemPage() {
  const [itemId, setItemId] = useState<string>("");
  const [type, setType] = useState<"lost" | "found">("lost");
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [dateLostFound, setDateLostFound] = useState("");
  const [timeLostFound, setTimeLostFound] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [verificationQuestion, setVerificationQuestion] = useState("");
  const [dropOffLocation, setDropOffLocation] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [itemType, setItemType] = useState("");
  const [handoverPreference, setHandoverPreference] = useState<"hold" | "drop_off" | "time_limited">("hold");
  const [handoverLimitTime, setHandoverLimitTime] = useState("");
  const [handoverLimitLocation, setHandoverLimitLocation] = useState("");
  
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ item: string; color: string; brand: string } | null>(null);

  const [state, formAction, isPending] = useActionState(reportItem, null);

  // Initialize itemId on client side once to avoid server/client mismatch
  useEffect(() => {
    setItemId(generateUUID());
  }, []);

  const handleAnalyzeImage = async () => {
    if (uploadedUrls.length === 0) return;
    setAnalyzing(true);
    setAiResult(null);
    try {
      const result = await analyzeImageWithAI(uploadedUrls[0]);
      setAiResult(result);
      
      // Auto-populate states
      setItemType(result.item);
      setColor(result.color);
      setBrand(result.brand);

      if (result.item && result.item !== "Unknown Item" && result.item !== "Student Item") {
        const brandStr = result.brand && result.brand !== "Unknown Brand" && result.brand !== "Generic" ? ` ${result.brand}` : "";
        const colorStr = result.color && result.color !== "Unknown Color" && result.color !== "Various" ? `${result.color}` : "";
        const autofilledTitle = `${colorStr}${brandStr} ${result.item}`.trim();
        setTitle(autofilledTitle);
      }
      
      const details = `Color: ${result.color}, Brand: ${result.brand}`;
      setDescription((prev) => prev ? `${prev}\n\n[AI Scan: ${details}]` : `[AI Scan: ${details}]`);

      // Try matching category
      const itemLower = result.item.toLowerCase();
      if (itemLower.includes("phone") || itemLower.includes("electronics") || itemLower.includes("laptop") || itemLower.includes("charger") || itemLower.includes("earbuds") || itemLower.includes("watch")) {
        setCategory("electronics");
      } else if (itemLower.includes("book") || itemLower.includes("notebook") || itemLower.includes("pen") || itemLower.includes("pencil")) {
        setCategory("books");
      } else if (itemLower.includes("id") || itemLower.includes("card") || itemLower.includes("document") || itemLower.includes("license")) {
        setCategory("documents");
      } else if (itemLower.includes("key") || itemLower.includes("fob")) {
        setCategory("keys");
      } else if (itemLower.includes("shirt") || itemLower.includes("backpack") || itemLower.includes("bag") || itemLower.includes("jacket") || itemLower.includes("clothing") || itemLower.includes("hoodie")) {
        setCategory("clothing");
      } else {
        setCategory("other");
      }
    } catch (err) {
      console.error("AI scanning error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 select-none font-sans max-w-xl mx-auto">
      
      {/* Notice Board Header */}
      <div className="text-center mb-6">
        <h1 className="font-display text-4xl uppercase leading-none text-[#201D1A]">
          Notice Press Run
        </h1>
        <p className="font-hand text-lg text-riso-orange mt-2">
          &quot;Print a new flyer in the campus notice run&quot;
        </p>
      </div>

      {/* Form Container Pod */}
      <div 
        className="relative w-full p-8 bg-paper-stock border-2 border-[#201D1A] text-[#201D1A] shadow-[4px_4px_0px_rgba(32,29,26,0.15)] animate-press-print-in"
      >
        
        {/* Staple */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <path d="M2 1 L2 5 M18 1 L18 5 M2 5 L18 5" stroke="var(--ink-black)" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* Cancel Button */}
        <div className="absolute top-4 right-4">
          <Link
            href="/lost-found"
            className="font-mono text-[10px] font-bold uppercase text-red-500 hover:underline"
          >
            [Cancel]
          </Link>
        </div>

        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="p-3 border border-dashed border-red-500 text-red-500 text-xs font-mono">
              ⚠️ {state.error}
            </div>
          )}

          {/* Hidden Inputs */}
          <input type="hidden" name="id" value={itemId} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="images" value={JSON.stringify(uploadedUrls)} />
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="dropOffLocation" value={dropOffLocation} />
          <input type="hidden" name="handoverPreference" value={handoverPreference} />
          <input type="hidden" name="handoverLimitTime" value={handoverLimitTime} />
          <input type="hidden" name="handoverLimitLocation" value={handoverLimitLocation} />

          {/* Notice Type Selector */}
          <div className="flex flex-col py-1">
            <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider mb-2">
              Notice Category Type
            </span>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setType("lost")}
                className={`flex-1 py-3 px-4 border font-mono font-bold text-xs transition-all cursor-pointer ${
                  type === "lost"
                    ? "bg-riso-orange text-paper-stock border-2 border-[#201D1A]"
                    : "bg-paper-stock border border-dashed border-[#201D1A]/40 text-[#201D1A]/60 hover:bg-ink-black/5"
                }`}
              >
                🔴 Lost Flyer
              </button>
              <button
                type="button"
                onClick={() => setType("found")}
                className={`flex-1 py-3 px-4 border font-mono font-bold text-xs transition-all cursor-pointer ${
                  type === "found"
                    ? "bg-success-ink text-paper-stock border-2 border-[#201D1A]"
                    : "bg-paper-stock border border-dashed border-[#201D1A]/40 text-[#201D1A]/60 hover:bg-ink-black/5"
                }`}
              >
                🟢 Found Flyer
              </button>
            </div>
          </div>

          {/* Image Uploader */}
          <div className="flex flex-col">
            <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider mb-2">
              Photos (Optional)
            </span>
            <div className="border border-dashed border-[#201D1A]/40 p-1">
              <ImageUploader
                itemId={itemId}
                bucketName="lost-found-images"
                onUploadComplete={(urls) => setUploadedUrls(urls)}
              />
            </div>
          </div>

          {/* AI Image Scan integration */}
          {uploadedUrls.length > 0 && (
            <div className="p-4 border border-dashed border-riso-violet bg-paper-stock flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] font-bold text-riso-violet uppercase tracking-wider">
                  🤖 AI Photo Scanner
                </span>
                <button
                  type="button"
                  disabled={analyzing}
                  onClick={handleAnalyzeImage}
                  className="py-1 px-3 border border-dashed border-riso-violet text-riso-violet hover:bg-riso-violet/5 font-mono text-[9px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {analyzing ? "Scanning..." : "Scan with AI"}
                </button>
              </div>
              
              {aiResult ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 border border-dashed border-[#201D1A] bg-paper-stock">
                      <div className="text-[8px] text-[#201D1A]/50 uppercase font-bold font-mono">Item</div>
                      <div className="font-bold text-riso-violet mt-0.5 font-mono truncate">{aiResult.item}</div>
                    </div>
                    <div className="p-2 border border-dashed border-[#201D1A] bg-paper-stock">
                      <div className="text-[8px] text-[#201D1A]/50 uppercase font-bold font-mono">Color</div>
                      <div className="font-bold text-riso-violet mt-0.5 font-mono truncate">{aiResult.color}</div>
                    </div>
                    <div className="p-2 border border-dashed border-[#201D1A] bg-paper-stock">
                      <div className="text-[8px] text-[#201D1A]/50 uppercase font-bold font-mono">Brand</div>
                      <div className="font-bold text-riso-violet mt-0.5 font-mono truncate">{aiResult.brand}</div>
                    </div>
                  </div>
                  <p className="text-[9px] text-riso-violet text-center font-mono font-bold">
                    ✨ Prefilled details loaded into the fields below.
                  </p>
                </div>
              ) : (
                <p className="text-[9px] text-[#201D1A]/50 font-mono italic text-center">
                  Click to prefill title, category, brand, and color values automatically.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col">
            <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
              Item Title
            </span>
            <input
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Leather Wallet, iPhone Charger"
              className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
              Description & Distinctive Features
            </span>
            <textarea
              name="description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe characteristics only the true owner would know..."
              className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange resize-none"
            />
          </div>

          {/* Category & Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                Category
              </span>
              <select
                name="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
              >
                <option value="" disabled className="bg-paper-stock">Select Category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-paper-stock">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                Campus Location Zone
              </span>
              <select
                name="location"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
              >
                <option value="" disabled className="bg-paper-stock">Select Location</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} className="bg-paper-stock">
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metadata: Color & Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color */}
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                Color
              </span>
              <input
                name="color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Matte Black"
                className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
              />
            </div>

            {/* Brand */}
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                Brand / Make
              </span>
              <input
                name="brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple"
                className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
              />
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                Date {type === "lost" ? "Lost" : "Found"}
              </span>
              <input
                name="dateLostFound"
                type="date"
                required
                value={dateLostFound}
                onChange={(e) => setDateLostFound(e.target.value)}
                className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
              />
            </div>

            {/* Time */}
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                Time (Optional)
              </span>
              <input
                name="timeLostFound"
                type="time"
                value={timeLostFound}
                onChange={(e) => setTimeLostFound(e.target.value)}
                className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col">
            <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
              Contact Information
            </span>
            <input
              name="contactInfo"
              type="text"
              required
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g. Email or Roll Number"
              className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
            />
          </div>

          {/* Verification Question for Found items */}
          {type === "found" && (
            <>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                  Verification Question
                </span>
                <input
                  name="verificationQuestion"
                  type="text"
                  required
                  value={verificationQuestion}
                  onChange={(e) => setVerificationQuestion(e.target.value)}
                  placeholder="Ask a validation detail (e.g. 'What is the sticker on the back?')"
                  className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
                />
              </div>

              {/* Handover Preference Selection */}
              <div className="flex flex-col py-1">
                <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider mb-2">
                  Handover Preference
                </span>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-xs font-mono cursor-pointer">
                    <input
                      type="radio"
                      name="pref-radio"
                      checked={handoverPreference === "hold"}
                      onChange={() => setHandoverPreference("hold")}
                      className="text-riso-orange focus:ring-riso-orange"
                    />
                    <span>Hold it — I'll keep it, contact me to arrange pickup</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-mono cursor-pointer">
                    <input
                      type="radio"
                      name="pref-radio"
                      checked={handoverPreference === "drop_off"}
                      onChange={() => setHandoverPreference("drop_off")}
                      className="text-riso-orange focus:ring-riso-orange"
                    />
                    <span>Drop at safe location — e.g. library desk / security</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-mono cursor-pointer">
                    <input
                      type="radio"
                      name="pref-radio"
                      checked={handoverPreference === "time_limited"}
                      onChange={() => setHandoverPreference("time_limited")}
                      className="text-riso-orange focus:ring-riso-orange"
                    />
                    <span>Time-limited hold — hold temporarily, then drop off</span>
                  </label>
                </div>
              </div>

              {/* If Drop at safe location */}
              {handoverPreference === "drop_off" && (
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                    Designated Drop-Off Partner Hub
                  </span>
                  <select
                    value={dropOffLocation}
                    onChange={(e) => setDropOffLocation(e.target.value)}
                    required
                    className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
                  >
                    <option value="" disabled className="bg-paper-stock">Select Drop Point</option>
                    <option value="Library Front Desk" className="bg-paper-stock">Library Front Desk</option>
                    <option value="Security Gate 1" className="bg-paper-stock">Security Gate 1</option>
                    <option value="CS Department Office" className="bg-paper-stock">CS Department Office</option>
                    <option value="Hostel Warden's Office" className="bg-paper-stock">Hostel Warden's Office</option>
                    <option value="Student Council Room" className="bg-paper-stock">Student Council Room</option>
                  </select>
                </div>
              )}

              {/* If Time-limited hold */}
              {handoverPreference === "time_limited" && (
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] font-bold text-[#8C2A2A] uppercase tracking-wider">
                      Hold Until (Date/Time description)
                    </span>
                    <input
                      type="text"
                      value={handoverLimitTime}
                      onChange={(e) => setHandoverLimitTime(e.target.value)}
                      placeholder="e.g. 6pm today, Friday noon"
                      required
                      className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-[#8C2A2A] focus:ring-1 focus:ring-[#8C2A2A]"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] font-bold text-[#201D1A]/60 uppercase tracking-wider">
                      Then Drop Off At
                    </span>
                    <select
                      value={handoverLimitLocation}
                      onChange={(e) => setHandoverLimitLocation(e.target.value)}
                      required
                      className="w-full bg-paper-stock border border-dashed border-[#201D1A] outline-none px-4 py-2 mt-1 font-mono text-xs focus:border-solid focus:border-riso-orange focus:ring-1 focus:ring-riso-orange"
                    >
                      <option value="" disabled className="bg-paper-stock">Select Future Drop Point</option>
                      <option value="Library Front Desk" className="bg-paper-stock">Library Front Desk</option>
                      <option value="Security Gate 1" className="bg-paper-stock">Security Gate 1</option>
                      <option value="CS Department Office" className="bg-paper-stock">CS Department Office</option>
                      <option value="Hostel Warden's Office" className="bg-paper-stock">Hostel Warden's Office</option>
                      <option value="Student Council Room" className="bg-paper-stock">Student Council Room</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center min-h-[46px] border-2 border-[#201D1A] font-mono font-bold text-xs uppercase bg-paper-stock text-[#201D1A] hover:bg-ink-black/5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 mt-4"
          >
            {isPending ? "RUNNING PRESS..." : "PRINT NOTICE FLYER"}
          </button>
        </form>

      </div>
    </div>
  );
}

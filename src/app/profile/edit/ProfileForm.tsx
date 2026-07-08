"use client";

import React, { useActionState, useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/utils/supabase/client";
import { updateProfile } from "@/app/profile/actions";
import Link from "next/link";

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

const GRAD_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

interface ProfileFormProps {
  initialProfile: any;
  userId: string;
}

export default function ProfileForm({ initialProfile, userId }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const [avatarUrl, setAvatarUrl] = useState<string>(initialProfile?.avatar_url || "");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const supabase = createClient();
      const fileName = `${userId}.png`;

      // Upload file to avatars bucket with upsert
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, compressedFile, {
          upsert: true,
          contentType: "image/png",
        });

      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      // Retrieve public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      
      // Force URL refresh with cache buster query parameter to bypass browser image cache
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const cardClipPath = "polygon(0 0, 100% 0, 100% 97%, 99% 98%, 98% 97%, 97% 98%, 96% 97%, 95% 98%, 94% 97%, 93% 98%, 92% 97%, 91% 98%, 90% 97%, 89% 98%, 88% 97%, 87% 98%, 86% 97%, 85% 98%, 84% 97%, 83% 98%, 82% 97%, 81% 98%, 80% 97%, 79% 98%, 78% 97%, 76% 97%, 75% 98%, 74% 97%, 73% 98%, 72% 97%, 71% 98%, 70% 97%, 69% 98%, 68% 97%, 67% 98%, 66% 97%, 65% 98%, 64% 97%, 63% 98%, 62% 97%, 61% 98%, 60% 97%, 59% 98%, 58% 97%, 56% 97%, 55% 98%, 54% 97%, 53% 98%, 52% 97%, 51% 98%, 50% 97%, 49% 98%, 48% 97%, 47% 98%, 46% 97%, 45% 98%, 44% 97%, 43% 98%, 42% 97%, 41% 98%, 40% 97%, 39% 98%, 38% 97%, 37% 98%, 36% 97%, 35% 98%, 34% 97%, 33% 98%, 32% 97%, 31% 98%, 30% 97%, 29% 98%, 28% 97%, 27% 98%, 26% 97%, 25% 98%, 24% 97%, 23% 98%, 22% 97%, 21% 98%, 20% 97%, 19% 98%, 18% 97%, 17% 98%, 16% 97%, 15% 98%, 14% 97%, 13% 98%, 12% 97%, 11% 98%, 10% 97%, 9% 98%, 8% 97%, 7% 98%, 6% 97%, 5% 98%, 4% 97%, 3% 98%, 2% 97%, 1% 98%, 0 97%)";

  return (
    <div className="relative w-full max-w-[500px] my-8 z-10 font-sans select-none">
      
      {/* Metal Paper Clip */}
      <div className="absolute -top-[14px] left-[32px] z-30 select-none pointer-events-none transform -rotate-12">
        <svg width="24" height="42" viewBox="0 0 24 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 38 C17 38 21 34 21 29 L21 9 C21 5 17 2 12 2 C7 2 3 5 3 9 L3 29 C3 32.5 5.5 35 9 35 C12.5 35 15 32.5 15 29 L15 9 C15 7.5 13.5 6 12 6 C10.5 6 9 7.5 9 9 L9 29" stroke="#5A5855" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>

      <Link 
        href="/"
        className="absolute -top-12 right-0 font-mono text-xs font-bold text-[#8C2A2A] hover:underline uppercase tracking-wider"
      >
        ← Back to Board
      </Link>

      <div 
        className="relative px-8 md:px-12 pt-[32px] pb-12 bg-[#EFEAD8] border-2 border-[#201D1A] text-[#201D1A] rounded-none shadow-[2px_2px_0px_#8C2A2A] animate-press-print-in"
        style={{
          backgroundImage: "linear-gradient(rgba(140, 42, 42, 0.08) 1px, transparent 1px)",
          backgroundSize: "100% 28px",
          clipPath: cardClipPath
        }}
      >
        <div className="absolute left-[36px] top-0 bottom-0 w-[1.5px] bg-[#8C2A2A]/25 pointer-events-none" />

        <div className="text-center border-b-2 border-dashed border-[rgba(32,29,26,0.25)] pb-6 mb-6">
          <h1 className="font-serif font-black uppercase text-3xl leading-[0.95] text-[#201D1A]">
            UPDATE PROFILE
          </h1>
          <p className="font-mono text-xs text-[#201D1A]/70 font-bold uppercase tracking-widest mt-2">
            Campus Print Room Registration
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 border border-dashed border-[#8C2A2A] text-[#8C2A2A] text-xs font-mono font-bold">
              ⚠️ {state.error}
            </div>
          )}
          {uploadError && (
            <div className="p-3 border border-dashed border-[#8C2A2A] text-[#8C2A2A] text-xs font-mono font-bold">
              ⚠️ {uploadError}
            </div>
          )}

          <input type="hidden" name="avatarUrl" value={avatarUrl} />

          <div className="flex flex-col items-center justify-center space-y-3 mb-6">
            <span className="font-mono text-xs font-bold text-[#201D1A] uppercase tracking-wider">
              Profile Photo
            </span>
            <div
              onClick={triggerFileSelect}
              className="relative w-24 h-24 rounded-full border-2 border-dashed border-[#8C2A2A] flex items-center justify-center cursor-pointer hover:bg-[#8C2A2A]/5 overflow-hidden group shadow-[1.5px_1.5px_0px_#8C2A2A] bg-transparent"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
              ) : (
                <span className="font-serif font-black text-3xl text-[#8C2A2A]/40 group-hover:text-[#8C2A2A]">?</span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-[#201D1A]/80 flex items-center justify-center text-[9px] text-[#EFEAD8] font-mono uppercase tracking-widest font-bold">
                  uploading
                </div>
              )}
            </div>
            <button type="button" onClick={triggerFileSelect} className="font-mono text-[9px] font-bold text-[#8C2A2A] hover:underline uppercase">
              Click to replace photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <div className="flex flex-col relative">
            <span className="font-mono text-[10px] font-bold text-[#201D1A] uppercase tracking-widest">
              Display Name
            </span>
            <input
              name="displayName"
              type="text"
              required
              defaultValue={initialProfile?.display_name || ""}
              className="w-full bg-transparent border-b-2 border-dashed border-[rgba(32,29,26,0.5)] outline-none py-2 font-mono text-sm text-[#201D1A] font-extrabold focus:border-solid focus:border-[#201D1A] typewriter-caret"
            />
          </div>

          <div className="flex flex-col relative">
            <span className="font-mono text-[10px] font-bold text-[#201D1A] uppercase tracking-widest">
              Department
            </span>
            <select
              name="department"
              required
              defaultValue={initialProfile?.department || ""}
              className="w-full bg-transparent border-b-2 border-dashed border-[rgba(32,29,26,0.5)] outline-none py-2 font-mono text-xs text-[#201D1A] font-extrabold focus:border-solid focus:border-[#201D1A] cursor-pointer appearance-none"
            >
              <option value="" disabled className="bg-[#EFEAD8] text-[#201D1A]/55">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} className="bg-[#EFEAD8] text-[#201D1A]">{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col relative">
            <span className="font-mono text-[10px] font-bold text-[#201D1A] uppercase tracking-widest">
              Graduation Year
            </span>
            <select
              name="graduationYear"
              defaultValue={initialProfile?.graduation_year || ""}
              className="w-full bg-transparent border-b-2 border-dashed border-[rgba(32,29,26,0.5)] outline-none py-2 font-mono text-xs text-[#201D1A] font-extrabold focus:border-solid focus:border-[#201D1A] cursor-pointer appearance-none"
            >
              <option value="" className="bg-[#EFEAD8] text-[#201D1A]/55">N/A (Faculty / Staff)</option>
              {GRAD_YEARS.map((year) => (
                <option key={year} value={year} className="bg-[#EFEAD8] text-[#201D1A]">{year}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col relative">
            <span className="font-mono text-[10px] font-bold text-[#201D1A] uppercase tracking-widest">
              Short Biography
            </span>
            <textarea
              name="bio"
              maxLength={300}
              placeholder="Tell us about yourself (max 300 characters)..."
              defaultValue={initialProfile?.bio || ""}
              className="w-full bg-transparent border-b-2 border-dashed border-[rgba(32,29,26,0.5)] outline-none py-2 font-mono text-xs text-[#201D1A] font-extrabold focus:border-solid focus:border-[#201D1A] resize-none h-20 typewriter-caret"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || uploading}
            style={{ 
              clipPath: "polygon(0 0, 95% 0, 98% 12%, 95% 25%, 98% 37%, 95% 50%, 98% 62%, 95% 75%, 98% 87%, 95% 100%, 0 100%)",
              filter: "drop-shadow(0px 0px 1.5px rgba(140, 42, 42, 0.75))"
            }}
            className="w-full flex items-center justify-between min-h-[48px] bg-[#8C2A2A] text-[#F2EEE4] font-sans font-bold text-xs uppercase hover:translate-y-[2px] active:translate-y-[3px] transition-all cursor-pointer disabled:opacity-50 rounded-none border-none px-6 mt-6"
          >
            <span>{isPending ? "STAMPING CHANGES..." : "SAVE PROFILE"}</span>
            <div className="h-6 border-r border-dashed border-[#F2EEE4]/40 mx-4" />
            <span className="font-mono text-[10px] normal-case opacity-90 tracking-normal">No. 0003</span>
          </button>
        </form>
      </div>
    </div>
  );
}

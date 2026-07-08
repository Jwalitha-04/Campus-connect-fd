"use client";

import React, { useActionState, useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/utils/supabase/client";
import { updateProfile } from "@/app/profile/actions";

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

  return (
    <div className="relative w-full max-w-lg p-8 bg-paper-cream border border-paper-border text-chalk-ink shadow-paper-lift dark:shadow-paper-lift-dark transform -rotate-1 transition-transform hover:rotate-0 rounded-sm">
      
      {/* Absolute Brass Push-Pin */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-pin-shadow"
        >
          <path
            d="M12 2C9.23858 2 7 4.23858 7 7C7 9.38268 8.66635 11.3752 10.9 11.884V16.5C10.9 17.0523 11.3477 17.5 11.9 17.5C12.4523 17.5 12.9 17.0523 12.9 16.5V11.884C15.1336 11.3752 16.8 9.38268 16.8 7C16.8 4.23858 14.7614 2 12 2Z"
            fill="var(--pin-brass)"
          />
          <circle cx="10.5" cy="5.5" r="1.5" fill="white" opacity="0.4" />
          <rect x="11.5" y="17.5" width="1" height="5.5" rx="0.5" fill="#A0A0A0" />
        </svg>
      </div>

      <div className="text-center mb-6">
        <h1 className="font-display text-2xl font-bold tracking-wide">
          Profile Setup Onboarding
        </h1>
        <p className="font-hand text-base text-gray-500 mt-1 dark:text-amber-200/50">
          Complete your card details to stick on the notice board
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/30 text-xs rounded-sm">
            ⚠️ {state.error}
          </div>
        )}
        {uploadError && (
          <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/30 text-xs rounded-sm">
            ⚠️ {uploadError}
          </div>
        )}

        {/* Hidden Field for Avatar URL */}
        <input type="hidden" name="avatarUrl" value={avatarUrl} />

        {/* Avatar Uploader View */}
        <div className="flex flex-col items-center justify-center space-y-2 mb-4">
          <div
            onClick={triggerFileSelect}
            className="relative w-24 h-24 rounded-full border-2 border-dashed border-sky-300 dark:border-amber-900/50 flex items-center justify-center cursor-pointer hover:border-amber-400 overflow-hidden bg-white/50 dark:bg-black/30 group"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
              />
            ) : (
              <span className="font-hand text-3xl text-gray-400 group-hover:text-amber-400 select-none">
                ?
              </span>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-mono uppercase tracking-widest">
                uploading
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={triggerFileSelect}
            className="font-hand text-sm text-sky-500 hover:text-amber-500 underline"
          >
            Click to upload profile photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Display Name */}
        <div className="flex flex-col relative border-b border-sky-200 dark:border-amber-900/30 py-1">
          <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest">
            Display Name
          </span>
          <input
            name="displayName"
            type="text"
            required
            defaultValue={initialProfile?.display_name || ""}
            className="bg-transparent focus:outline-none text-base mt-1 font-sans placeholder-gray-400 dark:placeholder-amber-900/40"
          />
          <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-red-400 opacity-20" />
        </div>

        {/* Department */}
        <div className="flex flex-col relative border-b border-sky-200 dark:border-amber-900/30 py-1">
          <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest">
            Department
          </span>
          <select
            name="department"
            required
            defaultValue={initialProfile?.department || ""}
            className="bg-transparent focus:outline-none text-base mt-1 font-sans text-chalk-ink dark:bg-paper-cream border-none outline-none py-1"
          >
            <option value="" disabled className="text-gray-400 bg-paper-cream">Select Department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept} className="text-chalk-ink bg-paper-cream">
                {dept}
              </option>
            ))}
          </select>
          <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-red-400 opacity-20" />
        </div>

        {/* Graduation Year */}
        <div className="flex flex-col relative border-b border-sky-200 dark:border-amber-900/30 py-1">
          <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest">
            Graduation Year
          </span>
          <select
            name="graduationYear"
            defaultValue={initialProfile?.graduation_year || ""}
            className="bg-transparent focus:outline-none text-base mt-1 font-sans text-chalk-ink dark:bg-paper-cream border-none outline-none py-1"
          >
            <option value="" className="text-chalk-ink bg-paper-cream">N/A (Faculty / Staff)</option>
            {GRAD_YEARS.map((year) => (
              <option key={year} value={year} className="text-chalk-ink bg-paper-cream">
                {year}
              </option>
            ))}
          </select>
          <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-red-400 opacity-20" />
        </div>

        {/* Biography */}
        <div className="flex flex-col relative border-b border-sky-200 dark:border-amber-900/30 py-1">
          <span className="font-mono text-[9px] text-sky-400 dark:text-amber-500 uppercase tracking-widest">
            Short Biography
          </span>
          <textarea
            name="bio"
            maxLength={300}
            placeholder="Tell us about yourself (max 300 characters)..."
            defaultValue={initialProfile?.bio || ""}
            className="bg-transparent focus:outline-none text-base mt-1 font-sans placeholder-gray-400 dark:placeholder-amber-900/40 resize-none h-20"
          />
          <div className="absolute left-[-20px] top-0 bottom-0 w-[1px] bg-red-400 opacity-20" />
        </div>

        {/* Save Stamp Button */}
        <button
          type="submit"
          disabled={isPending || uploading}
          className="ticket-clip w-full flex items-center justify-between min-h-[48px] bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold uppercase tracking-wider text-xs shadow-md transition-all active:translate-y-[2px] cursor-pointer disabled:opacity-50 mt-4 px-6"
        >
          <span>{isPending ? "Stamping Changes..." : "Stick Profile to Board"}</span>
          <div className="h-6 border-r border-dashed border-amber-300/60 mx-4" />
          <span className="font-mono text-[10px] normal-case opacity-90 tracking-normal">
            No. 0003
          </span>
        </button>
      </form>
    </div>
  );
}

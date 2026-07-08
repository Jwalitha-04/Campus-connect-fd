"use client";

import React, { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/utils/supabase/client";

interface ImageUploaderProps {
  itemId: string;
  bucketName: string;
  maxImages?: number;
  onUploadComplete: (urls: string[]) => void;
}

export default function ImageUploader({
  itemId,
  bucketName,
  maxImages = 3,
  onUploadComplete,
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images.`);
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const uploadedUrls: string[] = [...images];

    try {
      for (const file of files) {
        // Compress image on client side
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        // Define file upload parameters
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `public/${itemId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, compressedFile, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Retrieve public URL
        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      }

      setImages(uploadedUrls);
      onUploadComplete(uploadedUrls);
    } catch (err: any) {
      setError(err.message || "Failed to upload image(s).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = async (indexToRemove: number) => {
    const urlToRemove = images[indexToRemove];
    const updatedImages = images.filter((_, i) => i !== indexToRemove);
    setImages(updatedImages);
    onUploadComplete(updatedImages);

    try {
      const supabase = createClient();
      // Extract original path token from the public URL to trigger object removal
      const urlParts = urlToRemove.split(`/public/${bucketName}/`);
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from(bucketName).remove([filePath]);
      }
    } catch (err) {
      console.error("Failed to delete file from storage:", err);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {images.map((url, idx) => (
          <div
            key={url}
            className="relative w-24 h-24 border border-paper-border bg-white rounded-sm overflow-hidden shadow-sm group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < maxImages && (
          <div
            onClick={triggerSelect}
            className="w-24 h-24 border-2 border-dashed border-sky-300 dark:border-amber-900/50 hover:border-amber-400 rounded-sm flex flex-col items-center justify-center cursor-pointer bg-white/40 dark:bg-black/20 select-none group transition-colors"
          >
            {uploading ? (
              <span className="font-mono text-[9px] uppercase tracking-widest text-sky-400 animate-pulse">
                uploading
              </span>
            ) : (
              <>
                <span className="text-xl text-gray-400 group-hover:text-amber-500">+</span>
                <span className="font-hand text-xs text-gray-400 group-hover:text-amber-500 mt-1">
                  Add Photo
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        disabled={uploading}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <span className="text-red-500 dark:text-red-400 font-mono text-[10px] block">
          ⚠️ {error}
        </span>
      )}
      
      {images.length > 0 && (
        <span className="font-hand text-xs text-gray-400 block italic">
          Tip: {images.length} of {maxImages} photos attached.
        </span>
      )}
    </div>
  );
}

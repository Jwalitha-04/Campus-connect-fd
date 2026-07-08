"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  created_at: string;
}

export default function NotificationListener() {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function initListener() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel(`user_notifications_${user.id}_${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotification(newNotif);

            // Auto dismiss after 7 seconds
            const timer = setTimeout(() => {
              setNotification(null);
            }, 7000);

            return () => clearTimeout(timer);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    initListener();
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-pin-stick select-none font-sans max-w-sm w-full">
      {/* Yellow Sticky Note hanging from top */}
      <div className="relative p-6 bg-amber-100 border border-amber-300 text-chalk-ink shadow-md rounded-sm transform rotate-2">
        
        {/* Silver Pin at Top Center */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-pin-shadow">
            <circle cx="12" cy="12" r="8" fill="#D0D0D0" />
            <circle cx="12" cy="12" r="3" fill="#A0A0A0" />
            <line x1="12" y1="12" x2="12" y2="20" stroke="#707070" strokeWidth="2" />
          </svg>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setNotification(null)}
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 font-hand text-xs cursor-pointer underline decoration-dashed"
        >
          Dismiss
        </button>

        <div className="space-y-2 mt-2">
          <span className="font-mono text-[8px] text-amber-500 uppercase tracking-widest block font-bold">
            🔔 Match Warning Tag
          </span>
          <h4 className="font-display text-sm font-bold tracking-wide">
            {notification.title}
          </h4>
          <p className="font-hand text-xs text-chalk-ink/80 leading-relaxed italic">
            &quot;{notification.message}&quot;
          </p>

          {notification.link && (
            <a
              href={notification.link}
              onClick={() => setNotification(null)}
              className="text-[10px] text-sky-600 hover:text-amber-600 underline font-sans block pt-1 font-bold uppercase tracking-wider"
            >
              Inspect Notice Details →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

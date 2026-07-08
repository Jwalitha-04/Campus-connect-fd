"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { scheduleSession, updateSessionStatus, submitRating } from "../../actions";

interface Profile {
  id: string;
  display_name: string;
  department: string;
  graduation_year: number | null;
  reputation_points: number;
  avatar_url: string | null;
  role: string;
}

interface Skill {
  id: string;
  name: string;
}

interface SwapMatch {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: "pending" | "active" | "completed" | "cancelled";
  userA?: Profile | null;
  userB?: Profile | null;
  skillA?: Skill | null;
  skillB?: Skill | null;
}

interface Session {
  id: string;
  match_id: string;
  requester_id: string;
  session_date: string;
  session_time: string;
  location_type: "online" | "physical";
  location_detail: string;
  status: "requested" | "accepted" | "rescheduled" | "cancelled" | "completed";
}

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
}

interface MatchPortalProps {
  match: SwapMatch;
  currentUserId: string;
  initialSession: Session | null;
  initialMessages: Message[];
}

export default function MatchPortal({
  match,
  currentUserId,
  initialSession,
  initialMessages,
}: MatchPortalProps) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [schedulerLocType, setSchedulerLocType] = useState<"online" | "physical">(
    initialSession?.location_type || "online"
  );
  const [locationDetailVal, setLocationDetailVal] = useState(
    initialSession?.location_detail || ""
  );

  useEffect(() => {
    if (session) {
      setSchedulerLocType(session.location_type);
      setLocationDetailVal(session.location_detail);
    }
  }, [session]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const partner = currentUserId === match.user_a_id ? match.userB : match.userA;
  const myOffering = currentUserId === match.user_a_id ? match.skillA : match.skillB;
  const partnerOffering = currentUserId === match.user_a_id ? match.skillB : match.skillA;

  // Real-time Chat Subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`match_chat_${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Trigger feedback modal on session completion
  useEffect(() => {
    if (session?.status === "completed" && !ratingSubmitted) {
      setShowRatingModal(true);
    }
  }, [session?.status, ratingSubmitted]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const supabase = createClient();
    const content = chatInput;
    setChatInput("");

    const { error } = await supabase.from("chat_messages").insert({
      match_id: match.id,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("Attachment exceeds max limit of 10MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const filePath = `${match.id}/${Date.now()}_${file.name}`;

    try {
      const { data, error } = await supabase.storage.from("swap-attachments").upload(filePath, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("swap-attachments").getPublicUrl(filePath);

      await supabase.from("chat_messages").insert({
        match_id: match.id,
        sender_id: currentUserId,
        content: `Shared attachment: ${file.name}`,
        attachment_url: publicUrl,
      });

    } catch (err: any) {
      console.error("File upload error:", err);
      alert("Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get("session_date") as string;
    const time = formData.get("session_time") as string;
    const locType = formData.get("location_type") as "online" | "physical";
    const locDetail = formData.get("location_detail") as string;

    try {
      await scheduleSession(match.id, date, time, locType, locDetail);
      const supabase = createClient();
      const { data } = await supabase.from("sessions").select("*").eq("match_id", match.id).maybeSingle();
      if (data) setSession(data as Session);
    } catch (err: any) {
      alert(err.message || "Failed to schedule session.");
    }
  };

  const handleUpdateStatus = async (status: "accepted" | "cancelled" | "completed") => {
    if (!session) return;
    try {
      await updateSessionStatus(session.id, status);
      setSession((prev) => (prev ? { ...prev, status } : null));
    } catch (err: any) {
      alert(err.message || "Failed to update session.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !partner) return;

    try {
      await submitRating(session.id, partner.id, ratingScore, feedbackText);
      setRatingSubmitted(true);
      setShowRatingModal(false);
      alert("Feedback submitted! Tutor reputation points updated.");
    } catch (err: any) {
      alert(err.message || "Failed to submit review.");
    }
  };

  return (
    <div className="w-full min-h-screen p-6 flex flex-col font-sans select-none relative">
      
      {/* Review Dialog Survey */}
      {showRatingModal && partner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
          <div 
            className="relative w-full max-w-md p-8 bg-pod-surface border border-pod-border text-ink pod-aura blob-shape shadow-xl"
            style={{ "--aura-gradient": "linear-gradient(135deg, #FF9A5A, #FFC93C)" } as React.CSSProperties}
          >
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div className="text-center">
                <h3 className="font-display text-xl font-bold tracking-wide">
                  Session Completed!
                </h3>
                <p className="font-sans text-xs text-ink-soft mt-1">
                  Leave a rating for {partner.display_name}
                </p>
              </div>

              {/* Rating selection (stars) */}
              <div className="flex flex-col items-center">
                <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-2">
                  Session Quality Score
                </span>
                <div className="flex gap-2.5">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRatingScore(score)}
                      className="text-2xl cursor-pointer transition-transform active:scale-95 text-amber-500"
                    >
                      {score <= ratingScore ? "★" : "☆"}
                    </button>
                  ))}
                </div>
                <span className="font-sans text-xs font-semibold text-amber-500 mt-2">
                  {ratingScore} of 5 Stars
                </span>
              </div>

              {/* Feedback textarea */}
              <div className="flex flex-col">
                <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">
                  Feedback Review
                </span>
                <textarea
                  required
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Describe your session learning experience..."
                  className="bg-base border border-pod-border rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-amber-300/30 outline-none text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center min-h-[46px] rounded-full bg-gradient-amber text-white font-sans font-semibold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
              >
                Submit Tutor Rating
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-pod-border pb-6">
        <div>
          <Link href="/skill-swap">
            <h1 className="font-display text-4.5xl font-bold tracking-wide text-ink hover:opacity-85 transition-opacity">
              Swap Exchange Biome
            </h1>
          </Link>
          <p className="font-hand text-xl text-ink-soft mt-1">
            Match connection with {partner?.display_name || "Campus Member"}
          </p>
        </div>
        <div>
          <Link href="/skill-swap" className="font-sans text-xs text-ink-soft hover:underline">
            Back to Swap Board
          </Link>
        </div>
      </div>

      {/* Portal split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto w-full">
        
        {/* Left Section: Meeting Coordinator Dashboard (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-4 md:p-5 bg-pod-surface border border-pod-border text-ink rounded-2xl shadow-sm">
            <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-3">
              Session Coordinator
            </span>

            {/* Current Session status info */}
            {session ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-base border border-pod-border rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="font-sans font-semibold text-ink-soft uppercase tracking-wider">Date</span>
                    <span className="font-bold">{session.session_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-semibold text-ink-soft uppercase tracking-wider">Time</span>
                    <span className="font-bold">{session.session_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-semibold text-ink-soft uppercase tracking-wider">Format</span>
                    <span className="font-bold capitalize">{session.location_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans font-semibold text-ink-soft uppercase tracking-wider">Location</span>
                    <span className="font-bold break-all max-w-[120px] text-right">
                      {session.location_type === "online" && (session.location_detail.startsWith("http://") || session.location_detail.startsWith("https://")) ? (
                        <a
                          href={session.location_detail}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-amber-500 underline font-semibold"
                        >
                          Join Meet
                        </a>
                      ) : (
                        session.location_detail
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-pod-border">
                    <span className="font-sans font-semibold text-ink-soft uppercase tracking-wider">Status</span>
                    <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-full ${
                      session.status === "accepted" ? "bg-green-100 text-green-700" :
                      session.status === "requested" ? "bg-blue-100 text-blue-700" :
                      session.status === "rescheduled" ? "bg-amber-100 text-amber-700" :
                      session.status === "completed" ? "bg-gray-100 text-gray-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>

                {/* Session Actions based on status */}
                {session.status === "requested" || session.status === "rescheduled" ? (
                  session.requester_id !== currentUserId ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleUpdateStatus("accepted")}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-sans text-xs uppercase font-bold tracking-wider rounded-full shadow-sm transition-all active:translate-y-[1px] cursor-pointer"
                      >
                        ✔ Accept & Sync Calendar
                      </button>
                    </div>
                  ) : (
                    <p className="font-sans text-xs text-ink-soft italic text-center">
                      Waiting for partner confirmation...
                    </p>
                  )
                ) : null}

                {session.status === "accepted" && (
                  <div className="space-y-2">
                    {session.location_type === "online" && (session.location_detail.startsWith("http://") || session.location_detail.startsWith("https://")) && (
                      <a
                        href={session.location_detail}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center min-h-[38px] bg-gradient-teal text-white font-sans text-xs uppercase font-bold tracking-wider rounded-full shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        📹 Join Online Meeting
                      </a>
                    )}
                    <button
                      onClick={() => handleUpdateStatus("completed")}
                      className="w-full py-2 bg-gradient-amber text-white font-sans text-xs uppercase font-bold tracking-wider rounded-full shadow-sm transition-all active:translate-y-[1px] cursor-pointer"
                    >
                      ★ Mark Completed
                    </button>
                  </div>
                )}

                {session.status !== "completed" && session.status !== "cancelled" && (
                  <button
                    onClick={() => handleUpdateStatus("cancelled")}
                    className="w-full py-2 border border-red-200 text-red-500 hover:bg-red-50 text-[10px] uppercase font-bold tracking-wider rounded-full transition-all cursor-pointer"
                  >
                    Cancel Session
                  </button>
                )}

              </div>
            ) : (
              <p className="font-sans text-xs text-ink-soft italic">
                No session scheduled yet. Propose details below.
              </p>
            )}

            {/* Scheduler Form */}
            {(!session || session.status === "requested" || session.status === "rescheduled" || session.status === "accepted") && (
              <div className="mt-4 pt-4 border-t border-pod-border">
                <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-2">
                  {session ? "Reschedule Meeting" : "Propose Schedule"}
                </span>
                <form onSubmit={handleScheduleSubmit} className="space-y-2.5">
                  <div>
                    <input
                      type="date"
                      name="session_date"
                      required
                      defaultValue={session?.session_date || ""}
                      className="w-full bg-base border border-pod-border rounded-xl px-3 py-1 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      name="session_time"
                      required
                      defaultValue={session?.session_time || ""}
                      className="w-full bg-base border border-pod-border rounded-xl px-3 py-1 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-4 px-2">
                    <label className="flex items-center space-x-1.5 text-xs cursor-pointer text-ink-soft">
                      <input
                        type="radio"
                        name="location_type"
                        value="online"
                        checked={schedulerLocType === "online"}
                        onChange={() => setSchedulerLocType("online")}
                        className="accent-teal-500"
                      />
                      <span>Online</span>
                    </label>
                    <label className="flex items-center space-x-1.5 text-xs cursor-pointer text-ink-soft">
                      <input
                        type="radio"
                        name="location_type"
                        value="physical"
                        checked={schedulerLocType === "physical"}
                        onChange={() => setSchedulerLocType("physical")}
                        className="accent-teal-500"
                      />
                      <span>Physical</span>
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      name="location_detail"
                      required
                      placeholder={schedulerLocType === "online" ? "Paste link (e.g. Jitsi or Google Meet)" : "Classroom or Campus location"}
                      value={locationDetailVal}
                      onChange={(e) => setLocationDetailVal(e.target.value)}
                      className="w-full bg-base border border-pod-border rounded-xl px-3 py-1 text-xs focus:outline-none"
                    />
                    {schedulerLocType === "online" && (
                      <div className="flex flex-col gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setLocationDetailVal(`https://meet.jit.si/CampusConnect-Swap-${match.id}`)}
                          className="w-full py-1 px-2.5 border border-dashed border-teal-500 hover:bg-teal-50 text-teal-600 dark:hover:bg-teal-950/20 rounded-xl text-[9px] font-semibold transition-all cursor-pointer flex items-center justify-between"
                        >
                          <span>⚡ Auto-generate Jitsi Link</span>
                          <span className="font-mono text-[8px] opacity-60">meet.jit.si</span>
                        </button>
                        <div className="flex gap-1.5">
                          <a
                            href="https://meet.google.com/new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1 px-1.5 border border-dashed border-pod-border hover:bg-black/5 text-ink text-[9px] font-semibold rounded-xl transition-all cursor-pointer text-center block"
                          >
                            Google Meet
                          </a>
                          <a
                            href="https://zoom.us/start/videomeeting"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1 px-1.5 border border-dashed border-pod-border hover:bg-black/5 text-ink text-[9px] font-semibold rounded-xl transition-all cursor-pointer text-center block"
                          >
                            Zoom Call
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center min-h-[38px] rounded-full bg-gradient-teal text-white font-sans font-semibold text-xs shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {session ? "Propose Changes" : "Propose Session"}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Right Section: Real-Time Chat Board (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 bg-pod-surface border border-pod-border text-ink rounded-2xl h-[520px] flex flex-col justify-between relative shadow-md">
            
            <span className="font-sans text-[10px] font-semibold text-ink-soft uppercase tracking-wider block mb-4">
              Match Chat Room
            </span>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center font-sans text-xs text-ink-soft italic">
                  Start typing to say hi! Attach files for study swapping resources.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[70%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <span className="text-[8px] text-ink-soft font-mono">
                        {isMe ? "You" : partner?.display_name} • {new Date(msg.created_at).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      
                      <div
                        className={`p-3.5 border rounded-2xl text-xs mt-1 relative leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-teal-100 border-teal-200 text-slate-800 rounded-tr-none"
                            : "bg-base border-pod-border text-ink rounded-tl-none"
                        }`}
                      >
                        {msg.content}

                        {/* Paper-clip attachment link */}
                        {msg.attachment_url && (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-pod-border flex items-center gap-1.5">
                            <span className="text-base select-none">📎</span>
                            <a
                              href={msg.attachment_url}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-teal-600 hover:text-amber-500 underline font-sans break-all font-semibold"
                            >
                              Download resource file
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Controls */}
            <div className="border-t border-pod-border pt-4 flex gap-3">
              {/* Attachment trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="shrink-0 w-10 h-10 border border-dashed border-pod-border hover:border-teal-400 bg-base rounded-full flex items-center justify-center text-lg transition-colors cursor-pointer"
                title="Attach study file (max 10MB)"
              >
                {uploading ? "⏳" : "📎"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-base border border-pod-border rounded-full px-4 py-2 outline-none text-xs focus:ring-2 focus:ring-teal-300/30"
                />
                <button
                  type="submit"
                  className="shrink-0 px-5 bg-gradient-teal text-white rounded-full text-xs font-semibold hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  Send
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

import React from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import MatchPortal from "./MatchPortal";

export default async function MatchPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Fetch match details
  const { data: matchData, error: matchError } = await supabase
    .from("swap_matches")
    .select(`
      id,
      user_a_id,
      user_b_id,
      status,
      userA:profiles!swap_matches_user_a_id_fkey(id, display_name, department, graduation_year, reputation_points, avatar_url, role),
      userB:profiles!swap_matches_user_b_id_fkey(id, display_name, department, graduation_year, reputation_points, avatar_url, role),
      skillA:skills!swap_matches_skill_offered_by_a_fkey(id, name),
      skillB:skills!swap_matches_skill_offered_by_b_fkey(id, name)
    `)
    .eq("id", id)
    .single();

  if (matchError || !matchData) {
    notFound();
  }

  const match = matchData as any;

  // Verify user is a participant
  if (user.id !== match.user_a_id && user.id !== match.user_b_id) {
    notFound();
  }

  // Fetch active session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("match_id", match.id)
    .in("status", ["requested", "accepted", "rescheduled", "completed"])
    .order("created_at", { ascending: false })
    .maybeSingle();

  // Fetch chat history
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("match_id", match.id)
    .order("created_at", { ascending: true });

  return (
    <MatchPortal
      match={match}
      currentUserId={user.id}
      initialSession={session as any}
      initialMessages={(messages || []) as any}
    />
  );
}

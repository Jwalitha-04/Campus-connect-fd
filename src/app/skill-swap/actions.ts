"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function addSkillListing(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const type = formData.get("type") as "offering" | "wanting";
  const proficiencyLevel = formData.get("proficiency_level") as "beginner" | "intermediate" | "advanced";
  const availability = formData.get("availability") as string;

  if (!name || !description || !category || !type || !proficiencyLevel || !availability) {
    return { error: "All fields are required." };
  }

  const { error } = await supabase.from("skills").insert({
    user_id: user.id,
    name,
    description,
    category,
    type,
    proficiency_level: proficiencyLevel,
    availability,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/skill-swap");
  return { success: true };
}

export async function createSwapMatch(
  userBId: string,
  skillOfferedByAId?: string,
  skillOfferedByBId?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  // Check if active match already exists between A and B
  const { data: existingMatch } = await supabase
    .from("swap_matches")
    .select("id")
    .or(`and(user_a_id.eq.${user.id},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${user.id})`)
    .in("status", ["pending", "active"])
    .maybeSingle();

  if (existingMatch) {
    return { matchId: existingMatch.id };
  }

  // Create new pending match
  const { data: newMatch, error } = await supabase
    .from("swap_matches")
    .insert({
      user_a_id: user.id,
      user_b_id: userBId,
      skill_offered_by_a: skillOfferedByAId || null,
      skill_offered_by_b: skillOfferedByBId || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !newMatch) {
    throw new Error(error?.message || "Failed to initiate swap match.");
  }

  // Get proposer's profile and skill details to format a rich notification message
  const { data: proposerProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  let proposerSkillName = "a skill";
  if (skillOfferedByAId) {
    const { data: skillA } = await supabase
      .from("skills")
      .select("name")
      .eq("id", skillOfferedByAId)
      .single();
    if (skillA) {
      proposerSkillName = skillA.name;
    }
  }

  let receiverSkillName = "your skill";
  if (skillOfferedByBId) {
    const { data: skillB } = await supabase
      .from("skills")
      .select("name")
      .eq("id", skillOfferedByBId)
      .single();
    if (skillB) {
      receiverSkillName = skillB.name;
    }
  }

  const proposerName = proposerProfile?.display_name || "Someone";

  // Create notification for the receiver (userBId)
  await supabase.from("notifications").insert({
    user_id: userBId,
    title: "New Skill Swap Proposal!",
    message: `${proposerName} wants to swap skills: they offer to teach you "${proposerSkillName}" in exchange for "${receiverSkillName}".`,
    type: "skill_swap_proposal",
    link: `/skill-swap`,
  });

  revalidatePath("/skill-swap");
  return { matchId: newMatch.id };
}

export async function scheduleSession(
  matchId: string,
  sessionDate: string,
  sessionTime: string,
  locationType: "online" | "physical",
  locationDetail: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  // Check if a session already exists for this match
  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("match_id", matchId)
    .in("status", ["requested", "accepted", "rescheduled"])
    .maybeSingle();

  if (existingSession) {
    // Reschedule existing session
    const { error } = await supabase
      .from("sessions")
      .update({
        session_date: sessionDate,
        session_time: sessionTime,
        location_type: locationType,
        location_detail: locationDetail,
        status: "rescheduled",
        requester_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSession.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    // Propose new session
    const { error } = await supabase.from("sessions").insert({
      match_id: matchId,
      requester_id: user.id,
      session_date: sessionDate,
      session_time: sessionTime,
      location_type: locationType,
      location_detail: locationDetail,
      status: "requested",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Update match status to active if pending
  await supabase
    .from("swap_matches")
    .update({ status: "active" })
    .eq("id", matchId)
    .eq("status", "pending");

  // Notify the other user
  const { data: match } = await supabase
    .from("swap_matches")
    .select("user_a_id, user_b_id")
    .eq("id", matchId)
    .single();

  if (match) {
    const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
    const { data: proposerProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const proposerName = proposerProfile?.display_name || "Someone";

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      title: existingSession ? "Session Rescheduled!" : "New Session Proposed!",
      message: `${proposerName} proposed a schedule for your skill swap: on ${sessionDate} at ${sessionTime.slice(0, 5)} (${locationType}).`,
      type: "skill_swap_session",
      link: `/skill-swap/match/${matchId}`,
    });
  }

  revalidatePath(`/skill-swap/match/${matchId}`);
}

export async function updateSessionStatus(sessionId: string, status: "accepted" | "cancelled" | "completed") {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .update({ status })
    .eq("id", sessionId)
    .select("match_id")
    .single();

  if (error || !session) {
    throw new Error(error?.message || "Failed to update session status.");
  }

  if (status === "accepted") {
    // Generate mock calendar Invite .ics content
    console.log(`[MOCK ICS CALENDAR INVITE GENERATED]
    Session ID: ${sessionId}
    Attendee: ${user.email}
    Subject: Campus Connect Skill Swap Session
    Format: iCalendar (ICS) version 2.0
    `);
  }

  if (status === "completed") {
    // Update match status to completed
    await supabase
      .from("swap_matches")
      .update({ status: "completed" })
      .eq("id", session.match_id);
  }

  // Notify the other user
  const { data: match } = await supabase
    .from("swap_matches")
    .select("user_a_id, user_b_id")
    .eq("id", session.match_id)
    .single();

  if (match) {
    const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;
    const { data: updaterProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const updaterName = updaterProfile?.display_name || "Someone";

    let title = "";
    let message = "";
    if (status === "accepted") {
      title = "Session Schedule Confirmed!";
      message = `${updaterName} accepted the proposed schedule for your skill swap session.`;
    } else if (status === "cancelled") {
      title = "Session Cancelled";
      message = `${updaterName} cancelled the skill swap session.`;
    } else if (status === "completed") {
      title = "Session Completed!";
      message = `${updaterName} marked your skill swap session as completed.`;
    }

    if (title && message) {
      await supabase.from("notifications").insert({
        user_id: otherUserId,
        title,
        message,
        type: "skill_swap_status",
        link: `/skill-swap/match/${session.match_id}`,
      });
    }
  }

  revalidatePath(`/skill-swap/match/${session.match_id}`);
}

export async function submitRating(sessionId: string, revieweeId: string, score: number, feedback: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  const { error } = await supabase.from("ratings").insert({
    session_id: sessionId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    score,
    feedback,
  });

  if (error) {
    throw new Error(error.message);
  }
}

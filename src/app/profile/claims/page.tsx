import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ClaimsDashboard from "./ClaimsDashboard";

export default async function ClaimsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Fetch items posted by current user (for claims received)
  const { data: userItems } = await supabase
    .from("lost_found_items")
    .select("id")
    .eq("user_id", user.id);

  const userItemIds = userItems?.map((item) => item.id) || [];

  let receivedClaims: any[] = [];
  if (userItemIds.length > 0) {
    const { data } = await supabase
      .from("claims")
      .select(`
        id,
        answer,
        status,
        created_at,
        claimant:profiles(id, display_name, department, graduation_year, reputation_points, avatar_url),
        item:lost_found_items(id, title, type, category, location, date_lost_found, verification_question)
      `)
      .in("item_id", userItemIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    receivedClaims = data || [];
  }

  // Fetch claims made by current user
  const { data: madeClaimsData } = await supabase
    .from("claims")
    .select(`
      id,
      answer,
      status,
      created_at,
      claimant:profiles(id, display_name, department, graduation_year, reputation_points, avatar_url),
      item:lost_found_items(
        id,
        title,
        type,
        category,
        location,
        date_lost_found,
        verification_question,
        finder:profiles!user_id(id, display_name, avatar_url)
      )
    `)
    .eq("claimant_id", user.id)
    .order("created_at", { ascending: false });

  const madeClaims = (madeClaimsData as any) || [];

  return (
    <ClaimsDashboard 
      initialReceivedClaims={receivedClaims} 
      initialMadeClaims={madeClaims} 
    />
  );
}

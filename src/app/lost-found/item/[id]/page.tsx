import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ItemDetails from "./ItemDetails";

export default async function ItemDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: item, error } = await supabase
    .from("lost_found_items")
    .select("*, profiles(*)")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  return <ItemDetails item={item} currentUserId={user?.id || null} />;
}

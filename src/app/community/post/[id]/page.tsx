import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PostThread from "./PostThread";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch post details
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*, profiles(*)")
    .eq("id", id)
    .single();

  if (postError || !post) {
    notFound();
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  return (
    <PostThread
      post={post as any}
      comments={(comments || []) as any}
      currentUserId={user?.id || null}
    />
  );
}

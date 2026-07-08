"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function createPost(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;

  if (!title || !content || !category) {
    return { error: "All fields are required." };
  }

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    title,
    content,
    category,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/community");
  return { success: true };
}

export async function createComment(postId: string, content: string, parentId?: string | null) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content,
    parent_id: parentId || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/community/post/${postId}`);
}

export async function toggleReaction(postId: string, reactionType: "heart" | "pin" | "check") {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  // Check if reaction exists
  const { data: existingReaction } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (existingReaction) {
    // Remove reaction
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("id", existingReaction.id);

    if (error) throw new Error(error.message);
  } else {
    // Add reaction
    const { error } = await supabase.from("post_reactions").insert({
      user_id: user.id,
      post_id: postId,
      reaction_type: reactionType,
    });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/community");
  revalidatePath(`/community/post/${postId}`);
}

export async function acceptAnswer(commentId: string, postId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  // Verify user is the author of the post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    throw new Error("Post not found.");
  }

  if (post.user_id !== user.id) {
    throw new Error("Only the post author can accept an answer.");
  }

  // Set this comment to accepted, and reset others for this post if needed (or allow multiple accepted answers)
  const { error } = await supabase
    .from("comments")
    .update({ is_accepted: true })
    .eq("id", commentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/community/post/${postId}`);
}

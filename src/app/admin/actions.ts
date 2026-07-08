"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function reportContent(targetType: "post" | "comment" | "skill" | "item", targetId: string, reason: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  const { error } = await supabase.from("moderation_reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resolveReport(reportId: string, status: "resolved" | "dismissed") {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { error } = await supabase
    .from("moderation_reports")
    .update({ status })
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/dashboard");
}

export async function deleteReportedContent(reportId: string, targetType: "post" | "comment" | "skill" | "item", targetId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  // Delete from target table
  let table = "";
  if (targetType === "post") table = "posts";
  else if (targetType === "comment") table = "comments";
  else if (targetType === "skill") table = "skills";
  else if (targetType === "item") table = "lost_found_items";

  if (table) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", targetId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  // Update report status
  const { error: reportError } = await supabase
    .from("moderation_reports")
    .update({ status: "resolved" })
    .eq("id", reportId);

  if (reportError) {
    throw new Error(reportError.message);
  }

  revalidatePath("/admin/dashboard");
}

export async function overrideHandoff(claimId: string, itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  // Update claim to approved
  const { error: claimError } = await supabase
    .from("claims")
    .update({ status: "approved" })
    .eq("id", claimId);

  if (claimError) {
    throw new Error(claimError.message);
  }

  // Update item to returned
  const { error: itemError } = await supabase
    .from("lost_found_items")
    .update({ status: "returned" })
    .eq("id", itemId);

  if (itemError) {
    throw new Error(itemError.message);
  }

  revalidatePath("/admin/qr-desk");
  revalidatePath("/lost-found");
}

export async function directHandoffResolve(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { error } = await supabase
    .from("lost_found_items")
    .update({ status: "returned" })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/qr-desk");
  revalidatePath("/lost-found");
  revalidatePath(`/lost-found/item/${itemId}`);
}

export async function confirmDropOff(itemId: string, location: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated.");

  const { error } = await supabase
    .from("lost_found_items")
    .update({ status: `Secured at ${location}` })
    .eq("id", itemId);

  if (error) {
    throw new Error(error.message);
  }

  // Notify pending claimants that the item has been secured at the hub
  try {
    const { data: claims } = await supabase
      .from("claims")
      .select(`
        claimant_id,
        item:lost_found_items(title)
      `)
      .eq("item_id", itemId)
      .eq("status", "pending");

    if (claims) {
      for (const claim of claims) {
        const itemTitle = (claim.item as any)?.title || "your claimed item";
        await supabase.from("notifications").insert({
          user_id: claim.claimant_id,
          title: "Item Secured at Hub",
          message: `The found item "${itemTitle}" has been secured at the ${location}. You can collect it there by showing your verification screen.`,
          type: "item_secured",
          link: `/lost-found/item/${itemId}`,
        });
      }
    }
  } catch (e) {
    console.error("Failed to notify claimants on drop-off:", e);
  }

  revalidatePath("/admin/qr-desk");
  revalidatePath("/lost-found");
  revalidatePath(`/lost-found/item/${itemId}`);
}

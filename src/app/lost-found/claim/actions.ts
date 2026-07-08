"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { createClient as createServiceClient } from "@supabase/supabase-js";

async function getUserEmail(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  try {
    const supabase = createServiceClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data } = await supabase
      .schema("auth")
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    return data?.email || null;
  } catch (err) {
    console.error("Failed to fetch user email:", err);
    return null;
  }
}

async function sendNotificationEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: "Campus Connect <onboarding@resend.dev>",
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error("Failed to send email via Resend:", err);
    }
  } else {
    console.log(`[MOCK EMAIL SENT via RESEND]
    To: ${to}
    Subject: ${subject}
    Body: ${html}
    `);
  }
}

export async function submitClaim(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  const itemId = formData.get("itemId") as string;
  const answer = formData.get("answer") as string;

  if (!itemId || !answer) {
    return { error: "Answer is required." };
  }

  const { error } = await supabase.from("claims").insert({
    item_id: itemId,
    claimant_id: user.id,
    answer: answer,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  // Notify finder (owner of the item)
  try {
    const { data: item } = await supabase
      .from("lost_found_items")
      .select("user_id, title")
      .eq("id", itemId)
      .single();

    if (item && item.user_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: item.user_id,
        title: "New Claim Submitted",
        message: `Someone submitted a verification answer for your found item "${item.title}".`,
        type: "claim_submitted",
        link: `/profile/claims`,
      });

      const finderEmail = await getUserEmail(item.user_id);
      if (finderEmail) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        await sendNotificationEmail(
          finderEmail,
          `[Campus Connect] New Claim Submitted on "${item.title}"`,
          `
          <div style="font-family: sans-serif; padding: 20px; color: #1e1b18; background-color: #fcfbfa; border: 1px solid #1e1b18;">
            <h2 style="font-family: monospace; border-bottom: 2px dashed #1e1b18; padding-bottom: 10px;">CAMPUS CONNECT</h2>
            <h3>New Claim Ticket Submitted!</h3>
            <p>Hi,</p>
            <p>Someone has submitted a claim verification answer for your found item: <strong>${item.title}</strong>.</p>
            <p>Please log in and check your <a href="${siteUrl}/profile/claims" style="color: #0d9488; font-weight: bold; text-decoration: underline;">Claims Dashboard</a> to review the answer and accept or reject the claim.</p>
            <br/>
            <p style="font-size: 11px; color: #7f7872;">Best regards,<br/>Campus Connect Team</p>
          </div>
          `
        );
      }
    }
  } catch (e) {
    console.error("Failed to notify claim submission:", e);
  }

  revalidatePath(`/lost-found/item/${itemId}`);
  return { success: true };
}

export async function updateClaimStatus(
  claimId: string,
  status: "approved" | "rejected",
  handoverPreference?: "hold" | "drop_off",
  dropOffLocation?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated.");
  }

  // Update claim status
  const { data: updatedClaim, error: updateError } = await supabase
    .from("claims")
    .update({ status })
    .eq("id", claimId)
    .select("item_id, claimant_id")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  // If approved, update the item's status depending on handover preference
  if (status === "approved" && updatedClaim?.item_id) {
    // Fetch item to read its defaults
    const { data: item } = await supabase
      .from("lost_found_items")
      .select("title, handover_preference, drop_off_location, handover_limit_location, contact_info")
      .eq("id", updatedClaim.item_id)
      .single();

    const finalPreference = handoverPreference || (item?.handover_preference === "hold" ? "hold" : "drop_off");
    const finalLocation = dropOffLocation || item?.drop_off_location || item?.handover_limit_location || "";

    const isDropOff = finalPreference === "drop_off";
    const itemStatus = isDropOff ? "in_transit" : "returned";

    const updatePayload: any = { status: itemStatus };
    if (isDropOff && finalLocation) {
      updatePayload.drop_off_location = finalLocation;
    }

    const { error: itemError } = await supabase
      .from("lost_found_items")
      .update(updatePayload)
      .eq("id", updatedClaim.item_id);

    if (itemError) {
      throw new Error(itemError.message);
    }

    // Notify claimant
    if (updatedClaim.claimant_id) {
      try {
        let notificationMessage = `Your claim for "${item?.title || "item"}" was approved!`;
        let notificationTitle = "Claim Approved";

        if (isDropOff && finalLocation) {
          notificationTitle = "Claim Approved - Drop-Off Pending";
          notificationMessage = `Your claim for "${item?.title || "item"}" was approved! The finder is dropping it off at ${finalLocation}. Show your claim stub to collect once secured.`;
        } else {
          notificationMessage = `Your claim for "${item?.title || "item"}" was approved! Contact the finder at ${item?.contact_info || ""} to arrange pickup.`;
        }

        await supabase.from("notifications").insert({
          user_id: updatedClaim.claimant_id,
          title: notificationTitle,
          message: notificationMessage,
          type: "claim_approved",
          link: `/lost-found/item/${updatedClaim.item_id}`,
        });

        const claimantEmail = await getUserEmail(updatedClaim.claimant_id);
        if (claimantEmail) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
          await sendNotificationEmail(
            claimantEmail,
            `[Campus Connect] Claim Approved: "${item?.title || "Lost Item"}"`,
            `
            <div style="font-family: sans-serif; padding: 20px; color: #1e1b18; background-color: #fcfbfa; border: 1px solid #1e1b18;">
              <h2 style="font-family: monospace; border-bottom: 2px dashed #1e1b18; padding-bottom: 10px;">CAMPUS CONNECT</h2>
              <h3>Claim Ticket Approved! 🎉</h3>
              <p>Hi,</p>
              <p>Great news! Your claim ticket for the item <strong>${item?.title || "lost item"}</strong> has been approved.</p>
              <p><strong>Handover Coordination:</strong> ${
                isDropOff && finalLocation 
                  ? `The finder is dropping off your item at <strong>${finalLocation}</strong>. Show your claim stub to collect once secured.` 
                  : `Please contact the finder at <strong>${item?.contact_info || "their contact details"}</strong> to arrange pickup.`
              }</p>
              <p>You can check the ticket status, claim stub, or meet online on the <a href="${siteUrl}/profile/claims" style="color: #0d9488; font-weight: bold; text-decoration: underline;">Claims Dashboard</a>.</p>
              <br/>
              <p style="font-size: 11px; color: #7f7872;">Best regards,<br/>Campus Connect Team</p>
            </div>
            `
          );
        }
      } catch (e) {
        console.error("Failed to notify claimant of approval:", e);
      }
    }
  } else if (status === "rejected" && updatedClaim?.claimant_id && updatedClaim?.item_id) {
    // Notify claimant about rejection
    try {
      const { data: item } = await supabase
        .from("lost_found_items")
        .select("title")
        .eq("id", updatedClaim.item_id)
        .single();

      if (item) {
        await supabase.from("notifications").insert({
          user_id: updatedClaim.claimant_id,
          title: "Claim Rejected",
          message: `Your claim for "${item.title}" has been rejected.`,
          type: "claim_rejected",
          link: `/lost-found/item/${updatedClaim.item_id}`,
        });

        const claimantEmail = await getUserEmail(updatedClaim.claimant_id);
        if (claimantEmail) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
          await sendNotificationEmail(
            claimantEmail,
            `[Campus Connect] Claim Rejected: "${item.title}"`,
            `
            <div style="font-family: sans-serif; padding: 20px; color: #1e1b18; background-color: #fcfbfa; border: 1px solid #1e1b18;">
              <h2 style="font-family: monospace; border-bottom: 2px dashed #1e1b18; padding-bottom: 10px;">CAMPUS CONNECT</h2>
              <h3>Claim Ticket Rejected</h3>
              <p>Hi,</p>
              <p>Your claim ticket for the item <strong>${item.title}</strong> has been rejected by the finder.</p>
              <p>The finder could not verify ownership based on your answer. You can submit another claim on the <a href="${siteUrl}/lost-found/item/${updatedClaim.item_id}" style="color: #0d9488; font-weight: bold; text-decoration: underline;">Notice Flyer</a> with more specific details.</p>
              <br/>
              <p style="font-size: 11px; color: #7f7872;">Best regards,<br/>Campus Connect Team</p>
            </div>
            `
          );
        }
      }
    } catch (e) {
      console.error("Failed to notify claimant of rejection:", e);
    }
  }

  revalidatePath("/profile/claims");
  revalidatePath("/lost-found");
  if (updatedClaim?.item_id) {
    revalidatePath(`/lost-found/item/${updatedClaim.item_id}`);
  }
}

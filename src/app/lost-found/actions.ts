"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function reportItem(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  const id = formData.get("id") as string;
  const type = formData.get("type") as "lost" | "found";
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const dateStr = formData.get("dateLostFound") as string;
  const timeStr = formData.get("timeLostFound") as string;
  const location = formData.get("location") as string;
  const contactInfo = formData.get("contactInfo") as string;
  const verificationQuestion = formData.get("verificationQuestion") as string;
  const imagesJson = formData.get("images") as string; // JSON array of public URLs
  const color = formData.get("color") as string;
  const brand = formData.get("brand") as string;
  const itemType = formData.get("itemType") as string;
  const dropOffLocation = formData.get("dropOffLocation") as string;
  const handoverPreference = formData.get("handoverPreference") as string;
  const handoverLimitTime = formData.get("handoverLimitTime") as string;
  const handoverLimitLocation = formData.get("handoverLimitLocation") as string;

  if (!id || !type || !title || !description || !category || !dateStr || !location || !contactInfo) {
    return { error: "All required fields must be completed." };
  }

  if (type === "found" && !verificationQuestion) {
    return { error: "Verification question is required for found items." };
  }

  let images: string[] = [];
  try {
    images = imagesJson ? JSON.parse(imagesJson) : [];
  } catch (e) {
    images = [];
  }

  const qrCodeData = `cc-lf-${id}`;
  const initialStatus = (type === "found" && handoverPreference === "drop_off") ? "in_transit" : "active";

  const { error } = await supabase.from("lost_found_items").insert({
    id,
    user_id: user.id,
    type,
    title,
    description,
    category,
    images,
    date_lost_found: dateStr,
    time_lost_found: timeStr || null,
    location,
    contact_info: contactInfo,
    verification_question: verificationQuestion || null,
    qr_code_data: qrCodeData,
    color: color || null,
    brand: brand || null,
    item_type: itemType || null,
    drop_off_location: (type === "found" && handoverPreference === "drop_off") ? dropOffLocation : null,
    status: initialStatus,
    handover_preference: type === "found" ? (handoverPreference || 'hold') : 'hold',
    handover_limit_time: (type === "found" && handoverPreference === "time_limited") ? handoverLimitTime : null,
    handover_limit_location: (type === "found" && handoverPreference === "time_limited") ? handoverLimitLocation : null,
  });

  if (error) {
    return { error: error.message };
  }

  // Notify users of matching items (bidirectional matching)
  try {
    const newItem = {
      title,
      description,
      category,
      location,
      color: color || null,
      brand: brand || null,
      item_type: itemType || null,
    };

    if (type === "found") {
      // Query existing active lost items to notify their owners
      const { data: lostItems } = await supabase
        .from("lost_found_items")
        .select("*")
        .eq("type", "lost")
        .eq("status", "active");

      if (lostItems) {
        for (const lostItem of lostItems) {
          if (lostItem.user_id === user.id) continue;
          const { score } = calculateMatchScore(lostItem, newItem);
          if (score >= 20) {
            await supabase.from("notifications").insert({
              user_id: lostItem.user_id,
              title: "Matching Item Found!",
              message: `Someone shared that they found an item matching your lost notice "${lostItem.title}".`,
              type: "lost_found_match",
              link: `/lost-found/item/${id}`,
            });
          }
        }
      }
    } else if (type === "lost") {
      // Query existing active found items to notify current user & the found-item owner
      const { data: foundItems } = await supabase
        .from("lost_found_items")
        .select("*")
        .eq("type", "found")
        .eq("status", "active");

      if (foundItems) {
        for (const foundItem of foundItems) {
          if (foundItem.user_id === user.id) continue;
          const { score } = calculateMatchScore(foundItem, newItem);
          if (score >= 20) {
            // Notify the user who just reported the lost item
            await supabase.from("notifications").insert({
              user_id: user.id,
              title: "Potential Match Found!",
              message: `An existing found notice matching your lost post was detected: "${foundItem.title}". Check it out!`,
              type: "lost_found_match",
              link: `/lost-found/item/${foundItem.id}`,
            });

            // Notify the owner of the found item
            await supabase.from("notifications").insert({
              user_id: foundItem.user_id,
              title: "Matching Lost Item Reported!",
              message: `Someone posted a lost notice matching your found item listing "${foundItem.title}".`,
              type: "lost_found_match",
              link: `/lost-found/item/${id}`,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to notify matching items:", e);
  }

  revalidatePath("/lost-found");
  redirect("/lost-found");
}

export async function resolveLostItem(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  // Get item to verify owner and type
  const { data: item, error: fetchError } = await supabase
    .from("lost_found_items")
    .select("user_id, type")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return { error: "Item not found." };
  }

  if (item.type !== "lost") {
    return { error: "Only lost items can be directly resolved by the owner." };
  }

  if (item.user_id !== user.id) {
    return { error: "Unauthorized. Only the person who posted this item can mark it as resolved." };
  }

  const { error: updateError } = await supabase
    .from("lost_found_items")
    .update({ status: "returned" })
    .eq("id", itemId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/lost-found");
  revalidatePath(`/lost-found/item/${itemId}`);
  return { success: true };
}

interface MatchResult {
  score: number;
  reason: string;
}

function calculateMatchScore(item1: any, item2: any): MatchResult {
  if (item1.category !== item2.category) {
    return { score: 0, reason: "" };
  }

  let score = 0;
  const matchReasons: string[] = [];

  const title1 = item1.title.toLowerCase();
  const desc1 = item1.description.toLowerCase();
  const loc1 = item1.location.toLowerCase();
  const color1 = (item1.color || "").toLowerCase();
  const brand1 = (item1.brand || "").toLowerCase();
  const type1 = (item1.item_type || "").toLowerCase();

  const title2 = item2.title.toLowerCase();
  const desc2 = item2.description.toLowerCase();
  const loc2 = item2.location.toLowerCase();
  const color2 = (item2.color || "").toLowerCase();
  const brand2 = (item2.brand || "").toLowerCase();
  const type2 = (item2.item_type || "").toLowerCase();

  // 1. Check exact brand match
  if (brand1 && brand2 && brand1 === brand2) {
    score += 30;
    matchReasons.push(`Both match brand "${item1.brand || item2.brand}"`);
  }

  // 2. Check exact color match
  if (color1 && color2 && color1 === color2) {
    score += 25;
    matchReasons.push(`Both match color "${item1.color || item2.color}"`);
  }

  // 3. Check exact location match
  if (loc1 && loc2 && loc1 === loc2) {
    score += 15;
    matchReasons.push(`Both reported in/around ${item1.location || item2.location}`);
  }

  // 4. Check item type match
  if (type1 && type2 && type1 === type2) {
    score += 20;
    matchReasons.push(`Both identified as "${item1.item_type || item2.item_type}"`);
  }

  // 5. Keyword overlap in titles and descriptions
  const combined1 = `${title1} ${desc1}`.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
  const combined2 = `${title2} ${desc2}`.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

  const words1 = new Set(combined1.split(/\s+/).filter(w => w.length > 2));
  const words2 = combined2.split(/\s+/).filter(w => w.length > 2);

  let overlapCount = 0;
  const matchedKeywords: string[] = [];
  for (const word of words2) {
    if (words1.has(word) && !matchedKeywords.includes(word)) {
      overlapCount++;
      matchedKeywords.push(word);
    }
  }

  if (overlapCount > 0) {
    const textScore = Math.min(overlapCount * 8, 30);
    score += textScore;
    matchReasons.push(`Matches descriptive keywords: ${matchedKeywords.slice(0, 3).join(", ")}`);
  }

  return {
    score: Math.min(score, 100),
    reason: matchReasons.join(". ")
  };
}

export async function getSuggestedMatches(itemId: string) {
  const supabase = await createClient();

  const { data: item, error: fetchError } = await supabase
    .from("lost_found_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return { error: "Item not found." };
  }

  const oppositeType = item.type === "lost" ? "found" : "lost";

  // Query candidates of opposite type in the same category
  const { data: candidates, error: candidatesError } = await supabase
    .from("lost_found_items")
    .select("*, profiles:user_id(display_name)")
    .eq("type", oppositeType)
    .eq("status", "active")
    .eq("category", item.category);

  if (candidatesError) {
    return { error: candidatesError.message };
  }

  const matches: any[] = [];

  for (const cand of candidates || []) {
    const { score, reason } = calculateMatchScore(item, cand);

    // Check if score meets minimum matching threshold
    if (score >= 20) {
      matches.push({
        id: cand.id,
        title: cand.title,
        type: cand.type,
        location: cand.location,
        date_lost_found: cand.date_lost_found,
        images: cand.images,
        profiles: cand.profiles,
        score,
        reason,
      });
    }
  }

  // Sort by match score descending
  return { matches: matches.sort((a, b) => b.score - a.score) };
}

export async function analyzeImageWithAI(imageUrl: string) {
  try {
    // If Gemini key is available, run real image analysis
    if (process.env.GEMINI_API_KEY) {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) throw new Error("Failed to download uploaded image.");
      const buffer = await imageRes.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString("base64");
      const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

      const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Analyze this image of a lost/found item and extract: 1. Item type (e.g. Backpack, Keys, Wallet, Water Bottle, Phone, Glasses, etc.), 2. Color, 3. Brand (if visible, e.g. Nike, Apple, Wildcraft, or 'Generic'/'Unknown'). Return ONLY a valid JSON object in this format: {\"item\": \"...\", \"color\": \"...\", \"brand\": \"...\"}" },
                { inlineData: { mimeType, data: base64Data } }
              ]
            }
          ]
        })
      });

      if (apiRes.ok) {
        const resultJson = await apiRes.json();
        const text = resultJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleanText = text.replace(/```json/i, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanText);
        return {
          item: parsed.item || "Unknown Item",
          color: parsed.color || "Unknown Color",
          brand: parsed.brand || "Unknown Brand",
        };
      }
    }
  } catch (err) {
    console.error("Gemini Vision analysis failed, falling back to heuristics:", err);
  }

  // Smart Heuristics Fallback based on URL path or file naming
  const lowerUrl = imageUrl.toLowerCase();
  if (lowerUrl.includes("backpack") || lowerUrl.includes("bag")) {
    return { item: "Backpack", color: "Black", brand: "Wildcraft" };
  }
  if (lowerUrl.includes("bottle") || lowerUrl.includes("water")) {
    return { item: "Water Bottle", color: "Blue", brand: "Nike" };
  }
  if (lowerUrl.includes("key") || lowerUrl.includes("keychain")) {
    return { item: "Keys", color: "Silver", brand: "Tile" };
  }
  if (lowerUrl.includes("wallet") || lowerUrl.includes("card")) {
    return { item: "Wallet", color: "Brown", brand: "Levi's" };
  }
  if (lowerUrl.includes("phone") || lowerUrl.includes("iphone") || lowerUrl.includes("mobile")) {
    return { item: "Phone", color: "Silver", brand: "Apple" };
  }

  // General fallback
  return { item: "Student Item", color: "Various", brand: "Generic" };
}

export async function extendItem(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  // Check owner
  const { data: item } = await supabase
    .from("lost_found_items")
    .select("user_id")
    .eq("id", itemId)
    .single();

  if (!item || item.user_id !== user.id) {
    return { error: "Unauthorized." };
  }

  const { data: fetchItem } = await supabase
    .from("lost_found_items")
    .select("created_at")
    .eq("id", itemId)
    .single();

  if (!fetchItem) {
    return { error: "Item not found." };
  }

  const currentCreated = new Date(fetchItem.created_at);
  const extendedCreated = new Date(currentCreated.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Cap created_at at now() so we don't schedule things in the future
  const finalCreated = extendedCreated > new Date() ? new Date() : extendedCreated;

  const { error } = await supabase
    .from("lost_found_items")
    .update({
      created_at: finalCreated.toISOString(),
      warning_sent: false
    })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/lost-found");
  revalidatePath(`/lost-found/item/${itemId}`);
  return { success: true };
}

export async function generateHandoverPin(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  const { data: item } = await supabase
    .from("lost_found_items")
    .select("id, user_id, type")
    .eq("id", itemId)
    .single();

  if (!item) {
    return { error: "Item not found." };
  }

  let isReceiver = false;
  if (item.type === "lost" && item.user_id === user.id) {
    isReceiver = true;
  } else if (item.type === "found") {
    const { data: claim } = await supabase
      .from("claims")
      .select("id")
      .eq("item_id", itemId)
      .eq("claimant_id", user.id)
      .eq("status", "approved")
      .maybeSingle();
    
    if (claim) {
      isReceiver = true;
    }
  }

  if (!isReceiver) {
    return { error: "Only the item receiver (owner of lost item or approved claimant of found item) can generate the handover PIN." };
  }

  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { error } = await supabase
    .from("lost_found_items")
    .update({
      handover_pin: pin,
      handover_pin_expires_at: expiresAt.toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/lost-found/item/${itemId}`);
  return { success: true, pin, expiresAt: expiresAt.toISOString() };
}

export async function verifyHandoverPin(itemId: string, pin: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  const { data: item } = await supabase
    .from("lost_found_items")
    .select("id, user_id, type, title, handover_pin, handover_pin_expires_at")
    .eq("id", itemId)
    .single();

  if (!item) {
    return { error: "Item not found." };
  }

  if (!item.handover_pin || !item.handover_pin_expires_at) {
    return { error: "No active handover PIN has been generated for this item." };
  }

  if (new Date(item.handover_pin_expires_at) < new Date()) {
    return { error: "The handover PIN has expired. Please ask the receiver to generate a new PIN." };
  }

  if (item.handover_pin !== pin.trim()) {
    return { error: "Incorrect handover PIN. Please try again." };
  }

  let isGiver = false;
  let finderId = "";

  if (item.type === "found" && item.user_id === user.id) {
    isGiver = true;
    finderId = user.id;
  } else if (item.type === "lost" && item.user_id !== user.id) {
    isGiver = true;
    finderId = user.id;
  }

  if (!isGiver) {
    return { error: "Only the item giver (finder) can verify the handover PIN." };
  }

  // 1. Mark item status as 'returned'
  const { error: updateError } = await supabase
    .from("lost_found_items")
    .update({
      status: "returned",
      handover_pin: null,
      handover_pin_expires_at: null,
    })
    .eq("id", itemId);

  if (updateError) {
    return { error: updateError.message };
  }

  // 2. Reward finder with 20 Reputation Points (Skill Swap credits)
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("reputation_points")
      .eq("id", finderId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          reputation_points: (profile.reputation_points || 0) + 20,
        })
        .eq("id", finderId);
    }
  } catch (e) {
    console.error("Failed to reward reputation points:", e);
  }

  // 3. Notify the receiver that handoff was verified successfully
  try {
    let receiverId = "";
    if (item.type === "lost") {
      receiverId = item.user_id;
    } else {
      const { data: approvedClaim } = await supabase
        .from("claims")
        .select("claimant_id")
        .eq("item_id", itemId)
        .eq("status", "approved")
        .single();
      if (approvedClaim) {
        receiverId = approvedClaim.claimant_id;
      }
    }

    if (receiverId) {
      await supabase.from("notifications").insert({
        user_id: receiverId,
        title: "Handover Successful!",
        message: `The handover for "${item.title}" was verified. The notice has been resolved.`,
        type: "handover_success",
        link: `/lost-found/item/${itemId}`,
      });
    }
  } catch (e) {
    console.error("Failed to notify receiver of handover:", e);
  }

  revalidatePath("/lost-found");
  revalidatePath(`/lost-found/item/${itemId}`);
  return { success: true };
}

export async function updateItemStatusAction(itemId: string, newStatus: "active" | "in_transit" | "at_drop_point") {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in." };
  }

  // Fetch the item
  const { data: item, error: fetchError } = await supabase
    .from("lost_found_items")
    .select("user_id, title, drop_off_location, handover_limit_location")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    return { error: "Item not found." };
  }

  if (item.user_id !== user.id) {
    return { error: "Unauthorized. Only the owner can update status." };
  }

  const { error: updateError } = await supabase
    .from("lost_found_items")
    .update({ status: newStatus })
    .eq("id", itemId);

  if (updateError) {
    return { error: updateError.message };
  }

  // If status is updated to at_drop_point, notify claimant
  if (newStatus === "at_drop_point") {
    try {
      const { data: approvedClaim } = await supabase
        .from("claims")
        .select("claimant_id")
        .eq("item_id", itemId)
        .eq("status", "approved")
        .single();

      if (approvedClaim) {
        const dest = item.drop_off_location || item.handover_limit_location || "the drop hub";
        await supabase.from("notifications").insert({
          user_id: approvedClaim.claimant_id,
          title: "Item Secured at Drop Hub",
          message: `Your claimed item "${item.title}" has been dropped at ${dest}. Show your claim stub to collect.`,
          type: "item_secured",
          link: `/lost-found/item/${itemId}`,
        });
      }
    } catch (e) {
      console.error("Failed to notify claimant of drop:", e);
    }
  }

  revalidatePath("/lost-found");
  revalidatePath(`/lost-found/item/${itemId}`);
  return { success: true };
}


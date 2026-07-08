"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated." };
  }

  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;
  const department = formData.get("department") as string;
  const graduationYearStr = formData.get("graduationYear") as string;
  const avatarUrl = formData.get("avatarUrl") as string;

  const graduationYear = graduationYearStr ? parseInt(graduationYearStr, 10) : null;

  if (!displayName || !department) {
    return { error: "Display Name and Department are required." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio || null,
      department,
      graduation_year: graduationYear,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

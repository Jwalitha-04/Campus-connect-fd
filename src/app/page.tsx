import React from "react";
import { createClient } from "@/utils/supabase/server";
import HomeDashboard from "@/components/home/HomeDashboard";
import WelcomeLanding from "@/components/home/WelcomeLanding";

const topNotices = [
  "📌 Lost Wallet Near Library",
  "📚 Calculus Notes Available",
  "🎮 Chess Club Tournament Friday",
  "💼 Internship Opportunity Posted",
  "🔑 Found Bike Key",
  "📱 iPhone Charger Found",
  "🎓 Study Group Looking for Members",
  "🎸 Guitar Swap Available"
];

const bottomNotices = [
  "📢 Ink Run #0042 Ready for Press",
  "📌 Lost ID Card near Commons",
  "🔑 Found Keys in Hall B",
  "📚 Notes Available for CS101",
  "🎓 Event Today: Zine Making Shop",
  "💼 Internship: Web Dev Assistant",
  "🎸 Skill Swap: Learn Screenprinting",
  "📰 Today's Notice Runs Active"
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If user is authenticated, render the dashboard page
  if (user && !authError) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: notifications } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    return (
      <HomeDashboard
        profile={profile}
        initialNotifications={notifications}
      />
    );
  }

  // Otherwise, render the Riso Entry/Welcome page
  return <WelcomeLanding />;
}

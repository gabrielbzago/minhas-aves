import type { SupabaseClient } from "@supabase/supabase-js";
import { isAmadorTrialActive, PLAN_FEATURES } from "./plans";

export async function ensureAmadorTrialOnFirstUse(supabase: SupabaseClient<any>, userId: string, feature: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan,role,amador_trial_eligible,amador_trial_started_at,amador_trial_ends_at")
    .eq("id", userId)
    .maybeSingle();

  const isAmadorFeature = PLAN_FEATURES.amador.has(feature) && !PLAN_FEATURES.free.has(feature);
  let startedAt = profile?.amador_trial_started_at ?? null;
  let endsAt = profile?.amador_trial_ends_at ?? null;

  if (isAmadorFeature && profile?.plan === "free" && profile?.role === "creator" && profile?.amador_trial_eligible && !startedAt) {
    const { data: end } = await supabase.rpc("start_amador_trial_on_first_use", { p_user_id: userId });
    if (end) {
      endsAt = end;
      startedAt = new Date(new Date(end).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  return {
    profile: profile ? { ...profile, amador_trial_started_at: startedAt, amador_trial_ends_at: endsAt } : profile,
    active: isAmadorTrialActive({ plan: profile?.plan, role: profile?.role, eligible: profile?.amador_trial_eligible, startedAt, endsAt }),
  };
}

import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type ProfileContext = {
  full_name: string | null;
  headline: string | null;
  summary: string | null;
  github: string | null;
  website: string | null;
  skills: string[];
  experiences: { role: string; company: string | null; period: string | null; note: string | null }[];
};

/**
 * Carrega o perfil que serve de contexto para o match e para a geração do
 * e-mail. Sujeito à RLS do usuário logado.
 */
export async function loadProfileContext(
  supabase: ServerClient,
  userId: string,
): Promise<ProfileContext> {
  const [profileRes, skillsRes, expRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, headline, summary, github, website")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("profile_skills").select("skill").eq("user_id", userId).order("position"),
    supabase
      .from("experiences")
      .select("role, company, period, note")
      .eq("user_id", userId)
      .order("position"),
  ]);

  return {
    full_name: profileRes.data?.full_name ?? null,
    headline: profileRes.data?.headline ?? null,
    summary: profileRes.data?.summary ?? null,
    github: profileRes.data?.github ?? null,
    website: profileRes.data?.website ?? null,
    skills: (skillsRes.data ?? []).map((s) => s.skill),
    experiences: expRes.data ?? [],
  };
}

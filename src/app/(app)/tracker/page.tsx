import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TrackerBoard, type AppCard } from "@/components/tracker/tracker-board";
import type { ApplicationStatus } from "@/lib/design/tokens";

export default async function TrackerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [appsRes, metricsRes] = await Promise.all([
    supabase
      .from("applications")
      .select("id, company, role, source, status, applied_at, follow_up_at")
      .eq("user_id", user.id)
      .order("position")
      .order("created_at", { ascending: false }),
    supabase.from("application_metrics").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const cards: AppCard[] = (appsRes.data ?? []).map((a) => ({
    ...a,
    status: a.status as ApplicationStatus,
  }));

  const m = metricsRes.data;
  const metrics = [
    { val: String(m?.week_count ?? 0), label: "candidaturas / semana", first: true },
    { val: m?.response_rate_pct != null ? `${m.response_rate_pct}%` : "—", label: "taxa de resposta" },
    {
      val: m?.avg_response_days != null ? `${m.avg_response_days}d` : "—",
      label: "tempo médio de retorno",
    },
    { val: String(m?.in_process_count ?? 0), label: "em processo", last: true },
  ];

  return (
    <section className="px-10 pt-[34px] pb-12">
      <header className="mb-6">
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted mb-2">
          AplicaAI · Tracker
        </div>
        <h1 className="font-display font-extrabold text-[32px] tracking-[-0.01em] m-0 mb-5">
          Suas candidaturas
        </h1>

        <div className="flex border border-border rounded-lg bg-surface overflow-hidden w-fit shadow-flat">
          {metrics.map((mt) => (
            <div
              key={mt.label}
              className="px-[26px] py-4"
              style={{ borderLeft: mt.first ? "none" : "1px solid var(--color-border)" }}
            >
              <div className="font-mono text-[26px] font-semibold text-ink leading-none">
                {mt.val}
              </div>
              <div className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-muted mt-[7px]">
                {mt.label}
              </div>
            </div>
          ))}
        </div>
      </header>

      {cards.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg shadow-flat px-8 py-11 text-center max-w-[440px]">
          <div className="font-display font-bold text-[17px] mb-1.5">
            Nenhuma candidatura ainda
          </div>
          <p className="text-[13px] text-muted leading-[1.55] m-0">
            Gere um e-mail em Nova candidatura e ele aparece aqui como rascunho.
          </p>
        </div>
      ) : (
        <TrackerBoard initial={cards} />
      )}
    </section>
  );
}

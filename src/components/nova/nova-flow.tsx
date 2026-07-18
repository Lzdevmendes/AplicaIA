"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { gmailComposeUrl } from "@/lib/gmail/deeplink";
import { SkillMatch } from "./skill-match";
import {
  IconSparkle,
  IconSend,
  IconRefresh,
  IconDoc,
  IconEnvelope,
  IconImage,
} from "@/components/ui/icons";
import type { JobExtraction, GeneratedEmail } from "@/lib/ai/job-schemas";

type Phase = "input" | "generating" | "done";
type Tab = "paste" | "print";

const IMAGE_MEDIA = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function NovaFlow({
  cv,
  sendMode,
}: {
  cv: { filename: string; size_bytes: number } | null;
  sendMode: "deeplink" | "api";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("paste");
  const [jobText, setJobText] = useState("");
  const [image, setImage] = useState<{ base64: string; media: string; name: string } | null>(null);

  const [phase, setPhase] = useState<Phase>("input");
  const [job, setJob] = useState<JobExtraction | null>(null);
  const [email, setEmail] = useState<GeneratedEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const genLabel =
    phase === "generating" ? "Gerando…" : phase === "done" ? "Gerar de novo" : "Gerar e-mail";

  async function pickImage(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!IMAGE_MEDIA.includes(file.type)) {
      setError("Print precisa ser PNG, JPG, WEBP ou GIF.");
      return;
    }
    const buf = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    setImage({ base64, media: file.type, name: file.name });
  }

  async function generate() {
    setError(null);
    setSaved(false);
    setPhase("generating");
    setEmail(null);

    try {
      const extractBody =
        tab === "paste"
          ? { text: jobText }
          : { imageBase64: image?.base64, imageMediaType: image?.media };

      const extractRes = await fetch("/api/job/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractBody),
      });
      const extracted = await extractRes.json();
      if (!extractRes.ok) throw new Error(extracted.error ?? "falha ao ler a vaga");
      setJob(extracted as JobExtraction);

      const emailRes = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: extracted }),
      });
      const generated = await emailRes.json();
      if (!emailRes.ok) throw new Error(generated.error ?? "falha ao gerar o e-mail");

      setEmail(generated as GeneratedEmail);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "algo deu errado");
      setPhase(job ? "done" : "input");
    }
  }

  async function saveDraft(status: "rascunho" | "enviada") {
    if (!job || !email) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sessão expirada.");
      return;
    }

    const { data: app, error: appError } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        company: job.company || "Empresa",
        role: job.role || null,
        source: job.source || null,
        contact_email: job.contact_email || null,
        status,
        job_text: tab === "paste" ? jobText : null,
        job_meta: {
          work_model: job.work_model,
          source: job.source,
        },
        match_note: job.note || null,
        applied_at: status === "enviada" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (appError || !app) {
      setError(appError?.message ?? "falha ao salvar");
      return;
    }

    await Promise.all([
      supabase.from("application_emails").insert({
        user_id: user.id,
        application_id: app.id,
        subject: email.subject,
        body: email.body,
        sent_at: status === "enviada" ? new Date().toISOString() : null,
      }),
      job.skills.length
        ? supabase.from("skill_matches").insert(
            job.skills.map((s, position) => ({
              user_id: user.id,
              application_id: app.id,
              skill: s.name,
              verdict: s.verdict,
              position,
            })),
          )
        : Promise.resolve(),
    ]);

    setSaved(true);
    router.refresh();
    return app.id;
  }

  async function sendEmail() {
    if (!job || !email) return;

    if (sendMode === "deeplink") {
      // Deep link não anexa o CV nem confirma envio, então já grava como
      // enviada — a candidatura consta no tracker mesmo que o usuário feche a
      // aba do Gmail.
      await saveDraft("enviada");
      window.open(
        gmailComposeUrl({
          to: job.contact_email || "",
          subject: email.subject,
          body: email.body,
        }),
        "_blank",
        "noopener",
      );
      return;
    }

    // Modo API: grava como rascunho para ter o id, e o /api/email/send confirma
    // o envio (com o CV anexado) e vira o status para enviada.
    if (!job.contact_email) {
      setError("A vaga não trouxe um e-mail de contato para enviar.");
      return;
    }
    const appId = await saveDraft("rascunho");
    if (!appId) return;

    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: appId,
        to: job.contact_email,
        subject: email.subject,
        body: email.body,
      }),
    });
    const out = await res.json();
    if (!res.ok) {
      setError(out.error ?? "falha ao enviar pelo Gmail");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const meta = job
    ? [
        { k: "empresa", v: job.company },
        { k: "cargo", v: job.role },
        { k: "modelo", v: job.work_model },
        { k: "fonte", v: job.source },
        { k: "contato", v: job.contact_email },
      ].filter((m) => m.v)
    : [];

  const canGenerate =
    phase !== "generating" &&
    (tab === "paste" ? jobText.trim().length > 20 : !!image);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 items-start">
      {/* ESQUERDA: entrada da vaga */}
      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="flex gap-0.5 p-1.5 border-b border-border bg-bg">
          <TabButton active={tab === "paste"} onClick={() => setTab("paste")}>
            Colar texto
          </TabButton>
          <TabButton active={tab === "print"} onClick={() => setTab("print")}>
            Subir print
          </TabButton>
        </div>

        {tab === "paste" ? (
          <div className="px-[22px] pt-5 pb-[22px]">
            <label className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted block mb-2.5">
              Anúncio da vaga
            </label>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Cole aqui o texto da vaga — descrição, requisitos, e-mail de contato…"
              className="w-full h-[300px] border border-border rounded-lg px-4 py-[15px] text-[13.5px] leading-[1.6] text-ink bg-bg outline-none focus:border-pine focus:bg-surface"
            />
          </div>
        ) : (
          <div className="px-[22px] pt-5 pb-[22px]">
            <label className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted block mb-2.5">
              Print da vaga
            </label>
            <PrintDrop image={image} onPick={pickImage} />
          </div>
        )}

        {meta.length > 0 && (
          <div className="px-[22px] pb-5">
            <div className="flex flex-wrap gap-[7px]">
              {meta.map((m) => (
                <span
                  key={m.k}
                  className="font-mono text-[11px] text-muted bg-bg border border-border rounded-md px-[9px] py-[5px]"
                >
                  <span className="text-faint">{m.k}</span> {m.v}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="px-[22px] py-4 border-t border-border flex items-center gap-3 bg-bg">
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="flex-1 bg-pine text-white border-none rounded-lg py-[13px] text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-pine-dark transition-colors disabled:opacity-50 disabled:cursor-default"
          >
            <IconSparkle size={16} />
            {genLabel}
          </button>
          <span className="font-mono text-[10.5px] text-faint">⌘↵</span>
        </div>
      </div>

      {/* DIREITA: match + e-mail */}
      <div className="flex flex-col gap-4">
        <SkillMatch
          skills={job?.skills ?? []}
          note={job?.note ?? null}
          generating={phase === "generating"}
        />

        {error && (
          <p role="alert" className="text-[13px] text-clay">
            {error}
          </p>
        )}

        {phase === "input" && !job && (
          <div className="bg-surface border border-border rounded-lg shadow-flat px-8 py-11 text-center flex flex-col items-center gap-3">
            <IconEnvelope size={30} />
            <div className="font-display font-bold text-[17px] text-ink">
              Seu e-mail aparece aqui
            </div>
            <p className="text-[13px] text-muted max-w-[320px] leading-[1.55] m-0">
              Cole a vaga ao lado e clique em gerar. A gente escreve o assunto, o
              corpo e anexa seu CV.
            </p>
          </div>
        )}

        {phase === "generating" && (
          <div className="bg-surface border border-border rounded-lg shadow-flat px-8 py-10 text-center flex flex-col items-center gap-3.5">
            <div className="font-mono text-xs text-pine vp-pulse">
              escrevendo seu e-mail…
            </div>
            <div className="w-full max-w-[340px] flex flex-col gap-[9px]">
              {[70, 92, 84, 60].map((w) => (
                <div
                  key={w}
                  className="h-[9px] bg-subtle rounded"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === "done" && email && (
          <EmailCard
            email={email}
            contactEmail={job?.contact_email ?? ""}
            cv={cv}
            saved={saved}
            onEdit={(next) => setEmail(next)}
            onRegenerate={generate}
            onSaveDraft={() => saveDraft("rascunho")}
            onSend={sendEmail}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex-1 border-none py-[9px] rounded-md text-[13px] cursor-pointer transition-all",
        active
          ? "bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(20,22,26,.06)]"
          : "bg-transparent font-medium text-muted",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function PrintDrop({
  image,
  onPick,
}: {
  image: { name: string } | null;
  onPick: (f: File | undefined) => void;
}) {
  return (
    <label className="h-[300px] border-[1.5px] border-dashed border-border2 rounded-lg flex flex-col items-center justify-center gap-3 bg-bg text-center px-6 cursor-pointer hover:border-pine transition-colors">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <IconImage size={34} />
      <div className="text-sm font-medium">
        {image ? image.name : "Arraste o print da vaga aqui"}
      </div>
      <div className="text-[12.5px] text-muted max-w-[260px] leading-[1.5]">
        A gente lê a imagem e extrai empresa, cargo, stack e o e-mail de contato.
      </div>
    </label>
  );
}

function EmailCard({
  email,
  contactEmail,
  cv,
  saved,
  onEdit,
  onRegenerate,
  onSaveDraft,
  onSend,
}: {
  email: GeneratedEmail;
  contactEmail: string;
  cv: { filename: string; size_bytes: number } | null;
  saved: boolean;
  onEdit: (e: GeneratedEmail) => void;
  onRegenerate: () => void;
  onSaveDraft: () => void;
  onSend: () => void;
}) {
  return (
    <div className="vp-settle bg-surface border border-border rounded-lg shadow-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
          Para
        </span>
        <span className="text-[13px] text-ink">
          {contactEmail || "sem e-mail na vaga"}
        </span>
        <span className="ml-auto font-mono text-[10.5px] text-pine bg-pine-tint px-2 py-[3px] rounded-[5px]">
          {saved ? "salvo" : "pronto"}
        </span>
      </div>

      <div className="px-5 py-2 border-b border-border flex items-center gap-2.5">
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
          Assunto
        </span>
        <input
          value={email.subject}
          onChange={(e) => onEdit({ ...email, subject: e.target.value })}
          className="flex-1 border-none outline-none text-sm font-semibold text-ink py-1.5 bg-transparent"
        />
      </div>

      <textarea
        value={email.body}
        onChange={(e) => onEdit({ ...email, body: e.target.value })}
        className="vp-scroll w-full h-[250px] border-none outline-none px-5 py-[18px] text-[13.5px] leading-[1.7] text-text2 bg-transparent"
      />

      {cv && (
        <div className="px-5 py-3 border-t border-border flex items-center gap-2.5">
          <span className="flex items-center gap-[9px] bg-bg border border-border rounded-[7px] px-[11px] py-2">
            <IconDoc size={16} color="#C77A16" />
            <span className="text-[12.5px] font-medium">{cv.filename}</span>
            <span className="font-mono text-[10.5px] text-faint">
              {Math.round(cv.size_bytes / 1024)} KB
            </span>
          </span>
        </div>
      )}

      <div className="px-5 py-3.5 border-t border-border bg-bg flex items-center gap-2.5">
        <button
          onClick={onRegenerate}
          className="border border-border bg-surface rounded-lg px-3.5 py-[11px] text-[13px] font-medium text-ink cursor-pointer flex items-center gap-[7px] hover:border-border3 transition-colors"
        >
          <IconRefresh size={15} />
          Regerar
        </button>
        <button
          onClick={onSaveDraft}
          className="border border-border bg-surface rounded-lg px-3.5 py-[11px] text-[13px] font-medium text-ink cursor-pointer hover:border-border3 transition-colors"
        >
          Salvar rascunho
        </button>
        <button
          onClick={onSend}
          className="ml-auto bg-pine text-white border-none rounded-lg px-[18px] py-[11px] text-[13.5px] font-semibold cursor-pointer flex items-center gap-2 hover:bg-pine-dark transition-colors"
        >
          <IconSend size={16} />
          Enviar pelo Gmail
        </button>
      </div>
    </div>
  );
}

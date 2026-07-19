"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CvDropzone } from "./cv-dropzone";
import { Analyzing } from "./analyzing";
import { uploadAndParseCv } from "@/lib/cv/upload-and-parse";
import type { OnboardingStepKey } from "@/lib/ai/schemas";

export function OnboardingFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<"drop" | "analyzing">("drop");
  const [done, setDone] = useState<Set<OnboardingStepKey>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setDone(new Set());
    setPhase("analyzing");

    try {
      await uploadAndParseCv(file, (step) =>
        setDone((prev) => new Set(prev).add(step)),
      );
      router.push("/perfil");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "algo deu errado");
      setPhase("drop");
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-[560px] text-center">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted mb-3.5">
          Bem-vindo ao AplicaAI
        </div>

        {phase === "drop" ? (
          <>
            <h1 className="font-display font-extrabold text-[34px] tracking-[-0.01em] m-0 mb-2.5">
              Comece pelo seu CV
            </h1>
            <p className="text-[15px] text-muted leading-[1.55] m-0 mb-7">
              A gente lê seu currículo e monta seu perfil. Depois é só colar vagas.
            </p>
            <CvDropzone onFile={handleFile} error={error} />
          </>
        ) : (
          <Analyzing done={done} />
        )}
      </div>
    </section>
  );
}

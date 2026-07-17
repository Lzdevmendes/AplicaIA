"use client";

import { IconDoc } from "@/components/ui/icons";
import { ONBOARDING_STEPS, type OnboardingStepKey } from "@/lib/ai/schemas";

export function Analyzing({ done }: { done: Set<OnboardingStepKey> }) {
  return (
    <>
      <h1 className="font-display font-extrabold text-[30px] tracking-[-0.01em] m-0 mb-7">
        Analisando seu CV…
      </h1>

      <div className="bg-surface border border-border rounded-[14px] px-8 py-9 shadow-[0_1px_2px_rgba(20,22,26,.04),0_8px_24px_rgba(20,22,26,.05)]">
        <div className="w-14 h-14 rounded-[14px] bg-pine-tint flex items-center justify-center mx-auto mb-[22px]">
          <IconDoc size={24} color="#10855F" className="vp-pulse" />
        </div>

        <ol className="flex flex-col gap-3 max-w-[320px] mx-auto list-none p-0 m-0">
          {ONBOARDING_STEPS.map(({ key, label }) => {
            const isDone = done.has(key);
            return (
              <li key={key} className="flex items-center gap-[11px] text-left">
                <span
                  aria-hidden
                  className={
                    isDone
                      ? "w-4 h-4 rounded-full bg-pine flex-none inline-block shadow-[0_0_0_3px_var(--color-pine-tint)]"
                      : "w-4 h-4 rounded-full border-2 border-border flex-none inline-block vp-pulse"
                  }
                />
                <span
                  className="font-mono text-[12.5px]"
                  style={{ color: isDone ? "#14161A" : "#9a9ea3" }}
                >
                  {label}
                </span>
                <span className="sr-only">
                  {isDone ? "concluído" : "em andamento"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

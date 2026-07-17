"use client";

import { useRef, useState } from "react";
import { IconUpload } from "@/components/ui/icons";

const MAX_BYTES = 10 * 1024 * 1024;

export function CvDropzone({
  onFile,
  error,
}: {
  onFile: (file: File) => void;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function accept(file: File | undefined) {
    setLocalError(null);
    if (!file) return;

    if (file.type !== "application/pdf") {
      setLocalError("Por enquanto só PDF. DOCX chega em breve.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError(
        `O arquivo tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é 10 MB.`,
      );
      return;
    }
    onFile(file);
  }

  const shown = error ?? localError;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />

      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={[
          "w-full bg-surface border-[1.5px] border-dashed rounded-[14px]",
          "px-8 py-[52px] cursor-pointer flex flex-col items-center gap-4",
          "transition-colors",
          dragging ? "border-pine" : "border-border3 hover:border-pine",
        ].join(" ")}
      >
        <div className="w-[60px] h-[60px] rounded-[14px] bg-pine-tint flex items-center justify-center text-pine">
          <IconUpload size={26} />
        </div>
        <div className="font-display font-bold text-lg text-ink">
          Arraste seu CV ou clique para escolher
        </div>
        <div className="font-mono text-[11.5px] text-faint">
          PDF · até 10 MB
        </div>
      </button>

      {shown && (
        <p role="alert" className="text-[13px] text-clay leading-[1.5] mt-4">
          {shown}
        </p>
      )}

      <p className="text-xs text-faint leading-[1.5] mt-[18px]">
        Seus dados são privados. Você pode apagar tudo quando quiser.
      </p>
    </>
  );
}

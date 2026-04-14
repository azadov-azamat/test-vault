"use client";

import { useLang } from "@/i18n/context";
import type { Lang } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const langs: { code: Lang; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
];

export function LangSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div className={cn("inline-flex rounded-md border bg-muted/50 p-0.5", className)}>
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
            lang === l.code
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

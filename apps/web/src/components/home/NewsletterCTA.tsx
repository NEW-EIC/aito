"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@aito/ui";

export function NewsletterCTA() {
  const t = useTranslations("cta");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section className="bg-bg-alt border-b border-rule">
      <div className="container mx-auto px-4 py-20">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <h2 className="heading-2 max-w-md">{t("title")}</h2>
            <p className="mt-4 lead">{t("sub")}</p>
          </div>
          <form
            className="flex flex-col sm:flex-row gap-3 flex-wrap"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholder")}
              required
              disabled={done}
              className="flex-1 min-w-0 h-12 rounded-pill bg-surface border border-border-strong px-5 text-[0.95rem] text-fg placeholder:text-fg-soft focus:outline-none focus:border-fg"
            />
            <Button type="submit" size="lg" disabled={done}>
              {done ? t("done") : t("btn")}
            </Button>
            <p className="basis-full text-[12px] text-fg-soft mt-2">{t("fine")}</p>
          </form>
        </div>
      </div>
    </section>
  );
}

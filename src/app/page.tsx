"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      router.replace(data.user ? "/library" : "/login");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <div className="loading-shell">Joshly sta caricando…</div>;
}

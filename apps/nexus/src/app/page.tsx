import { ShieldCheck } from "lucide-react";

import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">Nexus</p>
              <p className="text-xs text-muted-foreground">
                Ormawa Eksekutif PKU IPB
              </p>
            </div>
          </div>

          <ModeToggle />
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Kabinet Astana Angkasa
          </p>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Sistem Informasi dan Monitoring Internal Organisasi
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            Fondasi awal Nexus telah berhasil dibuat. Dashboard, authentication,
            database, dan modul organisasi akan dibangun secara bertahap.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Theme Primary Berhasil
            </Button>

            <Button variant="outline">
              Dashboard Segera Tersedia
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
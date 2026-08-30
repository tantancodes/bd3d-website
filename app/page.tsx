import ArtifactExperience from "./components/ArtifactExperience";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: annotations, error } = await supabase
    .from("annotations")
    .select("*")
    .order("id");

  if (error) {
    console.error("Error loading annotations:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/40 text-sm font-medium">
              B3D
            </div>

            <div>
              <h1 className="text-sm font-medium tracking-tight">
                The Book of the Dead in 3D
              </h1>

              <p className="text-xs text-muted-foreground">
                Digital research collection
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <button className="transition-colors hover:text-foreground">
              Explore
            </button>

            <button className="transition-colors hover:text-foreground">
              About
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-6 py-10 md:px-10 md:py-14">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Prototype artifact
              </span>

              <span className="text-xs text-muted-foreground">
                Interactive 3D model
              </span>
            </div>

            <h2 className="text-4xl font-medium tracking-[-0.04em] md:text-5xl">
              Dog
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Explore the artifact in three dimensions and select an annotation
              marker to view its associated research information.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {annotations?.length ?? 0} annotations
          </div>
        </div>

        <ArtifactExperience annotations={annotations ?? []} />

        <footer className="mt-6 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Interactive research prototype</p>
          <p>Book of the Dead in 3D</p>
        </footer>
      </section>
    </main>
  );
}
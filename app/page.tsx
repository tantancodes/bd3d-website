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
    <main className="min-h-screen bg-[#f4f1ea] text-[#1f1f1f]">
      <nav className="flex items-center justify-between border-b border-black/10 px-10 py-6">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">
            The Book of the Dead in 3D
          </h1>

          <p className="text-sm text-black/50">
            Digital Coffin Research
          </p>
        </div>

        <div className="flex gap-8 text-sm">
          <span>Explore</span>
          <span>About</span>
        </div>
      </nav>

      <section className="px-10 py-12">
        <div className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-black/45">
            Prototype Artifact
          </p>

          <h2 className="text-5xl font-medium tracking-tight">
            Dog
          </h2>
        </div>

        <ArtifactExperience annotations={annotations ?? []} />
      </section>
    </main>
  );
}
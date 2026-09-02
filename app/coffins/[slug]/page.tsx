type CoffinPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const coffinData = {
  ptahotep: {
    name: "Ptahotep",
    location: "Egypt",
  },

  ankhet: {
    name: "Ankhet",
    location: "Egypt",
  },

  amuniu: {
    name: "Amuniu",
    location: "Egypt",
  },

  hunu: {
    name: "Hunu",
    location: "Egypt",
  },
};

export default async function CoffinPage({
  params,
}: CoffinPageProps) {
  const { slug } = await params;

  const coffin =
    coffinData[slug as keyof typeof coffinData];

  if (!coffin) {
    return (
      <main className="min-h-screen bg-[#f7f6f2] p-10 text-[#171714]">
        <h1 className="text-4xl">
          Coffin not found
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#171714]">
      <div className="mx-auto max-w-[1680px] px-6 py-16 md:px-10 lg:px-14">
        <a
          href="/"
          className="text-[10px] uppercase tracking-[0.2em] text-black/40"
        >
          ← Back to collection
        </a>

        <div className="mt-16">
          <p className="mb-5 text-[10px] uppercase tracking-[0.24em] text-black/35">
            Coffin Record
          </p>

          <h1 className="text-[clamp(4rem,9vw,9rem)] font-normal leading-[0.85] tracking-[-0.065em]">
            {coffin.name}
          </h1>

          <p className="mt-8 text-sm text-black/45">
            {coffin.location}
          </p>
        </div>
      </div>
    </main>
  );
}
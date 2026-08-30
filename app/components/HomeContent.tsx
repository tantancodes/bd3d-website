"use client";

import SarcoAscii from "./SarcoAscii";
import Image from "next/image";
import { motion } from "motion/react";

import ArtifactExperience, {
  type Annotation,
} from "./ArtifactExperience";

type HomeContentProps = {
  annotations: Annotation[];
};

export default function HomeContent({
  annotations,
}: HomeContentProps) {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#171714]">
      <header className="border-b border-black/[0.08] bg-[#f7f6f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between px-6 py-4 md:px-10 lg:px-14">
          <div className="flex items-center gap-3">
            <div className="relative size-12 overflow-hidden rounded-full border border-black/10 bg-white">
              <Image
                src="/images/bd3d-logo.png"
                alt="Book of the Dead in 3D logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            

            <div>
              <p className="text-[13px] font-medium tracking-tight">
                Book of the Dead in 3D
              </p>

              <p className="text-[10px] uppercase tracking-[0.16em] text-black/35">
                Digital Research Project
              </p>

            </div>
          </div>

          <nav className="flex items-center gap-7 text-[13px] text-black/45">
            {["Explore", "Project", "About"].map((item) => (
              <button
                key={item}
                className="relative transition-colors duration-300 hover:text-black
                after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0
                after:bg-black after:transition-all after:duration-300
                hover:after:w-full"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-black/[0.06]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(83,0,77,0.07),transparent_35%)]" />

        <div className="relative mx-auto max-w-[1680px] px-6 py-14 md:px-10 md:py-20 lg:px-14">
          <div className="grid items-end gap-10 md:grid-cols-[1fr_auto]">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-black/35"
              >
                Interactive Cultural Heritage Research
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="motion-preset-slide-up-lg
    motion-duration-700
    max-w-5xl
    text-[clamp(3.7rem,8vw,8rem)]
    font-normal
    leading-[0.85]
    tracking-[-0.065em]"
              >
                Book of the
                <br />
                Dead in 3D
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: "easeOut",
                }}
                className="mt-8 max-w-xl text-[15px] leading-7 text-black/45"
              >
                Explore ancient Egyptian objects through interactive
                three-dimensional models, scholarly annotations, translations,
                and digital research.
              </motion.p>
            </div>

            <div className="hidden w-[400px] md:block lg:w-[500px]">
  <SarcoAscii />
</div>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 pb-10 pt-14 md:px-10 md:pt-20 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-10 md:mb-14"
        >
          <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-black/35">
            Digital Object / Prototype / 001
          </p>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[clamp(4rem,9vw,8rem)] font-normal leading-[0.82] tracking-[-0.065em]">
                Dog
              </h2>

              <p className="mt-7 max-w-lg text-[14px] leading-6 text-black/45">
                Photogrammetric study object with spatially anchored research
                annotations.
              </p>
            </div>

            <div className="flex gap-10 pb-1 text-[10px] uppercase tracking-[0.15em]">
              <div>
                <p className="mb-2 text-black/25">Format</p>
                <p className="text-black/55">3D / GLB</p>
              </div>

              <div>
                <p className="mb-2 text-black/25">Annotations</p>
                <p className="text-black/55">
                  {String(annotations.length).padStart(2, "0")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-black/25">Mode</p>
                <p className="text-black/55">Interactive</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.99 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: 0.8,
            delay: 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ArtifactExperience annotations={annotations} />
        </motion.div>

        <footer className="mt-8 border-t border-black/[0.08] py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative size-8">
                <Image
                  src="/images/bd3d-logo.png"
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>

              <p className="text-[11px] uppercase tracking-[0.14em] text-black/40">
                Book of the Dead in 3D
              </p>
            </div>

            <p className="text-[10px] uppercase tracking-[0.15em] text-black/30">
              Interactive Digital Research
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}
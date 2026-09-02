"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

export default function CoffinIntro() {
  const [open, setOpen] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => {
      setOpen(true);
    }, 900);

    const finishTimer = setTimeout(() => {
      setFinished(true);
    }, 2400);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {!finished && (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-hidden bg-[#211a12]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* WARM BACKGROUND GLOW */}
          <div
            className="
              absolute inset-0
              bg-[radial-gradient(circle_at_center,rgba(196,151,71,0.16),transparent_48%)]
            "
          />

          {/* COFFIN WRAPPER */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            
            {/* CENTER LOGO */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{
                opacity: open ? 0 : 1,
                scale: open ? 1.03 : 1,
              }}
              transition={{
                opacity: { duration: 0.25 },
                scale: { duration: 0.9 },
              }}
              className="pointer-events-none absolute z-30 flex flex-col items-center"
            >
              <div
                className="
                  relative size-24 overflow-hidden rounded-full
                  border border-[#e5c57a]/40
                  bg-[#ead7a3]
                  shadow-[0_0_40px_rgba(215,176,92,0.15)]
                "
              >
                <Image
                  src="/images/bd3d-logo.png"
                  alt="Book of the Dead in 3D"
                  fill
                  sizes="96px"
                  className="object-contain"
                  priority
                />
              </div>

              <p className="mt-6 text-[10px] uppercase tracking-[0.32em] text-[#e8cf91]/65">
                Book of the Dead in 3D
              </p>
            </motion.div>

            {/* COFFIN */}
            <div
              className="
                relative
                h-[78%]
                max-h-[760px]
                min-h-[520px]
                w-[min(78vw,480px)]
              "
            >
              {/* LEFT HALF */}
              <motion.div
                initial={{
                  x: "0%",
                  rotateY: 0,
                }}
                animate={{
                  x: open ? "-115%" : "0%",
                  rotateY: open ? -12 : 0,
                }}
                transition={{
                  duration: 1.35,
                  ease: [0.76, 0, 0.24, 1],
                }}
                className="absolute inset-y-0 left-0 w-1/2 origin-right"
                style={{
                  clipPath:
                    "polygon(30% 0%, 100% 0%, 100% 100%, 20% 100%, 0% 82%, 8% 20%)",
                }}
              >
                {/* WOOD / PAPYRUS BASE */}
                <div className="absolute inset-0 bg-[#b8893f]" />

                {/* GOLDEN INNER TONE */}
                <div className="absolute inset-[3%] bg-[#caa457]/35" />

                {/* DARK OUTER BORDER */}
                <div className="absolute inset-y-[4%] left-[8%] right-[4%] border border-[#5b3b1f]/60" />

                {/* VERTICAL DECORATION */}
                <div className="absolute left-[18%] top-[10%] h-[80%] w-px bg-[#5a391c]/45" />

                {/* HIEROGLYPHIC-STYLE BANDS */}
                <div className="absolute left-[28%] top-[19%] h-px w-[55%] bg-[#5a391c]/45" />
                <div className="absolute left-[28%] top-[34%] h-px w-[55%] bg-[#5a391c]/45" />
                <div className="absolute left-[28%] top-[49%] h-px w-[55%] bg-[#5a391c]/45" />
                <div className="absolute left-[28%] top-[64%] h-px w-[55%] bg-[#5a391c]/45" />
                <div className="absolute left-[28%] top-[79%] h-px w-[55%] bg-[#5a391c]/45" />

                {/* GOLD ACCENTS */}
                <div className="absolute left-[31%] top-[26%] h-[2px] w-[45%] bg-[#e3c16e]/50" />
                <div className="absolute left-[31%] top-[56%] h-[2px] w-[45%] bg-[#e3c16e]/50" />

                {/* CENTER SEAM */}
                <div className="absolute right-0 top-0 h-full w-px bg-[#f0d58f]/40" />
              </motion.div>

              {/* RIGHT HALF */}
              <motion.div
                initial={{
                  x: "0%",
                  rotateY: 0,
                }}
                animate={{
                  x: open ? "115%" : "0%",
                  rotateY: open ? 12 : 0,
                }}
                transition={{
                  duration: 1.35,
                  ease: [0.76, 0, 0.24, 1],
                }}
                className="absolute inset-y-0 right-0 w-1/2 origin-left"
                style={{
                  clipPath:
                    "polygon(0% 0%, 70% 0%, 92% 20%, 100% 82%, 80% 100%, 0% 100%)",
                }}
              >
                {/* WOOD / PAPYRUS BASE */}
                <div className="absolute inset-0 bg-[#b8893f]" />

                {/* GOLDEN INNER TONE */}
                <div className="absolute inset-[3%] bg-[#caa457]/35" />

                {/* DARK OUTER BORDER */}
                <div className="absolute inset-y-[4%] left-[4%] right-[8%] border border-[#5b3b1f]/60" />

                {/* VERTICAL DECORATION */}
                <div className="absolute right-[18%] top-[10%] h-[80%] w-px bg-[#5a391c]/45" />

                {/* HIEROGLYPHIC-STYLE BANDS */}
                <div className="absolute right-[28%] top-[19%] h-px w-[55%] bg-[#5a391c]/45" />
                <div className="absolute right-[28%] top-[34%] h-px w-[55%] bg-[#5a391c]/45" />
                <div className="absolute right-[28%] top-[49%] h-px w-[55%] bg-[#5a391c]/45" />
                <div className="absolute right-[28%] top-[64%] h-px w-[55%] bg-[#5a391c]/45" />
                <div className="absolute right-[28%] top-[79%] h-px w-[55%] bg-[#5a391c]/45" />

                {/* GOLD ACCENTS */}
                <div className="absolute right-[31%] top-[26%] h-[2px] w-[45%] bg-[#e3c16e]/50" />
                <div className="absolute right-[31%] top-[56%] h-[2px] w-[45%] bg-[#e3c16e]/50" />

                {/* CENTER SEAM */}
                <div className="absolute left-0 top-0 h-full w-px bg-[#f0d58f]/40" />
              </motion.div>

              {/* HEAD ORNAMENT */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: open ? 0 : 1,
                }}
                transition={{ duration: 0.35 }}
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-[7%]
                  z-20
                  -translate-x-1/2
                "
              >
                <div
                  className="
                    h-20 w-20 rounded-full
                    border border-[#5b3b1f]/50
                    bg-[#d3ad5e]/25
                    shadow-[inset_0_0_20px_rgba(91,59,31,0.15)]
                  "
                />
              </motion.div>

              {/* CENTER LINE */}
              <motion.div
                animate={{
                  opacity: open ? 0 : 1,
                }}
                transition={{ duration: 0.35 }}
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-[6%]
                  z-40
                  h-[88%]
                  w-px
                  -translate-x-1/2
                  bg-[#f0d58f]/60
                "
              />
            </div>
          </div>

          {/* BOTTOM LABEL */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{
              opacity: open ? 0 : 0.5,
            }}
            transition={{ duration: 0.5 }}
            className="
              absolute
              bottom-8
              left-1/2
              -translate-x-1/2
              whitespace-nowrap
              text-[9px]
              uppercase
              tracking-[0.28em]
              text-[#e4c77e]
            "
          >
            Interactive Digital Research
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
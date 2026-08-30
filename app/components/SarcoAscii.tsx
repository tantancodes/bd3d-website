"use client";

import { AsciiArt } from "@/components/ui/ascii-art";

export default function SarcoAscii() {
  return (
    <AsciiArt
      src="/images/anubis.jpg"
      resolution={80}
      color="#6b214f"
      animationStyle="typewriter"
      animateOnView={false}
      className="mx-auto aspect-square w-full max-w-lg bg-[#f7f6f2]"
    />
  );
}
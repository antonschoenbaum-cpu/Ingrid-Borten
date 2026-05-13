"use client";

import { useEffect, useState } from "react";
import { ArtworkImage } from "@/components/artwork-image";

type Props = {
  images: string[];
};

export function HeroBackground({ images }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const i = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 7000);
    return () => clearInterval(i);
  }, [images.length]);

  return (
    <div className="absolute inset-0" aria-hidden>
      {images.map((src, idx) => (
        <div
          key={`${src}-${idx}`}
          className={[
            "absolute inset-0 transition-opacity duration-[1400ms] ease-in-out",
            idx === active ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <ArtworkImage
            src={src}
            alt=""
            className="h-full w-full object-cover object-center"
            priority={idx === 0}
          />
        </div>
      ))}
    </div>
  );
}

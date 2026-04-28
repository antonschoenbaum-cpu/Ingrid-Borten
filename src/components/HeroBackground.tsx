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
    }, 6000);
    return () => clearInterval(i);
  }, [images.length]);

  return (
    <div className="absolute inset-0">
      {images.map((src, idx) => (
        <div
          key={`${src}-${idx}`}
          className={[
            "absolute inset-0 transition-opacity duration-[2000ms]",
            idx === active ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <ArtworkImage
            src={src}
            alt=""
            className={[
              "h-full w-full object-cover transition-transform duration-[8000ms] ease-linear",
              idx === active ? "scale-105" : "scale-100",
            ].join(" ")}
            priority={idx === 0}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/25" />
    </div>
  );
}


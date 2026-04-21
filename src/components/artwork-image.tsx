type Props = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

/** SVG og uploadede billeder vises pålideligt uden ekstra image-domæne-konfiguration. */
export function ArtworkImage({ src, alt, className, priority }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

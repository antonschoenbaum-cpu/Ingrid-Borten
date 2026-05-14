type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function SitePageHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <header className="mx-auto max-w-7xl px-6 md:px-12 py-24 md:py-32">
      <p className="mb-6 text-xs uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
      <h1 className="mb-8 font-heading text-6xl leading-none text-gray-900 md:text-8xl">{title}</h1>
      <p className="mb-16 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">{subtitle}</p>
      <div className="mb-16 h-px w-16 bg-gray-300" aria-hidden />
    </header>
  );
}

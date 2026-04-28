export type Painting = {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  seoDescription?: string | null;
  createdAt: string;
  /** Om værket er solgt (JSON; ved Supabase-brug: boolean-kolonne `sold`). */
  sold: boolean;
  /** Lagerbeholdning (webshop). */
  stock?: number;
  /** Stripe pris-id (webshop). */
  stripePriceId?: string | null;
};

export type Jewelry = {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  seoDescription?: string | null;
  createdAt: string;
  sold: boolean;
  stock?: number;
  stripePriceId?: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  /** ISO 8601 dato-tid (fx timestamptz i Supabase). */
  start_date: string;
  /** Kun dato YYYY-MM-DD (date i Supabase). */
  end_date: string;
  location: string;
  description: string;
  image?: string | null;
};

export type CvEntry = {
  id: string;
  year: string;
  text: string;
};

export type AboutData = {
  biography: string;
  artistPhoto: string;
  /** Bevares i JSON for bagudkompatibilitet; offentlig «Om» bruger begivenheder til udstillinger. */
  cvEntries: CvEntry[];
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroImage1?: string;
  heroImage2?: string;
  heroImage3?: string;
  heroImage4?: string;
  heroImage5?: string;
};

export type ContactLinks = {
  facebookUrl: string;
  instagramUrl: string;
};

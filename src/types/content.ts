export type Painting = {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  createdAt: string;
  /** Om værket er solgt (JSON; ved Supabase-brug: boolean-kolonne `sold`). */
  sold: boolean;
};

export type Jewelry = {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  createdAt: string;
  sold: boolean;
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
};

export type ContactLinks = {
  facebookUrl: string;
  instagramUrl: string;
};

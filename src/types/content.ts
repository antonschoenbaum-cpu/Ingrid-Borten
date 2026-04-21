export type Painting = {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  createdAt: string;
};

export type Jewelry = {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  createdAt: string;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
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
  cvEntries: CvEntry[];
};

export type ContactLinks = {
  facebookUrl: string;
  instagramUrl: string;
};

export interface Category {
  id: string;

  name: string;

  slug: string;

  description?: string;

  color?: string;

  parentId?: string | null;

  featured: boolean;

  enabled: boolean;

  inShowcase?: boolean;

  active?: boolean;

  showcase?: boolean;

  views?: number;

  articles?: number;

  // ✅ ADD THIS
  children?: {
    id?: string;
    name: string;
    color?: string;
    active?: boolean;
  }[];

  _count?: {
    news: number;
  };
}
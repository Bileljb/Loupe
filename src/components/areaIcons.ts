import { Accessibility, Gauge, MapPin, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/schemas";

/** One icon per check area, used on the landing page, reports and guides. */
export const areaIcons: Record<Category | "local", LucideIcon> = {
  performance: Gauge,
  seo: Search,
  accessibility: Accessibility,
  technical: ShieldCheck,
  local: MapPin,
};

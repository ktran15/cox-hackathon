import {
  Droplet,
  Droplets,
  Heart,
  Leaf,
  type LucideIcon,
  MapPin,
  PackageCheck,
  RefreshCw,
  Recycle,
  Shirt,
  Sprout,
  Tag,
  Trophy,
} from 'lucide-react-native';

import type { BadgeId } from '@/src/domain/constants';
import { color } from '@/src/ui/theme/tokens';

// UI-only badge presentation (Section 7.9). The domain owns id/title/howToEarn
// (constants.ts); this maps each badge to a drawn icon, a sticker color, and a
// friendly one-line description for the detail sheet. No domain import beyond
// the BadgeId type — nothing here changes badge logic.
export interface BadgeMeta {
  Icon: LucideIcon;
  accent: string;
  description: string;
}

export const badgeMeta: Record<BadgeId, BadgeMeta> = {
  first_loop: {
    Icon: RefreshCw,
    accent: color.grass,
    description: 'You closed your first loop — one garment kept in use.',
  },
  closet_5: {
    Icon: Shirt,
    accent: color.blue,
    description: 'Five garments rehomed. Your closet is on a roll.',
  },
  rehomer_10: {
    Icon: PackageCheck,
    accent: color.grape,
    description: 'Ten garments found a new life. Real momentum.',
  },
  champion_25: {
    Icon: Trophy,
    accent: color.sunshine,
    description: 'Twenty-five routed! You are a circular champion.',
  },
  resell_10: {
    Icon: Tag,
    accent: color.grass,
    description: 'Ten items resold so another family could buy them.',
  },
  donate_10: {
    Icon: Heart,
    accent: color.bubblegum,
    description: 'Ten items donated straight to kids who need them.',
  },
  recycle_5: {
    Icon: Recycle,
    accent: color.seafoam,
    description: 'Five worn-out items saved from landfill as new fiber.',
  },
  local_giver: {
    Icon: MapPin,
    accent: color.bubblegum,
    description: 'You gave to a high-reuse local spot near you.',
  },
  water_1k: {
    Icon: Droplet,
    accent: color.blue,
    description: 'You have saved over 1,000 litres of water.',
  },
  water_10k: {
    Icon: Droplets,
    accent: color.blue,
    description: 'Ten thousand litres saved. A true hydro hero.',
  },
  co2_10: {
    Icon: Leaf,
    accent: color.grass,
    description: 'Ten kilograms of CO₂ kept out of the air.',
  },
  co2_50: {
    Icon: Sprout,
    accent: color.grass,
    description: 'Fifty kilograms of CO₂ saved. Climate kid status.',
  },
};

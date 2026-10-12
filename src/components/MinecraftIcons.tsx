import React from 'react';
import { GlassColorType, MinecraftIconType } from '../types/plugin';

const MC_COLOR_MAP: Record<string, string> = {
  '0': '#000000',
  '1': '#0000AA',
  '2': '#00AA00',
  '3': '#00AAAA',
  '4': '#AA0000',
  '5': '#AA00AA',
  '6': '#FFAA00',
  '7': '#AAAAAA',
  '8': '#555555',
  '9': '#5555FF',
  'a': '#55FF55',
  'b': '#55FFFF',
  'c': '#FF5555',
  'd': '#FF55FF',
  'e': '#FFFF55',
  'f': '#FFFFFF',
};

export function renderMinecraftText(raw: string): React.ReactNode {
  if (!raw) return <span className="opacity-0">.</span>;

  const segments: {
    text: string;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  }[] = [];

  let currentColor = '#FFFFFF';
  let bold = false;
  let italic = false;
  let underline = false;
  let buffer = '';

  for (let i = 0; i < raw.length; i++) {
    if ((raw[i] === '&' || raw[i] === '§') && i + 1 < raw.length) {
      const code = raw[i + 1].toLowerCase();
      if (MC_COLOR_MAP[code] || ['l', 'o', 'n', 'r'].includes(code)) {
        if (buffer.length > 0) {
          segments.push({ text: buffer, color: currentColor, bold, italic, underline });
          buffer = '';
        }
        if (MC_COLOR_MAP[code]) {
          currentColor = MC_COLOR_MAP[code];
          bold = false;
          italic = false;
          underline = false;
        } else if (code === 'l') {
          bold = true;
        } else if (code === 'o') {
          italic = true;
        } else if (code === 'n') {
          underline = true;
        } else if (code === 'r') {
          currentColor = '#FFFFFF';
          bold = false;
          italic = false;
          underline = false;
        }
        i++;
        continue;
      }
    }
    buffer += raw[i];
  }

  if (buffer.length > 0) {
    segments.push({ text: buffer, color: currentColor, bold, italic, underline });
  }

  return (
    <span className="inline-flex flex-wrap items-center leading-snug">
      {segments.map((seg, idx) => (
        <span
          key={idx}
          style={{
            color: seg.color,
            fontWeight: seg.bold ? 700 : 500,
            fontStyle: seg.italic ? 'italic' : 'normal',
            textDecoration: seg.underline ? 'underline' : 'none',
            textShadow: '1.5px 1.5px 0px rgba(0, 0, 0, 0.85)',
          }}
          className="whitespace-pre-wrap"
        >
          {seg.text}
        </span>
      ))}
    </span>
  );
}

export function buildProgressBar(current: number, max: number, bars = 12): string {
  const ratio = Math.min(1, Math.max(0, current / Math.max(1, max)));
  const filled = Math.round(ratio * bars);
  const empty = bars - filled;
  return `&a${'■'.repeat(filled)}&8${'■'.repeat(empty)} &7${Math.round(ratio * 100)}%`;
}

export const GLASS_PANE_COLORS: Record<GlassColorType, { fill: string; border: string; highlight: string; name: string; material: string }> = {
  BLACK: { fill: '#18181B', border: '#27272A', highlight: '#3F3F46', name: 'Black Stained Glass Pane', material: 'BLACK_STAINED_GLASS_PANE' },
  GRAY: { fill: '#334155', border: '#475569', highlight: '#64748B', name: 'Gray Stained Glass Pane', material: 'GRAY_STAINED_GLASS_PANE' },
  CYAN: { fill: '#0E7490', border: '#06B6D4', highlight: '#67E8F9', name: 'Cyan Stained Glass Pane', material: 'CYAN_STAINED_GLASS_PANE' },
  EMERALD: { fill: '#047857', border: '#10B981', highlight: '#6EE7B7', name: 'Lime Stained Glass Pane', material: 'LIME_STAINED_GLASS_PANE' },
  PURPLE: { fill: '#581C87', border: '#9333EA', highlight: '#C084FC', name: 'Purple Stained Glass Pane', material: 'PURPLE_STAINED_GLASS_PANE' },
  AMBER: { fill: '#92400E', border: '#F59E0B', highlight: '#FCD34D', name: 'Orange Stained Glass Pane', material: 'ORANGE_STAINED_GLASS_PANE' },
};

export const JOB_ICON_OPTIONS: { value: MinecraftIconType; label: string; material: string }[] = [
  { value: 'DIAMOND_PICKAXE', label: 'Diamond Pickaxe', material: 'DIAMOND_PICKAXE' },
  { value: 'IRON_AXE', label: 'Iron Axe', material: 'IRON_AXE' },
  { value: 'GOLDEN_HOE', label: 'Golden Hoe', material: 'GOLDEN_HOE' },
  { value: 'NETHERITE_SWORD', label: 'Netherite Sword', material: 'NETHERITE_SWORD' },
  { value: 'FISHING_ROD', label: 'Fishing Rod', material: 'FISHING_ROD' },
  { value: 'EMERALD', label: 'Emerald', material: 'EMERALD' },
  { value: 'GOLD_INGOT', label: 'Gold Ingot', material: 'GOLD_INGOT' },
  { value: 'EXPERIENCE_BOTTLE', label: 'Bottle o\' Enchanting', material: 'EXPERIENCE_BOTTLE' },
  { value: 'NETHER_STAR', label: 'Nether Star', material: 'NETHER_STAR' },
  { value: 'ENCHANTED_BOOK', label: 'Enchanted Book', material: 'ENCHANTED_BOOK' },
  { value: 'DIAMOND_ORE', label: 'Diamond Ore', material: 'DIAMOND_ORE' },
  { value: 'ANCIENT_DEBRIS', label: 'Ancient Debris', material: 'ANCIENT_DEBRIS' },
  { value: 'OAK_LOG', label: 'Oak Log', material: 'OAK_LOG' },
  { value: 'WHEAT', label: 'Wheat', material: 'WHEAT' },
  { value: 'ENDER_PEARL', label: 'Ender Pearl', material: 'ENDER_PEARL' },
  { value: 'COD', label: 'Raw Cod', material: 'COD' },
];

export const MinecraftItemIcon: React.FC<{
  icon: MinecraftIconType;
  size?: number;
  enchanted?: boolean;
}> = ({ icon, size = 32, enchanted = false }) => {
  const renderPixelArt = () => {
    switch (icon) {
      case 'DIAMOND_PICKAXE':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            {/* Stick */}
            <rect x="2" y="13" width="2" height="2" fill="#6B4C2B" />
            <rect x="4" y="11" width="2" height="2" fill="#8B6239" />
            <rect x="6" y="9" width="2" height="2" fill="#6B4C2B" />
            <rect x="8" y="7" width="2" height="2" fill="#8B6239" />
            <rect x="10" y="5" width="2" height="2" fill="#6B4C2B" />
            {/* Diamond Head */}
            <rect x="8" y="2" width="5" height="2" fill="#33EBCB" />
            <rect x="9" y="1" width="3" height="1" fill="#A4FDF0" />
            <rect x="12" y="3" width="2" height="5" fill="#20B8A0" />
            <rect x="13" y="4" width="1" height="3" fill="#A4FDF0" />
            <rect x="10" y="3" width="3" height="3" fill="#33EBCB" />
            <rect x="6" y="3" width="2" height="2" fill="#1D8A79" />
            <rect x="11" y="8" width="2" height="2" fill="#1D8A79" />
          </svg>
        );

      case 'IRON_AXE':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            {/* Wooden handle */}
            <rect x="2" y="13" width="2" height="2" fill="#6B4C2B" />
            <rect x="4" y="11" width="2" height="2" fill="#8B6239" />
            <rect x="6" y="9" width="2" height="2" fill="#6B4C2B" />
            <rect x="8" y="7" width="2" height="2" fill="#8B6239" />
            <rect x="10" y="5" width="2" height="2" fill="#6B4C2B" />
            {/* Iron blade */}
            <rect x="7" y="2" width="5" height="3" fill="#E2E8F0" />
            <rect x="6" y="3" width="3" height="4" fill="#CBD5E1" />
            <rect x="8" y="1" width="3" height="1" fill="#FFFFFF" />
            <rect x="11" y="4" width="3" height="3" fill="#94A3B8" />
            <rect x="5" y="5" width="2" height="2" fill="#94A3B8" />
          </svg>
        );

      case 'GOLDEN_HOE':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            {/* Stick */}
            <rect x="2" y="13" width="2" height="2" fill="#6B4C2B" />
            <rect x="4" y="11" width="2" height="2" fill="#8B6239" />
            <rect x="6" y="9" width="2" height="2" fill="#6B4C2B" />
            <rect x="8" y="7" width="2" height="2" fill="#8B6239" />
            <rect x="10" y="5" width="2" height="2" fill="#6B4C2B" />
            {/* Gold Hoe Head */}
            <rect x="8" y="2" width="6" height="2" fill="#FACC15" />
            <rect x="9" y="1" width="4" height="1" fill="#FEF08A" />
            <rect x="6" y="3" width="3" height="2" fill="#EAB308" />
            <rect x="5" y="4" width="2" height="2" fill="#CA8A04" />
            <rect x="12" y="4" width="2" height="2" fill="#CA8A04" />
          </svg>
        );

      case 'NETHERITE_SWORD':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            {/* Pommel & Hilt */}
            <rect x="1" y="13" width="2" height="2" fill="#4A3B3C" />
            <rect x="3" y="11" width="2" height="2" fill="#8B6239" />
            <rect x="3" y="9" width="2" height="2" fill="#F87171" />
            <rect x="5" y="11" width="2" height="2" fill="#F87171" />
            <rect x="4" y="10" width="3" height="3" fill="#644E52" />
            {/* Blade */}
            <rect x="6" y="8" width="3" height="3" fill="#473A3E" />
            <rect x="8" y="6" width="3" height="3" fill="#5A4A4F" />
            <rect x="10" y="4" width="3" height="3" fill="#473A3E" />
            <rect x="12" y="2" width="3" height="3" fill="#736066" />
            <rect x="7" y="7" width="6" height="1" fill="#9D878E" />
          </svg>
        );

      case 'FISHING_ROD':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            {/* Rod */}
            <rect x="2" y="13" width="2" height="2" fill="#6B4C2B" />
            <rect x="4" y="11" width="2" height="2" fill="#8B6239" />
            <rect x="6" y="9" width="2" height="2" fill="#8B6239" />
            <rect x="8" y="7" width="2" height="2" fill="#A07244" />
            <rect x="10" y="5" width="2" height="2" fill="#A07244" />
            <rect x="12" y="3" width="2" height="2" fill="#BA8753" />
            {/* String & Bobber */}
            <rect x="13" y="5" width="1" height="6" fill="#E2E8F0" />
            <rect x="12" y="11" width="3" height="2" fill="#EF4444" />
            <rect x="12" y="13" width="3" height="1" fill="#FFFFFF" />
          </svg>
        );

      case 'EMERALD':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="5" y="2" width="6" height="12" fill="#10B981" />
            <rect x="3" y="4" width="10" height="8" fill="#059669" />
            <rect x="5" y="4" width="6" height="8" fill="#34D399" />
            <rect x="6" y="5" width="2" height="4" fill="#A7F3D0" />
          </svg>
        );

      case 'GOLD_INGOT':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="2" y="6" width="12" height="5" fill="#EAB308" />
            <rect x="3" y="5" width="10" height="3" fill="#FACC15" />
            <rect x="4" y="6" width="6" height="1" fill="#FEF08A" />
            <rect x="3" y="11" width="10" height="1" fill="#A16207" />
          </svg>
        );

      case 'EXPERIENCE_BOTTLE':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="6" y="2" width="4" height="2" fill="#B45309" />
            <rect x="5" y="4" width="6" height="2" fill="#93C5FD" />
            <rect x="4" y="6" width="8" height="7" fill="#60A5FA" />
            <rect x="5" y="7" width="6" height="5" fill="#A3E635" />
            <rect x="6" y="8" width="3" height="3" fill="#FACC15" />
          </svg>
        );

      case 'NETHER_STAR':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="7" y="1" width="2" height="14" fill="#E0F2FE" />
            <rect x="1" y="7" width="14" height="2" fill="#E0F2FE" />
            <rect x="4" y="4" width="8" height="8" fill="#BAE6FD" />
            <rect x="6" y="6" width="4" height="4" fill="#FFFFFF" />
          </svg>
        );

      case 'ENCHANTED_BOOK':
      case 'BOOK':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="3" y="3" width="10" height="10" fill="#92400E" />
            <rect x="4" y="4" width="8" height="8" fill="#FEF3C7" />
            <rect x="3" y="5" width="9" height="7" fill="#B45309" />
            <rect x="5" y="3" width="3" height="10" fill={icon === 'ENCHANTED_BOOK' ? '#C084FC' : '#F59E0B'} />
            <rect x="6" y="2" width="2" height="12" fill={icon === 'ENCHANTED_BOOK' ? '#E879F9' : '#FBBF24'} />
          </svg>
        );

      case 'DIAMOND_ORE':
      case 'GOLD_ORE':
      case 'IRON_ORE':
      case 'COAL_ORE':
      case 'STONE': {
        const fleckColor =
          icon === 'DIAMOND_ORE'
            ? '#33EBCB'
            : icon === 'GOLD_ORE'
            ? '#FACC15'
            : icon === 'IRON_ORE'
            ? '#FDBA74'
            : icon === 'COAL_ORE'
            ? '#1E293B'
            : '#64748B';
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="2" y="2" width="12" height="12" fill="#64748B" />
            <rect x="2" y="2" width="12" height="3" fill="#94A3B8" />
            <rect x="2" y="11" width="12" height="3" fill="#475569" />
            <rect x="4" y="5" width="3" height="2" fill={fleckColor} />
            <rect x="9" y="6" width="3" height="3" fill={fleckColor} />
            <rect x="5" y="9" width="3" height="2" fill={fleckColor} />
          </svg>
        );
      }

      case 'ANCIENT_DEBRIS':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="2" y="2" width="12" height="12" fill="#452724" />
            <rect x="3" y="3" width="10" height="2" fill="#7D524B" />
            <rect x="4" y="6" width="8" height="2" fill="#9A6960" />
            <rect x="3" y="10" width="10" height="2" fill="#633D38" />
          </svg>
        );

      case 'OAK_LOG':
      case 'SPRUCE_LOG':
      case 'DARK_OAK_LOG':
      case 'CRIMSON_STEM': {
        const bark =
          icon === 'CRIMSON_STEM'
            ? '#7F1D1D'
            : icon === 'DARK_OAK_LOG'
            ? '#3E2723'
            : icon === 'SPRUCE_LOG'
            ? '#4E342E'
            : '#6B4C2B';
        const inner = icon === 'CRIMSON_STEM' ? '#EC4899' : '#D6A96E';
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="3" y="2" width="10" height="12" fill={bark} />
            <rect x="4" y="2" width="8" height="3" fill={inner} />
            <rect x="5" y="6" width="2" height="7" fill="#4A3219" />
            <rect x="9" y="5" width="2" height="8" fill="#4A3219" />
          </svg>
        );
      }

      case 'WHEAT':
      case 'SUGAR_CANE':
      case 'CARROT':
      case 'PUMPKIN':
      case 'NETHER_WART': {
        const cropColor =
          icon === 'NETHER_WART'
            ? '#DC2626'
            : icon === 'SUGAR_CANE'
            ? '#4ADE80'
            : icon === 'PUMPKIN'
            ? '#EA580C'
            : icon === 'CARROT'
            ? '#F97316'
            : '#EAB308';
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="4" y="3" width="2" height="10" fill={cropColor} />
            <rect x="7" y="2" width="2" height="11" fill={cropColor} />
            <rect x="10" y="3" width="2" height="10" fill={cropColor} />
            <rect x="3" y="9" width="10" height="2" fill="#B45309" />
          </svg>
        );
      }

      case 'ZOMBIE_HEAD':
      case 'SKELETON_SKULL':
      case 'CREEPER_HEAD':
      case 'ENDER_PEARL':
      case 'BLAZE_ROD': {
        if (icon === 'ENDER_PEARL') {
          return (
            <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
              <rect x="4" y="3" width="8" height="10" fill="#0D9488" />
              <rect x="3" y="4" width="10" height="8" fill="#115E59" />
              <rect x="5" y="5" width="6" height="6" fill="#14B8A6" />
              <rect x="6" y="5" width="2" height="2" fill="#99F6E4" />
            </svg>
          );
        }
        if (icon === 'BLAZE_ROD') {
          return (
            <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
              <rect x="3" y="11" width="3" height="3" fill="#EA580C" />
              <rect x="5" y="9" width="3" height="3" fill="#F59E0B" />
              <rect x="7" y="7" width="3" height="3" fill="#FACC15" />
              <rect x="9" y="5" width="3" height="3" fill="#FEF08A" />
              <rect x="11" y="3" width="2" height="2" fill="#F59E0B" />
            </svg>
          );
        }
        const headColor =
          icon === 'CREEPER_HEAD'
            ? '#22C55E'
            : icon === 'SKELETON_SKULL'
            ? '#E2E8F0'
            : '#4D7C0F';
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="3" y="3" width="10" height="10" fill={headColor} />
            <rect x="4" y="6" width="2" height="2" fill="#18181B" />
            <rect x="10" y="6" width="2" height="2" fill="#18181B" />
            <rect x="6" y="9" width="4" height="2" fill="#18181B" />
          </svg>
        );
      }

      case 'COD':
      case 'SALMON':
      case 'PUFFERFISH':
      case 'NAUTILUS_SHELL': {
        const fishColor =
          icon === 'SALMON'
            ? '#F43F5E'
            : icon === 'PUFFERFISH'
            ? '#FACC15'
            : icon === 'NAUTILUS_SHELL'
            ? '#FDE68A'
            : '#D97706';
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="4" y="5" width="8" height="6" fill={fishColor} />
            <rect x="2" y="6" width="2" height="4" fill={fishColor} />
            <rect x="12" y="4" width="2" height="3" fill={fishColor} />
            <rect x="12" y="9" width="2" height="3" fill={fishColor} />
            <rect x="5" y="7" width="1" height="1" fill="#0F172A" />
          </svg>
        );
      }

      case 'ARROW_BACK':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="5" y="7" width="8" height="2" fill="#F8FAFC" />
            <rect x="3" y="7" width="2" height="2" fill="#F59E0B" />
            <rect x="5" y="5" width="2" height="2" fill="#F59E0B" />
            <rect x="5" y="9" width="2" height="2" fill="#F59E0B" />
          </svg>
        );

      case 'BARRIER':
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated drop-shadow-[1px_2px_0px_rgba(0,0,0,0.75)]">
            <rect x="2" y="2" width="12" height="12" fill="#DC2626" />
            <rect x="4" y="4" width="8" height="8" fill="#18181B" />
            <rect x="5" y="7" width="6" height="2" fill="#DC2626" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 16 16" width={size} height={size} className="pixelated">
            <rect x="3" y="3" width="10" height="10" fill="#38BDF8" />
          </svg>
        );
    }
  };

  return (
    <div className="relative flex items-center justify-center select-none">
      {renderPixelArt()}
      {enchanted && (
        <div
          className="pointer-events-none absolute inset-0 rounded-sm opacity-40 mix-blend-screen"
          style={{
            background: 'linear-gradient(135deg, rgba(192,132,252,0.7) 0%, rgba(56,189,248,0.2) 50%, rgba(232,121,249,0.7) 100%)',
          }}
        />
      )}
    </div>
  );
};

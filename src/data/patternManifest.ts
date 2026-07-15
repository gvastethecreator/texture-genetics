import type { LucideIcon } from "lucide-react";
import { TextureType } from "../core/types/types";
import type { PatternDefinition, ShaderDefinition } from "../core/types/types";
import "../lib/tsl/registerPatterns";
import { TSL_PATTERN_MAP } from "../lib/tsl/tslBuilder";
import type { TslPatternFn } from "../lib/tsl/tslBuilder";
import { SHADER_LABELS, TEXTURE_CATEGORIES } from "./textureData";

interface PatternCategorySource {
  readonly types: readonly TextureType[];
  readonly color: string;
  readonly icon: LucideIcon;
}

export interface PatternCatalogSources {
  readonly types: readonly TextureType[];
  readonly categories: Readonly<Record<string, PatternCategorySource>>;
  readonly labels: Partial<Record<TextureType, ShaderDefinition>>;
  /** Supplied by build/test validation without pulling all GLSL strings into the initial UI chunk. */
  readonly glsl?: Partial<Record<TextureType, PatternDefinition>>;
  readonly tsl: Partial<Record<TextureType, TslPatternFn>>;
}

export interface PatternManifestEntry {
  readonly type: TextureType;
  readonly category: string;
  readonly categoryColor: string;
  readonly categoryIcon: LucideIcon;
  readonly definition: ShaderDefinition;
}

export interface PatternManifestCategory {
  readonly name: string;
  readonly color: string;
  readonly icon: LucideIcon;
  readonly types: readonly TextureType[];
}

/**
 * Builds the catalog from every renderer and UI source of truth. Invalid
 * catalogs fail as one actionable error instead of producing a partially
 * selectable pattern that fails later in the rendering pipeline.
 */
export function buildPatternManifest(
  sources: PatternCatalogSources,
): readonly PatternManifestEntry[] {
  const errors: string[] = [];
  const seenTypes = new Set<TextureType>();
  const allowedTypes = new Set(sources.types);

  for (const type of sources.types) {
    if (seenTypes.has(type)) errors.push(`Duplicate TextureType value: ${type}`);
    seenTypes.add(type);
  }

  for (const [categoryName, category] of Object.entries(sources.categories)) {
    for (const type of category.types) {
      if (!allowedTypes.has(type)) {
        errors.push(`Category "${categoryName}" references unknown pattern: ${type}`);
      }
    }
  }

  const entries = sources.types.flatMap((type): PatternManifestEntry[] => {
    const categories = Object.entries(sources.categories).filter(([, category]) =>
      category.types.includes(type),
    );
    const definition = sources.labels[type];

    if (categories.length === 0) errors.push(`Missing category for pattern: ${type}`);
    if (categories.length > 1) {
      errors.push(
        `Pattern "${type}" belongs to multiple categories: ${categories
          .map(([name]) => name)
          .join(", ")}`,
      );
    }
    if (!definition) errors.push(`Missing UI definition for pattern: ${type}`);
    if (sources.glsl && !sources.glsl[type]) {
      errors.push(`Missing GLSL implementation for pattern: ${type}`);
    }
    if (!sources.tsl[type]) errors.push(`Missing TSL implementation for pattern: ${type}`);

    if (
      categories.length !== 1 ||
      !definition ||
      (sources.glsl && !sources.glsl[type]) ||
      !sources.tsl[type]
    ) {
      return [];
    }

    const [categoryName, category] = categories[0];
    return [
      Object.freeze({
        type,
        category: categoryName,
        categoryColor: category.color,
        categoryIcon: category.icon,
        definition,
      }),
    ];
  });

  if (errors.length > 0) {
    throw new Error(`Invalid pattern catalog:\n- ${errors.join("\n- ")}`);
  }

  return Object.freeze(entries);
}

const catalogSources: PatternCatalogSources = {
  types: Object.values(TextureType),
  categories: TEXTURE_CATEGORIES,
  labels: SHADER_LABELS,
  tsl: TSL_PATTERN_MAP,
};

export const PATTERN_MANIFEST = buildPatternManifest(catalogSources);

export const PATTERN_MANIFEST_BY_TYPE = Object.freeze(
  Object.fromEntries(PATTERN_MANIFEST.map((entry) => [entry.type, entry])) as Record<
    TextureType,
    PatternManifestEntry
  >,
);

export const PATTERN_CATEGORIES: readonly PatternManifestCategory[] = Object.freeze(
  Object.entries(TEXTURE_CATEGORIES).map(([name, category]) =>
    Object.freeze({
      name,
      color: category.color,
      icon: category.icon,
      types: Object.freeze(
        PATTERN_MANIFEST.filter((entry) => entry.category === name).map((entry) => entry.type),
      ),
    }),
  ),
);

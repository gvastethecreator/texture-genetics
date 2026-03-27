
import { TextureType, PatternDefinition } from '../../core/types/types';
import { SHAPES } from './patterns/shapes';
import { NOISE } from './patterns/noise';
import { SDF_PATTERNS } from './patterns/sdf';
import { FIRE_LIGHT } from './patterns/fire';
import { NATURE } from './patterns/nature';
import { ABSTRACT } from './patterns/abstract';
import { GRADIENTS } from './patterns/gradients';

// Re-export for direct access if needed
export { SHAPES, NOISE, SDF_PATTERNS, FIRE_LIGHT, NATURE, ABSTRACT, GRADIENTS };

// Aggregated Map for Shader Construction
export const PATTERN_MAP: Record<TextureType, PatternDefinition> = {
    ...SHAPES,
    ...NOISE,
    ...SDF_PATTERNS,
    ...FIRE_LIGHT,
    ...NATURE,
    ...ABSTRACT,
    ...GRADIENTS
} as Record<TextureType, PatternDefinition>;

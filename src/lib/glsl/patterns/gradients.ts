import gradientRadialGlsl from '../../../data/patterns/glsl/gradients/gradient_radial.glsl?raw';
import gradientStripesGlsl from '../../../data/patterns/glsl/gradients/gradient_stripes.glsl?raw';
import gradientLinearGlsl from '../../../data/patterns/glsl/gradients/gradient_linear.glsl?raw';

import { TextureType, PatternDefinition } from '../../../core/types/types';

export const GRADIENTS: Partial<Record<TextureType, PatternDefinition>> = {
    [TextureType.GRADIENT_RADIAL]: { code: gradientRadialGlsl  },
    
    [TextureType.GRADIENT_STRIPES]: { code: gradientStripesGlsl  },
    
    [TextureType.GRADIENT_LINEAR]: { code: gradientLinearGlsl  },
};

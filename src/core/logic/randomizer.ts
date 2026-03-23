
import * as THREE from 'three';
import { AppState, TextureType, PaletteColor, ShaderParams } from '../types/types';
import { DEFAULTS } from '../constants';

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomBool = (chance = 0.5) => Math.random() < chance;
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- COLOR THEORY LOGIC ---

type ColorStrategy = 'analogous' | 'complementary' | 'triadic' | 'monochromatic' | 'random';

const strategies: ColorStrategy[] = ['analogous', 'analogous', 'complementary', 'triadic', 'monochromatic', 'random'];

export const generateHarmoniousPalette = (): PaletteColor[] => {
    // 1. Pick Base Color (HSL)
    const hue = Math.random();
    const sat = randomRange(0.5, 1.0); // Vibrant by default
    const light = randomRange(0.2, 0.8);
    
    // 2. Select Strategy
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    const colors: string[] = [];
    
    const baseColor = new THREE.Color().setHSL(hue, sat, light);
    colors.push('#' + baseColor.getHexString());

    if (strategy === 'monochromatic') {
        // Vary lightness/saturation, keep hue
        const count = randomInt(2, 4);
        for(let i=0; i<count; i++) {
            const c = new THREE.Color().setHSL(hue, randomRange(0.2, 1.0), randomRange(0.1, 0.9));
            colors.push('#' + c.getHexString());
        }
    } 
    else if (strategy === 'analogous') {
        // Hue shift +/- 30 degrees (0.08 in 0-1 space)
        const count = randomInt(2, 4);
        for(let i=0; i<count; i++) {
            const shift = (Math.random() - 0.5) * 0.16;
            const c = new THREE.Color().setHSL((hue + shift + 1.0) % 1.0, sat, randomRange(0.3, 0.7));
            colors.push('#' + c.getHexString());
        }
    }
    else if (strategy === 'complementary') {
        // Base + Opposite
        const comp = new THREE.Color().setHSL((hue + 0.5) % 1.0, sat, randomRange(0.3, 0.7));
        colors.push('#' + comp.getHexString());
        // Maybe an accent?
        if(randomBool(0.5)) {
             const accent = new THREE.Color().setHSL(hue, 0.2, 0.95); // White-ish
             colors.push('#' + accent.getHexString());
        }
    }
    else if (strategy === 'triadic') {
        // 120 degree separation
        const c2 = new THREE.Color().setHSL((hue + 0.33) % 1.0, sat, light);
        const c3 = new THREE.Color().setHSL((hue + 0.66) % 1.0, sat, light);
        colors.push('#' + c2.getHexString());
        colors.push('#' + c3.getHexString());
    }
    else {
        // Pure Random
        const count = randomInt(2, 5);
        for(let i=0; i<count; i++) {
            const c = new THREE.Color().setHex(Math.random() * 0xffffff);
            colors.push('#' + c.getHexString());
        }
    }

    // Always include a dark/black background option for depth?
    if (randomBool(0.3)) colors.unshift('#000000');

    // Fill the 8 slots
    const palette: PaletteColor[] = [];
    for (let i = 0; i < 8; i++) {
        if (i < colors.length) {
            palette.push({ color: colors[i], enabled: true });
        } else {
            // Filler (Disabled)
            palette.push({ color: '#888888', enabled: false });
        }
    }
    return palette;
};

// Param Generation: Center-weighted distribution for elegance
const elegantParam = () => {
    const r = Math.random();
    // Simple easing to favor middle values (0.2 - 0.8)
    return (r * r * (3 - 2 * r)) * 0.8 + 0.1;
};

export const generateRandomParams = (): Partial<ShaderParams> => {
    return {
        scale: randomRange(1.0, 4.0),
        intensity: randomRange(0.8, 1.4),
        speed: randomRange(0.1, 0.5),
        factor: elegantParam(),
        distortion: randomBool(0.3) ? randomRange(0.1, 0.4) : 0,
        detail: randomRange(0.2, 0.7),
        seed: Math.floor(Math.random() * 100),
        p1: Math.random(), 
        p2: Math.random(), 
        p3: Math.random(),
        p4: Math.random(),
        p5: Math.random(),
        p6: Math.random(),
        p7: Math.random() * 0.6,
        p8: Math.random(),
        p9: Math.random(),
        p10: Math.random(),
        p11: Math.random(),
        p12: Math.random(),
        p13: Math.random(),
        p14: Math.random(),
        p15: Math.random()
    };
};

export const generateSmartRandomState = (current: AppState): AppState => {
    const categories = Object.values(TextureType);
    const textureType = categories[Math.floor(Math.random() * categories.length)];
    const blendType = categories[Math.floor(Math.random() * categories.length)];
    
    const palette = generateHarmoniousPalette();
    const c1 = palette[0].color;
    const c2 = palette[1] ? palette[1].color : '#000000';

    const useBlend = randomBool(0.3);
    const useGlitch = randomBool(0.1);
    const usePixel = randomBool(0.1);
    const useSymmetry = randomBool(0.15);
    const useHolo = randomBool(0.1);

    return {
        ...current,
        textureType,
        params: {
            ...current.params,
            ...generateRandomParams(),
            color1: c1,
            color2: c2,
            palette: palette,
        },
        blending: { 
            ...DEFAULTS.BLENDING, 
            enabled: useBlend,
            type: blendType,
            mode: randomInt(1, 6),
            opacity: randomRange(0.3, 0.7),
            scale: randomRange(0.5, 3.0)
        },
        symmetry: {
            ...DEFAULTS.SYMMETRY,
            enabled: useSymmetry,
            segments: randomInt(3, 8),
            rotation: randomRange(0, 360)
        },
        postProcess: {
            ...DEFAULTS.POST_PROCESS,
            bloom: randomBool(0.4),
            bloomStrength: randomRange(0.5, 1.0),
            glitch: useGlitch,
            glitchStrength: randomRange(0.2, 0.8),
            pixelate: usePixel,
            pixelDensity: randomInt(32, 128)
        },
        environment: {
            ...current.environment,
            holographic: useHolo,
            holoStrength: randomRange(0.5, 1.2),
            envType: randomInt(0, 3)
        }
    };
};

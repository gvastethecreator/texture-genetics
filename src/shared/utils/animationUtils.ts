
import { AnimationConfig, WaveType } from '../../core/types/types';

export const calculateAnimatedValue = (time: number, config: AnimationConfig): number => {
    const t = time * config.speed;
    let val = 0;
    
    switch(config.type) {
        case WaveType.SINE:
            val = Math.sin(t) * 0.5 + 0.5;
            break;
        case WaveType.COSINE:
            val = Math.cos(t) * 0.5 + 0.5;
            break;
        case WaveType.TRIANGLE:
            val = Math.abs((t % 2.0) - 1.0);
            break;
        case WaveType.SAWTOOTH:
            val = t % 1.0;
            break;
        case WaveType.NOISE:
            // Simple pseudo random approximation
            val = (Math.sin(t) * 43758.5453) % 1.0; 
            val = Math.abs(val);
            break;
        default:
            val = 0;
    }
    
    return config.min + val * (config.max - config.min);
};

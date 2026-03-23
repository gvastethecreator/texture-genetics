
import * as THREE from 'three';
import { GeometryType, GeometryConfig } from '../../core/types/types';

// GLOBAL GEOMETRY CACHE (Singleton Pattern)
// Prevents regenerating expensive geometries (like ExtrudeGeometry) on every render cycle.
const geometryCache = new Map<string, THREE.BufferGeometry>();

const createCardGeometry = (config?: GeometryConfig): THREE.BufferGeometry => {
    const width = 1.3;
    const height = 1.8;
    const radius = config?.rounding !== undefined ? config.rounding * 0.5 : 0.08;
    const shape = new THREE.Shape();
    
    const x = -width / 2;
    const y = -height / 2;
    
    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    const extrudeSettings = {
        steps: 1,
        depth: 0.02,
        bevelEnabled: config?.bevelEnabled ?? true,
        bevelThickness: config?.bevelThickness ?? 0.02,
        bevelSize: config?.bevelSize ?? 0.02,
        bevelSegments: config?.bevelSegments ?? 4
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const posAttribute = geometry.attributes.position;
    const posArray = posAttribute.array;
    const uvAttribute = geometry.attributes.uv;
    const count = posAttribute.count;

    // Custom UV mapping for the card shape
    for (let i = 0; i < count; i++) {
        // Direct array access prevents errors
        const x = posArray[i * 3];
        const y = posArray[i * 3 + 1];
        const z = posArray[i * 3 + 2];

        if (Math.abs(z) > 0.01) {
             const u = (x / width) + 0.5;
             const v = (y / height) + 0.5;
             // Manual assignment avoids setXY method call
             uvAttribute.array[i * 2] = u;
             uvAttribute.array[i * 2 + 1] = v;
        } else {
            const angle = Math.atan2(y, x);
            const u = (angle / (Math.PI * 2)) + 0.5;
            const v = z * 10.0;
            // Manual assignment avoids setXY method call
            uvAttribute.array[i * 2] = u;
            uvAttribute.array[i * 2 + 1] = v;
        }
    }
    
    uvAttribute.needsUpdate = true; // Important when modifying array directly
    
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere(); 
    return geometry;
};

const createRoundedBoxGeometry = (width: number, height: number, depth: number, config: GeometryConfig): THREE.BufferGeometry => {
    const radius = config.rounding * Math.min(width, height, depth) * 0.5;
    const smoothness = Math.max(1, Math.floor(config.smoothness / 8));
    
    if (radius === 0) {
        return new THREE.BoxGeometry(width, height, depth, smoothness, smoothness, smoothness);
    }
    
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    
    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);

    const extrudeSettings = {
        depth: depth,
        bevelEnabled: config.bevelEnabled,
        bevelSegments: config.bevelSegments,
        steps: 1,
        bevelSize: config.bevelSize,
        bevelThickness: config.bevelThickness,
        curveSegments: smoothness
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    
    // Fix UVs for ExtrudeGeometry to match BoxGeometry
    const posAttribute = geometry.attributes.position;
    const uvAttribute = geometry.attributes.uv;
    
    for (let i = 0; i < posAttribute.count; i++) {
        const px = posAttribute.getX(i);
        const py = posAttribute.getY(i);
        const pz = posAttribute.getZ(i);
        
        if (Math.abs(pz) > depth / 2 - 0.01) {
            uvAttribute.setXY(i, (px / width) + 0.5, (py / height) + 0.5);
        } else {
            const angle = Math.atan2(py, px);
            uvAttribute.setXY(i, (angle / (Math.PI * 2)) + 0.5, pz / depth + 0.5);
        }
    }
    
    return geometry;
};

export const getGeometryForType = (type: GeometryType, config?: GeometryConfig): THREE.BufferGeometry => {
    const cacheKey = config ? `${type}-${JSON.stringify(config)}` : type;
    
    // Check Cache First
    if (geometryCache.has(cacheKey)) {
        return geometryCache.get(cacheKey)!;
    }

    let geo: THREE.BufferGeometry;
    const smoothness = config?.smoothness ?? 64;
    
    switch (type) {
        case GeometryType.CUBE: 
            if (config && (config.rounding > 0 || config.bevelEnabled)) {
                geo = createRoundedBoxGeometry(1.5, 1.5, 1.5, config);
            } else {
                geo = new THREE.BoxGeometry(1.5, 1.5, 1.5, Math.max(1, Math.floor(smoothness/16)), Math.max(1, Math.floor(smoothness/16)), Math.max(1, Math.floor(smoothness/16)));
            }
            break;
        case GeometryType.SPHERE: 
            geo = new THREE.SphereGeometry(1, smoothness, smoothness);
            break;
        case GeometryType.CYLINDER: 
            geo = new THREE.CylinderGeometry(0.8, 0.8, 2, smoothness, 1, false, 0, Math.PI * 2);
            break;
        case GeometryType.CARD: 
            geo = createCardGeometry(config);
            break;
        case GeometryType.PLANE: 
        default: 
            geo = new THREE.PlaneGeometry(2, 2, Math.max(1, Math.floor(smoothness/8)), Math.max(1, Math.floor(smoothness/8)));
            break;
    }
    
    // Optimization for InstancedMesh Culling
    geo.computeBoundingSphere();
    
    // Cache it 
    geometryCache.set(cacheKey, geo);
    
    return geo;
};

// Utility to clear cache if needed (e.g. low memory mode)
export const clearGeometryCache = () => {
    geometryCache.forEach(geo => geo.dispose());
    geometryCache.clear();
};

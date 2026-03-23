import { AppState } from '../../../core/types/types';
import { getFragmentShaderForParams, VERTEX_SHADER } from '../../../lib/glsl/shaderBuilder';
import { createUniformsFromState } from '../../../lib/three/uniforms';

export const generateHtml = async (state: AppState, onProgress: (p: number) => void): Promise<Blob> => {
    onProgress(10);
    
    const fragShader = getFragmentShaderForParams(state);
    const uniforms = createUniformsFromState(state, null, null, null);
    
    // Extract uniforms for the template
    const uniformDefs = Object.entries(uniforms).map(([key, value]) => {
        let valStr = '';
        const v = value.value as any;
        if (typeof v === 'number') valStr = v.toString();
        else if (v && v.isColor) valStr = `new THREE.Color(${v.getHex()})`;
        else if (v && v.isVector2) valStr = `new THREE.Vector2(${v.x}, ${v.y})`;
        else if (v && v.isVector3) valStr = `new THREE.Vector3(${v.x}, ${v.y}, ${v.z})`;
        else valStr = 'null';
        
        return `${key}: { value: ${valStr} }`;
    }).join(',\n        ');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shader Export</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: #000; }
        canvas { display: block; width: 100vw; height: 100vh; }
    </style>
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
            }
        }
    </script>
</head>
<body>
    <script type="module">
        import * as THREE from 'three';

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        const uniforms = {
            ${uniformDefs},
            u_time: { value: 0 },
            u_resolution: { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader: \`${VERTEX_SHADER}\`,
            fragmentShader: \`${fragShader.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
            uniforms: uniforms,
            transparent: true,
            side: THREE.DoubleSide,
            glslVersion: THREE.GLSL3
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            uniforms.u_resolution.value.set(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
        });

        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            uniforms.u_time.value = clock.getElapsedTime();
            renderer.render(scene, camera);
        }
        animate();
    </script>
</body>
</html>`;

    onProgress(100);
    return new Blob([htmlContent], { type: 'text/html' });
};

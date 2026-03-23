
import React, { useRef, useMemo, useEffect, useState, useLayoutEffect, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { AppState, GeometryType, PreviewAnimation, AnimationConfig } from '../../../core/types/types';
import { getFragmentShaderForParams, VERTEX_SHADER } from '../../../lib/glsl/shaderBuilder';
import { createUniformsFromState, updateUniformsFromState } from '../../../lib/three/uniforms';
import { getGeometryForType } from '../../../lib/three/geometryFactory';
import { calculateAnimatedValue } from '../../../shared/utils/animationUtils';
import { useTextureResource } from '../../../shared/hooks/useTextureResource';

interface MainMeshProps {
    appState: AppState;
    stateRef: React.MutableRefObject<AppState>;
    onLoadingChange?: (loading: boolean) => void;
}

export const MainMesh: React.FC<MainMeshProps> = memo(({ appState, stateRef, onLoadingChange }) => {
    const { size } = useThree();
    const meshRef = useRef<THREE.Mesh>(null);
    const instanceRef = useRef<THREE.InstancedMesh>(null);
    const tempObject = useMemo(() => new THREE.Object3D(), []);

    // Resources
    const maskTex = useTextureResource(appState.imageAlpha.maskEnabled ? appState.imageAlpha.maskTexture : null);
    const baseTex = useTextureResource(appState.baseTexture?.enabled ? appState.baseTexture.texture : null);
    const stickerTex = useTextureResource(appState.sticker?.enabled ? appState.sticker.texture : null);

    const [customGeometry, setCustomGeometry] = useState<THREE.BufferGeometry | null>(null);
    const lastLoadedModelUrl = useRef<string | null>(null);
    const lastSvgParams = useRef<string | null>(null);
    const lastTextParams = useRef<string | null>(null);

    // Explicit Geometry Disposal
    useEffect(() => {
        return () => {
            if (customGeometry) customGeometry.dispose();
        };
    }, [customGeometry]);

    // Geometry Logic
    const geometry = useMemo(() => {
        if ((appState.geometry === GeometryType.CUSTOM || appState.geometry === GeometryType.SVG || appState.geometry === GeometryType.TEXT) && customGeometry) {
            return customGeometry;
        }
        return getGeometryForType(appState.geometry, appState.geometryConfig);
    }, [appState.geometry, appState.geometryConfig, customGeometry]);

    // Model Loading Logic
    useEffect(() => {
        let active = true;

        const clearCustomGeom = () => {
            setCustomGeometry(prev => {
                if (prev) prev.dispose();
                return null;
            });
        };

        if (appState.geometry === GeometryType.CUSTOM && appState.customModel) {
            if (appState.customModel === lastLoadedModelUrl.current) return;
            if (onLoadingChange) onLoadingChange(true);
            lastLoadedModelUrl.current = appState.customModel;

            const loadModel = async () => {
                try {
                    const url = appState.customModel!;
                    let loadedGeom: THREE.BufferGeometry | null = null;

                    const onLoad = (object: THREE.Object3D) => {
                        object.traverse((child) => {
                            if ((child as THREE.Mesh).isMesh && !loadedGeom) {
                                loadedGeom = (child as THREE.Mesh).geometry.clone();
                            }
                        });
                    };

                    if (url.includes('obj') || url.startsWith('blob:')) {
                        const objLoader = new OBJLoader();
                        try {
                            const object = await objLoader.loadAsync(url);
                            onLoad(object);
                        } catch (e) {
                            const gltfLoader = new GLTFLoader();
                            const gltf = await gltfLoader.loadAsync(url);
                            onLoad(gltf.scene);
                        }
                    }

                    if (active && loadedGeom) {
                        const geom = loadedGeom as THREE.BufferGeometry;
                        geom.center();
                        geom.computeVertexNormals();
                        clearCustomGeom();
                        setCustomGeometry(geom);
                    }
                } catch (e) {
                    console.error("Failed to load model", e);
                } finally {
                    if (active && onLoadingChange) onLoadingChange(false);
                }
            };
            loadModel();
        } else if (appState.geometry === GeometryType.SVG) {
            const svgKey = JSON.stringify(appState.svg);
            if (svgKey === lastSvgParams.current) return;
            lastSvgParams.current = svgKey;

            if (onLoadingChange) onLoadingChange(true);

            const loadSvg = async () => {
                try {
                    // For presets, we can generate a simple SVG string or load from URL
                    let svgData = appState.svg.url;

                    if (!svgData) {
                        // Generate preset SVG
                        if (appState.svg.preset === 'star') {
                            svgData = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                        } else if (appState.svg.preset === 'heart') {
                            svgData = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                        } else {
                            svgData = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
                        }
                    }

                    const loader = new SVGLoader();
                    const svgResult = await loader.loadAsync(svgData);

                    const paths = svgResult.paths;
                    const shapes: THREE.Shape[] = [];

                    for (let i = 0; i < paths.length; i++) {
                        const path = paths[i];
                        const pathShapes = SVGLoader.createShapes(path);
                        shapes.push(...pathShapes);
                    }

                    if (shapes.length > 0) {
                        const extrudeSettings = {
                            depth: appState.svg.extrude,
                            bevelEnabled: false,
                        };

                        const geom = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
                        geom.center();

                        // Fix SVG being upside down
                        geom.rotateX(Math.PI);

                        const scale = appState.svg.scale * 0.1; // SVGs are usually large
                        geom.scale(scale, scale, scale);

                        geom.computeVertexNormals();
                        clearCustomGeom();
                        setCustomGeometry(geom);
                    }
                } catch (e) {
                    console.error("Failed to load SVG", e);
                } finally {
                    if (active && onLoadingChange) onLoadingChange(false);
                }
            };
            loadSvg();
        } else if (appState.geometry === GeometryType.TEXT) {
            const textKey = JSON.stringify(appState.text);
            if (textKey === lastTextParams.current) return;
            lastTextParams.current = textKey;

            if (onLoadingChange) onLoadingChange(true);

            const loadText = async () => {
                try {
                    const loader = new FontLoader();
                    const fontUrl = `https://unpkg.com/three@0.160.0/examples/fonts/${appState.text.font}_regular.typeface.json`;
                    const font = await loader.loadAsync(fontUrl);

                    const geom = new TextGeometry(appState.text.text || ' ', {
                        font: font,
                        size: appState.text.size,
                        depth: appState.text.extrude,
                        curveSegments: appState.text.curveSegments,
                        bevelEnabled: appState.text.bevelEnabled,
                        bevelThickness: appState.text.bevelThickness,
                        bevelSize: appState.text.bevelSize,
                        bevelOffset: 0,
                        bevelSegments: 3
                    });

                    geom.center();
                    geom.computeVertexNormals();
                    clearCustomGeom();
                    setCustomGeometry(geom);
                } catch (e) {
                    console.error("Failed to load Text", e);
                } finally {
                    if (active && onLoadingChange) onLoadingChange(false);
                }
            };
            loadText();
        } else {
            // Only clear custom geometry if we switch AWAY from CUSTOM/SVG/TEXT mode
            if (appState.geometry !== GeometryType.CUSTOM as any && appState.geometry !== GeometryType.SVG as any && appState.geometry !== GeometryType.TEXT as any) {
                clearCustomGeom();
                lastLoadedModelUrl.current = null;
                lastSvgParams.current = null;
                lastTextParams.current = null;
            }
        }

        return () => { active = false; if (onLoadingChange) onLoadingChange(false); };
    }, [appState.geometry, appState.customModel, appState.svg, appState.text, onLoadingChange]);

    // Material Logic
    const material = useMemo(() => {
        try {
            const uniforms = createUniformsFromState(appState, maskTex, baseTex, stickerTex);
            const frag = getFragmentShaderForParams(appState);

            const needsTransparency = appState.imageAlpha.enabled;

            const mat = new THREE.ShaderMaterial({
                vertexShader: VERTEX_SHADER,
                fragmentShader: frag,
                uniforms: uniforms,
                transparent: needsTransparency,
                side: THREE.DoubleSide,
                depthWrite: !needsTransparency,
                depthTest: true,
                glslVersion: THREE.GLSL3, // WEBGL 2 STRICT
            });

            return mat;
        } catch (e) {
            console.error("Shader Error", e);
            return new THREE.MeshBasicMaterial({ color: 0xff00ff });
        }
    }, [
        appState.textureType,
        appState.blending.enabled, appState.blending.type,
        appState.postProcess.bloom,
        appState.normalMap.enabled,
        appState.ao.enabled,
        appState.environment.holographic,
        appState.sticker.enabled,
        appState.sticker.texture,
        appState.viewMode,
        appState.imageAlpha.enabled,
        maskTex, baseTex, stickerTex
    ]);

    // Cleanup Material on Unmount/Change
    useEffect(() => {
        return () => {
            if (material) material.dispose();
        };
    }, [material]);

    // --- EVENT DRIVEN UPDATES ---
    // Only update expensive uniforms when React State changes (User Input)
    // This avoids parsing state and colors 60 times a second.
    useEffect(() => {
        if (material instanceof THREE.ShaderMaterial) {
            updateUniformsFromState(material.uniforms, appState, maskTex, baseTex, stickerTex);
        }
    }, [appState, maskTex, baseTex, stickerTex, material]);

    // --- RENDER LOOP ---
    // Only update smooth animations and time
    useFrame((state) => {
        try {
            const loopState = stateRef.current;
            if (!(material instanceof THREE.ShaderMaterial)) return;
            if (!material.uniforms) return;

            // Time & Resolution (Always Dynamic)
            if (loopState.animate) {
                material.uniforms.u_time.value = state.clock.elapsedTime * loopState.params.speed;
            } else {
                material.uniforms.u_time.value = loopState.time;
            }

            // Resolution (Canvas Resize)
            const dpr = state.gl.getPixelRatio();
            if (material.uniforms.u_resolution) {
                material.uniforms.u_resolution.value.set(size.width * dpr, size.height * dpr);
            }

            // Mouse (Smooth Interaction)
            if (material.uniforms.u_mouse) {
                material.uniforms.u_mouse.value.set(state.pointer.x * 0.5 + 0.5, state.pointer.y * 0.5 + 0.5);
            }

            // Parameter Animations (Waveforms)
            if (loopState.animate && loopState.paramAnimations) {
                const keyMap: Record<string, { u: string, scale?: number }> = {
                    'scale': { u: 'u_scale' }, 'intensity': { u: 'u_intensity' },
                    'factor': { u: 'u_factor' }, 'speed': { u: 'u_speed' },
                    'distortion': { u: 'u_distortion' }, 'detail': { u: 'u_detail' },
                    'p1': { u: 'u_p1' }, 'p2': { u: 'u_p2' }, 'p3': { u: 'u_p3' },
                    'transform.angle': { u: 'u_angle', scale: Math.PI / 180 },
                };

                Object.entries(loopState.paramAnimations).forEach(([key, value]) => {
                    const config = value as AnimationConfig;
                    if (config && config.enabled) {
                        const map = keyMap[key];
                        if (map && material.uniforms[map.u]) {
                            let val = calculateAnimatedValue(state.clock.elapsedTime, config);
                            if (map.scale) val *= map.scale;
                            material.uniforms[map.u].value = val;
                        }
                    }
                });
            }

            // Preview Rotation - NOW ENABLED FOR ALL GEOMETRIES
            const targetRef = instanceRef.current || meshRef.current;
            if (targetRef) {
                const anim = loopState.environment.animation;
                const speed = loopState.environment.animationSpeed;
                const t = state.clock.elapsedTime;

                targetRef.rotation.set(0, 0, 0);
                targetRef.position.set(0, 0, 0);

                if (anim === PreviewAnimation.TURNTABLE) targetRef.rotation.y = t * speed * 0.5;
                else if (anim === PreviewAnimation.TUMBLE) {
                    targetRef.rotation.x = t * speed * 0.3;
                    targetRef.rotation.y = t * speed * 0.5;
                }
                else if (anim === PreviewAnimation.HOVER) {
                    targetRef.rotation.y = t * speed * 0.1;
                    targetRef.position.y = Math.sin(t * speed * 2.0) * 0.1;
                }
                else if (anim === PreviewAnimation.HEARTBEAT) {
                    const s = 1.0 + Math.sin(t * speed * 5.0) * 0.05;
                    targetRef.scale.set(s, s, s);
                }
                else if (anim === PreviewAnimation.SHAKE) {
                    targetRef.position.x = Math.sin(t * speed * 20.0) * 0.02;
                    targetRef.rotation.z = Math.cos(t * speed * 15.0) * 0.02;
                }
            }
        } catch (e) {
            // Silently fail frame update rather than crashing thread
        }
    });

    const isTiling = (appState.tileMode || appState.tilingPreview) && appState.geometry === GeometryType.PLANE;

    // Tiling Layout Logic
    useLayoutEffect(() => {
        if (!instanceRef.current || !isTiling) return;

        let i = 0;
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                tempObject.position.set(x * 2.0, y * 2.0, 0);
                const sx = (appState.tiling.mirror && Math.abs(x) % 2 === 1) ? -1 : 1;
                const sy = (appState.tiling.mirror && Math.abs(y) % 2 === 1) ? -1 : 1;
                tempObject.scale.set(sx, sy, 1);
                tempObject.rotation.set(0, 0, 0);
                tempObject.updateMatrix();
                instanceRef.current.setMatrixAt(i, tempObject.matrix);
                i++;
            }
        }
        instanceRef.current.instanceMatrix.needsUpdate = true;
    }, [isTiling, appState.tiling.mirror, tempObject]);

    const meshKey = isTiling ? 'instanced' : `single-${appState.geometry}`;

    if (isTiling) {
        return (
            <instancedMesh
                key={meshKey}
                ref={instanceRef}
                args={[geometry, material, 9]}
                frustumCulled={false}
                castShadow
                receiveShadow
            />
        );
    }

    return (
        <mesh
            key={meshKey}
            ref={meshRef}
            geometry={geometry}
            material={material}
            frustumCulled={false}
            castShadow
            receiveShadow
        />
    );
});

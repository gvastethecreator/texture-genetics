
import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Hud, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { AppState, GeometryType, ViewMode } from '../../core/types/types';
import { 
    ZoomIn, ZoomOut, Maximize, 
    Square, Box, Circle, Cylinder, Smartphone, Upload, 
    Palette, Activity, AlignVerticalJustifyCenter, Sparkles, Loader2,
    Grid, Type, PenTool // NEW
} from 'lucide-react';
import { useContainerDimensions } from '../../shared/hooks/useContainerDimensions';

// Modular Components
import { SceneLighting } from './components/SceneLighting';
import { CameraRig, CameraHandler } from './components/CameraRig';
import { MainMesh } from './components/MainMesh';
import { MiniatureScene } from './components/MiniatureScene';
import { StickerGizmo } from './components/StickerGizmo';
import { StageFloor } from './components/StageFloor';
import { ParticleSystem } from './components/ParticleSystem';
import { SmokeSystem } from './components/SmokeSystem';
import { SceneEffects } from './components/SceneEffects';

// --- SCENE COMPOSITION ---
interface SceneCompositionProps {
    appState: AppState;
    stateRef: React.MutableRefObject<AppState>;
    controlsHandle: React.MutableRefObject<CameraHandler | null>;
    updateState: (s: Partial<AppState>) => void;
    onLoadingChange: (loading: boolean) => void;
    onZoomChange: (zoom: number) => void;
    orbitEnabled: boolean;
    setOrbitEnabled: (enabled: boolean) => void;
}

const SceneComposition: React.FC<SceneCompositionProps> = ({ 
    appState, stateRef, controlsHandle, updateState, onLoadingChange, onZoomChange, orbitEnabled, setOrbitEnabled 
}) => {
    const { size, scene } = useThree();
    
    // Global Fog & Background Management
    useEffect(() => {
        if (appState.environment.fogEnabled) {
            const color = new THREE.Color(appState.environment.fogColor || '#000000');
            const density = appState.environment.fogDensity;
            const far = 20 - (density * 100); 
            scene.fog = new THREE.Fog(color, 2, Math.max(5, far));
        } else {
            scene.fog = null;
        }

        if (appState.environment.envBackground) {
            scene.background = null; 
        } else {
            if (appState.environment.bgEnabled) {
                scene.background = new THREE.Color(appState.environment.bgColor);
            } else {
                scene.background = null; 
            }
        }
    }, [
        appState.environment.fogEnabled, 
        appState.environment.fogDensity, 
        appState.environment.fogColor,
        appState.environment.bgEnabled, 
        appState.environment.bgColor, 
        appState.environment.envBackground,
        scene
    ]);

    return (
        <>
            <SceneLighting appState={appState} />
            
            <CameraRig 
                appState={appState} 
                controlsHandle={controlsHandle} 
                onZoomChange={onZoomChange}
                updateState={updateState}
                enabled={orbitEnabled}
            />
            
            <group>
                <MainMesh 
                    appState={appState} 
                    stateRef={stateRef} 
                    onLoadingChange={onLoadingChange} 
                />
                {appState.environment.stageEnabled && <StageFloor appState={appState} />}
            </group>
            
            {appState.environment.particlesEnabled && (
                <ParticleSystem 
                    count={appState.environment.particleCount} 
                    speed={appState.environment.particleSpeed}
                    size={appState.environment.particleSize}
                />
            )}
            
            {appState.environment.smokeEnabled && <SmokeSystem appState={appState} />}
            
            <Suspense fallback={null}>
                <SceneEffects appState={appState} />
            </Suspense>
            
            <StickerGizmo 
                state={appState} 
                updateState={updateState} 
                visible={appState.sticker.enabled}
                setControlsEnabled={setOrbitEnabled}
            />

            {/* HUD: Miniature Map Preview (Top Left) */}
            <Hud renderPriority={2}>
                <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={1} />
                <ambientLight intensity={1} />
                <group position={[-size.width / 2 + 60, size.height / 2 - 60, 0]}>
                    <MiniatureScene appState={appState} size={100} />
                </group>
            </Hud>
        </>
    );
};

const LoadingScreen = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-2 text-accent-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-[10px] font-mono tracking-widest opacity-70">INITIALIZING GPU...</span>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export const TextureCanvas: React.FC<{ 
    appState: AppState; 
    setGlRef: (gl: THREE.WebGLRenderer) => void;
    updateState: (s: Partial<AppState>) => void;
}> = ({ appState, setGlRef, updateState }) => {
    const controlsHandle = useRef<CameraHandler | null>(null);
    const modelInputRef = useRef<HTMLInputElement>(null);
    const stateRef = useRef(appState);
    const [isLoading, setIsLoading] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [orbitEnabled, setOrbitEnabled] = useState(true);
    
    const { ref: containerRef, dimensions } = useContainerDimensions();
    const isReady = (dimensions.width > 0 && dimensions.height > 0);
    
    useEffect(() => { stateRef.current = appState; }, [appState]);

    const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            if (file.name.toLowerCase().endsWith('.svg')) {
                updateState({ geometry: GeometryType.SVG, svg: { ...appState.svg, url } });
            } else {
                updateState({ geometry: GeometryType.CUSTOM, customModel: url });
            }
        }
    };

    const onCreated = useCallback((state: any) => {
        const gl = state.gl as THREE.WebGLRenderer;
        setGlRef(gl);
        
        gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL Context Lost');
        }, false);

        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.toneMapping = THREE.ACESFilmicToneMapping; 
        gl.toneMappingExposure = 1.0;
        
    }, [setGlRef]);

    return (
        <div ref={containerRef} className="w-full h-full absolute inset-0 group bg-[#111216] overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
                        <span className="text-xs font-mono text-white/80">PROCESSING ASSET...</span>
                    </div>
                </div>
            )}

            {isReady ? (
                <Canvas
                    onCreated={onCreated}
                    className="w-full h-full block" 
                    gl={{ 
                        preserveDrawingBuffer: true, 
                        antialias: appState.settings.antialias, 
                        alpha: false,
                        powerPreference: "high-performance",
                        stencil: false,
                        depth: true,
                    }}
                    dpr={appState.settings.renderDpr || [1, 2]}
                    camera={{ position: [0, 0, 4], fov: 45, near: 0.1, far: 1000 }}
                    resize={{ scroll: false, debounce: 0 }}
                    shadows
                >
                    <Suspense fallback={null}>
                        <SceneComposition 
                            appState={appState} 
                            stateRef={stateRef}
                            controlsHandle={controlsHandle}
                            updateState={updateState}
                            onLoadingChange={setIsLoading}
                            onZoomChange={setZoomLevel}
                            orbitEnabled={orbitEnabled}
                            setOrbitEnabled={setOrbitEnabled}
                        />
                    </Suspense>
                </Canvas>
            ) : (
                <LoadingScreen />
            )}
            
            {/* CONTROLS OVERLAY */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded px-2 py-1 mb-1 shadow-lg pointer-events-auto">
                    <span className="text-[10px] font-mono text-accent-primary font-bold">{zoomLevel}%</span>
                </div>
                <div className="flex flex-col gap-2 pointer-events-auto">
                    <button onClick={() => controlsHandle.current?.zoomIn()} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95"><ZoomIn size={16} /></button>
                    <button onClick={() => controlsHandle.current?.zoomOut()} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95"><ZoomOut size={16} /></button>
                    <button onClick={() => controlsHandle.current?.reset()} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95" title="Reset View"><Maximize size={16} /></button>
                </div>
                <div className="flex flex-col gap-2 mt-2 pointer-events-auto">
                    <button onClick={() => controlsHandle.current?.setView('top')} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95 text-[10px] font-mono font-bold" title="Top View">TOP</button>
                    <button onClick={() => controlsHandle.current?.setView('front')} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95 text-[10px] font-mono font-bold" title="Front View">FRT</button>
                    <button onClick={() => controlsHandle.current?.setView('left')} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95 text-[10px] font-mono font-bold" title="Left View">LFT</button>
                    <button onClick={() => controlsHandle.current?.setView('right')} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95 text-[10px] font-mono font-bold" title="Right View">RGT</button>
                    <button onClick={() => controlsHandle.current?.setView('back')} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95 text-[10px] font-mono font-bold" title="Back View">BCK</button>
                    <button onClick={() => controlsHandle.current?.setView('isometric')} className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg transition-all active:scale-95 text-[10px] font-mono font-bold" title="Isometric View">ISO</button>
                </div>
            </div>
            
            {/* View Mode & Geometry Selectors (Bottom) */}
            <div className="absolute bottom-14 right-4 z-10 flex gap-1 p-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 opacity-100 transition-opacity duration-300">
                {[
                    { mode: ViewMode.ALBEDO, icon: Palette, label: 'Albedo' },
                    { mode: ViewMode.NORMAL, icon: Activity, label: 'Normal' },
                    { mode: ViewMode.HEIGHT, icon: AlignVerticalJustifyCenter, label: 'Height' },
                    { mode: ViewMode.UV, icon: Grid, label: 'UV' },
                    { mode: ViewMode.RENDER, icon: Sparkles, label: 'Render' },
                ].map((item) => (
                    <button
                        key={item.mode}
                        onClick={() => updateState({ viewMode: item.mode })}
                        className={`p-1.5 rounded transition-all ${appState.viewMode === item.mode ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title={item.label}
                    >
                        <item.icon size={14} />
                    </button>
                ))}
            </div>
            
            <div className="absolute bottom-14 left-4 z-10 flex gap-1 p-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/5 opacity-100 transition-opacity duration-300">
                {[
                    { type: GeometryType.PLANE, icon: Square },
                    { type: GeometryType.CUBE, icon: Box },
                    { type: GeometryType.SPHERE, icon: Circle },
                    { type: GeometryType.CYLINDER, icon: Cylinder },
                    { type: GeometryType.CARD, icon: Smartphone },
                    { type: GeometryType.SVG, icon: PenTool },
                    { type: GeometryType.TEXT, icon: Type },
                ].map((item) => (
                    <button
                        key={item.type}
                        onClick={() => updateState({ geometry: item.type })}
                        className={`p-1.5 rounded transition-all ${appState.geometry === item.type ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title={item.type}
                    >
                        <item.icon size={14} />
                    </button>
                ))}
                <div className="w-px bg-white/20 mx-1 h-4 self-center" />
                <input type="file" ref={modelInputRef} onChange={handleModelUpload} accept=".obj,.gltf,.glb,.svg" className="hidden" />
                <button
                    onClick={() => modelInputRef.current?.click()}
                    className={`p-1.5 rounded transition-all ${appState.geometry === GeometryType.CUSTOM ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    title="Upload Custom Model"
                >
                    <Upload size={14} />
                </button>
            </div>
        </div>
    );
};

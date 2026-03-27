
import React, { useState, useRef, lazy, Suspense } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Register all TSL patterns at startup (side-effect)
import './lib/tsl/registerPatterns';
import { GeometryType } from './core/types/types';
import { useTextureEditor } from './core/state/useTextureEditor';
import { useExportManager } from './features/export/useExportManager';
import { useHotkeys } from './shared/hooks/useHotkeys';

gsap.registerPlugin(useGSAP);

// Eager components (always visible)
import { Header } from './features/ui/Header';
import { Controls } from './features/controls-panel/Controls';
import { RightControls } from './features/controls-panel/RightControls';
import { TextureCanvas } from './features/texture-canvas/TextureCanvas';
import { StatusBar } from './features/status-bar/StatusBar';
import { DragDropOverlay } from './shared/ui/DragDropOverlay';
import { ToastContainer } from './shared/ui/Toast';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

// Lazy-loaded modals (loaded on demand)
const SettingsModal = lazy(() => import('./features/settings-modal/SettingsModal').then(m => ({ default: m.SettingsModal })));
const CodeViewerModal = lazy(() => import('./features/ui/CodeViewerModal').then(m => ({ default: m.CodeViewerModal })));
const ShortcutsModal = lazy(() => import('./features/ui/ShortcutsModal').then(m => ({ default: m.ShortcutsModal })));

export default function App() {
    const { state, history, actions, userPresets, isBusy, toasts } = useTextureEditor();

    // New Modular Export Hook
    const { isGenerating, progress, generateSpriteSheet, generateGif, generateHighResImage, downloadAllMaps, recordVideo, generateHtml, generateGlb } = useExportManager(state, {
        onSuccess: (msg) => actions.addToast('success', msg),
        onError: (msg) => actions.addToast('error', msg)
    });

    const [gl, setGl] = useState<THREE.Renderer | null>(null);

    // Layout State
    const [showLeft, setShowLeft] = useState(true);
    const [showRight, setShowRight] = useState(true);

    // Refs for GSAP
    const appContainerRef = useRef<HTMLDivElement>(null);
    const leftPanelRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!leftPanelRef.current) return;
        gsap.to(leftPanelRef.current, {
            width: showLeft ? 320 : 0,
            x: showLeft ? 0 : -320,
            opacity: showLeft ? 1 : 0,
            duration: 0.4,
            ease: "power3.inOut"
        });
    }, { dependencies: [showLeft], scope: appContainerRef });

    useGSAP(() => {
        if (!rightPanelRef.current) return;
        gsap.to(rightPanelRef.current, {
            width: showRight ? 288 : 0,
            x: showRight ? 0 : 288,
            opacity: showRight ? 1 : 0,
            duration: 0.4,
            ease: "power3.inOut"
        });
    }, { dependencies: [showRight], scope: appContainerRef });

    // Hotkeys
    useHotkeys({
        'mod+z': history.undo,
        'mod+y': history.redo,
        'mod+shift+z': history.redo,
        'space': (e) => {
            if (!state.isSettingsOpen && !state.isCodeOpen) actions.updateState({ animate: !state.animate });
        },
        'r': actions.randomize,
        'h': () => setShowLeft(p => !p)
    });

    // Drag & Drop
    const handleDropJson = (file: File) => actions.importPresets(file);
    const handleDropImage = (file: File) => {
        const name = file.name.toLowerCase();
        if (name.endsWith('.obj') || name.endsWith('.gltf') || name.endsWith('.glb')) {
            const url = URL.createObjectURL(file);
            actions.updateState({
                geometry: GeometryType.CUSTOM,
                customModel: url
            });
            actions.addToast('success', 'Custom Model Loaded');
        } else {
            // Texture
            const reader = new FileReader();
            reader.onload = (e) => {
                actions.updateState({
                    baseTexture: {
                        ...state.baseTexture,
                        enabled: true,
                        texture: e.target?.result as string
                    }
                });
                actions.addToast('success', 'Base Texture Loaded');
            };
            reader.readAsDataURL(file);
        }
    };

    if (state.isFullscreen) {
        return (
            <ErrorBoundary>
                <div className="fixed inset-0 z-50 bg-black w-full h-full">
                    <TextureCanvas
                        appState={state}
                        setGlRef={setGl}
                        updateState={actions.updateState}
                    />
                    <button
                        onClick={() => actions.updateState({ isFullscreen: false })}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded hover:bg-white/20 pointer-events-auto backdrop-blur-md border border-white/10"
                    >
                        Exit Fullscreen (ESC)
                    </button>
                </div>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <div ref={appContainerRef} className="flex flex-col h-screen w-screen bg-bg text-gray-200 overflow-hidden font-sans">

                {/* HEADER */}
                <Header
                    state={state}
                    userPresets={userPresets}
                    actions={actions}
                    history={history}
                    onShowCode={() => actions.updateState({ isCodeOpen: true })}
                    toggleLeftPanel={() => setShowLeft(!showLeft)}
                    toggleRightPanel={() => setShowRight(!showRight)}
                />

                {/* MAIN CONTENT */}
                <div className="flex-1 flex overflow-hidden relative w-full h-full">

                    {/* LEFT PANEL (Controls) */}
                    <div ref={leftPanelRef} className="border-r border-border relative z-20 shrink-0 bg-panel w-80">
                        <div className="absolute inset-0 overflow-hidden w-80">
                            <Controls state={state} actions={actions} history={history} />
                        </div>
                    </div>

                    {/* CENTER (Canvas) - ABSOLUTE POSITIONING STRATEGY */}
                    <div className="flex-1 relative min-w-0 min-h-0 bg-[#111216]">

                        {/* Fallback diagnostic background - If you see Blue/Gray, Canvas is transparent/missing. If Black, Canvas is working but scene is dark. */}
                        <div className="absolute inset-0 bg-[#111216]" />

                        {/* Canvas Container forced to fill */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            <ErrorBoundary>
                                <TextureCanvas
                                    appState={state}
                                    setGlRef={setGl}
                                    updateState={actions.updateState}
                                />
                            </ErrorBoundary>
                        </div>

                        {/* Progress Bar for Exporting */}
                        {isGenerating && (
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur border border-accent-primary/30 rounded-full px-6 py-2 flex items-center gap-3 shadow-2xl">
                                <div className="w-4 h-4 border-2 border-t-accent-primary border-r-accent-primary border-b-transparent border-l-transparent rounded-full animate-spin" />
                                <span className="text-xs font-mono font-bold text-white">EXPORTING... {progress}%</span>
                            </div>
                        )}

                        {/* Floating Status Bar inside Canvas area at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 z-10">
                            <StatusBar state={state} />
                        </div>
                    </div>

                    {/* RIGHT PANEL (Export/Env) */}
                    <div ref={rightPanelRef} className="border-l border-border relative z-20 shrink-0 bg-panel w-72">
                        <div className="absolute inset-0 overflow-hidden w-72">
                            <RightControls
                                state={state}
                                actions={actions}
                                history={history}
                                onDownload={generateHighResImage}
                                onSpriteSheet={generateSpriteSheet}
                                onGifExport={generateGif}
                                onVideoRecord={recordVideo}
                                onHtmlExport={generateHtml}
                                onGlbExport={generateGlb}
                                isGenerating={isGenerating}
                                onDownloadZip={downloadAllMaps}
                            />
                        </div>
                    </div>

                </div>

                {/* MODALS & OVERLAYS (lazy-loaded) */}
                <Suspense fallback={null}>
                    {state.isSettingsOpen && (
                        <SettingsModal
                            isOpen={state.isSettingsOpen}
                            onClose={() => actions.updateState({ isSettingsOpen: false })}
                            state={state}
                            updateState={actions.updateState}
                            updateSettings={(s) => actions.updateState({ settings: { ...state.settings, ...s } })}
                        />
                    )}

                    {state.isCodeOpen && (
                        <CodeViewerModal
                            isOpen={state.isCodeOpen}
                            onClose={() => actions.updateState({ isCodeOpen: false })}
                            state={state}
                        />
                    )}

                    {state.isShortcutsOpen && (
                        <ShortcutsModal
                            isOpen={state.isShortcutsOpen}
                            onClose={() => actions.updateState({ isShortcutsOpen: false })}
                        />
                    )}
                </Suspense>

                <DragDropOverlay
                    onDropJson={handleDropJson}
                    onDropImage={handleDropImage}
                />

                <ToastContainer toasts={toasts} onRemove={actions.removeToast} />

            </div>
        </ErrorBoundary>
    );
}

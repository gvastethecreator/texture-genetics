
import React, { memo, useRef } from 'react';
import * as Icons from 'lucide-react';
import { AppState, ViewMode } from '../../../core/types/types';
import { ControlSection, Label, Slider, ActionButton } from '../../../shared/ui/Elements';
import { generateStandaloneHtml, copyToClipboard } from '../../../shared/utils/exportUtils';

interface ExportPanelProps {
    state: AppState;
    updateStateGroup: <K extends keyof AppState>(key: K, values: Partial<AppState[K]>) => void;
    onSpriteSheet: () => void;
    onGifExport: () => void;
    onVideoRecord?: () => void; // New Prop
    onHtmlExport: () => void;
    onGlbExport: () => void;
    isGenerating?: boolean;
    onCommit: () => void;
    onDownload: (overrideViewMode?: ViewMode) => void;
    onChangeState: (s: Partial<AppState>) => void;
    exportPresets?: () => void;
    importPresets?: (file: File) => void;
    onDownloadZip?: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = memo(({ state, updateStateGroup, onSpriteSheet, onGifExport, onVideoRecord, onHtmlExport, onGlbExport, isGenerating, onCommit, onDownload, onChangeState, exportPresets, importPresets, onDownloadZip }) => {
    const handleVideoRecord = () => { if (onVideoRecord) onVideoRecord(); };
    const [copySuccess, setCopySuccess] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCopyHtml = async () => {
        const html = generateStandaloneHtml(state);
        const success = await copyToClipboard(html);
        if (success) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && importPresets) {
            importPresets(file);
        }
    };

    return (
        <>
            <ControlSection title="Animation & Export" icon={Icons.Film} color="#8B5CF6">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><Label label="Cols" /><Slider min={1} max={16} step={1} value={state.spriteSheet.columns} onChange={(v) => updateStateGroup('spriteSheet', { columns: v })} onCommit={onCommit} /></div>
                    <div><Label label="Rows" /><Slider min={1} max={16} step={1} value={state.spriteSheet.rows} onChange={(v) => updateStateGroup('spriteSheet', { rows: v })} onCommit={onCommit} /></div>
                </div>
                <div className="space-y-3">
                    <div><Label label="Total Frames" /><Slider min={1} max={64} step={1} value={state.spriteSheet.totalFrames} onChange={(v) => updateStateGroup('spriteSheet', { totalFrames: v })} onCommit={onCommit} /></div>
                    <div><Label label="Loop Duration (s)" /><Slider min={0.1} max={5} value={state.spriteSheet.duration} onChange={(v) => updateStateGroup('spriteSheet', { duration: v })} onCommit={onCommit} /></div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                    <ActionButton onClick={onSpriteSheet} disabled={isGenerating} primary>
                        {isGenerating ? <Icons.Loader2 className="animate-spin" size={14} /> : <Icons.Grid size={14} />}
                        {isGenerating ? 'Rendering Sheet...' : 'Render Sprite Sheet'}
                    </ActionButton>
                    <div className="grid grid-cols-2 gap-2">
                        <ActionButton onClick={onGifExport} disabled={isGenerating}>
                            {isGenerating ? <Icons.Loader2 className="animate-spin" size={14} /> : <Icons.Clapperboard size={14} />}
                            {isGenerating ? 'GIF' : 'Export GIF'}
                        </ActionButton>
                        <ActionButton onClick={handleVideoRecord} disabled={isGenerating || !onVideoRecord}>
                            {isGenerating ? <Icons.Loader2 className="animate-spin" size={14} /> : <Icons.Video size={14} />}
                            {isGenerating ? 'Rec...' : 'Export Video'}
                        </ActionButton>
                    </div>
                </div>
            </ControlSection>

            <ControlSection title="Download Maps" icon={Icons.Share2} color="#E0E0E0" defaultOpen={true}>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onDownload(ViewMode.ALBEDO)} className="bg-white text-black hover:bg-gray-200 py-2 px-3 rounded font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                            <Icons.Image size={14} /> Albedo
                        </button>
                        <button onClick={() => onDownload(ViewMode.NORMAL)} className="bg-surface border border-border text-blue-400 hover:bg-blue-900/20 hover:border-blue-800 py-2 px-3 rounded font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                            <Icons.Activity size={14} /> Normal
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onDownload(ViewMode.HEIGHT)} className="bg-surface border border-border text-gray-300 hover:bg-gray-800 py-2 px-3 rounded font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                            <Icons.AlignVerticalJustifyCenter size={14} /> Height
                        </button>
                        <button onClick={() => onDownload(ViewMode.UV)} className="bg-surface border border-border text-teal-400 hover:bg-teal-900/20 hover:border-teal-800 py-2 px-3 rounded font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                            <Icons.Grid size={14} /> UV
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => onDownload(ViewMode.RENDER)} className="bg-surface border border-border text-amber-400 hover:bg-amber-900/20 hover:border-amber-800 py-2 px-3 rounded font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                            <Icons.Sparkles size={14} /> Render
                        </button>
                    </div>

                    {onDownloadZip && (
                        <div className="pt-1">
                            <ActionButton onClick={onDownloadZip} disabled={isGenerating} className="border-accent-primary/30 text-accent-primary hover:bg-accent-primary hover:text-black">
                                {isGenerating ? <Icons.Loader2 className="animate-spin" size={14} /> : <Icons.Package size={14} />}
                                {isGenerating ? 'Packing ZIP...' : 'Download All Maps (ZIP)'}
                            </ActionButton>
                        </div>
                    )}

                    <div className="pt-3 border-t border-white/5 space-y-2">
                        <Label label="Project Management" />
                        <div className="grid grid-cols-2 gap-2">
                            <ActionButton onClick={exportPresets || (() => { })} disabled={!exportPresets}><Icons.DownloadCloud size={14} /> Save Project</ActionButton>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                            <ActionButton onClick={handleImportClick} disabled={!importPresets}><Icons.UploadCloud size={14} /> Load Project</ActionButton>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                        <ActionButton onClick={onHtmlExport} disabled={isGenerating}>
                            {isGenerating ? <Icons.Loader2 className="animate-spin" size={14} /> : <Icons.Code size={14} />}
                            {isGenerating ? 'HTML...' : 'Export HTML'}
                        </ActionButton>
                        <ActionButton onClick={onGlbExport} disabled={isGenerating}>
                            {isGenerating ? <Icons.Loader2 className="animate-spin" size={14} /> : <Icons.Box size={14} />}
                            {isGenerating ? 'GLB...' : 'Export GLB'}
                        </ActionButton>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                        <ActionButton onClick={() => onChangeState({ isFullscreen: true })}><Icons.Maximize size={14} /> Fullscreen</ActionButton>
                        <button onClick={handleCopyHtml} className={`w-full py-2 px-4 rounded font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-200 ease-out select-none border shadow-depth-sm ${copySuccess ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-surface border-border text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                            {copySuccess ? <Icons.Check size={14} /> : <Icons.Code size={14} />}
                            {copySuccess ? "Copied!" : "Copy HTML"}
                        </button>
                    </div>
                </div>
            </ControlSection>
        </>
    );
});

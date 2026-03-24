
import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import * as Icons from 'lucide-react';

gsap.registerPlugin(useGSAP);

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    const backdropRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!isOpen) return;
        gsap.from(backdropRef.current, { autoAlpha: 0, duration: 0.2 });
        gsap.from(contentRef.current, { y: 20, autoAlpha: 0, scale: 0.95, duration: 0.3, ease: "back.out(1.7)", delay: 0.05 });
    }, { dependencies: [isOpen] });

    if (!isOpen) return null;

    const shortcuts = [
        { key: 'Space', desc: 'Pause / Play Animation' },
        { key: 'R', desc: 'Smart Randomize Parameters' },
        { key: 'Ctrl + Z', desc: 'Undo' },
        { key: 'Ctrl + Y', desc: 'Redo' },
        { key: 'H', desc: 'Toggle Panels (Hide UI)' },
        { key: 'Drag & Drop', desc: 'Import Preset (.json) or Texture (.png/.jpg)' },
        { key: 'Double Click Slider', desc: 'Reset Value to Default' },
        { key: 'Click Value Input', desc: 'Type Precise Number' }
    ];

    return (
        <div ref={backdropRef} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div ref={contentRef} className="bg-[#0D0D0D] border border-border w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-border bg-[#151515]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                            <Icons.Keyboard size={18} />
                        </div>
                        <h2 className="text-sm font-black text-gray-100 uppercase tracking-widest">Keyboard Shortcuts</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                        <Icons.X size={18} />
                    </button>
                </div>
                <div className="p-2">
                    <div className="grid divide-y divide-white/5">
                        {shortcuts.map((s, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 transition-colors rounded-lg group">
                                <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">{s.desc}</span>
                                <span className="text-[10px] font-mono font-bold bg-white/10 text-accent-primary px-2 py-1 rounded border border-white/5 min-w-[30px] text-center">
                                    {s.key}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-black/30 border-t border-border text-[10px] text-gray-500 text-center">
                    EffectTextureGen v3.5 &bull; Professional Edition
                </div>
            </div>
        </div>
    );
};

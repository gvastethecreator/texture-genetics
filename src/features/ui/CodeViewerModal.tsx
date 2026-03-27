import React, { useEffect, useState, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import * as Icons from 'lucide-react';
import { AppState } from '../../core/types/types';
import { generateStandaloneHtml, copyToClipboard } from '../../shared/utils/exportUtils';

gsap.registerPlugin(useGSAP);

interface CodeViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    state: AppState;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose, state }) => {
    const [code, setCode] = useState('');
    const [copied, setCopied] = useState(false);
    const backdropRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setCode(generateStandaloneHtml(state));
        }
    }, [isOpen, state]);

    useGSAP(() => {
        if (!isOpen) return;
        gsap.from(backdropRef.current, { autoAlpha: 0, duration: 0.2 });
        gsap.from(contentRef.current, { y: 20, autoAlpha: 0, scale: 0.95, duration: 0.3, ease: "back.out(1.7)", delay: 0.05 });
    }, { dependencies: [isOpen] });

    const handleCopy = async () => {
        await copyToClipboard(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    // HTML/JS syntax highlighting for the standalone export
    const highlightCode = useCallback((src: string) => {
        const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|new|import|from|async|await|true|false|null|undefined|typeof|class|this)\b/g;
        const threeClasses = /\b(THREE|WebGLRenderer|Scene|OrthographicCamera|PlaneGeometry|Mesh|ShaderMaterial|Vector2|Vector3|Color|SRGBColorSpace|GLSL3|requestAnimationFrame)\b/g;
        const numbers = /\b(\d+(?:\.\d+)?)\b/g;

        const lines = src.split('\n');

        return lines.map((line, i) => {
            let html = line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            if (html.trim().startsWith('//') || html.trim().startsWith('*') || html.trim().startsWith('/*')) {
                return (
                    <div key={i} className="table-row">
                        <span className="table-cell text-right pr-4 text-gray-700 select-none text-[10px] w-8">{i + 1}</span>
                        <span className="table-cell text-gray-500 italic">{html}</span>
                    </div>
                );
            }

            html = html
                .replace(/(&lt;[^&]*?&gt;)/g, '<span class="text-blue-300">$1</span>')
                .replace(jsKeywords, '<span class="text-purple-400 font-bold">$1</span>')
                .replace(threeClasses, '<span class="text-yellow-300">$1</span>')
                .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, (m) => `<span class="text-green-400">${m}</span>`)
                .replace(numbers, '<span class="text-amber-300">$1</span>');

            return (
                <div key={i} className="table-row">
                    <span className="table-cell text-right pr-4 text-gray-700 select-none text-[10px] w-8">{i + 1}</span>
                    <span className="table-cell whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            );
        });
    }, []);

    return (
        <div ref={backdropRef} className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div ref={contentRef} className="bg-[#0D0D0D] border border-border w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-[#151515]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-900/30 text-blue-400 flex items-center justify-center">
                            <Icons.FileCode2 size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-100 uppercase tracking-widest">Standalone HTML Export</h2>
                            <p className="text-[10px] text-gray-500">Self-contained WebGL2 HTML — paste in any browser to run the shader</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${copied ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-surface border border-white/10 text-gray-300 hover:bg-white/10'}`}
                        >
                            {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
                            {copied ? 'COPIED' : 'COPY HTML'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                            <Icons.X size={18} />
                        </button>
                    </div>
                </div>

                {/* Code Body */}
                <div className="flex-1 overflow-auto bg-panel p-4 font-mono text-xs text-gray-300 leading-relaxed custom-scrollbar">
                    <div className="table w-full">
                        {highlightCode(code)}
                    </div>
                </div>
            </div>
        </div>
    );
};

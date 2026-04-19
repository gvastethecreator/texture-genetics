import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import * as Icons from "lucide-react";
import { AppState } from "../../core/types/types";
import { copyToClipboard } from "../../shared/utils/clipboard";
import { generateLegacyStandaloneHtml } from "../export/legacy/standaloneHtml";

gsap.registerPlugin(useGSAP);

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose, state }) => {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode(generateLegacyStandaloneHtml(state));
    }
  }, [isOpen, state]);

  useGSAP(
    () => {
      if (!isOpen) {
        return;
      }

      gsap.from(backdropRef.current, { autoAlpha: 0, duration: 0.2 });
      gsap.from(contentRef.current, {
        y: 20,
        autoAlpha: 0,
        scale: 0.95,
        duration: 0.3,
        ease: "back.out(1.7)",
        delay: 0.05,
      });
    },
    { dependencies: [isOpen] },
  );

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return null;
  }

  // HTML/JS syntax highlighting for the legacy standalone export
  const highlightCode = useCallback((src: string) => {
    const jsKeywords = new Set([
      "const",
      "let",
      "var",
      "function",
      "return",
      "if",
      "else",
      "for",
      "while",
      "new",
      "import",
      "from",
      "async",
      "await",
      "true",
      "false",
      "null",
      "undefined",
      "typeof",
      "class",
      "this",
    ]);
    const threeClasses = new Set([
      "THREE",
      "WebGLRenderer",
      "Scene",
      "OrthographicCamera",
      "PlaneGeometry",
      "Mesh",
      "ShaderMaterial",
      "Vector2",
      "Vector3",
      "Color",
      "SRGBColorSpace",
      "GLSL3",
      "requestAnimationFrame",
    ]);
    const tokenPattern =
      /(<[^>]*>)|(["'`])(?:(?!\2)[^\\]|\\.)*?\2|\b(?:const|let|var|function|return|if|else|for|while|new|import|from|async|await|true|false|null|undefined|typeof|class|this)\b|\b(?:THREE|WebGLRenderer|Scene|OrthographicCamera|PlaneGeometry|Mesh|ShaderMaterial|Vector2|Vector3|Color|SRGBColorSpace|GLSL3|requestAnimationFrame)\b|\b\d+(?:\.\d+)?\b/g;

    const renderHighlightedLine = (line: string): ReactNode[] => {
      const segments: ReactNode[] = [];
      let lastIndex = 0;

      for (const match of line.matchAll(tokenPattern)) {
        const token = match[0];
        const start = match.index ?? 0;

        if (start > lastIndex) {
          segments.push(line.slice(lastIndex, start));
        }

        let className = "text-gray-300";
        if (token.startsWith("<") && token.endsWith(">")) {
          className = "text-blue-300";
        } else if (/^["'`]/.test(token)) {
          className = "text-green-400";
        } else if (jsKeywords.has(token)) {
          className = "text-purple-400 font-bold";
        } else if (threeClasses.has(token)) {
          className = "text-yellow-300";
        } else if (/^\d/.test(token)) {
          className = "text-amber-300";
        }

        segments.push(
          <span key={`${start}-${token}`} className={className}>
            {token}
          </span>,
        );
        lastIndex = start + token.length;
      }

      if (lastIndex < line.length) {
        segments.push(line.slice(lastIndex));
      }

      return segments;
    };

    const lines = src.split("\n");

    return lines.map((line, i) => {
      if (
        line.trim().startsWith("//") ||
        line.trim().startsWith("*") ||
        line.trim().startsWith("/*")
      ) {
        return (
          <div key={i} className="table-row">
            <span className="table-cell w-8 select-none pr-4 text-right text-[10px] text-gray-700">
              {i + 1}
            </span>
            <span className="table-cell text-gray-500 italic">{line}</span>
          </div>
        );
      }

      return (
        <div key={i} className="table-row">
          <span className="table-cell w-8 select-none pr-4 text-right text-[10px] text-gray-700">
            {i + 1}
          </span>
          <span className="table-cell whitespace-pre-wrap">{renderHighlightedLine(line)}</span>
        </div>
      );
    });
  }, []);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={contentRef}
        className="bg-[#0D0D0D] border border-border w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/30 text-blue-400 flex items-center justify-center">
              <Icons.FileCode2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-100">
                Legacy HTML Export
              </h2>
              <p className="text-[10px] text-gray-500">
                Compat fallback en GLSL/WebGL2 mientras el runtime principal sigue en TSL
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-bold transition-all ${
                copied
                  ? "border border-green-500/50 bg-green-900/50 text-green-400"
                  : "border border-white/10 bg-surface text-gray-300 hover:bg-white/10"
              }`}
            >
              {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
              {copied ? "COPIED" : "COPY LEGACY HTML"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icons.X size={18} />
            </button>
          </div>
        </div>

        {/* Code Body */}
        <div className="flex-1 overflow-auto bg-panel p-4 font-mono text-xs text-gray-300 leading-relaxed custom-scrollbar">
          <div className="table w-full">{highlightCode(code)}</div>
        </div>
      </div>
    </div>
  );
};

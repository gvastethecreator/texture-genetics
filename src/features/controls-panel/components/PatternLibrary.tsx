import React, { memo } from "react";
import * as Icons from "lucide-react";
import { TextureType } from "../../../core/types/types";
import { TEXTURE_CATEGORIES } from "../../../data/textureData";

interface PatternLibraryProps {
  currentType: TextureType;
  onSelect: (t: TextureType) => void;
  onRandom: () => void;
}

export const PatternLibrary: React.FC<PatternLibraryProps> = memo(
  ({ currentType, onSelect, onRandom }) => {
    return (
      <div className="mb-4 space-y-1 border border-border/50 rounded-lg overflow-hidden">
        <div className="bg-surface px-3 py-2 border-b border-border/50 flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Pattern Library
          </span>
          <button
            onClick={onRandom}
            className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Random Pattern Type"
            aria-label="Random pattern type"
          >
            <Icons.Shuffle size={12} />
          </button>
        </div>
        {Object.entries(TEXTURE_CATEGORIES).map(([catName, data]) => {
          const Icon = data.icon;
          const isActiveCategory = data.types.includes(currentType);

          return (
            <div key={catName} className="relative">
              <button
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-all duration-200 ${isActiveCategory ? "bg-white/5 text-gray-200" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                onClick={() => {
                  if (!isActiveCategory) {
                    onSelect(data.types[0]);
                  }
                }}
              >
                {Icon && (
                  <Icon
                    size={14}
                    style={{
                      color: isActiveCategory ? data.color : "inherit",
                      opacity: isActiveCategory ? 1 : 0.7,
                    }}
                  />
                )}
                <span className="text-xs font-medium">{catName}</span>
                {isActiveCategory && (
                  <div className="ml-auto w-1 h-1 rounded-full bg-accent-primary" />
                )}
              </button>

              {isActiveCategory && (
                <div className="grid grid-cols-2 gap-1 p-2 bg-black/20 border-t border-black/20 animate-in slide-in-from-top-1 duration-200">
                  {data.types.map((t) => (
                    <button
                      key={t}
                      onClick={() => onSelect(t)}
                      className={`text-left text-[10px] py-1.5 px-2 rounded truncate transition-colors ${currentType === t ? "bg-accent-primary text-black font-bold shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
                      title={t}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

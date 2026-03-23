
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileJson, Image as ImageIcon, Box } from 'lucide-react';

interface DragDropOverlayProps {
    onDropJson: (file: File) => void;
    onDropImage: (file: File) => void;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ onDropJson, onDropImage }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<'json' | 'image' | 'model' | 'unknown'>('unknown');
    
    // Use a counter to handle the dragenter/dragleave bubbling issue standard in HTML5 DnD
    const dragCounter = useRef(0);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;
        
        if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
            const item = e.dataTransfer.items[0];
            
            // Heuristic detection of type
            if (item.type.includes('json')) {
                setDragType('json');
            } else if (item.type.includes('image')) {
                setDragType('image');
            } else {
                // Models often don't have a specific MIME type in drag events, default to generic or model
                setDragType('model');
            }
        }
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;
        
        // Only hide if we have actually left the window context (counter is 0)
        if (dragCounter.current <= 0) {
            setIsDragging(false);
            dragCounter.current = 0;
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Force dropEffect to copy to indicate valid drop target
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }, []);

    const handleDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const name = file.name.toLowerCase();
            
            if (name.endsWith('.json')) {
                onDropJson(file);
            } else if (name.endsWith('.obj') || name.endsWith('.gltf') || name.endsWith('.glb')) {
                // Logic handled by App.tsx, but we identify it here conceptually
                onDropImage(file); 
            } else {
                // Assume image for everything else
                onDropImage(file);
            }
        }
    }, [onDropJson, onDropImage]);
    
    useEffect(() => {
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);
        
        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    if (!isDragging) return null;

    let icon = <Upload size={64} />;
    let text = "Drop File Here";
    let subtext = "Release to import content";
    let colorClass = "text-accent-primary border-accent-primary";
    
    if (dragType === 'json') { 
        icon = <FileJson size={64} />; 
        text = "Import Preset"; 
        colorClass = "text-blue-400 border-blue-500";
    } else if (dragType === 'image') { 
        icon = <ImageIcon size={64} />; 
        text = "Load Texture"; 
        subtext = "Use as Base or Mask";
        colorClass = "text-amber-400 border-amber-500";
    } else if (dragType === 'model') { 
        icon = <Box size={64} />; 
        text = "Load 3D Model"; 
        subtext = "Preview texture on custom geometry";
        colorClass = "text-purple-400 border-purple-500";
    }

    return (
        <div className={`fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm border-4 border-dashed m-4 rounded-xl flex items-center justify-center pointer-events-none animate-in fade-in duration-200 ${colorClass}`}>
            <div className="flex flex-col items-center gap-4">
                {icon}
                <h2 className="text-3xl font-black uppercase tracking-widest">{text}</h2>
                <p className="text-white/70 font-mono">{subtext}</p>
            </div>
        </div>
    );
};

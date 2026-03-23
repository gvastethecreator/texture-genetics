
declare class GIF {
    constructor(options: {
        workers?: number;
        quality?: number;
        width?: number;
        height?: number;
        workerScript?: string;
        background?: string;
        transparent?: number | string | null;
        dither?: boolean;
        debug?: boolean;
    });

    addFrame(image: HTMLImageElement | HTMLCanvasElement | ImageData, options?: { delay?: number; copy?: boolean }): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'progress', callback: (percent: number) => void): void;
    on(event: 'abort', callback: () => void): void;
    render(): void;
}

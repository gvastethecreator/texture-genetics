import { AppState } from '../../../core/types/types';
import { generateStandaloneHtml } from '../../../shared/utils/exportUtils';

export const generateHtml = async (state: AppState, onProgress: (p: number) => void): Promise<Blob> => {
    onProgress(10);
    const htmlContent = generateStandaloneHtml(state);

    onProgress(100);
    return new Blob([htmlContent], { type: 'text/html' });
};

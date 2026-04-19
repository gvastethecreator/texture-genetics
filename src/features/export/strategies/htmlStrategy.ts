import { AppState } from "../../../core/types/types";
import { generateLegacyStandaloneHtml } from "../legacy/standaloneHtml";

export const generateHtml = async (
  state: AppState,
  onProgress: (p: number) => void,
): Promise<Blob> => {
  onProgress(10);
  const htmlContent = generateLegacyStandaloneHtml(state);

  onProgress(100);
  return new Blob([htmlContent], { type: "text/html" });
};

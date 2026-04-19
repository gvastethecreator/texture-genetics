// Fix EffectComposer children type to accept conditional rendering patterns
// This is a known typing limitation in @react-three/postprocessing
import type { ReactNode } from "react";

declare module "@react-three/postprocessing" {
  interface EffectComposerProps {
    children?: ReactNode;
  }
}

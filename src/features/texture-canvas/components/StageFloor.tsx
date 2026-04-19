import React from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import { AppState } from "../../../core/types/types";

export const StageFloor: React.FC<{ appState: AppState }> = ({ appState }) => {
  // Note: Conditional rendering is now handled by the parent (TextureCanvas)
  // This ensures the component fully unmounts/remounts when toggled.

  const blur = [400, 100] as [number, number];
  const mixBlur = 1.0;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1.3, 0]} // Lowered slightly to avoid clipping with complex geometry
      receiveShadow
    >
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        mirror={0.7} // High reflectivity
        blur={blur}
        depthScale={1.0}
        depthToBlurRatioBias={0.25}
        distortion={0}
        mixBlur={mixBlur}
        mixStrength={appState.environment.stageOpacity * 10.0} // Multiplied to be visible against dark bg
        mixContrast={1.0}
        resolution={1024}
        color={appState.environment.stageColor}
        metalness={0.8}
        roughness={0.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
      />
    </mesh>
  );
};

import React, { memo } from "react";
import { Grid } from "@react-three/drei";

export const InfiniteGrid = memo(() => {
  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[20, 20]} // Size
      cellSize={1}
      cellThickness={0.8}
      cellColor="#444444"
      sectionSize={5}
      sectionThickness={1.2}
      sectionColor="#666666"
      fadeDistance={25}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={true}
    />
  );
});

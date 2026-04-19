/**
 * TSL Lighting Chunk
 * Holographic/spectral effects and PBR BRDF lighting.
 */
import {
  Fn,
  float,
  vec2,
  vec3,
  vec4,
  int,
  sin,
  cos,
  floor,
  fract,
  dot,
  mix,
  max,
  clamp,
  pow,
  length,
  normalize,
  cross,
  reflect,
  smoothstep,
  acos,
  Loop,
  If,
} from "three/tsl";

const PI = float(3.14159265359);

// ─── Holographic hashing (self-contained) ───

export const holoHash2 = Fn(([p_in]: [any]) => {
  const p = vec2(p_in);
  const q = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(q).mul(43758.5453));
});

export const holoHash4 = Fn(([p_in]: [any]) => {
  const p = vec2(p_in);
  const q = vec4(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3)),
    dot(p, vec2(419.2, 371.9)),
    dot(p, vec2(832.3, 201.5)),
  );
  return fract(sin(q).mul(43758.5453));
});

export const holoVoronoi = Fn(([p_in]: [any]) => {
  const p = vec2(p_in);
  const ip = floor(p);
  const fp = fract(p);
  const md = float(8.0).toVar();
  const mz = vec2(0.0).toVar();

  Loop({ start: int(-1), end: int(2), type: "int", name: "j", condition: "<" }, ({ j }: any) => {
    Loop({ start: int(-1), end: int(2), type: "int", name: "i", condition: "<" }, ({ i }: any) => {
      const g = vec2(float(i), float(j));
      const o = holoHash4(ip.add(g));
      const r = g.add(o.xy).sub(fp);
      const d = dot(r, r);
      If(d.lessThan(md), () => {
        md.assign(d);
        mz.assign(o.zw);
      });
    });
  });

  return mz;
});

export const spectralGems = Fn(([w_in]: [any]) => {
  const w = float(w_in);
  return vec3(
    max(float(0.0), float(1.0).sub(pow(float(4.0).mul(w.sub(0.75)), float(2.0)))),
    max(float(0.0), float(1.0).sub(pow(float(4.0).mul(w.sub(0.5)), float(2.0)))),
    max(float(0.0), float(1.0).sub(pow(float(4.0).mul(w.sub(0.25)), float(2.0)))),
  );
});

export const getHolographicColor = Fn(
  ([
    baseCol_in,
    viewDir_in,
    lightDir_in,
    normal_in,
    uv_in,
    strength_in,
    lightIntensity_in,
    scale_in,
  ]: any[]) => {
    const baseCol = vec3(baseCol_in);
    const viewDir = vec3(viewDir_in);
    const lightDir = vec3(lightDir_in);
    const normal = vec3(normal_in);
    const uv = vec2(uv_in);
    const strength = float(strength_in);
    const lightIntensity = float(lightIntensity_in);
    const scale = float(scale_in);

    const result = vec3(baseCol).toVar();

    If(strength.greaterThan(0.001), () => {
      const noise = holoVoronoi(uv.mul(20.0).mul(scale));
      const theta = noise.x.mul(6.2831);
      const phi = acos(float(1.0).sub(noise.y.mul(0.00125)));

      // Tangent basis
      const k = cross(normal, vec3(1.0, 0.0, 0.0)).toVar();
      If(length(k).lessThan(0.01), () => {
        k.assign(cross(normal, vec3(0.0, 1.0, 0.0)));
      });
      k.assign(normalize(k));

      const v = normal;
      const a = normal
        .mul(cos(phi))
        .add(cross(k, v).mul(sin(phi)))
        .add(k.mul(dot(k, v)).mul(float(1.0).sub(cos(phi))));
      const b = normal.mul(dot(a, normal));
      const o = a.sub(b);
      const w = cross(normal, o);
      const th = length(o).toVar();
      const holoDisp = normalize(o)
        .mul(cos(theta))
        .add(normalize(w).mul(sin(theta)))
        .mul(th);
      const holoNormal = normalize(b.add(holoDisp));

      const n = normalize(mix(normal, holoNormal, 0.8));
      const spectrum = pow(
        max(dot(viewDir.negate(), reflect(lightDir.negate(), n)), float(0.0)),
        float(2.0),
      ).toVar();

      // Simplified angle-based iridescence
      const angle = dot(vec3(0.0, 1.0, 0.0), normal);
      const corner = float(1.0)
        .add(cos(float(4.0).mul(angle)))
        .mul(0.5);
      spectrum.assign(spectrum.add(corner.mul(0.42)).mul(float(1.0).sub(corner.mul(0.29))));

      const holo = spectralGems(float(1.0).sub(spectrum.sub(0.55).mul(5.0))).mul(lightIntensity);
      result.assign(baseCol.add(holo.mul(strength)));
    });

    return result;
  },
);

// ─── Normal Map (derivative based) ───

export const getAccurateNormal = Fn(
  ([centerVal_in, intensity_in, enabled_in, invert_in]: any[]) => {
    const centerVal = float(centerVal_in);
    const intensity = float(intensity_in);
    const enabled = float(enabled_in); // 1 or 0
    const invertF = float(invert_in);

    const result = vec3(0.0, 0.0, 1.0).toVar();

    If(enabled.greaterThan(0.5), () => {
      const dX = centerVal.dFdx();
      const dY = centerVal.dFdy();
      const factor = intensity.mul(0.5).toVar();
      const nx = dX.negate().mul(factor);
      const ny = dY.negate().mul(factor);
      const n = vec3(nx, ny, 1.0).toVar();
      If(invertF.greaterThan(0.5), () => {
        n.assign(vec3(nx.negate(), ny.negate(), 1.0));
      });
      result.assign(normalize(n));
    });

    return result;
  },
);

// ─── Curvature AO ───

export const getAO = Fn(([_val_in, normal_in, enabled_in, strength_in]: any[]) => {
  const normal = vec3(normal_in);
  const enabled = float(enabled_in);
  const strength = float(strength_in);

  const result = float(1.0).toVar();
  If(enabled.greaterThan(0.5), () => {
    const slope = float(1.0).sub(normal.z);
    const occlusion = slope.mul(0.5).mul(strength);
    result.assign(clamp(float(1.0).sub(occlusion), 0.0, 1.0));
  });
  return result;
});

// ─── Environment Mapping ───

export const getEnvironment = Fn(([dir_in, type_in, roughness_in]: any[]) => {
  const dir = vec3(dir_in);
  const envType = int(type_in);
  const roughness = float(roughness_in);
  const y = dir.y;
  const col = vec3(0.5).toVar();

  const t = smoothstep(-0.2, 0.2, y);
  const yPow = pow(max(float(0.0), y), float(0.5));

  // Studio (default)
  col.assign(mix(vec3(0.25), vec3(0.95), yPow));
  col.assign(col.mul(mix(vec3(1.0, 0.95, 0.9), vec3(0.9, 0.95, 1.0), dir.x.mul(0.5).add(0.5))));

  If(envType.equal(int(1)), () => {
    // Sunset
    const z = vec3(0.1, 0.2, 0.8);
    const h = vec3(1.0, 0.4, 0.1);
    const g = vec3(0.2, 0.1, 0.1);
    col.assign(mix(g, mix(h, z, yPow), t));
  });
  If(envType.equal(int(2)), () => {
    // Midnight
    const z = vec3(0.02, 0.02, 0.1);
    const h = vec3(0.05, 0.1, 0.3);
    const g = vec3(0.01);
    col.assign(mix(g, mix(h, z, yPow), t));
  });
  If(envType.equal(int(3)), () => {
    // Dawn
    const z = vec3(0.5, 0.6, 0.9);
    const h = vec3(1.0, 0.7, 0.5);
    const g = vec3(0.3, 0.2, 0.2);
    col.assign(mix(g, mix(h, z, yPow), t));
  });

  return mix(col, vec3(length(col).mul(0.5)), roughness);
});

// ─── PBR BRDF ───

export const fresnelSchlick = Fn(([cosTheta_in, F0_in]: any[]) => {
  const cosTheta = float(cosTheta_in);
  const F0 = vec3(F0_in);
  return F0.add(
    vec3(1.0)
      .sub(F0)
      .mul(pow(clamp(float(1.0).sub(cosTheta), 0.0, 1.0), float(5.0))),
  );
});

export const distributionGGX = Fn(([N_in, H_in, roughness_in]: any[]) => {
  const N = vec3(N_in);
  const H = vec3(H_in);
  const roughness = float(roughness_in);
  const a = roughness.mul(roughness);
  const a2 = max(float(0.001), a.mul(a));
  const NdotH = max(dot(N, H), float(0.0));
  const NdotH2 = NdotH.mul(NdotH);
  const num = a2;
  const denom = NdotH2.mul(a2.sub(1.0)).add(1.0);
  return num.div(max(PI.mul(denom).mul(denom), float(0.0001)));
});

export const geometrySchlickGGX = Fn(([NdotV_in, roughness_in]: any[]) => {
  const NdotV = float(NdotV_in);
  const roughness = float(roughness_in);
  const r = roughness.add(1.0);
  const k = r.mul(r).div(8.0);
  return NdotV.div(max(NdotV.mul(float(1.0).sub(k)).add(k), float(0.0001)));
});

export const geometrySmith = Fn(([N_in, V_in, L_in, roughness_in]: any[]) => {
  const N = vec3(N_in);
  const V = vec3(V_in);
  const L = vec3(L_in);
  const roughness = float(roughness_in);
  const NdotV = max(dot(N, V), float(0.0));
  const NdotL = max(dot(N, L), float(0.0));
  return geometrySchlickGGX(NdotV, roughness).mul(geometrySchlickGGX(NdotL, roughness));
});

export const getLitColor = Fn(
  ([
    albedo_in,
    normal_in,
    viewDir_in,
    lightDir_in,
    roughness_in,
    metalness_in,
    ao_in,
    envType_in,
    lightIntensity_in,
  ]: any[]) => {
    const albedo = vec3(albedo_in);
    const normal = vec3(normal_in);
    const viewDir = vec3(viewDir_in);
    const lightDir = vec3(lightDir_in);
    const roughness = clamp(float(roughness_in), 0.05, 1.0);
    const metalness = float(metalness_in);
    const ao = float(ao_in);
    const envType = int(envType_in);
    const lightIntensity = float(lightIntensity_in);

    const N = normalize(normal);
    const V = normalize(viewDir);
    const L = normalize(lightDir);
    const H = normalize(V.add(L).add(vec3(0.0001)));

    const F0 = mix(vec3(0.04), albedo, metalness);

    const NDF = distributionGGX(N, H, roughness);
    const G = geometrySmith(N, V, L, roughness);
    const F = fresnelSchlick(max(dot(H, V), float(0.0)), F0);

    const numerator = float(NDF).mul(G).mul(F);
    const denominator = float(4.0)
      .mul(max(dot(N, V), float(0.0)))
      .mul(max(dot(N, L), float(0.0)))
      .add(0.0001);
    const specular = clamp(numerator.div(denominator), 0.0, 4.0);

    const kS = F;
    const kD = vec3(1.0).sub(kS).mul(float(1.0).sub(metalness));

    const NdotL = max(dot(N, L), float(0.0));
    const directLighting = kD
      .mul(albedo)
      .div(PI)
      .add(vec3(specular).mul(0.8))
      .mul(NdotL)
      .mul(lightIntensity);

    // IBL
    const R = reflect(V.negate(), N);
    const envColor = getEnvironment(R, envType, roughness);
    const F_ambient = fresnelSchlick(max(dot(N, V), float(0.0)), F0);
    const kD_ambient = vec3(1.0).sub(F_ambient).mul(float(1.0).sub(metalness));
    const irradiance = getEnvironment(N, envType, float(1.0));
    const diffuseIBL = irradiance.mul(albedo);
    const ambient = kD_ambient
      .mul(diffuseIBL)
      .add(envColor.mul(F_ambient).mul(0.5))
      .mul(ao)
      .mul(0.5);
    const ambientMixed = mix(ambient, albedo.mul(0.2), 0.5);

    const fallback = albedo.mul(0.1);

    return ambientMixed.add(directLighting).add(fallback);
  },
);

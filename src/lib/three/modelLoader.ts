import * as THREE from "three";

export type ModelFormat = "obj" | "gltf" | "glb";

const MAX_MODEL_BYTES = 50 * 1024 * 1024;
const GLB_MAGIC = "glTF";

export class ModelLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelLoadError";
  }
}

const decodeText = (data: ArrayBuffer): string => new TextDecoder().decode(data);

const formatFromHint = (hint: string): ModelFormat | null => {
  const source = hint.toLowerCase().split(/[?#]/, 1)[0];
  if (source.endsWith(".obj")) return "obj";
  if (source.endsWith(".gltf")) return "gltf";
  if (source.endsWith(".glb")) return "glb";
  return null;
};

export const detectModelFormat = (data: ArrayBuffer, sourceHint = ""): ModelFormat => {
  if (data.byteLength === 0) throw new ModelLoadError("Model file is empty");

  const header = new TextDecoder().decode(new Uint8Array(data, 0, Math.min(4, data.byteLength)));
  if (header === GLB_MAGIC) return "glb";

  const text = decodeText(data);
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { asset?: { version?: unknown } };
      if (typeof parsed.asset?.version === "string") return "gltf";
    } catch {
      // A useful extension hint below lets the real parser report malformed glTF.
    }
  }

  if (/^(?:\s*(?:#.*)?\r?\n)*(?:\s*(?:v|vn|vt|f|o|g|mtllib|usemtl)\s+)/m.test(text)) {
    return "obj";
  }

  const hintedFormat = formatFromHint(sourceHint);
  if (hintedFormat) return hintedFormat;
  throw new ModelLoadError("Unsupported model format; expected OBJ, glTF, or GLB");
};

const hierarchyIsVisible = (object: THREE.Object3D): boolean => {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  return true;
};

const geometryIsRenderable = (geometry: THREE.BufferGeometry): boolean => {
  const position = geometry.getAttribute("position");
  if (!position || position.count < 3) return false;
  const primitiveVertexCount = geometry.index?.count ?? position.count;
  if (primitiveVertexCount < 3 || geometry.drawRange.count === 0) return false;

  const values = position.array;
  for (let index = 0; index < values.length; index += 1) {
    if (!Number.isFinite(values[index])) return false;
  }
  return true;
};

const extractRenderableGeometry = (root: THREE.Object3D): THREE.BufferGeometry => {
  root.updateMatrixWorld(true);
  let result: THREE.BufferGeometry | null = null;

  root.traverse((child) => {
    if (result || !(child instanceof THREE.Mesh) || !hierarchyIsVisible(child)) return;
    if (!geometryIsRenderable(child.geometry)) return;
    result = child.geometry.clone().applyMatrix4(child.matrixWorld);
  });

  if (!result) throw new ModelLoadError("Model does not contain renderable mesh geometry");

  const geometry = result as THREE.BufferGeometry;
  geometry.center();
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  if (!geometry.boundingSphere || !Number.isFinite(geometry.boundingSphere.radius)) {
    geometry.dispose();
    throw new ModelLoadError("Model geometry has invalid bounds");
  }
  return geometry;
};

const disposeLoadedObject = (root: THREE.Object3D): void => {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
};

export const parseModelGeometryData = async (
  data: ArrayBuffer,
  format: ModelFormat,
  resourcePath = "",
): Promise<THREE.BufferGeometry> => {
  let root: THREE.Object3D;
  if (format === "obj") {
    const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
    root = new OBJLoader().parse(decodeText(data));
  } else {
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const payload = format === "gltf" ? decodeText(data) : data;
    const gltf = await new GLTFLoader().parseAsync(payload, resourcePath);
    root = gltf.scene;
  }

  try {
    return extractRenderableGeometry(root);
  } finally {
    disposeLoadedObject(root);
  }
};

const getResourcePath = (sourceUrl: string): string => {
  if (sourceUrl.startsWith("blob:") || sourceUrl.startsWith("data:")) return "";
  try {
    return new URL(".", sourceUrl).href;
  } catch {
    return "";
  }
};

export const loadModelGeometry = async (sourceUrl: string): Promise<THREE.BufferGeometry> => {
  let response: Response;
  try {
    response = await fetch(sourceUrl);
  } catch (error) {
    throw new ModelLoadError(
      `Model file could not be read${error instanceof Error ? `: ${error.message}` : ""}`,
    );
  }
  if (!response.ok) {
    throw new ModelLoadError(`Model file could not be read (HTTP ${response.status})`);
  }

  const data = await response.arrayBuffer();
  if (data.byteLength > MAX_MODEL_BYTES) {
    throw new ModelLoadError("Model exceeds the 50 MB safety limit");
  }
  const format = detectModelFormat(data, sourceUrl);

  try {
    return await parseModelGeometryData(data, format, getResourcePath(sourceUrl));
  } catch (error) {
    if (error instanceof ModelLoadError) throw error;
    throw new ModelLoadError(
      `${format.toUpperCase()} model could not be parsed${error instanceof Error ? `: ${error.message}` : ""}`,
    );
  }
};

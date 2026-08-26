const readFile = (file: File, method: "readAsDataURL" | "readAsText"): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener(
      "load",
      () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error(`Expected ${method} to return a string result.`));
      },
      { once: true },
    );

    reader.addEventListener(
      "error",
      () => reject(reader.error ?? new Error(`Failed to read ${file.name}.`)),
      { once: true },
    );

    reader[method](file);
  });

export type IngestKind = "json" | "image" | "model" | "svg" | "unknown";

export const classifyUserFile = (file: File): IngestKind => {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".svg")) return "svg";
  if (name.endsWith(".obj") || name.endsWith(".gltf") || name.endsWith(".glb")) return "model";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/.test(name)) return "image";
  return "unknown";
};

export const readFileAsDataUrl = (file: File): Promise<string> => readFile(file, "readAsDataURL");

export const readTextFile = (file: File): Promise<string> => readFile(file, "readAsText");

export const loadImageFromSource = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error("Failed to decode uploaded image.")), {
      once: true,
    });

    image.src = src;
  });

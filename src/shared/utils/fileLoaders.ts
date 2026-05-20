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

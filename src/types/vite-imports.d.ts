// Vite raw import declarations for shader files
declare module "*.glsl?raw" {
  const content: string;
  export default content;
}

// Vite ?url import for web workers
declare module "modern-gif/worker?url" {
  const url: string;
  export default url;
}

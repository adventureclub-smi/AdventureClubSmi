// Shared by every place that conditionally mounts a react-three-fiber
// Canvas (the launch splash, the hero) — falls back to a flat/static
// version when WebGL genuinely isn't available, instead of leaving an
// empty gap or a caught render error.
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

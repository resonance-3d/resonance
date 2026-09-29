// Heading is clockwise from geographic north; movement stays on the local x/y plane.
export function cameraRelativeInput(right, forward, heading) {
  const length = Math.max(1, Math.hypot(right, forward));
  return {
    x: (right * Math.cos(heading) + forward * Math.sin(heading)) / length,
    y: (forward * Math.cos(heading) - right * Math.sin(heading)) / length,
  };
}
export function clampPitch(pitch) { return Math.max(-Math.PI * .46, Math.min(Math.PI * .46, pitch)); }

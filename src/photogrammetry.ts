import 'cesium/Build/Cesium/Widgets/widgets.css';
import './photogrammetry.css';
import { Viewer, Ion, Cesium3DTileset, Cartesian3, HeadingPitchRange, Matrix4, Math as CMath } from 'cesium';

// Standalone evaluation: no OSM/Bing basemap, geocoder, game geometry or export.
const status = document.querySelector<HTMLElement>('#status')!;
const viewer = new Viewer('view', {
  globe: false, baseLayer: false, baseLayerPicker: false, geocoder: false,
  animation: false, timeline: false, homeButton: false, sceneModePicker: false,
  navigationHelpButton: false, fullscreenButton: false, infoBox: false,
  selectionIndicator: false, requestRenderMode: true, maximumRenderTimeChange: Infinity,
});
viewer.resolutionScale = Math.min(1, 1.5 / window.devicePixelRatio);
viewer.scene.highDynamicRange = false;
// Camera target uses ellipsoid height; it is an approximate viewing preset,
// not a measured elevation or collision surface.
const center = Cartesian3.fromDegrees(11.03694, 43.92755, 110);
const views: Record<string, [number, number, number]> = {
  area: [15, -40, 650], square: [30, -30, 200], low: [15, -8, 95],
};
function setView(name: string) {
  const [heading, pitch, range] = views[name];
  viewer.camera.lookAt(center, new HeadingPitchRange(CMath.toRadians(heading), CMath.toRadians(pitch), range));
  viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  viewer.scene.requestRender();
}
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => {
  button.onclick = () => setView(button.dataset.view!);
});
setView('area');
async function start() {
  const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (!token) { status.textContent = 'Manca il token Cesium ion in .env.local.'; return; }
  Ion.defaultAccessToken = token;
  try {
    const tiles = await Cesium3DTileset.fromIonAssetId(2275207, {
      showCreditsOnScreen: true, maximumScreenSpaceError: 8,
      cacheBytes: 384 * 1024 * 1024, maximumCacheOverflowBytes: 128 * 1024 * 1024,
      enableCollision: true,
    });
    viewer.scene.primitives.add(tiles);
    let failures = 0;
    tiles.tileFailed.addEventListener(() => {
      failures++;
      status.textContent = `Alcune porzioni non sono disponibili (${failures}). Controlla rete e quota Cesium.`;
    });
    tiles.loadProgress.addEventListener((pending: number, processing: number) => {
      status.textContent = pending || processing
        ? `Caricamento: ${pending} richieste · ${processing} porzioni in preparazione`
        : failures ? `Vista caricata con ${failures} errori di streaming.`
        : 'Vista caricata · Google Photorealistic 3D Tiles';
    });
    document.querySelector<HTMLSelectElement>('#quality')!.onchange = event => {
      tiles.maximumScreenSpaceError = Number((event.target as HTMLSelectElement).value);
      viewer.scene.requestRender();
    };
    status.textContent = 'Servizio collegato · caricamento di Montemurlo…';
    viewer.scene.requestRender();
  } catch {
    // Never display endpoint errors containing signed URLs or credentials.
    status.textContent = 'Streaming non disponibile. Verifica accesso all’asset 2275207, restrizioni del token e quota su Cesium ion.';
  }
}
void start();
window.addEventListener('pagehide', () => viewer.destroy(), { once: true });

import { useMemo, type CSSProperties } from "react";

type EffectMode = "dark" | "light";
type FocusRole = "background" | "ui";

type FocusTarget = {
  selector: string;
  role: FocusRole;
  width?: string;
};

export type WovenClothProps = {
  mode?: EffectMode;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

export const WOVEN_CLOTH_DEFAULTS = {
  hue: 0,
  saturation: 1,
  brightness: 1,
} as const;

const WOVEN_CLOTH_TITLE = "Woven Cloth kinetic textile";
const WOVEN_CLOTH_BACKGROUND = "#16090b";
const WOVEN_CLOTH_TARGETS: readonly FocusTarget[] = [
  {
    selector: "body > div.fixed.inset-0.overflow-hidden.z-0",
    role: "background",
  },
];

const luminaWeaversClothSource = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Lumina Weavers · Kinetic Textiles, Kyoto</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
</head>
<body class="text-[#e8dcc4] overflow-hidden antialiased selection:bg-[#b02330] selection:text-white font-serif" style="background: radial-gradient(120% 100% at 50% 30%, #2a1113 0%, #1a0a0c 55%, #0f0607 100%); height: 100dvh; width: 100vw;">
  <div class="fixed inset-0 pointer-events-none z-0 bg-cover bg-center opacity-[0.15] mix-blend-screen" style="background-image: url('https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=2400&q=80');"></div>

  <div class="fixed inset-0 overflow-hidden z-0">
    <canvas id="cloth" class="absolute inset-0 w-full h-full block pointer-events-none"></canvas>
    <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(90% 80% at 50% 46%, transparent 55%, rgba(10,5,6,.72) 100%);"></div>
  </div>

  <div class="absolute inset-0 z-10 flex flex-col p-6 md:p-12 pointer-events-none font-sans">
    <header class="flex justify-between items-center w-full pointer-events-auto">
      <div class="overflow-hidden">
        <div class="reveal-item opacity-0 translate-y-8 text-xs tracking-[0.28em] uppercase text-[#b99a8f] font-medium">WOVEN CLOTH</div>
      </div>
      <nav class="hidden md:flex gap-8">
        <a href="#library" class="reveal-item block opacity-0 translate-y-8 text-xs tracking-widest uppercase text-[#e8dcc4]/80 hover:text-white transition-colors duration-300">Material Library</a>
        <a href="#trade" class="reveal-item block opacity-0 translate-y-8 text-xs tracking-widest uppercase text-[#e8dcc4]/80 hover:text-white transition-colors duration-300">Partnerships</a>
        <a href="#mill" class="reveal-item block opacity-0 translate-y-8 text-xs tracking-widest uppercase text-[#e8dcc4]/80 hover:text-white transition-colors duration-300">The Studio</a>
      </nav>
    </header>

    <div class="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 pointer-events-auto w-full">
      <div class="max-w-md space-y-6">
        <p class="word-reveal text-sm md:text-base leading-relaxed text-[#e8dcc4]/90">
          <strong class="text-white font-semibold block mb-1 text-base md:text-lg tracking-tight font-serif">Kinetic textiles, rendered to order.</strong>
          Every meter is simulated on bespoke kinetic engines. Digital threads, authentic physics, designed for infinite virtual environments.
        </p>
        <a href="#commission" class="reveal-item opacity-0 translate-y-8 inline-flex items-center gap-3 bg-[#b02330] hover:bg-[#961c27] text-white px-6 py-3 rounded-sm text-sm font-semibold tracking-wide transition-colors">Commission a textile →</a>
      </div>

      <div class="text-left sm:text-right mt-8 sm:mt-0">
        <div class="word-reveal text-xs tracking-[0.24em] uppercase text-[#b99a8f] leading-[1.9] font-medium">
          Vector &amp; matrix<br>
          No. 42 azure thread<br>
          Node 7 · Grid 2024
        </div>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      if (window.gsap) {
        window.gsap.to(".reveal-item", { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power3.out", delay: 0.2 });
      }
    });

    (() => {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const canvas = document.getElementById("cloth");
      if (!canvas || !window.THREE) return;

      function makeClothTexture() {
        const W = 1280, H = 800;
        const c = document.createElement("canvas");
        c.width = W; c.height = H;
        const x = c.getContext("2d");
        if (!x) throw new Error("Unable to create cloth texture context");

        const g = x.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#efe6d4");
        g.addColorStop(0.5, "#e9dfca");
        g.addColorStop(1, "#e3d7bf");
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);

        x.strokeStyle = "#a5202c";
        x.lineWidth = 10;
        x.strokeRect(46, 46, W - 92, H - 92);
        x.lineWidth = 3;
        x.strokeStyle = "#7c1622";
        x.strokeRect(66, 66, W - 132, H - 132);

        x.fillStyle = "#a5202c";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.font = 'bold 78px Georgia, "Times New Roman", serif';
        x.fillText("W C", W / 2, 190);
        x.font = 'normal 20px "Helvetica Neue", Arial, sans-serif';
        x.fillStyle = "#7c1622";
        x.fillText("· WOVEN CLOTH ·", W / 2, 246);
        x.fillStyle = "#9e1e2a";
        x.font = 'bold 118px Georgia, "Times New Roman", serif';
        x.fillText("WOVEN", W / 2, 400);
        x.fillText("CLOTH", W / 2, 520);
        x.fillStyle = "#7c1622";
        x.font = '600 30px "Helvetica Neue", Arial, sans-serif';
        x.fillText("T E X T I L E   S I M U L A T I O N", W / 2, 626);

        for (let yy = 0; yy < H; yy += 3) {
          x.strokeStyle = "rgba(60,30,20,0.05)";
          x.lineWidth = 1;
          x.beginPath(); x.moveTo(0, yy + 0.5); x.lineTo(W, yy + 0.5); x.stroke();
        }
        for (let xx = 0; xx < W; xx += 3) {
          x.strokeStyle = "rgba(255,250,235,0.06)";
          x.beginPath(); x.moveTo(xx + 0.5, 0); x.lineTo(xx + 0.5, H); x.stroke();
        }

        const id = x.getImageData(0, 0, W, H);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const n = (Math.random() * 2 - 1) * 10;
          d[i] += n; d[i + 1] += n; d[i + 2] += n;
        }
        x.putImageData(id, 0, 0);

        const tex = new THREE.CanvasTexture(c);
        tex.anisotropy = 4;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      }

      const scene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const BW = 4.4, BH = 2.75, GX = 40, GY = 26;
      const geo = new THREE.PlaneGeometry(BW, BH, GX, GY);
      const mat = new THREE.MeshPhongMaterial({ map: makeClothTexture(), side: THREE.DoubleSide, shininess: 6, specular: 0x2a1410, color: 0xffffff });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      scene.add(new THREE.AmbientLight(0xffe9d0, 0.62));
      const key = new THREE.DirectionalLight(0xfff0dc, 1.15);
      key.position.set(-3, 3.5, 3.2);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xb02330, 0.42);
      rim.position.set(3, -1.5, 2.0);
      scene.add(rim);

      const pos = geo.attributes.position;
      const N = (GX + 1) * (GY + 1);
      const cur = new Float32Array(N * 3), prev = new Float32Array(N * 3), rest = new Float32Array(N * 3);
      const pinned = new Uint8Array(N);

      for (let i = 0; i < N; i++) {
        const ax = pos.getX(i), ay = pos.getY(i);
        cur[i * 3] = prev[i * 3] = rest[i * 3] = ax;
        cur[i * 3 + 1] = prev[i * 3 + 1] = rest[i * 3 + 1] = ay;
        cur[i * 3 + 2] = prev[i * 3 + 2] = rest[i * 3 + 2] = 0;
      }
      for (let ix = 0; ix <= GX; ix++) pinned[ix] = 1;

      const idx = (ix, iy) => ix + iy * (GX + 1);
      const restH = BW / GX, restV = BH / GY;
      const GRAV = -3.1, DAMP = 0.985, DT = 0.016;

      function wind(ix, iy, t) {
        const cx = ix / GX, cy = iy / GY;
        const travel = t * 1.7 - cy * 4.2;
        const gust = 0.6 + 0.42 * Math.sin(t * 0.6) + 0.18 * Math.sin(t * 1.9 + 1.3);
        const amp = 4.3 * cy;
        const fz = (Math.sin(travel + cx * 3.3) + 0.5 * Math.sin(travel * 1.7 + cx * 6.0)) * amp * gust;
        const fx = Math.sin(t * 0.9 + cy * 2.2) * 0.6 * cy;
        const fy = -0.4 * cy;
        return [fx, fy, fz];
      }

      function solve(a, b, rl) {
        let dx = cur[b * 3] - cur[a * 3];
        let dy = cur[b * 3 + 1] - cur[a * 3 + 1];
        let dz = cur[b * 3 + 2] - cur[a * 3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const diff = ((d - rl) / d) * 0.5;
        dx *= diff; dy *= diff; dz *= diff;
        const pa = pinned[a], pb = pinned[b];
        if (!pa && !pb) {
          cur[a * 3] += dx; cur[a * 3 + 1] += dy; cur[a * 3 + 2] += dz;
          cur[b * 3] -= dx; cur[b * 3 + 1] -= dy; cur[b * 3 + 2] -= dz;
        } else if (pa && !pb) {
          cur[b * 3] -= dx * 2; cur[b * 3 + 1] -= dy * 2; cur[b * 3 + 2] -= dz * 2;
        } else if (!pa && pb) {
          cur[a * 3] += dx * 2; cur[a * 3 + 1] += dy * 2; cur[a * 3 + 2] += dz * 2;
        }
      }

      function step(t) {
        for (let iy = 0; iy <= GY; iy++) {
          for (let ix = 0; ix <= GX; ix++) {
            const i = idx(ix, iy);
            if (pinned[i]) continue;
            const [fx, fy, fz] = wind(ix, iy, t);
            for (let k = 0; k < 3; k++) {
              const j = i * 3 + k;
              const a = k === 0 ? fx : k === 1 ? fy + GRAV : fz;
              const v = (cur[j] - prev[j]) * DAMP;
              prev[j] = cur[j];
              cur[j] = cur[j] + v + a * DT * DT;
            }
          }
        }

        for (let it = 0; it < 3; it++) {
          for (let iy = 0; iy <= GY; iy++) for (let ix = 0; ix < GX; ix++) solve(idx(ix, iy), idx(ix + 1, iy), restH);
          for (let iy = 0; iy < GY; iy++) for (let ix = 0; ix <= GX; ix++) solve(idx(ix, iy), idx(ix, iy + 1), restV);
        }

        for (let ix = 0; ix <= GX; ix++) {
          const i = ix;
          cur[i * 3] = rest[i * 3]; cur[i * 3 + 1] = rest[i * 3 + 1]; cur[i * 3 + 2] = rest[i * 3 + 2];
          prev[i * 3] = rest[i * 3]; prev[i * 3 + 1] = rest[i * 3 + 1]; prev[i * 3 + 2] = rest[i * 3 + 2];
        }
      }

      function commit() {
        for (let i = 0; i < N; i++) pos.setXYZ(i, cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]);
        pos.needsUpdate = true;
        geo.computeVertexNormals();
      }

      let camera;
      function fit() {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h, false);
        const aspect = w / h;
        camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
        const vFit = (BH / 2) / Math.tan(42 * Math.PI / 360);
        const hFit = (BW / 2) / Math.tan(42 * Math.PI / 360) / aspect;
        camera.position.set(0, 0.05, Math.max(vFit, hFit) * 1.16 + 0.4);
        camera.lookAt(0, 0, 0);
      }

      window.addEventListener("resize", fit);
      fit();

      let running = false, raf = 0, t = 0;
      function loop() {
        if (!running) return;
        t += DT; step(t); commit(); renderer.render(scene, camera); raf = requestAnimationFrame(loop);
      }
      function start() { if (running) return; running = true; raf = requestAnimationFrame(loop); }
      function stop() { running = false; cancelAnimationFrame(raf); }

      if (reduce) {
        for (let s = 0; s < 220; s++) step(s * DT);
        commit(); renderer.render(scene, camera);
      } else {
        for (let s = 0; s < 40; s++) step(s * DT);
        t = 40 * DT; start();
        document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
      }
    })();
  </script>
</body>
</html>`;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function replaceRequired(source: string, authored: string, focused: string) {
  if (!source.includes(authored)) {
    throw new Error(`Woven Cloth source adapter could not find: ${authored}`);
  }
  return source.replace(authored, focused);
}

function wovenClothLabelSource(source: string) {
  return [
    ["W C", "W C"],
    ["· WOVEN CLOTH ·", "· WOVEN CLOTH ·"],
    ["WOVEN", "WOVEN"],
    ["CLOTH", "CLOTH"],
  ].reduce((adapted, [authored, focused]) => {
    if (!adapted.includes(authored)) return adapted;
    return replaceRequired(adapted, authored, focused);
  }, source);
}

function buildFocusedDocument(mode: EffectMode) {
  void mode;
  const targetJson = JSON.stringify(WOVEN_CLOTH_TARGETS).replace(/</g, "\\u003c");
  const background = WOVEN_CLOTH_BACKGROUND;
  const focusStyle = `<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${background} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; }
[data-threeui-role="ui"] { position: relative !important; z-index: 1 !important; width: min(calc(100% - 32px), var(--threeui-target-width, 1040px)) !important; max-width: none !important; max-height: calc(100% - 32px) !important; margin: auto !important; overflow: auto !important; opacity: 1 !important; transform: none !important; filter: none !important; flex: none !important; box-sizing: border-box !important; }
</style>`;
  const focusScript = `<script data-threeui-focus>
(function () {
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${targetJson};
    var roots = [];
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute('data-threeui-role', spec.role);
      if (spec.width) element.style.setProperty('--threeui-target-width', spec.width);
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) { document.body.appendChild(root); });
    Array.from(document.body.children).forEach(function (element) {
      if (roots.indexOf(element) !== -1) return;
      element.setAttribute('data-threeui-residual', '');
      element.setAttribute('aria-hidden', 'true');
    });
    document.body.setAttribute('data-threeui-ready', '');
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  function scheduleIsolation() { setTimeout(isolate, 100); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleIsolation, { once: true });
  else scheduleIsolation();
  window.addEventListener('load', isolate, { once: true });
})();
</script>`;
  return wovenClothLabelSource(luminaWeaversClothSource)
    .replace(/<\/head>/i, `${focusStyle}</head>`)
    .replace(/<\/body>/i, `${focusScript}</body>`);
}

function WovenCloth({
  mode = "dark",
  hue = WOVEN_CLOTH_DEFAULTS.hue,
  saturation = WOVEN_CLOTH_DEFAULTS.saturation,
  brightness = WOVEN_CLOTH_DEFAULTS.brightness,
  className,
  style,
}: WovenClothProps) {
  const safeMode: EffectMode = mode === "light" ? "light" : "dark";
  const source = useMemo(() => buildFocusedDocument(safeMode), [safeMode]);
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);
  const filter =
    safeHue === 0 && safeSaturation === 1 && safeBrightness === 1
      ? undefined
      : `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`;

  return (
    <iframe
      className={className}
      data-mode={safeMode}
      title={WOVEN_CLOTH_TITLE}
      srcDoc={source}
      sandbox="allow-scripts"
      loading="eager"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        border: 0,
        background: WOVEN_CLOTH_BACKGROUND,
        filter,
        ...style,
      }}
    />
  );
}

export default WovenCloth;

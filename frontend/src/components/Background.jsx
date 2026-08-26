import React, { useRef, useEffect } from "react";

/**
 * DitherBackground — Dithering Ordenado Bayer 4×4 con Animación por Bloques
 *
 * Especificaciones (Figma exact match):
 *  - Matriz: Bayer 4×4 ordenada
 *  - Size: 2px por bloque
 *  - Levels: 4 niveles de cuantización por canal (R, G, B por separado)
 *  - Brightness: 103% (x 1.03)
 *  - Contrast: 1 (sin cambio)
 *  - Mono: false
 *  - Bloques negro puro: transparentes (revelan el fondo oscuro)
 *  - Animación: % de bloques con umbral oscilante en seno con fase propia
 */

// Parámetros configurables
const BLOCK_SIZE = 2; // 2px por bloque
const LEVELS = 4; // 4 niveles de cuantización por canal
const BRIGHTNESS = 1.03; // 103% de brillo
const CONTRAST = 1.0; // 1 (sin cambio)
const FLICKER_FRACTION = 0.25; // 18% de bloques animados
const SPEED = 2.4; // Velocidad base de oscilación
const OSC_AMP = 0.45; // Amplitud de oscilación del umbral
const TARGET_FPS = 60; // Tasa de refresco

// Matriz Bayer 4×4 normalizada [0..15] / 16
const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
];

export default function DitherBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let ro;
    let lastTime = 0;
    const interval = 1000 / TARGET_FPS;

    const img = new Image();
    img.src = "/background/ditther-background.png";

    const initDither = async () => {
      // Esperar a que las fuentes web (Dancing Script / Caveat) estén listas
      try {
        await document.fonts.ready;
      } catch (e) {}

      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      // 1. Obtener píxeles de la imagen original
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = imgW;
      sampleCanvas.height = imgH;
      const sCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
      sCtx.drawImage(img, 0, 0);

      // Calcular posición inferior derecha dentro del área visible según aspect ratio
      const cw = canvas.offsetWidth || 500;
      const ch = canvas.offsetHeight || 900;
      const visibleImgW = (cw / ch) * imgH;
      const rightX = Math.min(imgW - 16, Math.floor((imgW / 2) + (visibleImgW / 2) - 18));
      const bottomY = imgH - 8;

      // Dibujar texto "UdeA" en cursiva integrado antes del dithering
      sCtx.save();
      sCtx.font = "italic 700 56px 'Dancing Script', 'Caveat', 'Brush Script MT', 'Segoe Script', cursive";
      sCtx.textAlign = "right";
      sCtx.textBaseline = "bottom";

      // Sombra oscura suave para contraste contra árboles/edificios
      sCtx.fillStyle = "rgba(0, 0, 0, 0.85)";
      sCtx.fillText("UdeA", rightX + 2, bottomY + 2);

      // Letras blancas cursivas para que el Bayer 4x4 las cuantice en dither
      sCtx.fillStyle = "rgba(255, 255, 255, 0.96)";
      sCtx.fillText("UdeA", rightX, bottomY);
      sCtx.restore();

      const imgData = sCtx.getImageData(0, 0, imgW, imgH).data;

      // 2. Definir grid en bloques de 2×2 px
      const gridW = Math.floor(imgW / BLOCK_SIZE);
      const gridH = Math.floor(imgH / BLOCK_SIZE);
      const numBlocks = gridW * gridH;

      // 3. Estructuras de datos por bloque para máxima velocidad
      const baseR = new Float32Array(numBlocks);
      const baseG = new Float32Array(numBlocks);
      const baseB = new Float32Array(numBlocks);
      const baseA = new Uint8Array(numBlocks);
      const bayerThreshold = new Float32Array(numBlocks);
      const isAnimated = new Uint8Array(numBlocks);
      const phases = new Float32Array(numBlocks);
      const speeds = new Float32Array(numBlocks);

      // Precalcular datos de cada bloque
      for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
          const bIdx = gy * gridW + gx;
          const srcX = gx * BLOCK_SIZE;
          const srcY = gy * BLOCK_SIZE;

          // Promedio de color del bloque de 2x2
          let rSum = 0,
            gSum = 0,
            bSum = 0,
            aSum = 0,
            count = 0;
          for (let dy = 0; dy < BLOCK_SIZE && srcY + dy < imgH; dy++) {
            for (let dx = 0; dx < BLOCK_SIZE && srcX + dx < imgW; dx++) {
              const pIdx = ((srcY + dy) * imgW + (srcX + dx)) * 4;
              rSum += imgData[pIdx];
              gSum += imgData[pIdx + 1];
              bSum += imgData[pIdx + 2];
              aSum += imgData[pIdx + 3];
              count++;
            }
          }

          let r = rSum / count / 255.0;
          let g = gSum / count / 255.0;
          let b = bSum / count / 255.0;
          const a = (aSum / count) | 0;

          // Aplicar brillo (x 1.03) y contraste
          r = Math.min(
            1.0,
            Math.max(0.0, (r * BRIGHTNESS - 0.5) * CONTRAST + 0.5),
          );
          g = Math.min(
            1.0,
            Math.max(0.0, (g * BRIGHTNESS - 0.5) * CONTRAST + 0.5),
          );
          b = Math.min(
            1.0,
            Math.max(0.0, (b * BRIGHTNESS - 0.5) * CONTRAST + 0.5),
          );

          baseR[bIdx] = r;
          baseG[bIdx] = g;
          baseB[bIdx] = b;
          baseA[bIdx] = a;

          // Umbral de la matriz Bayer 4x4 correspondiente a este bloque
          bayerThreshold[bIdx] = BAYER_4X4[gy % 4][gx % 4];

          // Asignar si este bloque es animado y su fase aleatoria
          const anim = Math.random() < FLICKER_FRACTION;
          isAnimated[bIdx] = anim ? 1 : 0;
          phases[bIdx] = Math.random() * Math.PI * 2;
          speeds[bIdx] = SPEED * (0.8 + Math.random() * 0.4);
        }
      }

      // 4. Canvas offscreen del tamaño del grid (1 px = 1 bloque de 2x2)
      const offGrid = document.createElement("canvas");
      offGrid.width = gridW;
      offGrid.height = gridH;
      const offCtx = offGrid.getContext("2d");
      const gridImageData = offCtx.createImageData(gridW, gridH);
      const grid32 = new Uint32Array(gridImageData.data.buffer);

      // Ajuste responsivo de tamaño
      const resize = () => {
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      };
      resize();
      ro = new ResizeObserver(resize);
      ro.observe(canvas);

      // Cuantización de color con umbral
      const quantSteps = LEVELS - 1; // 3 pasos para 4 niveles: 0, 1/3, 2/3, 1
      const spread = 1.0 / quantSteps; // 0.3333

      const quantize = (val, threshold) => {
        // Desplazamiento por umbral Bayer centrado
        const dithered = val + (threshold - 0.5) * spread;
        const clamped = dithered < 0 ? 0 : dithered > 1 ? 1 : dithered;
        const level = Math.round(clamped * quantSteps);
        return Math.round((level / quantSteps) * 255);
      };

      let startTime = performance.now();

      const draw = (now) => {
        animId = requestAnimationFrame(draw);

        if (now - lastTime < interval) return;
        lastTime = now;

        const timeSec = (now - startTime) / 1000.0;

        // Renderizar todos los bloques
        for (let i = 0; i < numBlocks; i++) {
          if (baseA[i] < 20) {
            grid32[i] = 0; // Transparente
            continue;
          }

          let threshold = bayerThreshold[i];

          // Si es un bloque animado, oscilar el umbral con seno
          if (isAnimated[i] === 1) {
            const osc = Math.sin(timeSec * speeds[i] + phases[i]);
            threshold += osc * OSC_AMP;
          }

          // Cuantizar canales R, G y B por separado
          const rQ = quantize(baseR[i], threshold);
          const gQ = quantize(baseG[i], threshold);
          const bQ = quantize(baseB[i], threshold);

          // Si resulta en negro puro (0,0,0), dejarlo transparente para el fondo oscuro
          if (rQ === 0 && gQ === 0 && bQ === 0) {
            grid32[i] = 0;
          } else {
            // Empaquetar píxel RGBA (Little Endian: AABBGGRR)
            grid32[i] = (255 << 24) | (bQ << 16) | (gQ << 8) | rQ;
          }
        }

        // Volcar píxeles al canvas auxiliar
        offCtx.putImageData(gridImageData, 0, 0);

        // Dibujar en el canvas principal escalado con 'cover' y píxeles nítidos
        const cw = canvas.width;
        const ch = canvas.height;
        ctx.imageSmoothingEnabled = false;

        const hRatio = cw / imgW;
        const vRatio = ch / imgH;
        const ratio = Math.max(hRatio, vRatio);

        const renderW = imgW * ratio;
        const renderH = imgH * ratio;
        const offsetX = (cw - renderW) / 2;
        const offsetY = (ch - renderH) / 2;

        ctx.fillStyle = "#0b0b0c";
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(offGrid, offsetX, offsetY, renderW, renderH);
      };

      animId = requestAnimationFrame(draw);
    };

    img.onload = initDither;

    return () => {
      cancelAnimationFrame(animId);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#0b0b0c]">
      {/* Canvas principal con Dithering Bayer 4x4 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          imageRendering: "pixelated",
        }}
      />

      {/* Viñeta sutil para integrarse con la interfaz */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(11,11,12,0.45) 0%, transparent 45%, rgba(11,11,12,0.15) 100%)",
        }}
      />
    </div>
  );
}

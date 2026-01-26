import React, { useEffect, useState, useRef } from 'react';

export default function ColorBlobs({ dark = false, className = '' }) {
    const [debugVisible, setDebugVisible] = useState(() => {
        try {
            const val = localStorage.getItem('colorBlobsDebug');
            if (val === null) return true; // default visible when not set
            return val === 'true';
        } catch (e) {
            return true;
        }
    });

    useEffect(() => {
        const handler = () => {
            try {
                setDebugVisible(localStorage.getItem('colorBlobsDebug') === 'true');
            } catch (e) {
                setDebugVisible(false);
            }
        };
        window.addEventListener('colorBlobs:update', handler);
        return () => window.removeEventListener('colorBlobs:update', handler);
    }, []);

    const palette = dark
        ? [
            'rgba(105,58,183,0.28)', // purple
            'rgba(0,149,246,0.20)',  // blue
            'rgba(0,210,161,0.14)',  // teal
            'rgba(255, 138, 128, 0.12)' // warm accent
        ]
        : [
            'rgba(255,104,104,0.22)', // coral
            'rgba(85,139,255,0.18)',  // blue
            'rgba(255,199,102,0.14)', // warm
            'rgba(99,255,210,0.12)'   // mint
        ];

    // Larger, softer blobs that move broadly across the canvas
    const blobs = [
        { left: '5%', top: '6%', w: 840, h: 840, color: palette[0], dur: '28s', tx: 180, ty: 140, blur: 80, opacity: 0.26 },
        { left: '18%', top: '60%', w: 720, h: 720, color: palette[1], dur: '34s', tx: -200, ty: 220, blur: 96, opacity: 0.24 },
        { left: '58%', top: '8%', w: 520, h: 520, color: palette[2], dur: '30s', tx: 360, ty: -180, blur: 84, opacity: 0.28 },
        { left: '74%', top: '52%', w: 860, h: 860, color: palette[3], dur: '40s', tx: -220, ty: 200, blur: 120, opacity: 0.22 },
        { left: '38%', top: '36%', w: 620, h: 620, color: palette[0], dur: '26s', tx: 120, ty: 150, blur: 56, opacity: 0.20 },
    ];

    // Utility to set alpha for rgba strings (simple, expects rgb/rgba inputs)
    const setAlpha = (color, a) => {
        try {
            if (!color) return color;
            if (color.startsWith('rgba')) {
                return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/, `rgba($1,$2,$3,${a})`);
            }
            if (color.startsWith('rgb')) {
                return color.replace(/rgb\(([^\)]+)\)/, (m, groups) => `rgba(${groups},${a})`);
            }
            return color; // fallback
        } catch (e) {
            return color;
        }
    }; 

    const gatherRef = useRef(blobs.map(() => ({ gx: 0, gy: 0 }))); // current applied offsets
    const gatherTargetRef = useRef(blobs.map(() => ({ gx: 0, gy: 0 }))); // target offsets we smoothly approach
    const prevPositionsRef = useRef(blobs.map(() => ({ x: 0, y: 0, r: 0 })));
    const mountedRef = useRef(true);
    const blobRefs = useRef([]);
    const rafRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;

        const triggerGather = () => {
            const cw = window.innerWidth;
            const ch = window.innerHeight;
            const clusterX = cw * (0.48 + (Math.random() - 0.5) * 0.16);
            const clusterY = ch * (0.44 + (Math.random() - 0.5) * 0.2);

            const target = blobs.map(b => {
                const leftPct = parseFloat(b.left) || 50;
                const topPct = parseFloat(b.top) || 50;
                const bx = (leftPct / 100) * cw;
                const by = (topPct / 100) * ch;
                const vx = (clusterX - bx) * (0.45 + Math.random() * 0.35);
                const vy = (clusterY - by) * (0.45 + Math.random() * 0.35);
                return { gx: vx, gy: vy };
            });

            // Set the target offsets (RAF loop will smoothly approach them)
            gatherTargetRef.current = target;

            // Release back to zero after a while
            setTimeout(() => {
                gatherTargetRef.current = blobs.map(() => ({ gx: 0, gy: 0 }));
            }, 2400 + Math.random() * 1200);
        };

        const interval = setInterval(triggerGather, 9000 + Math.random() * 8000);
        const initial = setTimeout(triggerGather, 1500);

        // Start the RAF-driven movement loop (replaces CSS keyframes for smooth uninterrupted movement)
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReduced) {
            const phases = blobs.map(() => ({ phaseX: Math.random() * Math.PI * 2, phaseY: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.6 }));

            const loop = (now) => {
                const t = now / 1000;
                blobs.forEach((b, i) => {
                    const el = blobRefs.current[i];
                    if (!el) return;
                    const phase = phases[i];

                    // Increase amplitude so blobs move more across the screen
                    const ampX = (debugVisible ? 1.6 : 1.4) * b.tx;
                    const ampY = (debugVisible ? 1.6 : 1.3) * b.ty;

                    // wider, smooth multi-frequency wobble
                    const wobbleX = Math.sin(t * (0.28 + phase.speed * 0.45)) * ampX * 0.9 + Math.sin(t * (0.12 + phase.speed * 0.3)) * ampX * 0.32;
                    const wobbleY = Math.cos(t * (0.22 + phase.speed * 0.4)) * ampY * 0.9 + Math.cos(t * (0.1 + phase.speed * 0.28)) * ampY * 0.28;

                    const g = gatherRef.current[i] || { gx: 0, gy: 0 };
                    const gx = g.gx * (debugVisible ? 1.0 : 1.1);
                    const gy = g.gy * (debugVisible ? 1.0 : 1.1);

                    const targetX = wobbleX + gx * 1.0;
                    const targetY = wobbleY + gy * 1.0;
                    const targetR = Math.sin(t + phase.phaseX) * (debugVisible ? 1.6 : 0.6);

                    // Smooth from previous to target to avoid micro-jumps
                    const prev = prevPositionsRef.current[i] || { x: 0, y: 0, r: 0 };
                    const lerp = (a, b, f) => a + (b - a) * f;
                    const smoothX = lerp(prev.x, targetX, 0.08);
                    const smoothY = lerp(prev.y, targetY, 0.08);
                    const smoothR = lerp(prev.r, targetR, 0.06);
                    prevPositionsRef.current[i] = { x: smoothX, y: smoothY, r: smoothR };

                    el.style.transform = `translate3d(${smoothX.toFixed(2)}px, ${smoothY.toFixed(2)}px, 0) rotate(${smoothR.toFixed(2)}deg)`;
                });
                rafRef.current = requestAnimationFrame(loop);
            };
            rafRef.current = requestAnimationFrame(loop);
        }

        return () => {
            mountedRef.current = false;
            clearInterval(interval);
            clearTimeout(initial);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [debugVisible]);

    return (
        <div aria-hidden className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={debugVisible ? { zIndex: 99999 } : {}}>
            {blobs.map((b, i) => {
                const g = gatherRef.current[i] || { gx: 0, gy: 0 };
                const usedColor = b.color;
                // Make base look more diffuse and lower opacity on normal mode; debugVisible still shows stronger but not harsh
                const usedBlur = debugVisible ? Math.max(12, Math.floor(b.blur / 3)) : Math.floor(b.blur * 1.25);
                const usedOpacity = debugVisible ? Math.min(Math.max(b.opacity * 1.8, 0.40), 0.9) : Math.min(b.opacity * (dark ? 0.5 : 0.45), 0.20);
                const blend = debugVisible ? 'normal' : (dark ? 'screen' : 'normal');
                const topZ = debugVisible ? 99999 : undefined;
                const bg = debugVisible ? usedColor.replace(/\)$/, ', 0.65)') : `radial-gradient(circle at 30% 30%, ${usedColor}, rgba(255,255,255,0) 35%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.03), rgba(255,255,255,0) 50%)`; 

                // Calculate core / halo colors and sizes
                const coreColor = setAlpha(usedColor, debugVisible ? 0.85 : 0.48);
                const haloColor = setAlpha(usedColor, debugVisible ? 0.30 : 0.10);
                const coreBlur = debugVisible ? Math.max(8, Math.floor(usedBlur / 5)) : Math.max(10, Math.floor(usedBlur / 1.8));
                const haloBlur = Math.floor(usedBlur * (debugVisible ? 1.25 : 1.8));
                const coreOpacity = debugVisible ? Math.min(1, usedOpacity * 0.9) : Math.min(1, usedOpacity * 0.75);

                return (
                    <div
                        key={i}
                        ref={(el) => (blobRefs.current[i] = el)}
                        className="blob-wrapper"
                        style={{
                            left: b.left,
                            top: b.top,
                            width: `${debugVisible ? Math.round(b.w * 1.18) : b.w}px`,
                            height: `${debugVisible ? Math.round(b.h * 1.18) : b.h}px`,
                            zIndex: topZ,
                            position: 'absolute',
                        }}
                    >
                        <div className="blob-halo" style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '9999px',
                            background: `radial-gradient(circle at 50% 50%, ${haloColor}, rgba(255,255,255,0) 60%)`,
                            filter: `blur(${haloBlur}px)`,
                            opacity: debugVisible ? Math.min(1, usedOpacity * 0.95) : usedOpacity * 0.9,
                            mixBlendMode: blend,
                            transition: 'opacity 900ms ease, filter 1000ms ease'
                        }} />
                    </div>
                );
            })}

            <style>{`
                .blob { position: absolute; border-radius: 9999px; will-change: transform, opacity; }

                /* Movement driven by RAF loop to avoid loop reset snapping; keyframes removed */

                @media (prefers-reduced-motion: reduce) {
                    .blob { animation: none !important; }
                    .blob-wrapper { transition: none !important; }
                }

                .blob-wrapper { position: absolute; overflow: visible; pointer-events: none; }
                .blob-core { transform-origin: center; }
                .blob-halo { transform-origin: center; }

                @media (max-width: 640px) {
                    .blob-wrapper { opacity: 0.7 !important; }
                    .blob-core { filter: blur(10px) !important; }
                    .blob-halo { filter: blur(44px) !important; }
                }
            `}</style>
        </div>
    );
}

import React from 'react';

export default function ParallaxBackground() {
    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-white">
            <div className='absolute w-full h-full bg-amber-50/30'>
            </div>
            <div className='absolute w-full h-full bg-white/20 flex justify-center items-end'>
                <span
                    style={{
                        fontSize: "clamp(5rem, 18vw, 15rem)",
                        fontWeight: 900,
                        lineHeight: 1,
                        marginBottom: "-2.5%",
                        backgroundImage: `
                          linear-gradient(
                            to top,
                            var(--color-text) 0%,
                            var(--color-text) 35%,
                            color-mix(in srgb, var(--color-text) 65%, transparent) 45%,
                            color-mix(in srgb, var(--color-text) 15%, transparent) 65%,
                            transparent 70%
                          )
                        `,
                        opacity: 0.3,
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                    }}
                >
                    UdeA
                </span>
            </div>
            <img
                src="/background/fondo-new.jpg"
                alt="Fondo Dithering"
                className="w-full h-full object-cover"
            />
        </div>
    );
}


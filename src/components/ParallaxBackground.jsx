import React, { useState, useEffect } from 'react';

export default function ParallaxBackground() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const bushes = [
        // Biblioteca
        { x: '-left-10', bottom: 'bottom-80', scale: 4, depth: 33, opacity: 0.6  },
        { x: '-left-45', bottom: 'bottom-78', scale: 4.5, depth: 32, opacity: 0.85  },
        { x: '-left-45', bottom: 'bottom-70', scale: 7, depth: 32  },

        // Fuente
        { x: 'left-80 ml-56', bottom: 'bottom-80', scale: 3.5, depth: 28 },
        { x: 'left-100 ml-56', bottom: 'bottom-80', scale: 3.9, depth: 40 },

        // Auditorio
        { x: 'right-12', bottom: 'bottom-75', scale: 2.3, depth: 22, opacity: 0.7 },
        { x: 'right-10', bottom: 'bottom-68', scale: 1.9, depth: 24 },

        // Relleno natural
        { x: 'right-2', bottom: 'bottom-140', scale: 14, depth: 90, opacity: 0.9 },
        { x: 'right-1/4', bottom: 'bottom-90', scale: 10, depth: 100, opacity: 0.8 },
    ];

    // Arbustos que van atrás de la fuente
    const bushesBeforeBackground = [
        { x: 'left-100 ml-56', bottom: 'bottom-100', scale: 4.5, depth: 20 },
        { x: 'left-130 ml-56', bottom: 'bottom-95', scale: 4, depth: 16 },
    ];

    // Nubes con imagen - diferentes posiciones, rotaciones y opacidades
    const clouds = [
        { left: '-5%', top: '8%', width: 900, speed: 20, opacity: 0.5, rotation: -5 },
        { left: '25%', top: '-5%', width: 800, speed: 23, opacity: 0.75, rotation: 3 },
        { left: '48%', top: '12%', width: 50, speed: 23, opacity: 0.9, rotation: -8 },
        { left: '68%', top: '6%', width: 700, speed: 22.8, opacity: 0.8, rotation: 5 },
        { left: '12%', top: '18%', width: 150, speed: 23.5, opacity: 0.7, rotation: -3 },
        { left: '82%', top: '14%', width: 600, speed: 23.2, opacity: 0.35, rotation: 7 },
        { left: '38%', top: '-5%', width: 900, speed: 21.8, opacity: 0.85, rotation: -6 },
        { left: '58%', top: '16%', width: 5000, speed: 22.3, opacity: 0.8, rotation: 4 },
        { left: '90%', top: '10%', width: 160, speed: 24, opacity: 0.7, rotation: -4 },
        { left: '20%', top: '24%', width: 400, speed: 23.5, opacity: 0.75, rotation: 6 },
        { left: '40%', top: '24%', width: 500, speed: 23.5, opacity: 0.35, rotation: 6 },
    ];


    useEffect(() => {
        const handleMouseMove = (e) => {
            // Normalizar la posición del mouse a un rango de -1 a 1
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="flex-1 h-full relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
            {/* Fondo base (cielo) - expandido con imagen */}
            <div
                className="absolute inset-0 transition-transform duration-500 ease-out"
                style={{
                    transform: `translate(${mousePosition.x * 5}px, ${mousePosition.y * 5}px) scale(1.2)`,
                }}
            >
                <img
                    src="/background/fondo.jpg"
                    alt="Fondo"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0" />
            </div>

            {/* Nubes - detrás de los árboles */}
            <div className="absolute inset-0 pointer-events-none z-[3]">
                {clouds.map((cloud, i) => (
                    <div
                        key={i}
                        className="absolute transition-transform duration-800 ease-out"
                        style={{
                            left: cloud.left,
                            top: cloud.top,
                            transform: `translateX(${mousePosition.x * cloud.speed}px) rotate(${cloud.rotation}deg)`,
                            opacity: cloud.opacity,
                        }}
                    >
                        <img
                            src="/background/nube.png"
                            alt="Nube"
                            style={{
                                width: `${cloud.width}px`,
                                height: 'auto',
                            }}
                            className="drop-shadow-lg"
                        />
                    </div>
                ))}
            </div>

            {/* Árboles de fondo - capa lejana más grande */}
            <div
                className="absolute -bottom-0 -left-10 -right-10 h-3/4 transition-transform duration-300 ease-out z-[4]"
                style={{
                    transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 10}px) scale(1)`,
                }}
            >
                <img
                    src="/background/arboles.png"
                    alt="Árboles"
                    className="absolute bottom-0 left-0 w-full h-auto object-cover"
                />
            </div>

            {/* Edificios - Biblioteca (izquierda) - mucho más grande */}
            <div
                className="absolute bottom-50 left-50 transition-transform duration-200 ease-out"
                style={{
                    transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * 20}px) scale(2)`,
                }}
            >
                <img
                    src="/background/biblioteca.png"
                    alt="Biblioteca"
                    className="w-[500px] h-auto object-contain drop-shadow-2xl"
                />
            </div>

            {/* Edificios - Auditorio (derecha) - mucho más grande */}
            <div
                className="absolute bottom-45 -right-20 transition-transform duration-200 ease-out"
                style={{
                    transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * 20}px) scale(0.8)`,
                }}
            >
                <img
                    src="/background/auditorio.png"
                    alt="Auditorio"
                    className="w-[500px] h-auto object-contain drop-shadow-2xl"
                />
            </div>

            {/* Fuente central - más grande */}
            <div
                className="absolute bottom-70 left-1/2 transition-transform duration-150 ease-out z-10"
                style={{
                    transform: `translate(calc(-50% + ${mousePosition.x * 35}px), ${mousePosition.y * 30}px) scale(2.2)`,
                }}
            >
                <img
                    src="/background/fuente.png"
                    alt="Fuente"
                    className="w-96 h-auto object-contain z-20 drop-shadow-2xl"
                />
            </div>

            {/* Arbustos que van ATRÁS de la fuente */}
            <div className="absolute inset-0 z-5 pointer-events-none">
                {bushesBeforeBackground.map((bush, i) => (
                    <div
                        key={i}
                        className={`absolute ${bush.bottom} ${bush.x} transition-transform duration-200 ease-out`}
                        style={{
                            transform: `
          translate(${mousePosition.x * bush.depth}px, ${mousePosition.y * (bush.depth - 4)}px)
          scale(${bush.scale})
        `,
                        }}
                    >
                        <img
                            src="/background/arbusto.png"
                            alt="Arbusto"
                            className={`w-[180px] h-auto object-contain drop-shadow-lg opacity-70`}
                        />
                    </div>
                ))}
            </div>

            {/* Capa de suelo/pasto - removida temporalmente */}
            {/* <div
                className="absolute -bottom-10 -left-20 -right-20 h-1/3 bg-gradient-to-t from-emerald-200 via-emerald-100 to-transparent dark:from-emerald-950 dark:via-emerald-900 dark:to-transparent transition-transform duration-200 ease-out"
                style={{
                    transform: `translateY(${mousePosition.y * 20}px) scale(1.3)`,
                }}
            /> */}

            <div className="absolute inset-0 z-30 pointer-events-none">
                {bushes.map((bush, i) => (
                    <div
                        key={i}
                        className={`absolute ${bush.bottom} ${bush.x} transition-transform duration-200 ease-out`}
                        style={{
                            transform: `
          translate(${mousePosition.x * bush.depth}px, ${mousePosition.y * (bush.depth - 4)}px)
          scale(${bush.scale})
        `,
                        }}
                    >
                        <img
                            src="/background/arbusto.png"
                            alt="Arbusto"
                            className={`w-[180px] h-auto object-contain drop-shadow-xl z-${bush.zIndex ? bush.zIndex : 0} opacity-${bush.opacity ? bush.opacity * 100 : 100}`}
                        />
                    </div>
                ))}
            </div>



            {/* Overlay sutil para el tema oscuro */}
            <div className="absolute inset-0 bg-black/0 dark:bg-black/40 pointer-events-none transition-colors duration-500" />
        </div>
    );
}

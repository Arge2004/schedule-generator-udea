import React, { useState, useEffect } from 'react';

export default function ParallaxBackground() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [mouseVelocity, setMouseVelocity] = useState({ x: 0, y: 0 });
    const [time, setTime] = useState(0);

    const bushes = [
        // Biblioteca
        { x: '-left-10', bottom: 'bottom-80', scale: 4, depth: 33, opacity: 0.6 },
        { x: '-left-45', bottom: 'bottom-78', scale: 4.5, depth: 32, opacity: 0.85 },
        { x: '-left-45', bottom: 'bottom-70', scale: 7, depth: 32 },

        // Fuente
        { x: 'left-80 ml-56', bottom: 'bottom-80', scale: 3.5, depth: 28 },
        { x: 'left-100 ml-56', bottom: 'bottom-80', scale: 3.9, depth: 40 },

        // Auditorio
        { x: 'right-12', bottom: 'bottom-80', scale: 2.7, depth: 22, opacity: 0.7 },
        { x: 'right-10', bottom: 'bottom-68', scale: 1.9, depth: 24 },

        // Relleno natural
        { x: 'right-2', bottom: 'bottom-150', scale: 14, depth: 90, opacity: 0.9 },
        { x: 'right-1/4', bottom: 'bottom-100', scale: 12, depth: 100, opacity: 0.8 },
    ];

    // Arbustos que van atrás de la fuente
    const bushesBeforeBackground = [
        { x: 'left-100 ml-56', bottom: 'bottom-100', scale: 4.5, depth: 20 },
        { x: 'left-130 ml-56', bottom: 'bottom-95', scale: 4, depth: 16 },
        { x: 'left-180 ml-56', bottom: 'bottom-80', scale: 2, depth: 10 },
    ];

    const trees = [
        { left: '25%', bottom: 'bottom-60', width: 300, speed: 15, scale: 1.2, opacity: 0.8 },
        { left: '20%', bottom: 'bottom-45', width: 300, speed: 20, scale: 0.8, opacity: 0.8 },
        { left: '80%', bottom: 'bottom-50', width: 300, speed: 15, scale: 0.8, opacity: 0.8 },
        { left: '80%', bottom: 'bottom-57', width: 200, speed: 30, scale: 1.2, opacity: 0.8, zIndex: 4 },
        { left: '60%', bottom: 'bottom-60', width: 300, speed: 20, scale: 1, opacity: 0.9 },
        { left: '50%', bottom: 'bottom-55', width: 300, speed: 20, scale: 0.8, opacity: 0.6 },
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
        let lastX = 0;
        let lastY = 0;
        let lastTime = Date.now();

        const handleMouseMove = (e) => {
            // Normalizar la posición del mouse a un rango de -1 a 1
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            
            // Calcular velocidad del mouse
            const now = Date.now();
            const dt = Math.max(now - lastTime, 1);
            const vx = Math.abs(x - lastX) / dt * 1000;
            const vy = Math.abs(y - lastY) / dt * 1000;
            
            setMousePosition({ x, y });
            setMouseVelocity({ x: Math.min(vx, 5), y: Math.min(vy, 5) });
            
            lastX = x;
            lastY = y;
            lastTime = now;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Animación continua para movimiento orgánico
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(t => t + 0.01);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 h-full relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
            
            {/* TEXTO CIRCULAR: Universidad de Antioquia */}
            <div 
                className="absolute top-60 left-1/2 -translate-x-1/2 z-[2] pointer-events-none transition-transform duration-500 ease-out"
                style={{
                    transform: `translate(calc(${mousePosition.x * 15}px), ${mousePosition.y * 12}px) scale(${1 + Math.sin(time * 0.4) * 0.02})`,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))',
                }}
            >
                <svg viewBox="-50 0 1000 400" className="w-[1000px] h-auto overflow-visible">
                    <defs>
                        {/* Filtro de difuminado intenso para efecto celestial neón */}
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        {/* Gradiente celestial blanco-amarillo suave */}
                        <linearGradient id="celestialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgb(255, 255, 255, 0.2)" />
                            <stop offset="30%" stopColor="rgba(255, 253, 220, 0.1)" />
                            <stop offset="60%" stopColor="rgba(255, 250, 200, 0.2)" />
                            <stop offset="100%" stopColor="rgba(255, 255, 230, 0.1)" />
                        </linearGradient>
                    </defs>
                    
                    {/* Rayos desde esquina superior derecha hacia las letras */}
                    <g filter="url(#glow)">
                        {Array.from({ length: 7 }).map((_, i) => {
                            // Origen: esquina superior derecha (más a la esquina)
                            const x1 = 920;
                            const y1 = -100;
                            
                            // Destino: puntos en el arco donde están las letras
                            const t = i / 6; // 0 a 1
                            const arcStartX = 150;
                            const arcEndX = 750;
                            const arcY = 270;
                            const arcRadius = 300;
                            
                            // Calcular punto en el arco
                            const arcCenterX = (arcStartX + arcEndX) / 2;
                            const angle = Math.PI * (1 - t); // De PI a 0
                            const arcX = arcCenterX + Math.cos(angle) * arcRadius;
                            const arcY2 = arcY - Math.sin(angle) * arcRadius;
                            
                            // Extender mucho más allá (1.2x para mayor distancia)
                            const dx = arcX - x1;
                            const dy = arcY2 - y1;
                            const x2 = arcX + dx * 1.2;
                            const y2 = arcY2 + dy * 1.2;
                            
                            // Calcular distancia para variar grosor (efecto triangular más pronunciado)
                            const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                            const maxDistance = 1800;
                            const widthFactor = distance / maxDistance;
                            // Efecto triangular más pronunciado: exponente 2.5 para mayor contraste
                            const triangleEffect = Math.pow(widthFactor, 2.5);
                            
                            return (
                                <line
                                    key={i}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="url(#celestialGradient)"
                                    strokeWidth={(Math.abs(Math.sin(time * 0.5 + i * 0.3)) * 18 + 10) * (0.05 + triangleEffect * 0.95)}
                                    strokeLinecap="round"
                                    opacity={0.6 + Math.abs(Math.sin(time * 0.4 + i * 0.5)) * 0.3}
                                />
                            );
                        })}
                    </g>

                    <path id="circlePath" d="M 120,270 A 315,300 0 0,1 750,270" fill="transparent" />
                    <text 
                        className="font-black text-5xl tracking-[0.2em] uppercase"
                        fill="white"
                        stroke="rgba(255, 255, 255, 0.8)"
                        strokeWidth="1"
                        style={{
                            paintOrder: 'stroke fill',
                        }}
                    >
                        <textPath href="#circlePath" startOffset="50%" textAnchor="middle">
                            Universidad de Antioquia
                        </textPath>
                    </text>
                </svg>
            </div>

            {/* Algunas líneas duplicadas por delante de biblioteca y fuente */}
            <div 
                className="absolute top-50 left-1/2 -translate-x-1/2 z-[12] pointer-events-none transition-transform duration-500 ease-out"
                style={{
                    transform: `translate(calc(${mousePosition.x * 15}px), ${mousePosition.y * 12}px) scale(${1 + Math.sin(time * 0.4) * 0.02})`,
                }}
            >
                <svg viewBox="0 0 900 400" className="w-[900px] h-auto overflow-visible">
                    <defs>
                        <filter id="glowFront">
                            <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        <linearGradient id="celestialGradientFront" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgb(255, 255, 255, 0.2)" />
                            <stop offset="30%" stopColor="rgba(255, 253, 220, 0.1)" />
                            <stop offset="60%" stopColor="rgba(255, 250, 200, 0.2)" />
                            <stop offset="100%" stopColor="rgba(255, 255, 230, 0.1)" />
                        </linearGradient>
                    </defs>
                    
                    <g filter="url(#glowFront)">
                        {Array.from({ length: 14 }).map((_, i) => {
                            // Solo renderizar líneas 1, 2, 7, 8 (para biblioteca y fuente)
                            if (![1, 2, 7, 8].includes(i)) return null;
                            
                            const x1 = 920;
                            const y1 = -100;
                            
                            const t = i / 9;
                            const arcStartX = 150;
                            const arcEndX = 750;
                            const arcY = 270;
                            const arcRadius = 300;
                            
                            const arcCenterX = (arcStartX + arcEndX) / 2;
                            const angle = Math.PI * (1 - t);
                            const arcX = arcCenterX + Math.cos(angle) * arcRadius;
                            const arcY2 = arcY - Math.sin(angle) * arcRadius;
                            
                            const dx = arcX - x1;
                            const dy = arcY2 - y1;
                            const x2 = arcX + dx * 1;
                            const y2 = arcY2 + dy * 2.5;
                            
                            const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                            const maxDistance = 1800;
                            const widthFactor = distance / maxDistance;
                            const triangleEffect = Math.pow(widthFactor, 1.5);
                            
                            return (
                                <line
                                    key={i}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="url(#celestialGradientFront)"
                                    strokeWidth={(Math.abs(Math.sin(time * 0.5 + i * 0.3)) * 18 + 10) * (0.05 + triangleEffect * 0.95)}
                                    strokeLinecap="round"
                                    opacity={0.6 + Math.abs(Math.sin(time * 0.4 + i * 0.5)) * 0.3}
                                />
                            );
                        })}
                    </g>
                </svg>
            </div>
            
            {/* Fondo base (cielo) - expandido con imagen */}
            <div
                className="absolute inset-0 transition-transform duration-700 ease-out"
                style={{
                    transform: `translate(${mousePosition.x * 8 + Math.sin(time) * 4}px, ${mousePosition.y * 8 + Math.cos(time * 0.8) * 4}px) scale(${1.2 + Math.sin(time * 0.5) * 0.04})`,
                    filter: `blur(2px)`,
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
                        className="absolute transition-transform duration-1000 ease-out"
                        style={{
                            left: cloud.left,
                            top: cloud.top,
                            transform: `translateX(${mousePosition.x * cloud.speed + Math.sin(time + i) * 30}px) translateY(${Math.cos(time * 0.5 + i) * 20}px) rotate(${cloud.rotation + Math.sin(time + i) * 4}deg) scale(${1 + Math.sin(time * 0.3 + i) * 0.1})`,
                            opacity: cloud.opacity,
                            filter: `blur(${2.5 + Math.abs(Math.sin(time + i)) * 0.5}px)`,
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
                className="absolute -bottom-0 -left-10 -right-10 h-3/4 transition-transform duration-500 ease-out z-[100]"
                style={{
                    transform: `translate(${mousePosition.x * 25 + Math.sin(time * 0.5) * 10}px, ${mousePosition.y * 15 + Math.cos(time * 0.4) * 6}px) scale(${1 + Math.sin(time * 0.3) * 0.04})`,
                    filter: `blur(1.5px)`,
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
                className="absolute bottom-50 left-50 transition-transform duration-400 ease-out z-[3]"
                style={{
                    transform: `translate(${mousePosition.x * 40 + Math.sin(time * 0.6) * 8}px, ${mousePosition.y * 30 + Math.sin(time * 0.6) * 6}px) scale(${2 + Math.sin(time * 0.4) * 0.06}) rotate(${Math.sin(time * 0.3) * 1}deg)`,
                    filter: `blur(${mousePosition.x < -0.2 ? 0.3 : 1}px)`,
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
                className="absolute bottom-45 -right-20 transition-transform duration-400 ease-out z-[3]"
                style={{
                    transform: `translate(${mousePosition.x * 40 + Math.cos(time * 0.5) * 8}px, ${mousePosition.y * 30 + Math.cos(time * 0.5) * 6}px) scale(${0.8 + Math.cos(time * 0.45) * 0.05}) rotate(${Math.cos(time * 0.3) * 1}deg)`,
                    filter: `blur(${mousePosition.x > 0.2 ? 0.3 : 1}px)`,
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
                className="absolute bottom-70 left-1/2 transition-transform duration-300 ease-out z-10"
                style={{
                    transform: `translate(calc(-50% + ${mousePosition.x * 55 + Math.sin(time * 0.8) * 15}px), ${mousePosition.y * 45 + Math.cos(time * 0.7) * 10}px) scale(${2.2 + Math.sin(time * 0.5) * 0.08})`,
                    filter: `blur(${Math.abs(mousePosition.x) < 0.3 ? 0.1 : 0.5}px)`,
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
                        className={`absolute ${bush.bottom} ${bush.x} transition-transform duration-400 ease-out`}
                        style={{
                            transform: `
                                translate(${mousePosition.x * bush.depth * 1.5}px, ${mousePosition.y * (bush.depth - 4) * 1.3}px)
                                scale(${bush.scale})
                            `,
                            filter: `blur(0.5px)`,
                        }}
                    >
                        <img
                            src="/background/arbusto.png"
                            alt="Arbusto"
                            className="w-[180px] h-auto object-contain drop-shadow-lg"
                            style={{
                                transform: `
                                    scaleX(${1 + Math.sin(time * 2.1 + i * 2) * 0.1})
                                    scaleY(${1 + Math.cos(time * 1.1 + i * 1.8) * 0.06})
                                    skewX(${Math.sin(time * 1.2 + i * 1.3) * 3}deg)
                                    skewY(${Math.cos(time * 0.7 + i * 1.5) * 2}deg)
                                `,
                                opacity: 0.7,
                            }}
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
                        className={`absolute ${bush.bottom} ${bush.x} transition-transform duration-350 ease-out`}
                        style={{
                            transform: `
                                translate(${mousePosition.x * bush.depth * 1.8}px, ${mousePosition.y * (bush.depth - 4) * 1.5}px)
                                scale(${bush.scale})
                            `,
                            filter: `blur(0px)`,
                            opacity: bush.opacity || 1,
                        }}
                    >
                        <img
                            src="/background/arbusto.png"
                            alt="Arbusto"
                            className="w-[180px] h-auto object-contain drop-shadow-xl"
                        />
                    </div>
                ))}
            </div>

            {trees.map((tree, i) => (
                <div
                    key={i}
                    className={`absolute bottom-0 ${tree.bottom} transition-transform duration-500 ease-out`}
                    style={{
                        left: tree.left,
                        transform: `translateX(${mousePosition.x * tree.speed * 2 + Math.sin(time * 0.4 + i * 0.7) * 18}px) translateY(${Math.cos(time * 0.3 + i * 0.5) * 10}px) scale(${tree.scale + Math.sin(time * 0.35 + i) * 0.08}) rotate(${Math.sin(time * 0.25 + i) * 3}deg)`,
                        opacity: tree.opacity,
                        zIndex: tree.zIndex || 1,
                        filter: `blur(${tree.opacity < 0.85 ? 1 : 0.5}px)`,
                    }}
                >
                    <img
                        src="/background/arbol.png"
                        alt="Árbol"
                        style={{
                            width: `${tree.width}px`,
                            height: 'auto',
                        }}
                        className="drop-shadow-2xl"
                    />
                </div>
            ))}

            <div
                className="absolute -bottom-20 right-20 transition-transform duration-300 ease-out z-[20]"
                style={{
                    transform: `translate(calc(-50% + ${mousePosition.x * 100 + Math.sin(time * 0.9) * 25}px), ${mousePosition.y * 80 + Math.cos(time * 0.8) * 18}px) scale(${0.8 + Math.sin(time * 0.6) * 0.15}) rotate(${Math.sin(time * 0.4) * 5}deg)`,
                    opacity: 0.8,
                    filter: `blur(0px)`,
                }}
            >
                <img
                    src="/background/arbolito.png"
                    alt="Árbolito"
                    className="w-96 h-auto object-contain z-[20] drop-shadow-2xl"
                />
            </div>

            {/* Overlay sutil para el tema oscuro */}
            <div className="absolute inset-0 bg-black/0 dark:bg-black/40 pointer-events-none transition-colors duration-500" />
        </div>
    );
}

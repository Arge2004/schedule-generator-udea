import React from 'react';

export default function ParallaxBackground() {
    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-white">
            <div className='absolute w-full h-full bg-amber-50/30'>
            </div>
            <div className='absolute w-full h-full bg-white/20 flex justify-center items-end'>
            </div>
            <img
                src="/background/fondo-new.jpg"
                alt="Fondo Dithering"
                className="w-full h-full object-cover"
            />
        </div>
    );
}


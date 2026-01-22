import React from 'react';

export default function Schedule() {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const horas = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM a 10 PM (22:00)

    const formatHora = (hora) => {
        const ampm = hora < 12 ? 'AM' : 'PM';
        const hora12 = hora > 12 ? hora - 12 : hora === 0 ? 12 : hora;
        return `${hora12}:00 ${ampm}`;
    };

    return (
        <div className="flex-1 h-full bg-white dark:bg-background-dark overflow-hidden flex flex-col">
            {/* Header con los días */}
            <div className="grid grid-cols-[80px_repeat(7,minmax(140px,1fr))] bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                {/* Celda vacía en la esquina */}
                <div className="border-r border-zinc-200 dark:border-zinc-800 py-4"></div>

                {/* Días de la semana */}
                {dias.map((dia) => (
                    <div
                        key={dia}
                        className="py-4 px-4 text-center font-bold text-sm text-zinc-700 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800 select-none"
                    >
                        {dia}
                    </div>
                ))}
            </div>

            {/* Grid de horarios */}
            <div className='flex-1 flex flex-col min-h-0 overflow-auto'>
                {horas.map((hora, index) => (
                    <div
                        key={hora}
                        className="grid grid-cols-[80px_repeat(7,minmax(140px,1fr))] border-b border-zinc-200 dark:border-zinc-800 flex-1 min-h-0"
                    >
                        {/* Columna de hora */}
                        <div className="px-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 flex items-center justify-center select-none">
                            {formatHora(hora)}
                        </div>

                        {/* Celdas de cada día */}
                        {dias.map((dia) => (
                            <div
                                key={`${dia}-${hora}`}
                                className="p-2 bg-white dark:bg-background-dark border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-100/10"
                            >
                                {/* Aquí irán las materias/clases */}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export default function SelectionParticles({
  color = "#1392ec",
  count = 14,
  radius = 28,
  className = "",
}) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * 360 + ((i % 2) * 15 - 7.5);
      const rad = (angle * Math.PI) / 180;
      const distance = radius * (0.6 + ((i * 13) % 40) / 100);
      const size = 3 + (i % 3) * 1.5;
      const isStar = i % 4 === 0;

      return {
        id: i,
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        size,
        isStar,
        duration: 0.38 + (i % 3) * 0.04,
        delay: (i % 3) * 0.015,
      };
    });
  }, [count, radius]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-40 flex items-center justify-center overflow-visible ${className}`}
    >
      {/* Anillo de choque sutil */}
      <motion.div
        initial={{ scale: 0.2, opacity: 0.9, borderWidth: "2px" }}
        animate={{
          scale: 1.8,
          opacity: 0,
          borderWidth: "1px",
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="absolute w-6 h-6 rounded-full border pointer-events-none"
        style={{ borderColor: color }}
      />

      {/* Partículas y destellos */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0.4, 1.25, 0],
            opacity: [1, 1, 0],
            rotate: [0, p.id * 60],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            borderRadius: p.isStar ? "2px" : "9999px",
            backgroundColor:
              p.id % 4 === 0
                ? "#ffffff"
                : p.id % 4 === 1
                  ? "#38bdf8"
                  : p.id % 4 === 2
                    ? "#fbbf24"
                    : color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      ))}
    </div>
  );
}

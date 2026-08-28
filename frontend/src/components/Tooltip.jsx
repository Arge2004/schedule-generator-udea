import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({
  children,
  content,
  position = "top",
  delay = 100,
  className = "",
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords(rect);
  }, []);

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    calculatePosition();
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Ocultar inmediatamente al hacer scroll, resize, click o blur en cualquier contenedor
  useEffect(() => {
    if (!isVisible) return;
    const handleClose = () => {
      setIsVisible(false);
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    window.addEventListener("pointerdown", handleClose);
    window.addEventListener("blur", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("pointerdown", handleClose);
      window.removeEventListener("blur", handleClose);
    };
  }, [isVisible]);

  // Limpiar timeout si se desmonta
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Calcular estilo del popover flotante
  const getTooltipStyle = () => {
    if (!coords) return { display: "none" };

    const gap = 8;
    const style = {
      position: "fixed",
      zIndex: 999999,
    };

    switch (position) {
      case "bottom":
        style.top = `${gap * 2.5 + coords.height / 2}px`;
        style.left = `${coords.left + coords.width / 2}px`;
        style.transform = "translate(-50%, 50%)";
        break;
      case "left":
        style.top = `${coords.top + coords.height / 2}px`;
        style.left = `${coords.left - gap}px`;
        style.transform = "translate(-100%, -50%)";
        break;
      case "right":
        style.top = `${coords.top + coords.height / 2}px`;
        style.left = `${coords.right + gap}px`;
        style.transform = "translateY(-50%)";
        break;
      case "top-left":
        // Abre hacia arriba alineando el borde derecho al botón (crece hacia la izquierda)
        style.top = `${coords.top - gap}px`;
        style.left = `${Math.min(window.innerWidth - 8, coords.right)}px`;
        style.transform = "translate(-100%, -100%)";
        break;
      case "top-right":
        // Abre hacia arriba alineando el borde izquierdo al botón (crece hacia la derecha)
        style.top = `${coords.top - gap}px`;
        style.left = `${Math.max(8, coords.left)}px`;
        style.transform = "translate(0, -100%)";
        break;
      case "top":
      default:
        style.top = `${coords.top - gap}px`;
        style.left = `${Math.min(
          window.innerWidth - 120,
          Math.max(120, coords.left + coords.width / 2),
        )}px`;
        style.transform = "translate(-50%, -100%)";
        break;
    }

    return style;
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-flex ${className}`}
    >
      {children}

      {isVisible &&
        content &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={getTooltipStyle()}
            className="pointer-events-none px-3 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-md text-xs font-medium shadow-2xl border border-zinc-700/80 animate-in fade-in zoom-in-95 duration-100 whitespace-nowrap text-left select-none"
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
}

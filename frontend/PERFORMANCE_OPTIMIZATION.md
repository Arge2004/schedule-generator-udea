# Optimización de Rendimiento - ParallaxBackground

Este documento explica la estrategia de optimización implementada en el componente `ParallaxBackground.jsx` para garantizar una experiencia fluida en todos los dispositivos.

## Estrategia en 3 Niveles

### 1. Nivel Preventivo (CSS + Media Queries)
**Objetivo:** Respetar las preferencias del sistema operativo del usuario antes de cargar JavaScript.

#### Implementación:
- Se detecta automáticamente `prefers-reduced-motion` en `App.css`
- Si el usuario tiene activada la opción "Reducir movimiento" en su SO, todas las animaciones se desactivan instantáneamente
- **Beneficio:** Accesibilidad y rendimiento para usuarios que lo necesitan

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. Nivel Predictivo (Hardware Detection)
**Objetivo:** Detectar dispositivos con recursos limitados antes de iniciar animaciones pesadas.

#### Implementación:
```javascript
const isLowEndDevice = (
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
    (navigator.deviceMemory && navigator.deviceMemory < 4)
);
```

#### Criterios:
- **CPU:** Menos de 4 núcleos
- **RAM:** Menos de 4GB

Si se detecta hardware limitado, se muestra automáticamente la versión estática del background.

### 3. Nivel Reactivo (Performance Monitoring)
**Objetivo:** Detectar lag en tiempo real durante los primeros 2 segundos de animación.

#### Implementación:
- Monitorea los FPS (frames per second) durante 2 segundos
- Si el promedio de FPS cae por debajo de 40, cambia automáticamente a la versión estática
- **Umbral:** 40 FPS (equilibrio entre fluidez y tolerancia)

```javascript
function checkPerformance(currentTime) {
    frameCount++;
    const elapsed = currentTime - startTime;
    
    if (elapsed < monitorDuration) {
        rafId = requestAnimationFrame(checkPerformance);
    } else {
        const fps = (frameCount * 1000) / elapsed;
        if (fps < 40) {
            console.log(`Rendimiento detectado: ${fps.toFixed(1)} FPS. Cambiando a versión estática.`);
            setUseStaticVersion(true);
        }
    }
}
```

## Componente Estático Fallback

Cuando se activa cualquiera de los 3 niveles, se renderiza `StaticBackground`, que incluye:
- Fondo estático sin animaciones
- Texto circular sin efectos
- Edificios y elementos sin movimiento parallax
- **Ventaja:** Carga instantánea, sin consumo de recursos

## Flujo de Decisión

```
1. ¿Prefers-reduced-motion activo? → Sí → Versión Estática
                                    ↓ No
2. ¿Dispositivo de bajo rendimiento? → Sí → Versión Estática
                                     ↓ No
3. Iniciar animaciones y monitorear FPS
   ↓
   ¿FPS < 40 durante 2s? → Sí → Versión Estática
                         ↓ No
   Continuar con animaciones completas
```

## Resultados Esperados

- ✅ **Dispositivos de alta gama:** Animaciones fluidas y completas
- ✅ **Dispositivos medios:** Monitoreo inicial, posible cambio a estático
- ✅ **Dispositivos de baja gama:** Detección inmediata, versión estática
- ✅ **Usuarios con necesidades de accesibilidad:** Respeto automático de preferencias

## Notas Técnicas

### Por qué 40 FPS
- **60 FPS:** Ideal pero muy exigente
- **30 FPS:** Mínimo aceptable pero perceptiblemente lento
- **40 FPS:** Balance perfecto entre fluidez y tolerancia

### Por qué 2 segundos
- Suficiente tiempo para obtener una muestra significativa
- No tan largo como para molestar al usuario con lag
- Permite estabilización inicial del navegador

### Optimizaciones Adicionales
- `useEffect` condicionales para evitar listeners innecesarios en modo estático
- Cancelación apropiada de `requestAnimationFrame`
- Uso de `useRef` para evitar re-renders innecesarios

## Cómo Probarlo

### Simular dispositivo de bajo rendimiento
En Chrome DevTools:
1. Abrir DevTools (F12)
2. Performance → CPU: 4x slowdown
3. Recargar la página

### Simular prefers-reduced-motion
En Chrome:
1. DevTools → Rendering
2. Marcar "Emulate CSS media feature prefers-reduced-motion: reduce"

### Monitorear cambios
Abrir la consola del navegador y observar el mensaje:
```
Rendimiento detectado: XX.X FPS. Cambiando a versión estática.
```

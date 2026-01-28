# 📱 Fix para Cámara en Móviles

## ✅ Mejoras Implementadas

### 1. Detección de Dispositivo Móvil
- Detecta automáticamente si es móvil o desktop
- Aplica configuraciones específicas para cada tipo de dispositivo

### 2. Solicitud de Cámara Trasera (Móviles)
Intenta múltiples estrategias en orden:
1. `facingMode: { exact: 'environment' }` - Cámara trasera específica
2. `facingMode: { ideal: 'environment' }` - Preferencia por cámara trasera
3. Cualquier cámara disponible - Fallback

### 3. Atributos Especiales para Móvil
El elemento `<video>` ahora incluye:
- `playsInline` - Reproduce inline en iOS (no fullscreen)
- `webkit-playsinline` - Compatibilidad con Safari antiguo
- `muted` - Necesario para autoplay
- `autoPlay` - Inicia automáticamente
- `x-webkit-airplay="allow"` - Compatibilidad AirPlay

### 4. Configuración de Stream Optimizada
```javascript
{
  video: {
    facingMode: { exact: 'environment' }, // Cámara trasera
    width: { ideal: 1280 },               // Resolución ideal
    height: { ideal: 720 }                // Para mejor lectura QR
  },
  audio: false                            // No necesitamos audio
}
```

### 5. Espera Explícita de Metadata
- Espera a que el video cargue completamente antes de iniciar el scanner
- Timeout de 5 segundos por seguridad
- Logs detallados de estado

### 6. Mejor Manejo de Errores
Mensajes específicos para:
- ✅ `NotAllowedError` - Permiso denegado
- ✅ `NotFoundError` - Sin cámara
- ✅ `NotReadableError` - Cámara en uso
- ✅ `OverconstrainedError` - Configuración no soportada

### 7. Información de Debug en UI
- Estado de HTTPS
- Tipo de dispositivo (Móvil/Desktop)
- Botón para detener escáner

## 🔧 Debugging

### Consola del Navegador
El código ahora registra:
```
🎥 Intentando iniciar escáner...
📱 Dispositivo móvil: true/false
📹 Cámaras disponibles: N
  Cámara 1: [label]
  Cámara 2: [label]
📱 Intentando cámara trasera (móvil)...
✅ Cámara trasera obtenida
📊 Stream tracks: [...]
📹 Metadata cargada: { width, height, readyState }
🎬 Video reproduciendo
✅ Escáner de QR activo
```

## 📋 Checklist de Problemas Comunes

### ⚠️ La cámara no se activa
1. **Verificar HTTPS**: La cámara solo funciona en:
   - `https://tu-dominio.com`
   - `localhost` (en desarrollo)
   
2. **Verificar Permisos**:
   - Android: Configuración → Apps → Navegador → Permisos → Cámara
   - iOS: Ajustes → Safari → Cámara

3. **Cerrar otras apps** que usen la cámara

4. **Reiniciar el navegador**

### ⚠️ Se activa cámara frontal en vez de trasera
Esto es normal en algunos dispositivos. El código intentará la trasera pero puede fallar y usar la frontal como fallback.

### ⚠️ Error "No se pudo configurar la cámara"
Algunos dispositivos antiguos no soportan las resoluciones solicitadas. El código ahora tiene fallbacks.

## 🧪 Cómo Probar

1. **En Android Chrome/Firefox**:
   ```
   https://tu-dominio.com/caja
   ```

2. **En iPhone Safari**:
   ```
   https://tu-dominio.com/caja
   ```

3. **Verificar la consola**:
   - Abrir DevTools en el navegador del celular
   - Android Chrome: chrome://inspect
   - iOS Safari: Safari > Develop > [Dispositivo]

4. **Probar con diferentes navegadores**:
   - Chrome
   - Firefox
   - Safari
   - Samsung Internet

## 🚀 Próximos Pasos

Si sigue sin funcionar:

1. **Verificar SSL**:
   ```bash
   # Debe ser HTTPS, no HTTP
   curl -I https://tu-dominio.com
   ```

2. **Probar en diferentes dispositivos**:
   - Android: Múltiples versiones
   - iOS: Múltiples versiones

3. **Revisar logs de la consola** del navegador móvil

4. **Verificar que el servidor esté sirviendo en HTTPS**

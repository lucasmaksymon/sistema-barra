# 🚀 Fix Rápido: Cámara en Móvil

## ⚡ Solución en 3 Pasos

### 1️⃣ Usar HTTPS (OBLIGATORIO)

```bash
# Opción A: ngrok (más fácil)
npm install -g ngrok
npm run dev
# En otra terminal:
ngrok http 3000
# Usa la URL https://xxx.ngrok.io

# Opción B: Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3000
```

### 2️⃣ Abrir en el Celular

```
https://tu-url-ngrok.ngrok.io/caja
```

### 3️⃣ Aceptar Permisos

Cuando pida acceso a la cámara → **PERMITIR**

---

## ✅ Mejoras Aplicadas

1. ✅ Detección automática de móvil
2. ✅ Solicitud de cámara trasera específica
3. ✅ Múltiples fallbacks si falla
4. ✅ Atributos especiales para iOS/Android
5. ✅ Logs detallados en consola
6. ✅ Mejor manejo de errores
7. ✅ UI con indicadores de estado

## 🔍 Verificar en UI

Busca esto en la interfaz:
```
🔒 HTTPS OK • 📱 Móvil
```

Si dice `⚠️ Necesita HTTPS` → Debes usar ngrok

## 📱 Debugear en Móvil

### Android
```
chrome://inspect en tu PC
```

### iOS
```
Safari → Desarrollo → [Tu iPhone]
```

## 🐛 Si No Funciona

1. **Verificar HTTPS**: Debe decir `🔒 HTTPS OK`
2. **Ver consola**: Buscar logs con 🎥 📱 📹 ✅ ❌
3. **Permisos**: Ajustes del navegador → Permisos → Cámara
4. **Cerrar otras apps** que usen la cámara

---

**Más detalles**: Ver `CAMERA-MOBILE-FIX.md` y `MOBILE-TESTING.md`

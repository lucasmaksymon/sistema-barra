# 📱 Guía de Pruebas en Móvil

## 🚨 REQUISITO CRÍTICO: HTTPS

La cámara **SOLO** funciona con HTTPS en dispositivos móviles (excepto localhost).

### Opciones para HTTPS en Desarrollo

#### Opción 1: ngrok (Recomendado para pruebas)
```bash
# Instalar ngrok
npm install -g ngrok

# Iniciar tu servidor Next.js
npm run dev

# En otra terminal, exponer con ngrok
ngrok http 3000

# Usar la URL HTTPS que te da ngrok
# Ejemplo: https://abc123.ngrok.io
```

#### Opción 2: Cloudflare Tunnel
```bash
# Instalar cloudflared
# Windows: Descargar de https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Iniciar tunnel
cloudflared tunnel --url http://localhost:3000
```

#### Opción 3: Certificado SSL Local
```bash
# Generar certificado
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Modificar server.mjs para usar HTTPS
```

## 📱 Instrucciones de Prueba

### Android

#### 1. Chrome DevTools Remote
```bash
# En tu PC:
1. Abre Chrome → chrome://inspect
2. Conecta tu Android por USB
3. Habilita "Depuración USB" en tu Android
4. Verás tu dispositivo en chrome://inspect
5. Click en "inspect" para ver la consola
```

#### 2. Acceder a la App
```
1. Abre Chrome en tu Android
2. Ve a la URL HTTPS (ngrok/cloudflare)
3. Acepta permisos de cámara cuando se soliciten
```

#### 3. Verificar Permisos
```
Ajustes → Apps → Chrome → Permisos → Cámara → Permitir
```

### iOS (iPhone/iPad)

#### 1. Safari Web Inspector
```bash
# En tu Mac:
1. Safari → Preferencias → Avanzado → Mostrar menú Desarrollo
2. Conecta tu iPhone por cable
3. En iPhone: Ajustes → Safari → Avanzado → Web Inspector (ON)
4. En Mac Safari: Desarrollo → [Tu iPhone] → [Tu página]
```

#### 2. Acceder a la App
```
1. Abre Safari en tu iPhone
2. Ve a la URL HTTPS (ngrok/cloudflare)
3. Acepta permisos de cámara cuando se soliciten
```

#### 3. Verificar Permisos
```
Ajustes → Safari → Cámara → Preguntar o Permitir
```

## 🔍 Logs de Debug

### En la Consola Verás:
```
🎥 Intentando iniciar escáner...
📱 Dispositivo móvil: true
📹 Cámaras disponibles: 2
  Cámara 1: Back Camera
  Cámara 2: Front Camera
📱 Intentando cámara trasera (móvil)...
✅ Cámara trasera obtenida
📊 Stream tracks: [...]
📹 Metadata cargada: { width: 1280, height: 720, readyState: 4 }
🎬 Video reproduciendo
✅ Escáner de QR activo
```

### Si Hay Errores:
```
❌ Error al iniciar escáner: NotAllowedError
```

Busca el error específico y consulta CAMERA-MOBILE-FIX.md

## 🐛 Problemas Comunes

### ❌ "La cámara no se activa"

**Causa 1: No es HTTPS**
```
Solución: Usar ngrok o cloudflare tunnel
```

**Causa 2: Permisos denegados**
```
Android: Ajustes → Apps → Chrome → Permisos → Cámara
iOS: Ajustes → Safari → Cámara
```

**Causa 3: Cámara en uso por otra app**
```
Solución: Cerrar otras apps que usen la cámara
```

### ❌ "Se activa cámara frontal"

**Esto es normal** en algunos dispositivos antiguos. El código intentará la trasera pero puede usar la frontal como fallback.

### ❌ "Video negro / no se ve nada"

**Causa: Permisos parciales**
```
1. Revocar permisos en ajustes
2. Recargar página
3. Volver a aceptar permisos
```

### ❌ "NotReadableError"

**Causa: Cámara ocupada**
```
1. Cerrar otras pestañas que usen cámara
2. Cerrar otras apps
3. Reiniciar navegador
```

## ✅ Checklist Pre-Prueba

- [ ] Servidor corriendo en puerto 3000
- [ ] ngrok/cloudflare configurado
- [ ] URL HTTPS funcionando
- [ ] Celular conectado (USB para debug)
- [ ] Permisos de cámara disponibles
- [ ] DevTools/Inspector abierto para ver logs

## 📊 Información Útil en la UI

En la interfaz verás:
```
🔒 HTTPS OK • 📱 Móvil
```

o

```
⚠️ Necesita HTTPS • 💻 Desktop
```

Esto te ayuda a verificar rápidamente el estado.

## 🎯 Flujo de Prueba Completo

1. **Iniciar desarrollo**:
   ```bash
   npm run dev
   ngrok http 3000
   ```

2. **Obtener URL HTTPS**:
   ```
   Ejemplo: https://abc123.ngrok.io
   ```

3. **Abrir en móvil**:
   ```
   https://abc123.ngrok.io/caja
   ```

4. **Login**:
   ```
   Usuario: (tu usuario de prueba)
   Password: (tu contraseña)
   ```

5. **Ir a método de pago QR**:
   ```
   Seleccionar "QR de Consumo"
   ```

6. **Click en "📷 Escanear con Cámara"**:
   ```
   Aceptar permisos
   Debe activarse la cámara
   ```

7. **Verificar logs**:
   ```
   Abrir DevTools/Inspector
   Ver logs en consola
   ```

## 📞 Si Nada Funciona

1. Compartir logs completos de la consola
2. Modelo y versión del dispositivo
3. Navegador y versión
4. Screenshot del error
5. Estado de HTTPS (🔒 HTTPS OK o ⚠️)

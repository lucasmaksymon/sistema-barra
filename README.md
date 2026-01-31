# 🍺 Sistema de Gestión de Bar para Eventos

Sistema web responsive (mobile-first) para gestionar operaciones de bar en eventos con múltiples POS, control de inventario, pagos y QR único por pedido.

## 🚀 Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes + PostgreSQL + Prisma
- **Deploy**: Render.com + Neon PostgreSQL (ambos gratis)

## 📋 Requisitos

- Node.js 20.19+
- PostgreSQL (Neon recomendado)

## ⚡ Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tu connection string de Neon

# 3. Configurar base de datos (Neon recomendado)
npx prisma db push

# 4. Cargar carta completa del bar
npm run db:reset

# 5. Iniciar servidor
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 👥 Usuarios de Prueba

Después del seed, puedes usar estos usuarios:

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@bar.com | admin123 |
| Cajero | cajero1@bar.com | cajero123 |
| Bartender | bartender1@bar.com | barra123 |

## 🏗️ Arquitectura

```
app/api/           # API REST (eventos, pedidos, entregas, pagos, inventario)
app/(auth)/        # UI protegidas (caja, barra, admin)
lib/               # Lógica de negocio (auth, inventory, qr)
prisma/            # Schema + seed
```

### 📦 Sistema de Productos y Combos

El sistema maneja **3 tipos de productos**:

- **BASE**: Insumos/componentes (botellas, speed, jugos) - No se venden solos
- **SIMPLE**: Productos de venta individual (agua, speed suelto)
- **COMPUESTO**: Combos con recetas configurables (Smirnoff + 5 Speed/2 Jugos)


### Flujo de Negocio

1. **Caja** crea pedido → ~~Reserva stock~~ **(CONTROL DE STOCK DESHABILITADO)**
2. **Admin** aprueba transferencia (si aplica)
3. **Cliente** recibe QR único
4. **Bartender** escanea QR → Entrega items → ~~Decrementa stock~~ **(CONTROL DE STOCK DESHABILITADO)**

> ⚠️ **NOTA**: El control de inventario está temporalmente deshabilitado. Los pedidos no validan ni actualizan stock.

## 🔐 API Endpoints

**Auth**: `/api/auth/login`, `/api/auth/me`  
**Pedidos**: `/api/pedidos`, `/api/qr/[token]`  
**Entregas**: `/api/entregas`  
**Pagos**: `/api/pagos/pendientes`, `/api/pagos/[id]/aprobar`  
**Inventario**: `/api/inventario/stock`, `/api/inventario/movimientos`  
**Eventos**: `/api/eventos`, `/api/productos`

## 🚢 Deploy Gratis en Render

1. **Database**: Crea DB gratuita en [neon.tech](https://neon.tech)
2. **Web Service**: 
   - Conecta repo en [render.com](https://render.com)
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm start`
   - Variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
3. **Seed**: Ejecuta `npx prisma db push && npm run prisma:seed` desde Shell de Render

**Opcional**: Usa [UptimeRobot](https://uptimerobot.com/) para evitar que se duerma el servicio

## 📊 Scripts

```bash
npm run dev          # Desarrollo con HTTPS
npm run build        # Build producción
npm run db:studio    # UI visual para DB (localhost:5555)
npm run db:seed      # Cargar carta completa (limpia y recarga)
npm run db:migrate   # Ejecutar migraciones
```

## 🐛 Troubleshooting

**"Prisma Client no generado"**: `npx prisma generate`  
**Error de conexión DB**: Verifica `DATABASE_URL` en `.env.local`  
**Puerto 3000 en uso**: `PORT=3001 npm run dev`

---

**Desarrollado para gestión profesional de bar en eventos**

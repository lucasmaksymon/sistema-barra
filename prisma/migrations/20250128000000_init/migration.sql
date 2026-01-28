-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'SUPERVISOR', 'CAJA', 'BARRA', 'INVENTARIO');

-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('SIMPLE', 'BASE', 'COMPUESTO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('CASH', 'TRANSFER', 'QR_CONSUMO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDING_PAYMENT', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDING_DELIVERY', 'PARTIAL_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EstadoItem" AS ENUM ('PENDING', 'PARTIAL', 'DELIVERED');

-- CreateEnum
CREATE TYPE "TipoLocation" AS ENUM ('DEPOSITO', 'BARRA');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INBOUND', 'TRANSFER', 'SALE_RESERVE', 'DELIVERY_COMMIT', 'WASTE', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "EstadoQRConsumo" AS ENUM ('ACTIVO', 'AGOTADO', 'BLOQUEADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "TipoTransaccionQR" AS ENUM ('CARGA', 'CONSUMO', 'AJUSTE', 'DEVOLUCION');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CAJA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caja" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barra" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Barra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tipo" "TipoProducto" NOT NULL DEFAULT 'SIMPLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoReceta" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "componenteId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "opcional" BOOLEAN NOT NULL DEFAULT false,
    "grupoOpcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductoReceta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "cajeroId" TEXT NOT NULL,
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "estadoPedido" "EstadoPedido" NOT NULL DEFAULT 'PENDING_DELIVERY',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "qrConsumoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "fechaEntregaCompleta" TIMESTAMP(3),
    "aprobadoPor" TEXT,
    "fechaAprobacion" TIMESTAMP(3),

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "opcionesComponentes" JSONB,
    "cantidadEntregada" INTEGER NOT NULL DEFAULT 0,
    "estadoItem" "EstadoItem" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "barraId" TEXT NOT NULL,
    "bartenderId" TEXT NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaDetalle" (
    "id" TEXT NOT NULL,
    "entregaId" TEXT NOT NULL,
    "pedidoItemId" TEXT NOT NULL,
    "cantidadEntregada" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntregaDetalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLocation" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoLocation" NOT NULL,
    "eventoId" TEXT NOT NULL,
    "barraId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "reservado" INTEGER NOT NULL DEFAULT 0,
    "umbralBajo" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoStock" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "origenId" TEXT,
    "destinoId" TEXT,
    "pedidoId" TEXT,
    "entregaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "motivo" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CierreEvento" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "locationId" TEXT,
    "stockTeorico" JSONB NOT NULL,
    "stockReal" JSONB NOT NULL,
    "varianzas" JSONB NOT NULL,
    "motivos" JSONB,
    "realizadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CierreEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRConsumo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,
    "montoInicial" DECIMAL(10,2) NOT NULL,
    "saldoActual" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoQRConsumo" NOT NULL DEFAULT 'ACTIVO',
    "nombreCliente" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fechaExpiracion" TIMESTAMP(3),

    CONSTRAINT "QRConsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaccionQRConsumo" (
    "id" TEXT NOT NULL,
    "qrConsumoId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "tipo" "TipoTransaccionQR" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "saldoAnterior" DECIMAL(10,2) NOT NULL,
    "saldoNuevo" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "realizadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransaccionQRConsumo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rol_activo_idx" ON "Usuario"("rol", "activo");

-- CreateIndex
CREATE INDEX "Usuario_activo_idx" ON "Usuario"("activo");

-- CreateIndex
CREATE INDEX "Evento_activo_fecha_idx" ON "Evento"("activo", "fecha");

-- CreateIndex
CREATE INDEX "Evento_fecha_idx" ON "Evento"("fecha");

-- CreateIndex
CREATE INDEX "Caja_eventoId_activo_idx" ON "Caja"("eventoId", "activo");

-- CreateIndex
CREATE INDEX "Caja_eventoId_idx" ON "Caja"("eventoId");

-- CreateIndex
CREATE INDEX "Barra_eventoId_activa_idx" ON "Barra"("eventoId", "activa");

-- CreateIndex
CREATE INDEX "Barra_eventoId_idx" ON "Barra"("eventoId");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigo_key" ON "Producto"("codigo");

-- CreateIndex
CREATE INDEX "Producto_tipo_activo_idx" ON "Producto"("tipo", "activo");

-- CreateIndex
CREATE INDEX "Producto_categoria_activo_idx" ON "Producto"("categoria", "activo");

-- CreateIndex
CREATE INDEX "Producto_activo_idx" ON "Producto"("activo");

-- CreateIndex
CREATE INDEX "ProductoReceta_productoId_idx" ON "ProductoReceta"("productoId");

-- CreateIndex
CREATE INDEX "ProductoReceta_componenteId_idx" ON "ProductoReceta"("componenteId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoReceta_productoId_componenteId_key" ON "ProductoReceta"("productoId", "componenteId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_codigo_key" ON "Pedido"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_qrToken_key" ON "Pedido"("qrToken");

-- CreateIndex
CREATE INDEX "Pedido_eventoId_estadoPedido_idx" ON "Pedido"("eventoId", "estadoPedido");

-- CreateIndex
CREATE INDEX "Pedido_eventoId_estadoPago_idx" ON "Pedido"("eventoId", "estadoPago");

-- CreateIndex
CREATE INDEX "Pedido_eventoId_createdAt_idx" ON "Pedido"("eventoId", "createdAt");

-- CreateIndex
CREATE INDEX "Pedido_estadoPago_estadoPedido_idx" ON "Pedido"("estadoPago", "estadoPedido");

-- CreateIndex
CREATE INDEX "Pedido_qrToken_idx" ON "Pedido"("qrToken");

-- CreateIndex
CREATE INDEX "Pedido_cajaId_idx" ON "Pedido"("cajaId");

-- CreateIndex
CREATE INDEX "Pedido_cajeroId_idx" ON "Pedido"("cajeroId");

-- CreateIndex
CREATE INDEX "PedidoItem_pedidoId_estadoItem_idx" ON "PedidoItem"("pedidoId", "estadoItem");

-- CreateIndex
CREATE INDEX "PedidoItem_productoId_idx" ON "PedidoItem"("productoId");

-- CreateIndex
CREATE INDEX "PedidoItem_estadoItem_idx" ON "PedidoItem"("estadoItem");

-- CreateIndex
CREATE INDEX "Entrega_pedidoId_idx" ON "Entrega"("pedidoId");

-- CreateIndex
CREATE INDEX "Entrega_barraId_createdAt_idx" ON "Entrega"("barraId", "createdAt");

-- CreateIndex
CREATE INDEX "Entrega_bartenderId_idx" ON "Entrega"("bartenderId");

-- CreateIndex
CREATE INDEX "EntregaDetalle_entregaId_idx" ON "EntregaDetalle"("entregaId");

-- CreateIndex
CREATE INDEX "EntregaDetalle_pedidoItemId_idx" ON "EntregaDetalle"("pedidoItemId");

-- CreateIndex
CREATE UNIQUE INDEX "StockLocation_barraId_key" ON "StockLocation"("barraId");

-- CreateIndex
CREATE INDEX "StockLocation_eventoId_idx" ON "StockLocation"("eventoId");

-- CreateIndex
CREATE INDEX "Stock_locationId_productoId_idx" ON "Stock"("locationId", "productoId");

-- CreateIndex
CREATE INDEX "Stock_productoId_idx" ON "Stock"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_productoId_locationId_key" ON "Stock"("productoId", "locationId");

-- CreateIndex
CREATE INDEX "MovimientoStock_productoId_createdAt_idx" ON "MovimientoStock"("productoId", "createdAt");

-- CreateIndex
CREATE INDEX "MovimientoStock_origenId_idx" ON "MovimientoStock"("origenId");

-- CreateIndex
CREATE INDEX "MovimientoStock_destinoId_idx" ON "MovimientoStock"("destinoId");

-- CreateIndex
CREATE INDEX "MovimientoStock_tipo_createdAt_idx" ON "MovimientoStock"("tipo", "createdAt");

-- CreateIndex
CREATE INDEX "MovimientoStock_usuarioId_idx" ON "MovimientoStock"("usuarioId");

-- CreateIndex
CREATE INDEX "CierreEvento_eventoId_idx" ON "CierreEvento"("eventoId");

-- CreateIndex
CREATE UNIQUE INDEX "QRConsumo_codigo_key" ON "QRConsumo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "QRConsumo_qrToken_key" ON "QRConsumo"("qrToken");

-- CreateIndex
CREATE INDEX "QRConsumo_eventoId_estado_idx" ON "QRConsumo"("eventoId", "estado");

-- CreateIndex
CREATE INDEX "QRConsumo_qrToken_idx" ON "QRConsumo"("qrToken");

-- CreateIndex
CREATE INDEX "QRConsumo_estado_idx" ON "QRConsumo"("estado");

-- CreateIndex
CREATE INDEX "TransaccionQRConsumo_qrConsumoId_idx" ON "TransaccionQRConsumo"("qrConsumoId");

-- CreateIndex
CREATE INDEX "TransaccionQRConsumo_createdAt_idx" ON "TransaccionQRConsumo"("createdAt");

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barra" ADD CONSTRAINT "Barra_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoReceta" ADD CONSTRAINT "ProductoReceta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoReceta" ADD CONSTRAINT "ProductoReceta_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cajeroId_fkey" FOREIGN KEY ("cajeroId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_qrConsumoId_fkey" FOREIGN KEY ("qrConsumoId") REFERENCES "QRConsumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_barraId_fkey" FOREIGN KEY ("barraId") REFERENCES "Barra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_bartenderId_fkey" FOREIGN KEY ("bartenderId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaDetalle" ADD CONSTRAINT "EntregaDetalle_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "Entrega"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaDetalle" ADD CONSTRAINT "EntregaDetalle_pedidoItemId_fkey" FOREIGN KEY ("pedidoItemId") REFERENCES "PedidoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLocation" ADD CONSTRAINT "StockLocation_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLocation" ADD CONSTRAINT "StockLocation_barraId_fkey" FOREIGN KEY ("barraId") REFERENCES "Barra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StockLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "StockLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "StockLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CierreEvento" ADD CONSTRAINT "CierreEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRConsumo" ADD CONSTRAINT "QRConsumo_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRConsumo" ADD CONSTRAINT "QRConsumo_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaccionQRConsumo" ADD CONSTRAINT "TransaccionQRConsumo_qrConsumoId_fkey" FOREIGN KEY ("qrConsumoId") REFERENCES "QRConsumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


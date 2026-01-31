import { prisma } from './prisma';
import { TipoMovimiento } from '@prisma/client';

/**
 * Verifica si hay stock disponible suficiente
 * DESHABILITADO: Siempre retorna true
 */
export async function verificarStockDisponible(
  productoId: string,
  locationId: string,
  cantidadRequerida: number
): Promise<boolean> {
  // CONTROL DE STOCK DESHABILITADO
  return true;
  
  /* CÓDIGO ORIGINAL COMENTADO
  const stock = await prisma.stock.findUnique({
    where: {
      productoId_locationId: {
        productoId,
        locationId,
      },
    },
  });

  if (!stock) {
    return false;
  }

  const disponible = stock.cantidad - stock.reservado;
  return disponible >= cantidadRequerida;
  */
}

/**
 * Reserva stock al crear un pedido (Estrategia C)
 * DESHABILITADO: No hace nada
 */
export async function reservarStock(
  productoId: string,
  locationId: string,
  cantidad: number,
  usuarioId: string,
  pedidoId?: string
) {
  // CONTROL DE STOCK DESHABILITADO - No hace nada
  return;
  
  /* CÓDIGO ORIGINAL COMENTADO
  // Verificar disponibilidad
  const disponible = await verificarStockDisponible(productoId, locationId, cantidad);
  
  if (!disponible) {
    throw new Error('Stock insuficiente');
  }

  // Incrementar reservado
  await prisma.stock.update({
    where: {
      productoId_locationId: {
        productoId,
        locationId,
      },
    },
    data: {
      reservado: {
        increment: cantidad,
      },
    },
  });

  // Registrar movimiento
  await prisma.movimientoStock.create({
    data: {
      productoId,
      tipo: 'SALE_RESERVE',
      cantidad,
      destinoId: locationId,
      usuarioId,
      pedidoId,
      motivo: 'Reserva por venta',
    },
  });
  */
}

/**
 * Confirma la entrega y decrementa el stock (Estrategia C)
 * DESHABILITADO: No hace nada
 */
export async function confirmarEntrega(
  productoId: string,
  locationId: string,
  cantidad: number,
  usuarioId: string,
  pedidoId: string,
  entregaId: string
) {
  // CONTROL DE STOCK DESHABILITADO - No hace nada
  return;
  
  /* CÓDIGO ORIGINAL COMENTADO
  // Actualizar stock: decrementar cantidad y reservado
  await prisma.stock.update({
    where: {
      productoId_locationId: {
        productoId,
        locationId,
      },
    },
    data: {
      cantidad: {
        decrement: cantidad,
      },
      reservado: {
        decrement: cantidad,
      },
    },
  });

  // Registrar movimiento
  await prisma.movimientoStock.create({
    data: {
      productoId,
      tipo: 'DELIVERY_COMMIT',
      cantidad: -cantidad,
      origenId: locationId,
      usuarioId,
      pedidoId,
      entregaId,
      motivo: 'Entrega confirmada',
    },
  });
  */
}

/**
 * Libera stock reservado al cancelar un pedido
 * DESHABILITADO: No hace nada
 */
export async function liberarStockReservado(
  productoId: string,
  locationId: string,
  cantidad: number,
  usuarioId: string,
  pedidoId: string
) {
  // CONTROL DE STOCK DESHABILITADO - No hace nada
  return;
  
  /* CÓDIGO ORIGINAL COMENTADO
  // Decrementar reservado
  await prisma.stock.update({
    where: {
      productoId_locationId: {
        productoId,
        locationId,
      },
    },
    data: {
      reservado: {
        decrement: cantidad,
      },
    },
  });

  // Registrar movimiento
  await prisma.movimientoStock.create({
    data: {
      productoId,
      tipo: 'RETURN',
      cantidad,
      destinoId: locationId,
      usuarioId,
      pedidoId,
      motivo: 'Liberación por cancelación',
    },
  });
  */
}

/**
 * Transfiere stock entre ubicaciones
 */
export async function transferirStock(
  productoId: string,
  origenId: string,
  destinoId: string,
  cantidad: number,
  usuarioId: string,
  notas?: string
) {
  // Verificar stock en origen (debe tener cantidad disponible sin reservas)
  const stockOrigen = await prisma.stock.findUnique({
    where: {
      productoId_locationId: {
        productoId,
        locationId: origenId,
      },
    },
  });

  if (!stockOrigen || stockOrigen.cantidad < cantidad) {
    throw new Error('Stock insuficiente en origen');
  }

  await prisma.$transaction(async (tx) => {
    // Decrementar en origen
    await tx.stock.update({
      where: {
        productoId_locationId: {
          productoId,
          locationId: origenId,
        },
      },
      data: {
        cantidad: {
          decrement: cantidad,
        },
      },
    });

    // Incrementar en destino (o crear si no existe)
    await tx.stock.upsert({
      where: {
        productoId_locationId: {
          productoId,
          locationId: destinoId,
        },
      },
      create: {
        productoId,
        locationId: destinoId,
        cantidad,
        reservado: 0,
        umbralBajo: 10,
      },
      update: {
        cantidad: {
          increment: cantidad,
        },
      },
    });

    // Registrar movimiento de transferencia
    await tx.movimientoStock.create({
      data: {
        productoId,
        tipo: 'TRANSFER',
        cantidad,
        origenId,
        destinoId,
        usuarioId,
        motivo: 'Transferencia entre ubicaciones',
        notas,
      },
    });
  });
}

/**
 * Obtiene productos con stock bajo (optimizado)
 */
export async function obtenerProductosStockBajo(eventoId: string) {
  // Optimización: usar consulta SQL directa para filtrar stock bajo
  const stockBajo = await prisma.stock.findMany({
    where: {
      location: {
        eventoId,
        activo: true,
      },
      umbralBajo: {
        not: null,
      },
    },
    select: {
      id: true,
      cantidad: true,
      reservado: true,
      umbralBajo: true,
      producto: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
      location: {
        select: {
          id: true,
          nombre: true,
          tipo: true,
        },
      },
    },
  });

  // Filtrar en memoria solo los que estén bajo el umbral
  return stockBajo
    .filter((s) => {
      const disponible = s.cantidad - s.reservado;
      return s.umbralBajo && disponible <= s.umbralBajo;
    })
    .map((s) => ({
      producto: s.producto.nombre,
      location: s.location.nombre,
      cantidad: s.cantidad,
      reservado: s.reservado,
      disponible: s.cantidad - s.reservado,
      umbralBajo: s.umbralBajo!,
    }));
}

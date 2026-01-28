import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from './prisma';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Valida y reserva stock para un producto (simple o compuesto)
 * Si es compuesto, valida y reserva los componentes
 */
export async function validarYReservarStock(
  tx: TransactionClient,
  productoId: string,
  cantidad: number,
  locationId: string,
  opcionesComponentes?: Record<string, string> // { "acompañamiento": "S001" }
): Promise<void> {
  // Obtener el producto con su receta
  const producto = await tx.producto.findUnique({
    where: { id: productoId },
    include: {
      receta: {
        include: {
          componente: true,
        },
      },
    },
  });

  if (!producto) {
    throw new Error('Producto no encontrado');
  }

  // Si es SIMPLE, validar y reservar directamente
  if (producto.tipo === 'SIMPLE') {
    await validarYReservarProductoSimple(tx, productoId, cantidad, locationId);
    return;
  }

  // Si es COMPUESTO, validar y reservar componentes
  if (producto.tipo === 'COMPUESTO') {
    if (producto.receta.length === 0) {
      throw new Error(`El producto ${producto.nombre} no tiene receta configurada`);
    }

    // Agrupar componentes por grupo de opciones
    const gruposOpcionales: Record<string, typeof producto.receta> = {};
    const componentesObligatorios: typeof producto.receta = [];

    for (const recetaItem of producto.receta) {
      if (recetaItem.opcional && recetaItem.grupoOpcion) {
        if (!gruposOpcionales[recetaItem.grupoOpcion]) {
          gruposOpcionales[recetaItem.grupoOpcion] = [];
        }
        gruposOpcionales[recetaItem.grupoOpcion].push(recetaItem);
      } else {
        componentesObligatorios.push(recetaItem);
      }
    }

    // Validar que se hayan elegido opciones para todos los grupos opcionales
    for (const grupo in gruposOpcionales) {
      if (!opcionesComponentes || !opcionesComponentes[grupo]) {
        const opciones = gruposOpcionales[grupo]
          .map((r) => r.componente.nombre)
          .join(', ');
        throw new Error(
          `Debe elegir ${grupo} para ${producto.nombre}. Opciones: ${opciones}`
        );
      }

      const componenteElegidoCodigo = opcionesComponentes[grupo];
      const componenteElegido = gruposOpcionales[grupo].find(
        (r) => r.componente.codigo === componenteElegidoCodigo
      );

      if (!componenteElegido) {
        throw new Error(
          `Opción inválida para ${grupo}: ${componenteElegidoCodigo}`
        );
      }

      // Validar y reservar el componente elegido
      await validarYReservarProductoSimple(
        tx,
        componenteElegido.componenteId,
        componenteElegido.cantidad * cantidad,
        locationId
      );
    }

    // Validar y reservar componentes obligatorios
    for (const recetaItem of componentesObligatorios) {
      await validarYReservarProductoSimple(
        tx,
        recetaItem.componenteId,
        recetaItem.cantidad * cantidad,
        locationId
      );
    }

    return;
  }

  // Si es BASE, no debería venderse solo
  if (producto.tipo === 'BASE') {
    throw new Error(
      `El producto ${producto.nombre} es un insumo base y no puede venderse directamente`
    );
  }
}

/**
 * Valida y reserva stock de un producto simple
 */
async function validarYReservarProductoSimple(
  tx: TransactionClient,
  productoId: string,
  cantidad: number,
  locationId: string
): Promise<void> {
  const stockDisponible = await tx.stock.findUnique({
    where: {
      productoId_locationId: {
        productoId,
        locationId,
      },
    },
  });

  if (!stockDisponible) {
    const producto = await tx.producto.findUnique({
      where: { id: productoId },
    });
    throw new Error(`${producto?.nombre || 'Producto'} sin stock configurado`);
  }

  const disponible = stockDisponible.cantidad - stockDisponible.reservado;
  if (disponible < cantidad) {
    const producto = await tx.producto.findUnique({
      where: { id: productoId },
    });
    throw new Error(
      `Stock insuficiente de ${producto?.nombre} (disponible: ${disponible}, solicitado: ${cantidad})`
    );
  }

  // Reservar stock
  await tx.stock.update({
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
}

/**
 * Obtiene información de la receta de un producto para mostrar en la UI (optimizado)
 */
export async function obtenerRecetaProducto(productoId: string) {
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
    select: {
      tipo: true,
      nombre: true,
      receta: {
        select: {
          id: true,
          cantidad: true,
          opcional: true,
          grupoOpcion: true,
          componente: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
        },
      },
    },
  });

  if (!producto) {
    return null;
  }

  if (producto.tipo !== 'COMPUESTO' || producto.receta.length === 0) {
    return null;
  }

  // Agrupar opciones
  const gruposOpcionales: Record<
    string,
    Array<{ id: string; codigo: string; nombre: string; cantidad: number }>
  > = {};
  const componentesObligatorios: Array<{
    id: string;
    codigo: string;
    nombre: string;
    cantidad: number;
  }> = [];

  for (const recetaItem of producto.receta) {
    const info = {
      id: recetaItem.componente.id,
      codigo: recetaItem.componente.codigo,
      nombre: recetaItem.componente.nombre,
      cantidad: recetaItem.cantidad,
    };

    if (recetaItem.opcional && recetaItem.grupoOpcion) {
      if (!gruposOpcionales[recetaItem.grupoOpcion]) {
        gruposOpcionales[recetaItem.grupoOpcion] = [];
      }
      gruposOpcionales[recetaItem.grupoOpcion].push(info);
    } else {
      componentesObligatorios.push(info);
    }
  }

  return {
    tipo: producto.tipo,
    componentesObligatorios,
    gruposOpcionales,
  };
}

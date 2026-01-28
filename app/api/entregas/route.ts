import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const crearEntregaSchema = z.object({
  qrToken: z.string(),
  barraId: z.string(),
  items: z.array(
    z.object({
      pedidoItemId: z.string(),
      cantidadEntregada: z.number().int().positive(),
    })
  ).min(1, 'Debe entregar al menos un item'),
  notas: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['BARRA', 'ADMIN', 'SUPERVISOR']);
    
    // Verificar que el usuario existe en la BD
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id: user.userId },
    });
    
    if (!usuarioExiste) {
      return NextResponse.json(
        { success: false, error: 'Usuario no válido. Por favor, cierra sesión e inicia sesión nuevamente.' },
        { status: 401 }
      );
    }
    
    const body = await request.json();

    // Validar datos
    const validation = crearEntregaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { qrToken, barraId, items, notas } = validation.data;

    // Buscar pedido con productos completos (incluir receta para combos)
    const pedido = await prisma.pedido.findUnique({
      where: { qrToken },
      select: {
        id: true,
        codigo: true,
        estadoPago: true,
        estadoPedido: true,
        items: {
          select: {
            id: true,
            productoId: true,
            cantidad: true,
            cantidadEntregada: true,
            estadoItem: true,
            producto: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                tipo: true,
                receta: {
                  select: {
                    componenteId: true,
                    cantidad: true,
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
            },
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Verificar estado del pedido
    if (pedido.estadoPedido === 'DELIVERED') {
      return NextResponse.json(
        { success: false, error: 'Pedido ya fue entregado completamente' },
        { status: 400 }
      );
    }

    if (pedido.estadoPedido === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Pedido cancelado' },
        { status: 400 }
      );
    }

    // Verificar pago (por defecto no entregar si no está pagado)
    if (pedido.estadoPago !== 'PAID') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pago pendiente de aprobación. No se puede entregar.' 
        },
        { status: 400 }
      );
    }

    // Verificar que la barra existe
    const barra = await prisma.barra.findUnique({
      where: { id: barraId },
      include: { evento: true },
    });

    if (!barra) {
      return NextResponse.json(
        { success: false, error: 'Barra no encontrada' },
        { status: 400 }
      );
    }

    // Obtener ubicación de stock del evento
    const stockLocation = await prisma.stockLocation.findFirst({
      where: { 
        eventoId: barra.eventoId,
        activo: true 
      },
    });

    if (!stockLocation) {
      return NextResponse.json(
        { success: false, error: 'No hay ubicación de stock disponible' },
        { status: 400 }
      );
    }

    // Procesar entrega en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Validar cada item
      for (const item of items) {
        const pedidoItem = pedido.items.find((pi) => pi.id === item.pedidoItemId);
        
        if (!pedidoItem) {
          throw new Error('Item del pedido no encontrado');
        }

        const cantidadRestante = pedidoItem.cantidad - pedidoItem.cantidadEntregada;
        
        if (item.cantidadEntregada > cantidadRestante) {
          throw new Error(
            `No se puede entregar ${item.cantidadEntregada} de ${pedidoItem.producto.nombre}. Solo quedan ${cantidadRestante} por entregar.`
          );
        }
      }

      // Crear entrega
      const entrega = await tx.entrega.create({
        data: {
          pedidoId: pedido.id,
          barraId,
          bartenderId: user.userId,
          notas,
          detalles: {
            create: items.map((item) => ({
              pedidoItemId: item.pedidoItemId,
              cantidadEntregada: item.cantidadEntregada,
            })),
          },
        },
        include: {
          detalles: true,
        },
      });

      // Actualizar cada item del pedido y stock
      for (const item of items) {
        const pedidoItem = pedido.items.find((pi) => pi.id === item.pedidoItemId);
        if (!pedidoItem) continue;

        const nuevaCantidadEntregada = pedidoItem.cantidadEntregada + item.cantidadEntregada;
        const nuevoEstado = 
          nuevaCantidadEntregada >= pedidoItem.cantidad ? 'DELIVERED' : 'PARTIAL';

        // Actualizar pedido item
        await tx.pedidoItem.update({
          where: { id: item.pedidoItemId },
          data: {
            cantidadEntregada: nuevaCantidadEntregada,
            estadoItem: nuevoEstado,
          },
        });

        // Actualizar stock según el tipo de producto
        if (pedidoItem.producto.tipo === 'COMPUESTO') {
          // Para combos: actualizar stock de cada componente BASE
          if (pedidoItem.producto.receta && pedidoItem.producto.receta.length > 0) {
            for (const componenteReceta of pedidoItem.producto.receta) {
              const cantidadComponente = componenteReceta.cantidad * item.cantidadEntregada;
              
              // Actualizar stock del componente
              await tx.stock.update({
                where: {
                  productoId_locationId: {
                    productoId: componenteReceta.componenteId,
                    locationId: stockLocation.id,
                  },
                },
                data: {
                  cantidad: {
                    decrement: cantidadComponente,
                  },
                  reservado: {
                    decrement: cantidadComponente,
                  },
                },
              });

              // Registrar movimiento de stock del componente
              await tx.movimientoStock.create({
                data: {
                  productoId: componenteReceta.componenteId,
                  tipo: 'DELIVERY_COMMIT',
                  cantidad: -cantidadComponente,
                  origenId: stockLocation.id,
                  usuarioId: user.userId,
                  pedidoId: pedido.id,
                  entregaId: entrega.id,
                  motivo: `Entrega confirmada - Componente de ${pedidoItem.producto.nombre}`,
                },
              });
            }
          }
        } else {
          // Para productos SIMPLE: actualizar stock directamente
          await tx.stock.update({
            where: {
              productoId_locationId: {
                productoId: pedidoItem.productoId,
                locationId: stockLocation.id,
              },
            },
            data: {
              cantidad: {
                decrement: item.cantidadEntregada,
              },
              reservado: {
                decrement: item.cantidadEntregada,
              },
            },
          });

          // Registrar movimiento de stock
          await tx.movimientoStock.create({
            data: {
              productoId: pedidoItem.productoId,
              tipo: 'DELIVERY_COMMIT',
              cantidad: -item.cantidadEntregada,
              origenId: stockLocation.id,
              usuarioId: user.userId,
              pedidoId: pedido.id,
              entregaId: entrega.id,
              motivo: 'Entrega confirmada',
            },
          });
        }
      }

      // Verificar si todos los items están entregados
      const itemsActualizados = await tx.pedidoItem.findMany({
        where: { pedidoId: pedido.id },
      });

      const todosEntregados = itemsActualizados.every(
        (item) => item.estadoItem === 'DELIVERED'
      );

      const algunEntregado = itemsActualizados.some(
        (item) => item.estadoItem === 'DELIVERED' || item.estadoItem === 'PARTIAL'
      );

      const nuevoEstadoPedido = todosEntregados 
        ? 'DELIVERED' 
        : algunEntregado 
        ? 'PARTIAL_DELIVERY' 
        : 'PENDING_DELIVERY';

      // Actualizar estado del pedido
      await tx.pedido.update({
        where: { id: pedido.id },
        data: {
          estadoPedido: nuevoEstadoPedido,
          fechaEntregaCompleta: todosEntregados ? new Date() : null,
        },
      });

      return {
        entregaId: entrega.id,
        pedidoEstado: nuevoEstadoPedido,
        itemsActualizados: items.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: resultado.entregaId,
        pedidoId: pedido.id,
        mensaje: 'Entrega registrada exitosamente',
        pedidoEstado: resultado.pedidoEstado,
        itemsActualizados: resultado.itemsActualizados,
      },
    });
  } catch (error: any) {
    console.error('Error al crear entrega:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['BARRA', 'ADMIN', 'SUPERVISOR']);
    const { searchParams } = new URL(request.url);

    const barraId = searchParams.get('barraId');
    const fecha = searchParams.get('fecha');

    const where: any = {};

    if (barraId) {
      where.barraId = barraId;
    }

    // Filtrar por bartender si es rol BARRA
    if (user.rol === 'BARRA' && !barraId) {
      where.bartenderId = user.userId;
    }

    if (fecha) {
      const fechaObj = new Date(fecha);
      where.createdAt = {
        gte: new Date(fechaObj.setHours(0, 0, 0, 0)),
        lt: new Date(fechaObj.setHours(23, 59, 59, 999)),
      };
    }

    const entregas = await prisma.entrega.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        notas: true,
        pedido: {
          select: {
            id: true,
            codigo: true,
            total: true,
          },
        },
        barra: {
          select: {
            id: true,
            nombre: true,
          },
        },
        bartender: {
          select: {
            id: true,
            nombre: true,
          },
        },
        detalles: {
          select: {
            id: true,
            cantidadEntregada: true,
            pedidoItem: {
              select: {
                id: true,
                cantidad: true,
                producto: {
                  select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                    categoria: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: entregas,
    });
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

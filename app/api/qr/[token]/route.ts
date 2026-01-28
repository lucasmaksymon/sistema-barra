import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const pedido = await prisma.pedido.findUnique({
      where: { qrToken: token },
      select: {
        codigo: true,
        total: true,
        estadoPago: true,
        estadoPedido: true,
        metodoPago: true,
        createdAt: true,
        evento: {
          select: {
            id: true,
            nombre: true,
          },
        },
        caja: {
          select: {
            id: true,
            nombre: true,
          },
        },
        cajero: {
          select: {
            nombre: true,
          },
        },
        items: {
          select: {
            id: true,
            cantidad: true,
            cantidadEntregada: true,
            estadoItem: true,
            precioUnitario: true,
            producto: {
              select: {
                codigo: true,
                nombre: true,
              },
            },
          },
        },
        entregas: {
          select: {
            id: true,
            createdAt: true,
            barra: {
              select: {
                nombre: true,
              },
            },
            bartender: {
              select: {
                nombre: true,
              },
            },
            detalles: {
              select: {
                cantidadEntregada: true,
                pedidoItem: {
                  select: {
                    producto: {
                      select: {
                        nombre: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        codigo: pedido.codigo,
        evento: pedido.evento.nombre,
        caja: pedido.caja.nombre,
        total: Number(pedido.total),
        estadoPago: pedido.estadoPago,
        estadoPedido: pedido.estadoPedido,
        metodoPago: pedido.metodoPago,
        createdAt: pedido.createdAt.toISOString(),
        items: pedido.items.map((item) => ({
          id: item.id,
          producto: {
            nombre: item.producto.nombre,
            codigo: item.producto.codigo,
          },
          cantidad: item.cantidad,
          cantidadEntregada: item.cantidadEntregada,
          estadoItem: item.estadoItem,
          precioUnitario: Number(item.precioUnitario),
        })),
        entregas: pedido.entregas.map((entrega) => ({
          id: entrega.id,
          barra: entrega.barra.nombre,
          bartender: entrega.bartender.nombre,
          fecha: entrega.createdAt.toISOString(),
          detalles: entrega.detalles.map((detalle) => ({
            producto: detalle.pedidoItem.producto.nombre,
            cantidadEntregada: detalle.cantidadEntregada,
          })),
        })),
      },
    });
  } catch (error) {
    console.error('Error al obtener pedido por QR:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

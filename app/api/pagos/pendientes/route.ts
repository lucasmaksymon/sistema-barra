import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN', 'SUPERVISOR']);

    const pedidosPendientes = await prisma.pedido.findMany({
      where: {
        metodoPago: 'TRANSFER',
        estadoPago: 'PENDING_PAYMENT',
      },
      select: {
        id: true,
        codigo: true,
        eventoId: true,
        total: true,
        subtotal: true,
        createdAt: true,
        caja: {
          select: {
            id: true,
            nombre: true,
          },
        },
        cajero: {
          select: {
            id: true,
            nombre: true,
          },
        },
        evento: {
          select: {
            id: true,
            nombre: true,
          },
        },
        items: {
          select: {
            id: true,
            cantidad: true,
            precioUnitario: true,
            producto: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: pedidosPendientes,
    });
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

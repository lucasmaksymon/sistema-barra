import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const aprobarPagoSchema = z.object({
  aprobado: z.boolean(),
  notas: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, ['ADMIN', 'SUPERVISOR']);
    const { id } = await params;
    const body = await request.json();

    // Validar datos
    const validation = aprobarPagoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { aprobado, notas } = validation.data;

    // Buscar pedido
    const pedido = await prisma.pedido.findUnique({
      where: { id },
    });

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que sea transferencia y esté pendiente
    if (pedido.metodoPago !== 'TRANSFER') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden aprobar transferencias' },
        { status: 400 }
      );
    }

    if (pedido.estadoPago !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { success: false, error: 'El pago ya fue procesado' },
        { status: 400 }
      );
    }

    // Actualizar estado
    const pedidoActualizado = await prisma.pedido.update({
      where: { id },
      data: {
        estadoPago: aprobado ? 'PAID' : 'REJECTED',
        aprobadoPor: user.userId,
        fechaAprobacion: new Date(),
        fechaPago: aprobado ? new Date() : null,
      },
      include: {
        caja: true,
        cajero: {
          select: { nombre: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: pedidoActualizado,
      message: aprobado 
        ? 'Pago aprobado exitosamente' 
        : 'Pago rechazado',
    });
  } catch (error) {
    console.error('Error al aprobar pago:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

/**
 * GET /api/inventario/stock
 * Obtiene el stock disponible
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);
    const { searchParams } = new URL(request.url);

    const eventoId = searchParams.get('eventoId');
    const locationId = searchParams.get('locationId');

    const where: any = {};

    if (locationId) {
      where.locationId = locationId;
    } else if (eventoId) {
      where.location = {
        eventoId,
      };
    }

    const stock = await prisma.stock.findMany({
      where,
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            precio: true,
            tipo: true,
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
      orderBy: [
        { location: { nombre: 'asc' } },
        { producto: { nombre: 'asc' } },
      ],
    });

    const stockConDisponible = stock.map((s) => ({
      ...s,
      disponible: s.cantidad - s.reservado,
      precio: Number(s.producto.precio),
    }));

    return NextResponse.json({
      success: true,
      data: stockConDisponible,
    });
  } catch (error) {
    console.error('Error al obtener stock:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventario/stock
 * Ajusta el stock de un producto (entrada o salida manual)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['ADMIN']);
    const body = await request.json();
    const { productoId, locationId, cantidad, tipo, motivo } = body;

    // Validaciones
    if (!productoId || !locationId || !cantidad || !tipo || !motivo) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    if (cantidad === 0) {
      return NextResponse.json(
        { success: false, error: 'La cantidad debe ser diferente de cero' },
        { status: 400 }
      );
    }

    // Obtener stock actual
    const stockActual = await prisma.stock.findFirst({
      where: {
        productoId,
        locationId,
      },
    });

    if (!stockActual) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado en esta ubicación' },
        { status: 404 }
      );
    }

    // Validar que no quede negativo
    const nuevaCantidad = stockActual.cantidad + cantidad;
    if (nuevaCantidad < 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede ajustar a cantidad negativa' },
        { status: 400 }
      );
    }

    // Actualizar en transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar stock
      await tx.stock.update({
        where: { id: stockActual.id },
        data: { cantidad: nuevaCantidad },
      });

      // Crear movimiento
      await tx.movimientoStock.create({
        data: {
          productoId,
          tipo: tipo === 'entrada' ? 'INBOUND' : 'ADJUSTMENT',
          cantidad: Math.abs(cantidad),
          origenId: tipo === 'salida' ? locationId : null,
          destinoId: tipo === 'entrada' ? locationId : null,
          usuarioId: user.userId,
          motivo: motivo,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Stock ajustado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al ajustar stock:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventario/stock
 * Actualiza configuración del stock (umbral bajo, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);
    const body = await request.json();
    const { stockId, umbralBajo } = body;

    if (!stockId) {
      return NextResponse.json(
        { success: false, error: 'stockId es requerido' },
        { status: 400 }
      );
    }

    await prisma.stock.update({
      where: { id: stockId },
      data: { umbralBajo },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada',
    });
  } catch (error: any) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

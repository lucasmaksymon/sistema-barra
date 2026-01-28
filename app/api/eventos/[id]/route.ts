import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;

    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        cajas: true,
        barras: true,
        _count: {
          select: {
            pedidos: true,
          },
        },
      },
    });

    if (!evento) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: evento,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/eventos/[id]
 * Actualiza un evento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const { nombre, fecha, activo } = body;

    // Verificar que el evento existe
    const eventoExistente = await prisma.evento.findUnique({
      where: { id },
    });

    if (!eventoExistente) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el evento
    const evento = await prisma.evento.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? nombre : eventoExistente.nombre,
        fecha: fecha !== undefined ? new Date(fecha) : eventoExistente.fecha,
        activo: activo !== undefined ? activo : eventoExistente.activo,
      },
    });

    return NextResponse.json({
      success: true,
      data: evento,
      message: 'Evento actualizado exitosamente',
    });
  } catch (error: any) {
    console.error('Error en PUT /api/eventos/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar evento' },
      { status: 500 }
    );
  }
}

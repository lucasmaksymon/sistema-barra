import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const cajas = await prisma.caja.findMany({
      select: {
        id: true,
        nombre: true,
        eventoId: true,
        activo: true,
        createdAt: true,
        evento: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: cajas,
    });
  } catch (error: any) {
    console.error('Error al obtener cajas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

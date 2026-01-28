import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const barras = await prisma.barra.findMany({
      select: {
        id: true,
        nombre: true,
        eventoId: true,
        activa: true,
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
      data: barras,
    });
  } catch (error: any) {
    console.error('Error al obtener barras:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';

const crearEventoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  fecha: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const activo = searchParams.get('activo');

    const where: any = {};
    if (activo === 'true') {
      where.activo = true;
    }

    const eventos = await prisma.evento.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        fecha: true,
        activo: true,
        createdAt: true,
        _count: {
          select: {
            pedidos: true,
            cajas: true,
            barras: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: eventos,
    });
  } catch (error: any) {
    console.error('Error al obtener eventos:', error);
    
    // Si es error de autenticación, devolver 401
    if (error.message?.includes('autenticación') || error.message?.includes('token')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);
    const body = await request.json();

    const validation = crearEventoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { nombre, fecha } = validation.data;

    const evento = await prisma.evento.create({
      data: {
        nombre,
        fecha: new Date(fecha),
      },
    });

    return NextResponse.json({
      success: true,
      data: evento,
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

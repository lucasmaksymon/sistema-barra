import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { transferirStock } from '@/lib/inventory';
import { z } from 'zod';

const crearMovimientoSchema = z.object({
  tipo: z.enum(['INBOUND', 'TRANSFER', 'WASTE', 'ADJUSTMENT']),
  productoId: z.string(),
  cantidad: z.number().int(),
  origenId: z.string().optional(),
  destinoId: z.string().optional(),
  motivo: z.string().optional(),
  notas: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['ADMIN', 'INVENTARIO']);
    const body = await request.json();

    const validation = crearMovimientoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { tipo, productoId, cantidad, origenId, destinoId, motivo, notas } = validation.data;

    // Manejar transferencias
    if (tipo === 'TRANSFER') {
      if (!origenId || !destinoId) {
        return NextResponse.json(
          { success: false, error: 'Origen y destino requeridos para transferencia' },
          { status: 400 }
        );
      }

      await transferirStock(productoId, origenId, destinoId, cantidad, user.userId, notas);

      return NextResponse.json({
        success: true,
        message: 'Transferencia realizada exitosamente',
      });
    }

    // Manejar otros tipos de movimientos
    let locationId: string | undefined;

    if (tipo === 'INBOUND' && destinoId) {
      locationId = destinoId;
      
      // Incrementar stock
      await prisma.stock.upsert({
        where: {
          productoId_locationId: {
            productoId,
            locationId: destinoId,
          },
        },
        create: {
          productoId,
          locationId: destinoId,
          cantidad,
          reservado: 0,
          umbralBajo: 10,
        },
        update: {
          cantidad: {
            increment: cantidad,
          },
        },
      });
    } else if ((tipo === 'WASTE' || tipo === 'ADJUSTMENT') && origenId) {
      locationId = origenId;
      
      // Actualizar stock
      await prisma.stock.update({
        where: {
          productoId_locationId: {
            productoId,
            locationId: origenId,
          },
        },
        data: {
          cantidad: {
            increment: cantidad, // Puede ser negativo para WASTE
          },
        },
      });
    }

    // Registrar movimiento
    await prisma.movimientoStock.create({
      data: {
        productoId,
        tipo,
        cantidad,
        origenId,
        destinoId,
        usuarioId: user.userId,
        motivo,
        notas,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Movimiento registrado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al crear movimiento:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN', 'INVENTARIO', 'SUPERVISOR']);
    const { searchParams } = new URL(request.url);

    const productoId = searchParams.get('productoId');
    const tipo = searchParams.get('tipo');
    const fecha = searchParams.get('fecha');

    const where: any = {};

    if (productoId) {
      where.productoId = productoId;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (fecha) {
      const fechaObj = new Date(fecha);
      where.createdAt = {
        gte: new Date(fechaObj.setHours(0, 0, 0, 0)),
        lt: new Date(fechaObj.setHours(23, 59, 59, 999)),
      };
    }

    const movimientos = await prisma.movimientoStock.findMany({
      where,
      include: {
        producto: {
          select: {
            nombre: true,
            codigo: true,
          },
        },
        origen: {
          select: {
            nombre: true,
          },
        },
        destino: {
          select: {
            nombre: true,
          },
        },
        usuario: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: movimientos,
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

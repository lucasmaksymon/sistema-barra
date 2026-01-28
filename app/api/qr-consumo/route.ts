import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { generateQRConsumoToken, generateQRConsumoCodigo, getQRConsumoUrl } from '@/lib/qr-consumo';
import { z } from 'zod';

const crearQRConsumoSchema = z.object({
  eventoId: z.string(),
  montoInicial: z.number().positive(),
  nombreCliente: z.string().optional(),
  notas: z.string().optional(),
  fechaExpiracion: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['ADMIN']);
    const body = await request.json();

    // Validar datos
    const validation = crearQRConsumoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { eventoId, montoInicial, nombreCliente, notas, fechaExpiracion } = validation.data;

    // Verificar evento
    const evento = await prisma.evento.findUnique({
      where: { id: eventoId },
    });

    if (!evento || !evento.activo) {
      return NextResponse.json(
        { success: false, error: 'Evento no válido' },
        { status: 400 }
      );
    }

    // Generar código y token
    const todayQRConsumos = await prisma.qRConsumo.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const codigo = generateQRConsumoCodigo(todayQRConsumos + 1);
    const qrToken = generateQRConsumoToken();

    // Crear QR de consumo
    const qrConsumo = await prisma.qRConsumo.create({
      data: {
        codigo,
        qrToken,
        eventoId,
        creadoPorId: user.userId,
        montoInicial,
        saldoActual: montoInicial,
        nombreCliente,
        notas,
        fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : null,
      },
    });

    // Crear transacción inicial
    await prisma.transaccionQRConsumo.create({
      data: {
        qrConsumoId: qrConsumo.id,
        tipo: 'CARGA',
        monto: montoInicial,
        saldoAnterior: 0,
        saldoNuevo: montoInicial,
        descripcion: 'Carga inicial',
        realizadoPor: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: qrConsumo.id,
        codigo: qrConsumo.codigo,
        qrToken: qrConsumo.qrToken,
        qrUrl: getQRConsumoUrl(qrConsumo.qrToken, request),
        montoInicial: Number(qrConsumo.montoInicial),
        saldoActual: Number(qrConsumo.saldoActual),
        estado: qrConsumo.estado,
        createdAt: qrConsumo.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error al crear QR de consumo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['ADMIN', 'CAJA']);
    const { searchParams } = new URL(request.url);

    const eventoId = searchParams.get('eventoId');
    const estado = searchParams.get('estado');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (eventoId) {
      where.eventoId = eventoId;
    }

    if (estado) {
      where.estado = estado;
    }

    const [qrConsumos, total] = await Promise.all([
      prisma.qRConsumo.findMany({
        where,
        include: {
          evento: {
            select: {
              id: true,
              nombre: true,
            },
          },
          creadoPor: {
            select: {
              nombre: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.qRConsumo.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        qrConsumos: qrConsumos.map((qr) => ({
          ...qr,
          montoInicial: Number(qr.montoInicial),
          saldoActual: Number(qr.saldoActual),
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener QR de consumo:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { qrToken, montoRequerido } = body;

    if (!qrToken) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
        { status: 400 }
      );
    }

    // Buscar el QR de consumo
    const qrConsumo = await prisma.qRConsumo.findUnique({
      where: { qrToken },
      include: {
        evento: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!qrConsumo) {
      return NextResponse.json({
        success: false,
        valido: false,
        error: 'QR de consumo no encontrado',
      });
    }

    // Verificar estado
    if (qrConsumo.estado !== 'ACTIVO') {
      let mensajeEstado = 'QR de consumo no disponible';
      
      if (qrConsumo.estado === 'AGOTADO') {
        mensajeEstado = 'QR de consumo agotado (saldo: $0)';
      } else if (qrConsumo.estado === 'BLOQUEADO') {
        mensajeEstado = 'QR de consumo bloqueado';
      } else if (qrConsumo.estado === 'EXPIRADO') {
        mensajeEstado = 'QR de consumo expirado';
      }
      
      return NextResponse.json({
        success: false,
        valido: false,
        error: mensajeEstado,
      });
    }

    // Verificar fecha de expiración
    if (qrConsumo.fechaExpiracion && new Date(qrConsumo.fechaExpiracion) < new Date()) {
      // Marcar como expirado
      await prisma.qRConsumo.update({
        where: { id: qrConsumo.id },
        data: { estado: 'EXPIRADO' },
      });

      return NextResponse.json({
        success: false,
        valido: false,
        error: 'QR de consumo expirado',
      });
    }

    // Verificar saldo si se especificó un monto requerido
    if (montoRequerido && Number(qrConsumo.saldoActual) < montoRequerido) {
      return NextResponse.json({
        success: false,
        valido: false,
        error: `Saldo insuficiente. Disponible: $${Number(qrConsumo.saldoActual).toFixed(2)}`,
        qrConsumo: {
          id: qrConsumo.id,
          codigo: qrConsumo.codigo,
          saldoActual: Number(qrConsumo.saldoActual),
          nombreCliente: qrConsumo.nombreCliente,
        },
      });
    }

    return NextResponse.json({
      success: true,
      valido: true,
      qrConsumo: {
        id: qrConsumo.id,
        codigo: qrConsumo.codigo,
        saldoActual: Number(qrConsumo.saldoActual),
        nombreCliente: qrConsumo.nombreCliente,
        evento: qrConsumo.evento,
      },
    });
  } catch (error: any) {
    console.error('Error al validar QR de consumo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

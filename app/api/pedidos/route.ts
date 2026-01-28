import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { generateQRToken, generatePedidoCodigo, getQRUrl } from '@/lib/qr';
import { reservarStock } from '@/lib/inventory';
import { validarYReservarStock } from '@/lib/productos-compuestos';
import { z } from 'zod';

const crearPedidoSchema = z.object({
  eventoId: z.string(),
  cajaId: z.string(),
  metodoPago: z.enum(['CASH', 'TRANSFER', 'QR_CONSUMO']),
  qrConsumoToken: z.string().optional(),
  items: z.array(
    z.object({
      productoId: z.string(),
      cantidad: z.number().int().positive(),
      precioUnitario: z.number().positive(),
      opcionesComponentes: z.record(z.string()).optional(), // { "acompañamiento": "S001" }
    })
  ).min(1, 'Debe haber al menos un item'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['CAJA', 'ADMIN']);
    
    // Verificar que el usuario existe en la BD
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id: user.userId },
    });
    
    if (!usuarioExiste) {
      return NextResponse.json(
        { success: false, error: 'Usuario no válido. Por favor, cierra sesión e inicia sesión nuevamente.' },
        { status: 401 }
      );
    }
    
    const body = await request.json();

    // Validar datos
    const validation = crearPedidoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { eventoId, cajaId, metodoPago, qrConsumoToken, items } = validation.data;

    // Verificar caja y evento
    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
      include: { evento: true },
    });

    if (!caja || caja.eventoId !== eventoId) {
      return NextResponse.json(
        { success: false, error: 'Caja o evento inválido' },
        { status: 400 }
      );
    }

    // Calcular totales
    const subtotal = items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0
    );
    const total = subtotal;

    // Si el método de pago es QR_CONSUMO, validar el QR
    let qrConsumoId: string | undefined;
    if (metodoPago === 'QR_CONSUMO') {
      if (!qrConsumoToken) {
        return NextResponse.json(
          { success: false, error: 'Token de QR de consumo requerido' },
          { status: 400 }
        );
      }

      // Validar QR de consumo
      const qrConsumo = await prisma.qRConsumo.findUnique({
        where: { qrToken: qrConsumoToken },
      });

      if (!qrConsumo) {
        return NextResponse.json(
          { success: false, error: 'QR de consumo no encontrado' },
          { status: 400 }
        );
      }

      if (qrConsumo.estado !== 'ACTIVO') {
        return NextResponse.json(
          { success: false, error: 'QR de consumo no disponible' },
          { status: 400 }
        );
      }

      if (Number(qrConsumo.saldoActual) < total) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Saldo insuficiente. Disponible: $${Number(qrConsumo.saldoActual).toFixed(2)}` 
          },
          { status: 400 }
        );
      }

      qrConsumoId = qrConsumo.id;
    }

    // Generar código y token
    const todayPedidos = await prisma.pedido.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const codigo = generatePedidoCodigo(todayPedidos + 1);
    const qrToken = generateQRToken();

    // Obtener ubicación de stock del evento
    const stockLocation = await prisma.stockLocation.findFirst({
      where: { 
        eventoId, 
        activo: true 
      },
    });

    if (!stockLocation) {
      return NextResponse.json(
        { success: false, error: 'No hay ubicación de stock disponible' },
        { status: 400 }
      );
    }

    const locationId = stockLocation.id;

    // Crear pedido con transacción
    const pedido = await prisma.$transaction(async (tx) => {
      // Verificar y reservar stock para cada item (combos o simples)
      for (const item of items) {
        await validarYReservarStock(
          tx,
          item.productoId,
          item.cantidad,
          locationId,
          item.opcionesComponentes
        );
      }

      // Determinar estado de pago según método
      let estadoPago: 'PAID' | 'PENDING_PAYMENT' = 'PENDING_PAYMENT';
      let fechaPago: Date | null = null;

      if (metodoPago === 'CASH' || metodoPago === 'QR_CONSUMO') {
        estadoPago = 'PAID';
        fechaPago = new Date();
      }

      // Crear el pedido
      const nuevoPedido = await tx.pedido.create({
        data: {
          codigo,
          qrToken,
          eventoId,
          cajaId,
          cajeroId: user.userId,
          metodoPago,
          qrConsumoId,
          estadoPago,
          estadoPedido: 'PENDING_DELIVERY',
          subtotal,
          total,
          fechaPago,
          items: {
            create: items.map((item) => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.cantidad * item.precioUnitario,
              opcionesComponentes: item.opcionesComponentes || {},
              cantidadEntregada: 0,
              estadoItem: 'PENDING',
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // La reserva de stock ya se hizo en validarYReservarStock()
      // (incluye componentes para combos)

      // Si es pago con QR de consumo, descontar del saldo
      if (metodoPago === 'QR_CONSUMO' && qrConsumoId) {
        const qrConsumo = await tx.qRConsumo.findUnique({
          where: { id: qrConsumoId },
        });

        if (!qrConsumo) {
          throw new Error('QR de consumo no encontrado');
        }

        const saldoAnterior = Number(qrConsumo.saldoActual);
        const nuevoSaldo = saldoAnterior - total;

        // Actualizar saldo del QR de consumo
        await tx.qRConsumo.update({
          where: { id: qrConsumoId },
          data: {
            saldoActual: nuevoSaldo,
            estado: nuevoSaldo <= 0 ? 'AGOTADO' : 'ACTIVO',
          },
        });

        // Crear transacción
        await tx.transaccionQRConsumo.create({
          data: {
            qrConsumoId,
            pedidoId: nuevoPedido.id,
            tipo: 'CONSUMO',
            monto: total,
            saldoAnterior,
            saldoNuevo: nuevoSaldo,
            descripcion: `Pedido ${nuevoPedido.codigo}`,
            realizadoPor: user.userId,
          },
        });
      }

      return nuevoPedido;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: pedido.id,
        codigo: pedido.codigo,
        qrToken: pedido.qrToken,
        qrUrl: getQRUrl(pedido.qrToken, request),
        total: Number(pedido.total),
        estadoPago: pedido.estadoPago,
        estadoPedido: pedido.estadoPedido,
        createdAt: pedido.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error al crear pedido:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
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
      where.estadoPedido = estado;
    }

    // Si es cajero, solo ver sus pedidos
    if (user.rol === 'CAJA') {
      where.cajeroId = user.userId;
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        select: {
          id: true,
          codigo: true,
          qrToken: true,
          eventoId: true,
          estadoPago: true,
          estadoPedido: true,
          subtotal: true,
          total: true,
          metodoPago: true,
          createdAt: true,
          fechaPago: true,
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
          items: {
            select: {
              id: true,
              cantidad: true,
              precioUnitario: true,
              subtotal: true,
              cantidadEntregada: true,
              estadoItem: true,
              producto: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  categoria: true,
                  tipo: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pedido.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pedidos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

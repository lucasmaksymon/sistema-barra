import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;

    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        receta: {
          include: {
            componente: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                precio: true,
              },
            },
          },
        },
      },
    });

    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Si no es compuesto o no tiene receta, devolver null
    if (producto.tipo !== 'COMPUESTO' || producto.receta.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Agrupar componentes
    const gruposOpcionales: Record<string, any[]> = {};
    const componentesObligatorios: any[] = [];

    for (const recetaItem of producto.receta) {
      const info = {
        id: recetaItem.componente.id,
        codigo: recetaItem.componente.codigo,
        nombre: recetaItem.componente.nombre,
        cantidad: recetaItem.cantidad,
        precio: Number(recetaItem.componente.precio),
      };

      if (recetaItem.opcional && recetaItem.grupoOpcion) {
        if (!gruposOpcionales[recetaItem.grupoOpcion]) {
          gruposOpcionales[recetaItem.grupoOpcion] = [];
        }
        gruposOpcionales[recetaItem.grupoOpcion].push(info);
      } else {
        componentesObligatorios.push(info);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tipo: producto.tipo,
        componentesObligatorios,
        gruposOpcionales,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener receta:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

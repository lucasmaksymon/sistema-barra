import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/combos
 * Lista todos los combos (productos tipo COMBO) con sus recetas
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    // Obtener combos con sus recetas
    const combos = await prisma.producto.findMany({
      where: {
        tipo: 'COMPUESTO',
      },
      include: {
        receta: {
          include: {
            componente: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                precio: true,
                tipo: true,
              },
            },
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Formatear la respuesta
    const combosFormateados = combos.map((combo) => {
      const componentesObligatorios: any[] = [];
      const gruposOpcionales: Record<string, any[]> = {};

      combo.receta.forEach((item) => {
        const componenteInfo = {
          recetaId: item.id,
          componenteId: item.componenteId,
          codigo: item.componente.codigo,
          nombre: item.componente.nombre,
          cantidad: item.cantidad,
          opcional: item.opcional,
          grupoOpcion: item.grupoOpcion,
        };

        if (!item.opcional) {
          componentesObligatorios.push(componenteInfo);
        } else if (item.grupoOpcion) {
          if (!gruposOpcionales[item.grupoOpcion]) {
            gruposOpcionales[item.grupoOpcion] = [];
          }
          gruposOpcionales[item.grupoOpcion].push(componenteInfo);
        }
      });

      return {
        id: combo.id,
        codigo: combo.codigo,
        nombre: combo.nombre,
        descripcion: combo.descripcion,
        precio: Number(combo.precio),
        categoria: combo.categoria,
        activo: combo.activo,
        componentesObligatorios,
        gruposOpcionales,
      };
    });

    return NextResponse.json({
      success: true,
      data: combosFormateados,
    });
  } catch (error: any) {
    console.error('Error en GET /api/combos:', error);
    const status = error.message?.includes('autorizado') ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener combos' },
      { status }
    );
  }
}

/**
 * POST /api/combos
 * Crea un nuevo combo con su receta
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const { codigo, nombre, descripcion, precio, categoria, activo, componentesObligatorios, gruposOpcionales } = body;

    // Validaciones básicas
    if (!codigo || !nombre || !precio) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    if (!componentesObligatorios || componentesObligatorios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El combo debe tener al menos un componente obligatorio' },
        { status: 400 }
      );
    }

    // Verificar que el código no exista
    const existe = await prisma.producto.findUnique({
      where: { codigo },
    });

    if (existe) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un producto con ese código' },
        { status: 400 }
      );
    }

    // Crear el combo con su receta
    const combo = await prisma.producto.create({
      data: {
        codigo,
        nombre,
        descripcion: descripcion || null,
        precio,
        categoria: categoria || null,
        tipo: 'COMPUESTO',
        activo: activo ?? true,
      },
    });

    // Crear componentes obligatorios
    const recetaData: any[] = componentesObligatorios.map((comp: any) => ({
      productoId: combo.id,
      componenteId: comp.componenteId,
      cantidad: comp.cantidad,
      opcional: false,
    }));

    // Agregar componentes opcionales agrupados
    if (gruposOpcionales) {
      Object.entries(gruposOpcionales).forEach(([nombreGrupo, componentes]: [string, any]) => {
        if (Array.isArray(componentes)) {
          componentes.forEach((comp: any) => {
            recetaData.push({
              productoId: combo.id,
              componenteId: comp.componenteId,
              cantidad: comp.cantidad,
              opcional: true,
              grupoOpcion: nombreGrupo,
            });
          });
        }
      });
    }

    await prisma.productoReceta.createMany({
      data: recetaData,
    });

    return NextResponse.json({
      success: true,
      data: combo,
      message: 'Combo creado exitosamente',
    });
  } catch (error: any) {
    console.error('Error en POST /api/combos:', error);
    const status = error.message?.includes('autorizado') || error.message?.includes('denegado') ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear combo' },
      { status }
    );
  }
}

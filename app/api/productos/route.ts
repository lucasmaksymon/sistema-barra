import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { z } from 'zod';

const crearProductoSchema = z.object({
  codigo: z.string().min(1, 'Código requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  precio: z.number().positive('Precio debe ser positivo'),
  categoria: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const activo = searchParams.get('activo');
    const categoria = searchParams.get('categoria');
    const tipo = searchParams.get('tipo'); // Nuevo: filtrar por tipo
    const incluirReceta = searchParams.get('incluirReceta') === 'true';

    const where: any = {};
    
    if (activo === 'true') {
      where.activo = true;
    }
    
    if (categoria) {
      where.categoria = categoria;
    }

    if (tipo) {
      where.tipo = tipo; // 'BASE', 'SIMPLE', 'COMPUESTO'
    }

    const productos = await prisma.producto.findMany({
      where,
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precio: true,
        categoria: true,
        activo: true,
        tipo: true,
        receta: incluirReceta ? {
          select: {
            id: true,
            cantidad: true,
            opcional: true,
            grupoOpcion: true,
            componenteId: true,
            componente: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                tipo: true,
              },
            },
          },
        } : false,
      },
      orderBy: [
        { categoria: 'asc' },
        { nombre: 'asc' },
      ],
    });

    const productosFormateados = productos.map((p) => {
      const base: any = {
        ...p,
        precio: Number(p.precio),
      };

      // Si es un combo y se pidió la receta, formatearla
      if (p.tipo === 'COMPUESTO' && incluirReceta && 'receta' in p) {
        const receta = p.receta as any[];
        
        // Separar componentes obligatorios y opcionales
        const obligatorios = receta.filter(r => !r.opcional);
        const opcionales = receta.filter(r => r.opcional);

        // Agrupar opcionales por grupoOpcion
        const gruposOpcionales: Record<string, any[]> = {};
        for (const r of opcionales) {
          const grupo = r.grupoOpcion || 'sin_grupo';
          if (!gruposOpcionales[grupo]) {
            gruposOpcionales[grupo] = [];
          }
          gruposOpcionales[grupo].push({
            componenteId: r.componenteId,
            codigo: r.componente.codigo,
            nombre: r.componente.nombre,
            cantidad: r.cantidad,
          });
        }

        base.recetaInfo = {
          componentesObligatorios: obligatorios.map(r => ({
            componenteId: r.componenteId,
            codigo: r.componente.codigo,
            nombre: r.componente.nombre,
            cantidad: r.cantidad,
          })),
          gruposOpcionales,
        };
      }

      // Eliminar la receta cruda si existe
      if ('receta' in base) {
        delete base.receta;
      }

      return base;
    });

    return NextResponse.json({
      success: true,
      data: productosFormateados,
    });
  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);
    const body = await request.json();

    const validation = crearProductoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { codigo, nombre, descripcion, precio, categoria } = validation.data;

    // Verificar que el código no exista
    const existente = await prisma.producto.findUnique({
      where: { codigo },
    });

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'El código ya existe' },
        { status: 400 }
      );
    }

    const producto = await prisma.producto.create({
      data: {
        codigo,
        nombre,
        descripcion,
        precio,
        categoria,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...producto,
        precio: Number(producto.precio),
      },
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

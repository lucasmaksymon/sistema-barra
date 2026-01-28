import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';

const actualizarProductoSchema = z.object({
  codigo: z.string().min(1).optional(),
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  precio: z.number().positive().optional(),
  categoria: z.string().optional(),
  activo: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);
    const body = await request.json();
    const { id } = await params;

    const validation = actualizarProductoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { codigo, nombre, descripcion, precio, categoria, activo } = validation.data;

    // Verificar que el producto existe
    const productoExistente = await prisma.producto.findUnique({
      where: { id },
    });

    if (!productoExistente) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Si se cambia el código, verificar que no esté en uso
    if (codigo && codigo !== productoExistente.codigo) {
      const codigoEnUso = await prisma.producto.findUnique({
        where: { codigo },
      });

      if (codigoEnUso) {
        return NextResponse.json(
          { success: false, error: 'El código ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Preparar datos para actualizar
    const dataToUpdate: any = {};
    if (codigo) dataToUpdate.codigo = codigo;
    if (nombre) dataToUpdate.nombre = nombre;
    if (descripcion !== undefined) dataToUpdate.descripcion = descripcion;
    if (precio) dataToUpdate.precio = precio;
    if (categoria !== undefined) dataToUpdate.categoria = categoria;
    if (activo !== undefined) dataToUpdate.activo = activo;

    const producto = await prisma.producto.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...producto,
        precio: Number(producto.precio),
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);
    const { id } = await params;

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // En lugar de eliminar, marcar como inactivo
    await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Producto desactivado correctamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

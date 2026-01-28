import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/combos/[id]
 * Actualiza un combo y su receta
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const { id } = await params;
    const body = await request.json();
    const { codigo, nombre, descripcion, precio, categoria, activo, componentesObligatorios, gruposOpcionales } = body;

    // Verificar que el combo existe
    const comboExistente = await prisma.producto.findUnique({
      where: { id },
    });

    if (!comboExistente || comboExistente.tipo !== 'COMPUESTO') {
      return NextResponse.json(
        { success: false, error: 'Combo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el código no esté en uso por otro producto
    if (codigo && codigo !== comboExistente.codigo) {
      const existe = await prisma.producto.findUnique({
        where: { codigo },
      });

      if (existe) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un producto con ese código' },
          { status: 400 }
        );
      }
    }

    // Validar que haya al menos un componente obligatorio
    if (!componentesObligatorios || componentesObligatorios.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El combo debe tener al menos un componente obligatorio' },
        { status: 400 }
      );
    }

    // Actualizar en una transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar el producto
      await tx.producto.update({
        where: { id },
        data: {
          codigo: codigo || comboExistente.codigo,
          nombre: nombre || comboExistente.nombre,
          descripcion: descripcion !== undefined ? descripcion : comboExistente.descripcion,
          precio: precio !== undefined ? precio : comboExistente.precio,
          categoria: categoria !== undefined ? categoria : comboExistente.categoria,
          activo: activo !== undefined ? activo : comboExistente.activo,
        },
      });

      // Eliminar receta anterior
      await tx.productoReceta.deleteMany({
        where: { productoId: id },
      });

      // Crear nueva receta
      const recetaData: any[] = componentesObligatorios.map((comp: any) => ({
        productoId: id,
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
                productoId: id,
                componenteId: comp.componenteId,
                cantidad: comp.cantidad,
                opcional: true,
                grupoOpcion: nombreGrupo,
              });
            });
          }
        });
      }

      await tx.productoReceta.createMany({
        data: recetaData,
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Combo actualizado exitosamente',
    });
  } catch (error: any) {
    console.error('Error en PUT /api/combos/[id]:', error);
    const status = error.message?.includes('autorizado') || error.message?.includes('denegado') ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar combo' },
      { status }
    );
  }
}

/**
 * DELETE /api/combos/[id]
 * Elimina un combo (soft delete, marca como inactivo)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const { id } = await params;

    // Verificar que el combo existe
    const combo = await prisma.producto.findUnique({
      where: { id },
    });

    if (!combo || combo.tipo !== 'COMPUESTO') {
      return NextResponse.json(
        { success: false, error: 'Combo no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Combo desactivado exitosamente',
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/combos/[id]:', error);
    const status = error.message?.includes('autorizado') || error.message?.includes('denegado') ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Error al eliminar combo' },
      { status }
    );
  }
}

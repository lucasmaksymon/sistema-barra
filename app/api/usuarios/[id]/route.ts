import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  rol: z.enum(['ADMIN', 'CAJA', 'BARRA']).optional(),
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

    const validation = actualizarUsuarioSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { nombre, email, password, rol, activo } = validation.data;

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuarioExistente) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si se cambia el email, verificar que no esté en uso
    if (email && email !== usuarioExistente.email) {
      const emailEnUso = await prisma.usuario.findUnique({
        where: { email },
      });

      if (emailEnUso) {
        return NextResponse.json(
          { success: false, error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Preparar datos para actualizar
    const dataToUpdate: any = {};
    if (nombre) dataToUpdate.nombre = nombre;
    if (email) dataToUpdate.email = email;
    if (rol) dataToUpdate.rol = rol;
    if (activo !== undefined) dataToUpdate.activo = activo;
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: usuario,
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
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

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el usuario
    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

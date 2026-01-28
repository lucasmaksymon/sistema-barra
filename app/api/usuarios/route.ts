import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const crearUsuarioSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(['ADMIN', 'CAJA', 'BARRA']),
  activo: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: usuarios,
    });
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);
    const body = await request.json();

    const validation = crearUsuarioSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { nombre, email, password, rol, activo } = validation.data;

    // Verificar si el email ya existe
    const existente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existente) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol,
        activo: activo ?? true,
      },
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
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

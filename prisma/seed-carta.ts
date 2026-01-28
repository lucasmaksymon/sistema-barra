import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed con la carta exacta del bar
 */
async function main() {
  console.log('🌱 Cargando carta del bar...\n');

  // ============================================================================
  // LIMPIAR TODO
  // ============================================================================
  console.log('🗑️  Limpiando base de datos...');
  await prisma.transaccionQRConsumo.deleteMany();
  await prisma.qRConsumo.deleteMany();
  await prisma.cierreEvento.deleteMany();
  await prisma.movimientoStock.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.stockLocation.deleteMany();
  await prisma.entregaDetalle.deleteMany();
  await prisma.entrega.deleteMany();
  await prisma.pedidoItem.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.productoReceta.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.barra.deleteMany();
  await prisma.caja.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.usuario.deleteMany();
  console.log('✅ Base de datos limpiada\n');

  // ============================================================================
  // CREAR USUARIOS
  // ============================================================================
  console.log('👥 Creando usuarios...');
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@bar.com',
      password: await bcrypt.hash('admin123', 10),
      nombre: 'Administrador',
      rol: 'ADMIN',
    },
  });

  const cajero1 = await prisma.usuario.create({
    data: {
      email: 'cajero1@bar.com',
      password: await bcrypt.hash('cajero123', 10),
      nombre: 'Cajero Principal',
      rol: 'CAJA',
    },
  });

  const bartender1 = await prisma.usuario.create({
    data: {
      email: 'bartender1@bar.com',
      password: await bcrypt.hash('barra123', 10),
      nombre: 'Bartender Principal',
      rol: 'BARRA',
    },
  });

  console.log('✅ Usuarios creados\n');

  // ============================================================================
  // CREAR EVENTO, CAJA Y BARRA
  // ============================================================================
  console.log('🎉 Creando evento...');
  const evento = await prisma.evento.create({
    data: {
      nombre: 'Temporada Verano 2026',
      fecha: new Date('2026-02-15T20:00:00Z'),
      activo: true,
    },
  });

  const caja = await prisma.caja.create({
    data: {
      nombre: 'Caja Principal',
      eventoId: evento.id,
      activo: true,
    },
  });

  const barra = await prisma.barra.create({
    data: {
      nombre: 'Barra Principal',
      eventoId: evento.id,
      activa: true,
    },
  });

  console.log('✅ Evento, caja y barra creados\n');

  // ============================================================================
  // CREAR UBICACIÓN DE STOCK
  // ============================================================================
  console.log('📍 Creando ubicación de stock...');
  const stockGeneral = await prisma.stockLocation.create({
    data: {
      nombre: 'Stock General',
      tipo: 'DEPOSITO',
      eventoId: evento.id,
      activo: true,
    },
  });
  console.log('✅ Ubicación de stock creada\n');

  // ============================================================================
  // CREAR PRODUCTOS BASE (Insumos para botellas)
  // ============================================================================
  console.log('📦 Creando productos BASE (botellas e insumos)...');

  // Botellas alcohólicas
  const smirnoff = await prisma.producto.create({
    data: { codigo: 'BASE-SMI001', nombre: 'Botella Smirnoff', precio: 0, tipo: 'BASE', activo: true },
  });

  const smirnoffSab = await prisma.producto.create({
    data: { codigo: 'BASE-SMI002', nombre: 'Botella Smirnoff Saborizado', precio: 0, tipo: 'BASE', activo: true },
  });

  const absolut = await prisma.producto.create({
    data: { codigo: 'BASE-ABS001', nombre: 'Botella Absolut', precio: 0, tipo: 'BASE', activo: true },
  });

  const absolutSab = await prisma.producto.create({
    data: { codigo: 'BASE-ABS002', nombre: 'Botella Absolut Saborizado', precio: 0, tipo: 'BASE', activo: true },
  });

  const ginGordons = await prisma.producto.create({
    data: { codigo: 'BASE-GIN001', nombre: 'Botella Gin Gordon\'s', precio: 0, tipo: 'BASE', activo: true },
  });

  const fernet = await prisma.producto.create({
    data: { codigo: 'BASE-FER001', nombre: 'Botella Fernet Branca', precio: 0, tipo: 'BASE', activo: true },
  });

  const jager = await prisma.producto.create({
    data: { codigo: 'BASE-JAG001', nombre: 'Botella Jägermeister', precio: 0, tipo: 'BASE', activo: true },
  });

  const whiskyRed = await prisma.producto.create({
    data: { codigo: 'BASE-WHI001', nombre: 'Botella Whisky Red Label', precio: 0, tipo: 'BASE', activo: true },
  });

  const whiskyBlack = await prisma.producto.create({
    data: { codigo: 'BASE-WHI002', nombre: 'Botella Whisky Black Label', precio: 0, tipo: 'BASE', activo: true },
  });

  const chandon = await prisma.producto.create({
    data: { codigo: 'BASE-CHA001', nombre: 'Botella Chandon', precio: 0, tipo: 'BASE', activo: true },
  });

  const baronB = await prisma.producto.create({
    data: { codigo: 'BASE-BAR001', nombre: 'Botella Barón B', precio: 0, tipo: 'BASE', activo: true },
  });

  // Acompañamientos para botellas
  const speedBase = await prisma.producto.create({
    data: { codigo: 'BASE-SPE001', nombre: 'Speed (para botellas)', precio: 0, tipo: 'BASE', activo: true },
  });

  const jugoBase = await prisma.producto.create({
    data: { codigo: 'BASE-JUG001', nombre: 'Jugo (para botellas)', precio: 0, tipo: 'BASE', activo: true },
  });

  const tonicaBase = await prisma.producto.create({
    data: { codigo: 'BASE-TON001', nombre: 'Tónica (para botellas)', precio: 0, tipo: 'BASE', activo: true },
  });

  const spriteBase = await prisma.producto.create({
    data: { codigo: 'BASE-SPR001', nombre: 'Sprite (para botellas)', precio: 0, tipo: 'BASE', activo: true },
  });

  const cocaBase = await prisma.producto.create({
    data: { codigo: 'BASE-COC001', nombre: 'Coca Cola (para botellas)', precio: 0, tipo: 'BASE', activo: true },
  });

  console.log('✅ 17 productos BASE creados\n');

  // ============================================================================
  // CREAR TRAGOS (Productos SIMPLES)
  // ============================================================================
  console.log('🍸 Creando TRAGOS (productos simples)...');

  await prisma.producto.create({
    data: { codigo: 'TRG-001', nombre: 'Smirnoff + Jugo', precio: 10000, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-002', nombre: 'Smirnoff + Speed', precio: 10500, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-003', nombre: 'Smirnoff Saborizado + Jugo', precio: 10500, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-004', nombre: 'Smirnoff Saborizado + Speed', precio: 11000, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-005', nombre: 'Absolut + Jugo', precio: 11500, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-006', nombre: 'Absolut + Speed', precio: 12000, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-007', nombre: 'Gin Gordon\'s + Tónica/Sprite', precio: 12000, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-008', nombre: 'Fernet + Coca', precio: 11000, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-009', nombre: 'Jäger + Speed', precio: 13000, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-010', nombre: 'Whisky Red Label + Speed', precio: 14000, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  await prisma.producto.create({
    data: { codigo: 'TRG-011', nombre: 'Chandon + Speed', precio: 12000, categoria: 'Tragos', tipo: 'SIMPLE', activo: true },
  });

  console.log('✅ 11 TRAGOS creados\n');

  // ============================================================================
  // CREAR BOTELLAS (Combos)
  // ============================================================================
  console.log('🍾 Creando BOTELLAS (combos)...');

  // 1. Smirnoff + 5 Speed/Jugo
  const bot1 = await prisma.producto.create({
    data: {
      codigo: 'BOT-001',
      nombre: 'Smirnoff + 5 Speed/Jugo',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 50000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot1.id, componenteId: smirnoff.id, cantidad: 1, opcional: false },
      { productoId: bot1.id, componenteId: speedBase.id, cantidad: 5, opcional: true, grupoOpcion: 'acompañamiento' },
      { productoId: bot1.id, componenteId: jugoBase.id, cantidad: 5, opcional: true, grupoOpcion: 'acompañamiento' },
    ],
  });

  // 2. Smirnoff Saborizado + 5 Speed
  const bot2 = await prisma.producto.create({
    data: {
      codigo: 'BOT-002',
      nombre: 'Smirnoff Saborizado + 5 Speed',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 55000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot2.id, componenteId: smirnoffSab.id, cantidad: 1, opcional: false },
      { productoId: bot2.id, componenteId: speedBase.id, cantidad: 5, opcional: false },
    ],
  });

  // 3. Absolut + 5 Speed/Jugo
  const bot3 = await prisma.producto.create({
    data: {
      codigo: 'BOT-003',
      nombre: 'Absolut + 5 Speed/Jugo',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 70000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot3.id, componenteId: absolut.id, cantidad: 1, opcional: false },
      { productoId: bot3.id, componenteId: speedBase.id, cantidad: 5, opcional: true, grupoOpcion: 'acompañamiento' },
      { productoId: bot3.id, componenteId: jugoBase.id, cantidad: 5, opcional: true, grupoOpcion: 'acompañamiento' },
    ],
  });

  // 4. Absolut Saborizado + 5 Speed
  const bot4 = await prisma.producto.create({
    data: {
      codigo: 'BOT-004',
      nombre: 'Absolut Saborizado + 5 Speed',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 75000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot4.id, componenteId: absolutSab.id, cantidad: 1, opcional: false },
      { productoId: bot4.id, componenteId: speedBase.id, cantidad: 5, opcional: false },
    ],
  });

  // 5. Gin Gordon's + Tónica/Sprite
  const bot5 = await prisma.producto.create({
    data: {
      codigo: 'BOT-005',
      nombre: 'Gin Gordon\'s + Tónica/Sprite',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 65000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot5.id, componenteId: ginGordons.id, cantidad: 1, opcional: false },
      { productoId: bot5.id, componenteId: tonicaBase.id, cantidad: 1, opcional: true, grupoOpcion: 'acompañamiento' },
      { productoId: bot5.id, componenteId: spriteBase.id, cantidad: 1, opcional: true, grupoOpcion: 'acompañamiento' },
    ],
  });

  // 6. Fernet + Coca
  const bot6 = await prisma.producto.create({
    data: {
      codigo: 'BOT-006',
      nombre: 'Fernet + Coca',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 60000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot6.id, componenteId: fernet.id, cantidad: 1, opcional: false },
      { productoId: bot6.id, componenteId: cocaBase.id, cantidad: 1, opcional: false },
    ],
  });

  // 7. Jäger + 5 Speed
  const bot7 = await prisma.producto.create({
    data: {
      codigo: 'BOT-007',
      nombre: 'Jäger + 5 Speed',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 85000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot7.id, componenteId: jager.id, cantidad: 1, opcional: false },
      { productoId: bot7.id, componenteId: speedBase.id, cantidad: 5, opcional: false },
    ],
  });

  // 8. Whisky Red Label + 5 Speed
  const bot8 = await prisma.producto.create({
    data: {
      codigo: 'BOT-008',
      nombre: 'Whisky Red Label + 5 Speed',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 85000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot8.id, componenteId: whiskyRed.id, cantidad: 1, opcional: false },
      { productoId: bot8.id, componenteId: speedBase.id, cantidad: 5, opcional: false },
    ],
  });

  // 9. Whisky Black Label + 5 Speed
  const bot9 = await prisma.producto.create({
    data: {
      codigo: 'BOT-009',
      nombre: 'Whisky Black Label + 5 Speed',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 125000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot9.id, componenteId: whiskyBlack.id, cantidad: 1, opcional: false },
      { productoId: bot9.id, componenteId: speedBase.id, cantidad: 5, opcional: false },
    ],
  });

  // 10. Chandon + 2 Speed
  const bot10 = await prisma.producto.create({
    data: {
      codigo: 'BOT-010',
      nombre: 'Chandon + 2 Speed',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 55000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot10.id, componenteId: chandon.id, cantidad: 1, opcional: false },
      { productoId: bot10.id, componenteId: speedBase.id, cantidad: 2, opcional: false },
    ],
  });

  // 11. Barón B + 2 Speed
  const bot11 = await prisma.producto.create({
    data: {
      codigo: 'BOT-011',
      nombre: 'Barón B + 2 Speed',
      descripcion: 'Incluye acompañamiento, hielo y limón',
      precio: 80000,
      categoria: 'Botellas',
      tipo: 'COMPUESTO',
      activo: true,
    },
  });
  await prisma.productoReceta.createMany({
    data: [
      { productoId: bot11.id, componenteId: baronB.id, cantidad: 1, opcional: false },
      { productoId: bot11.id, componenteId: speedBase.id, cantidad: 2, opcional: false },
    ],
  });

  console.log('✅ 11 BOTELLAS creadas\n');

  // ============================================================================
  // CREAR BEBIDAS SIN ALCOHOL (Productos SIMPLES)
  // ============================================================================
  console.log('🥤 Creando bebidas SIN ALCOHOL...');

  const speed = await prisma.producto.create({
    data: { codigo: 'BEB-001', nombre: 'Speed', precio: 4000, categoria: 'Sin Alcohol', tipo: 'SIMPLE', activo: true },
  });

  const agua = await prisma.producto.create({
    data: { codigo: 'BEB-002', nombre: 'Agua Mineral', precio: 3000, categoria: 'Sin Alcohol', tipo: 'SIMPLE', activo: true },
  });

  console.log('✅ 2 bebidas sin alcohol creadas\n');

  // ============================================================================
  // CREAR STOCK INICIAL
  // ============================================================================
  console.log('📊 Creando stock inicial...');

  const stockInicial = [
    // Botellas
    { producto: smirnoff, cantidad: 50 },
    { producto: smirnoffSab, cantidad: 30 },
    { producto: absolut, cantidad: 40 },
    { producto: absolutSab, cantidad: 25 },
    { producto: ginGordons, cantidad: 30 },
    { producto: fernet, cantidad: 40 },
    { producto: jager, cantidad: 25 },
    { producto: whiskyRed, cantidad: 20 },
    { producto: whiskyBlack, cantidad: 15 },
    { producto: chandon, cantidad: 30 },
    { producto: baronB, cantidad: 20 },
    // Acompañamientos
    { producto: speedBase, cantidad: 800 },
    { producto: jugoBase, cantidad: 400 },
    { producto: tonicaBase, cantidad: 200 },
    { producto: spriteBase, cantidad: 200 },
    { producto: cocaBase, cantidad: 300 },
    // Sin alcohol
    { producto: speed, cantidad: 500 },
    { producto: agua, cantidad: 400 },
  ];

  for (const { producto, cantidad } of stockInicial) {
    await prisma.stock.create({
      data: {
        productoId: producto.id,
        locationId: stockGeneral.id,
        cantidad,
        reservado: 0,
        umbralBajo: Math.floor(cantidad * 0.15),
      },
    });

    await prisma.movimientoStock.create({
      data: {
        productoId: producto.id,
        tipo: 'INBOUND',
        cantidad,
        destinoId: stockGeneral.id,
        usuarioId: admin.id,
        motivo: 'Carga inicial de carta',
      },
    });
  }

  console.log('✅ Stock inicial creado\n');

  // ============================================================================
  // RESUMEN
  // ============================================================================
  console.log('');
  console.log('═'.repeat(70));
  console.log('✅ CARTA CARGADA EXITOSAMENTE');
  console.log('═'.repeat(70));
  console.log('');
  console.log('👤 USUARIOS:');
  console.log('   • Admin:      admin@bar.com / admin123');
  console.log('   • Cajero:     cajero1@bar.com / cajero123');
  console.log('   • Bartender:  bartender1@bar.com / barra123');
  console.log('');
  console.log('🎉 EVENTO:      ' + evento.nombre);
  console.log('🏪 CAJA:        ' + caja.nombre);
  console.log('🍹 BARRA:       ' + barra.nombre);
  console.log('📍 UBICACIÓN:   ' + stockGeneral.nombre);
  console.log('');
  console.log('📋 CARTA:');
  console.log('   🍸 Tragos:              11 productos');
  console.log('   🍾 Botellas (combos):   11 productos');
  console.log('   🥤 Sin Alcohol:         2 productos');
  console.log('   📦 Insumos BASE:        17 productos');
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   📊 TOTAL:               41 productos');
  console.log('');
  console.log('💰 PRECIOS:');
  console.log('   • Tragos:        $10.000 - $14.000');
  console.log('   • Botellas:      $50.000 - $125.000');
  console.log('   • Sin Alcohol:   $3.000 - $4.000');
  console.log('');
  console.log('═'.repeat(70));
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error al cargar carta:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

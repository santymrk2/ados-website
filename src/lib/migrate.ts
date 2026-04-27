import { db } from './db';
import { sql, eq, and } from 'drizzle-orm';
import * as schema from './schema';

interface DuplicateRow {
  juego_id: number;
  equipo: string;
  cnt: number;
  ids: string;
}

export async function migrateDatabase() {
  console.log('🔍 Verificando integridad de datos...');

  try {
    // 1. Verificar si hay datos en juego_posiciones
    const totalRecords = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.juegoPosiciones);

    const recordCount = totalRecords[0]?.count || 0;
    console.log(`📊 Total de registros en juego_posiciones: ${recordCount}`);

    if (recordCount === 0) {
      console.log('✅ Base de datos vacía, no hay migración necesaria');
      return { status: 'ok', message: 'No migration needed', recordsCount: 0 };
    }

    // 2. Detectar duplicados (mismo juegoId y equipo con diferente posicion)
    const duplicates = await db.execute(sql`
      SELECT
        juego_id,
        equipo,
        COUNT(*) as cnt,
        GROUP_CONCAT(id) as ids
      FROM juego_posiciones
      GROUP BY juego_id, equipo
      HAVING COUNT(*) > 1
    `);

    const duplicateCount = duplicates.rows?.length || 0;

    if (duplicateCount > 0) {
      console.log(`⚠️  Encontrados ${duplicateCount} registros duplicados`);

      // 3. Limpiar duplicados: mantener el ID más alto (más reciente)
      for (const row of duplicates.rows || []) {
        const typedRow = row as unknown as DuplicateRow;
        const juegoId = typedRow.juego_id;
        const equipo = typedRow.equipo;
        const ids = typedRow.ids.split(',').map(Number);

        // Mantener el ID más alto, eliminar los demás
        const idsToDelete = ids.sort((a, b) => b - a).slice(1);

        console.log(
          `  🗑️  Limpiando duplicados para juego=${juegoId}, equipo=${equipo}: eliminando IDs ${idsToDelete.join(', ')}`,
        );

        await db
          .delete(schema.juegoPosiciones)
          .where(sql`id IN (${sql.join(idsToDelete)})`);
      }

      console.log(`✅ Duplicados limpiados exitosamente`);
    } else {
      console.log('✅ No se encontraron duplicados');
    }

    // 4. Verificar estructura de datos en juegos
    const juegos = await db.select().from(schema.juegos);
    console.log(`\n📚 Total de juegos: ${juegos.length}`);

    let gameStructureIssues = 0;
    for (const juego of juegos) {
      const posiciones = await db
        .select()
        .from(schema.juegoPosiciones)
        .where(eq(schema.juegoPosiciones.juegoId, juego.id));

      if (posiciones.length === 0) {
        console.log(`  ⚠️  Juego "${juego.nombre}" (ID: ${juego.id}) sin posiciones asignadas`);
        gameStructureIssues++;
      }
    }

    if (gameStructureIssues > 0) {
      console.log(
        `  ⚠️  ${gameStructureIssues} juegos sin posiciones (esto es normal si están incompletos)`,
      );
    }

    // 5. Validar constraint UNIQUE
    console.log('\n✨ Validando que el schema tiene UNIQUE constraint...');
    const indexInfo = await db.execute(
      sql`PRAGMA index_info(unq_juego_equipo)`,
    );

    if (indexInfo.rows && indexInfo.rows.length > 0) {
      console.log('✅ UNIQUE INDEX está presente en juego_posiciones');
    } else {
      console.log('⚠️  UNIQUE INDEX no encontrado (Drizzle lo creará en push)');
    }

    console.log('\n✅ Migración completada exitosamente');
    return {
      status: 'ok',
      message: 'Migration completed',
      recordsCount: recordCount,
      duplicatesRemoved: duplicateCount,
      gameIssues: gameStructureIssues,
    };
  } catch (error) {
    console.error('❌ Error durante migración:', error);
    return {
      status: 'error',
      message: (error as Error).message,
    };
  }
}

// Ejecutar migración si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase().then((result) => {
    console.log('\n📋 Resultado:', result);
    process.exit(result.status === 'ok' ? 0 : 1);
  });
}

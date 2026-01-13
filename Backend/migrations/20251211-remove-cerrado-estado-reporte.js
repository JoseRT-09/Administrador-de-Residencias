'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Eliminar el valor por defecto primero
    await queryInterface.sequelize.query(`
      ALTER TABLE reports ALTER COLUMN estado DROP DEFAULT;
    `);

    // 2. Actualizar cualquier valor 'Cerrado' existente a 'Resuelto'
    await queryInterface.sequelize.query(`
      UPDATE reports SET estado = 'Resuelto' WHERE estado = 'Cerrado';
    `);

    // 3. Limpiar cualquier tipo temporal que pueda haber quedado de ejecuciones anteriores
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_reports_estado_old" CASCADE;
    `);

    // 4. Renombrar el tipo actual a temporal
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_reports_estado" RENAME TO "enum_reports_estado_old";
    `);

    // 5. Crear el nuevo tipo ENUM sin 'Cerrado'
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_reports_estado" AS ENUM ('Abierto', 'En Progreso', 'Resuelto');
    `);

    // 6. Actualizar la columna estado al nuevo tipo
    await queryInterface.sequelize.query(`
      ALTER TABLE reports
      ALTER COLUMN estado TYPE "enum_reports_estado"
      USING estado::text::"enum_reports_estado";
    `);

    // 7. Restablecer el valor por defecto (usando un valor válido)
    await queryInterface.sequelize.query(`
      ALTER TABLE reports ALTER COLUMN estado SET DEFAULT 'Abierto'::"enum_reports_estado";
    `);

    // 8. Eliminar el tipo temporal
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_reports_estado_old";
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Eliminar el valor por defecto
    await queryInterface.sequelize.query(`
      ALTER TABLE reports ALTER COLUMN estado DROP DEFAULT;
    `);

    // 2. Limpiar cualquier tipo temporal
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_reports_estado_new" CASCADE;
    `);

    // 3. Revertir los cambios
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_reports_estado" RENAME TO "enum_reports_estado_new";
    `);

    // 4. Crear el tipo original con 'Cerrado'
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_reports_estado" AS ENUM ('Abierto', 'En Progreso', 'Resuelto', 'Cerrado');
    `);

    // 5. Convertir la columna al tipo original
    await queryInterface.sequelize.query(`
      ALTER TABLE reports
      ALTER COLUMN estado TYPE "enum_reports_estado"
      USING estado::text::"enum_reports_estado";
    `);

    // 6. Restablecer el valor por defecto original
    await queryInterface.sequelize.query(`
      ALTER TABLE reports ALTER COLUMN estado SET DEFAULT 'Abierto'::"enum_reports_estado";
    `);

    // 7. Eliminar el tipo temporal
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_reports_estado_new";
    `);
  }
};
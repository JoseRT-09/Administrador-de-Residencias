'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Eliminar el valor por defecto primero
    await queryInterface.sequelize.query(`
      ALTER TABLE complaints ALTER COLUMN estado DROP DEFAULT;
    `);

    // 2. Actualizar cualquier valor 'Cerrada' existente a 'Resuelta'
    await queryInterface.sequelize.query(`
      UPDATE complaints SET estado = 'Resuelta' WHERE estado = 'Cerrada';
    `);

    // 3. Limpiar cualquier tipo temporal que pueda haber quedado de ejecuciones anteriores
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_complaints_estado_old" CASCADE;
    `);

    // 4. Renombrar el tipo actual a temporal
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_complaints_estado" RENAME TO "enum_complaints_estado_old";
    `);

    // 5. Crear el nuevo tipo ENUM sin 'Cerrada'
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_complaints_estado" AS ENUM ('Nueva', 'En Revisión', 'En Proceso', 'Resuelta', 'Rechazada');
    `);

    // 6. Actualizar la columna estado al nuevo tipo
    await queryInterface.sequelize.query(`
      ALTER TABLE complaints
      ALTER COLUMN estado TYPE "enum_complaints_estado"
      USING estado::text::"enum_complaints_estado";
    `);

    // 7. Restablecer el valor por defecto (usando un valor válido)
    await queryInterface.sequelize.query(`
      ALTER TABLE complaints ALTER COLUMN estado SET DEFAULT 'Nueva'::"enum_complaints_estado";
    `);

    // 8. Eliminar el tipo temporal
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_complaints_estado_old";
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Eliminar el valor por defecto
    await queryInterface.sequelize.query(`
      ALTER TABLE complaints ALTER COLUMN estado DROP DEFAULT;
    `);

    // 2. Limpiar cualquier tipo temporal
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_complaints_estado_new" CASCADE;
    `);

    // 3. Revertir los cambios
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_complaints_estado" RENAME TO "enum_complaints_estado_new";
    `);

    // 4. Crear el tipo original con 'Cerrada'
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_complaints_estado" AS ENUM ('Nueva', 'En Revisión', 'En Proceso', 'Resuelta', 'Cerrada', 'Rechazada');
    `);

    // 5. Convertir la columna al tipo original
    await queryInterface.sequelize.query(`
      ALTER TABLE complaints
      ALTER COLUMN estado TYPE "enum_complaints_estado"
      USING estado::text::"enum_complaints_estado";
    `);

    // 6. Restablecer el valor por defecto original
    await queryInterface.sequelize.query(`
      ALTER TABLE complaints ALTER COLUMN estado SET DEFAULT 'Nueva'::"enum_complaints_estado";
    `);

    // 7. Eliminar el tipo temporal
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_complaints_estado_new";
    `);
  }
};
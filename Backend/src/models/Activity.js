const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ubicacion: {
    type: DataTypes.STRING(100)
  },
  organizador_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cupo_maximo: {
    type: DataTypes.INTEGER
  },
  inscritos_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  estado: {
    type: DataTypes.ENUM('Programada', 'En Curso', 'Completada', 'Cancelada'),
    defaultValue: 'Programada'
  }
}, {
  tableName: 'activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Activity;
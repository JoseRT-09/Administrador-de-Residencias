const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo: {
    type: DataTypes.ENUM('Incendio', 'Eléctrico', 'Agua', 'Robo', 'Otro'),
    allowNull: false
  },
  residencia_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'residences',
      key: 'id'
    }
  },
  reportado_por: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  prioridad: {
    type: DataTypes.ENUM('Baja', 'Media', 'Alta', 'Crítica'),
    defaultValue: 'Media'
  },
  estado: {
    type: DataTypes.ENUM('Abierto', 'En Progreso', 'Resuelto', 'Cerrado'),
    defaultValue: 'Abierto'
  },
  asignado_a: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fecha_resolucion: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Report;
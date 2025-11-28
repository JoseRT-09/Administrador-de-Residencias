const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Residence = sequelize.define('Residence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero_unidad: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  bloque: {
    type: DataTypes.STRING(10)
  },
  piso: {
    type: DataTypes.INTEGER
  },
  area_m2: {
    type: DataTypes.DECIMAL(10, 2)
  },
  dueno_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  residente_actual_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  administrador_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fecha_asignacion: {
    type: DataTypes.DATEONLY
  },
  estado: {
    type: DataTypes.ENUM('Ocupada', 'Disponible', 'Mantenimiento'),
    defaultValue: 'Disponible'
  }
}, {
  tableName: 'residences',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Residence;
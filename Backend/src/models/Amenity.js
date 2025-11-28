const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Amenity = sequelize.define('Amenity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  ubicacion: {
    type: DataTypes.STRING(100)
  },
  capacidad: {
    type: DataTypes.INTEGER
  },
  disponibilidad: {
    type: DataTypes.ENUM('Disponible', 'Ocupada', 'Mantenimiento', 'Cerrada'),
    defaultValue: 'Disponible'
  },
  horario_apertura: {
    type: DataTypes.TIME
  },
  horario_cierre: {
    type: DataTypes.TIME
  },
  requiere_reserva: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  costo_uso: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  imagen_url: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'amenities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Amenity;
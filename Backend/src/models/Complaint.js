const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  autor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  asunto: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  dirigido_a: {
    type: DataTypes.ENUM('Administración', 'Residente', 'Mantenimiento')
  },
  residente_objetivo_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cuerpo_mensaje: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  es_anonimo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  estado: {
    type: DataTypes.ENUM('Nuevo', 'Revisado', 'En Proceso', 'Resuelto'),
    defaultValue: 'Nuevo'
  },
  respuesta: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'complaints',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Complaint;
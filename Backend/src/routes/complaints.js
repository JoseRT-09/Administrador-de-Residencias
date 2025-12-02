// Backend/src/models/Complaint.js (CORREGIDO)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  asunto: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 150]
    }
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [20, 5000]
    }
  },
  categoria: {
    type: DataTypes.ENUM(
      'Ruido',
      'Convivencia',
      'Mascotas',
      'Estacionamiento',
      'Áreas Comunes',
      'Limpieza',
      'Seguridad',
      'Mantenimiento',
      'Administración',
      'Otro'
    ),
    allowNull: false,
    defaultValue: 'Otro'
  },
  prioridad: {
    type: DataTypes.ENUM(
      'Baja',
      'Media',
      'Alta',
      'Urgente'
    ),
    allowNull: false,
    defaultValue: 'Media'
  },
  estado: {
    type: DataTypes.ENUM(
      'Nueva',
      'En Revisión',
      'En Proceso',
      'Resuelta',
      'Cerrada',
      'Rechazada'
    ),
    allowNull: false,
    defaultValue: 'Nueva'
  },
  usuario_id: { // Clave del usuario que presenta la queja
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  residencia_id: { // Clave de la residencia involucrada
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'residences',
      key: 'id'
    }
  },
  fecha_queja: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  es_anonima: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'complaints',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Complaint;
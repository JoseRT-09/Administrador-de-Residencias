const { Residence, User, ReassignmentHistory } = require('../models');
const { ESTADOS_RESIDENCIA } = require('../config/constants');

// Obtener todas las residencias
exports.getAllResidences = async (req, res) => {
  try {
    const { estado, bloque, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (bloque) where.bloque = bloque;

    const { count, rows } = await Residence.findAndCountAll({
      where,
      include: [
        { model: User, as: 'dueno', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: User, as: 'residenteActual', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: User, as: 'administrador', attributes: ['id', 'nombre', 'apellido', 'email'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['numero_unidad', 'ASC']]
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      residences: rows
    });
  } catch (error) {
    console.error('Error al obtener residencias:', error);
    res.status(500).json({ message: 'Error al obtener residencias', error: error.message });
  }
};

// Obtener residencia por ID
exports.getResidenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const residence = await Residence.findByPk(id, {
      include: [
        { model: User, as: 'dueno', attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] },
        { model: User, as: 'residenteActual', attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] },
        { model: User, as: 'administrador', attributes: ['id', 'nombre', 'apellido', 'email'] }
      ]
    });

    if (!residence) {
      return res.status(404).json({ message: 'Residencia no encontrada' });
    }

    res.json({ residence });
  } catch (error) {
    console.error('Error al obtener residencia:', error);
    res.status(500).json({ message: 'Error al obtener residencia', error: error.message });
  }
};

// Crear residencia
exports.createResidence = async (req, res) => {
  try {
    const {
      numero_unidad,
      bloque,
      piso,
      area_m2,
      dueno_id,
      residente_actual_id,
      administrador_id
    } = req.body;

    // Verificar si ya existe la unidad
    const existingResidence = await Residence.findOne({ where: { numero_unidad } });
    if (existingResidence) {
      return res.status(400).json({ message: 'El número de unidad ya existe' });
    }

    const residence = await Residence.create({
      numero_unidad,
      bloque,
      piso,
      area_m2,
      dueno_id,
      residente_actual_id,
      administrador_id,
      fecha_asignacion: residente_actual_id ? new Date() : null,
      estado: residente_actual_id ? ESTADOS_RESIDENCIA.OCUPADA : ESTADOS_RESIDENCIA.DISPONIBLE
    });

    const residenceWithDetails = await Residence.findByPk(residence.id, {
      include: [
        { model: User, as: 'dueno', attributes: ['id', 'nombre', 'apellido'] },
        { model: User, as: 'residenteActual', attributes: ['id', 'nombre', 'apellido'] },
        { model: User, as: 'administrador', attributes: ['id', 'nombre', 'apellido'] }
      ]
    });

    res.status(201).json({
      message: 'Residencia creada exitosamente',
      residence: residenceWithDetails
    });
  } catch (error) {
    console.error('Error al crear residencia:', error);
    res.status(500).json({ message: 'Error al crear residencia', error: error.message });
  }
};

// Actualizar residencia
exports.updateResidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_unidad, bloque, piso, area_m2, estado, administrador_id } = req.body;

    const residence = await Residence.findByPk(id);
    if (!residence) {
      return res.status(404).json({ message: 'Residencia no encontrada' });
    }

    await residence.update({
      numero_unidad: numero_unidad || residence.numero_unidad,
      bloque: bloque || residence.bloque,
      piso: piso !== undefined ? piso : residence.piso,
      area_m2: area_m2 || residence.area_m2,
      estado: estado || residence.estado,
      administrador_id: administrador_id !== undefined ? administrador_id : residence.administrador_id
    });

    const updatedResidence = await Residence.findByPk(id, {
      include: [
        { model: User, as: 'dueno', attributes: ['id', 'nombre', 'apellido'] },
        { model: User, as: 'residenteActual', attributes: ['id', 'nombre', 'apellido'] },
        { model: User, as: 'administrador', attributes: ['id', 'nombre', 'apellido'] }
      ]
    });

    res.json({
      message: 'Residencia actualizada exitosamente',
      residence: updatedResidence
    });
  } catch (error) {
    console.error('Error al actualizar residencia:', error);
    res.status(500).json({ message: 'Error al actualizar residencia', error: error.message });
  }
};

// Asignar/Reasignar residente
exports.assignResident = async (req, res) => {
  try {
    const { id } = req.params;
    const { residente_nuevo_id, tipo_cambio, motivo } = req.body;

    const residence = await Residence.findByPk(id);
    if (!residence) {
      return res.status(404).json({ message: 'Residencia no encontrada' });
    }

    // Guardar en historial si hay un cambio
    if (residence.residente_actual_id) {
      await ReassignmentHistory.create({
        residencia_id: id,
        residente_anterior_id: residence.residente_actual_id,
        residente_nuevo_id,
        tipo_cambio,
        motivo,
        autorizado_por: req.user.id
      });
    }

    // Actualizar residencia
    await residence.update({
      residente_actual_id: residente_nuevo_id,
      fecha_asignacion: new Date(),
      estado: residente_nuevo_id ? ESTADOS_RESIDENCIA.OCUPADA : ESTADOS_RESIDENCIA.DISPONIBLE
    });

    const updatedResidence = await Residence.findByPk(id, {
      include: [
        { model: User, as: 'dueno', attributes: ['id', 'nombre', 'apellido'] },
        { model: User, as: 'residenteActual', attributes: ['id', 'nombre', 'apellido'] },
        { model: User, as: 'administrador', attributes: ['id', 'nombre', 'apellido'] }
      ]
    });

    res.json({
      message: 'Residente asignado exitosamente',
      residence: updatedResidence
    });
  } catch (error) {
    console.error('Error al asignar residente:', error);
    res.status(500).json({ message: 'Error al asignar residente', error: error.message });
  }
};

// Obtener historial de reasignaciones
exports.getReassignmentHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await ReassignmentHistory.findAll({
      where: { residencia_id: id },
      include: [
        { model: User, as: 'residenteAnterior', attributes: ['id', 'nombre', 'apellido'] },
        { model: User, as: 'residenteNuevo', attributes: ['id', 'nombre', 'apellido'] },
        { model: User, as: 'autorizadoPor', attributes: ['id', 'nombre', 'apellido'] }
      ],
      order: [['fecha_cambio', 'DESC']]
    });

    res.json({ history });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener historial', error: error.message });
  }
};

// Eliminar residencia
exports.deleteResidence = async (req, res) => {
  try {
    const { id } = req.params;

    const residence = await Residence.findByPk(id);
    if (!residence) {
      return res.status(404).json({ message: 'Residencia no encontrada' });
    }

    await residence.destroy();
    res.json({ message: 'Residencia eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar residencia:', error);
    res.status(500).json({ message: 'Error al eliminar residencia', error: error.message });
  }
};
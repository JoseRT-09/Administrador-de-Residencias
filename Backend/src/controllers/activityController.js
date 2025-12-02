const { Activity, User } = require('../models');
const { Op } = require('sequelize');

// Obtener todas las actividades
exports.getAllActivities = async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;

    const { count, rows } = await Activity.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'organizador', // Alias Correcto
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha_inicio', 'ASC']]
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      activities: rows
    });
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ message: 'Error al obtener actividades', error: error.message });
  }
};

// Obtener actividad por ID
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizador', // Alias Correcto
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono']
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ message: 'Error al obtener actividad', error: error.message });
  }
};

// Crear actividad
exports.createActivity = async (req, res) => {
  try {
    const {
      titulo, // Campo corregido
      descripcion,
      tipo,
      fecha_inicio, // Campo corregido
      fecha_fin,
      ubicacion,
      max_participantes // Campo corregido
    } = req.body;

    const activity = await Activity.create({
      titulo,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      ubicacion,
      organizador_id: req.user.id,
      max_participantes,
      inscritos_count: 0,
      estado: 'Programada'
    });

    const activityWithDetails = await Activity.findByPk(activity.id, {
      include: [
        {
          model: User,
          as: 'organizador',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });

    res.status(201).json({
      message: 'Actividad creada exitosamente',
      activity: activityWithDetails
    });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    res.status(500).json({ message: 'Error al crear actividad', error: error.message });
  }
};

// Actualizar actividad
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      tipo,
      fecha_inicio,
      fecha_fin,
      ubicacion,
      max_participantes,
      estado
    } = req.body;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    await activity.update({
      titulo: titulo || activity.titulo,
      descripcion: descripcion || activity.descripcion,
      tipo: tipo || activity.tipo,
      fecha_inicio: fecha_inicio || activity.fecha_inicio,
      fecha_fin: fecha_fin !== undefined ? fecha_fin : activity.fecha_fin,
      ubicacion: ubicacion || activity.ubicacion,
      max_participantes: max_participantes !== undefined ? max_participantes : activity.max_participantes,
      estado: estado || activity.estado
    });

    const updatedActivity = await Activity.findByPk(id, {
      include: [
        {
          model: User,
          as: 'organizador',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });

    res.json({
      message: 'Actividad actualizada exitosamente',
      activity: updatedActivity
    });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    res.status(500).json({ message: 'Error al actualizar actividad', error: error.message });
  }
};

// Cancelar actividad
exports.cancelActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    await activity.update({ estado: 'Cancelada' });

    res.json({
      message: 'Actividad cancelada exitosamente',
      activity
    });
  } catch (error) {
    console.error('Error al cancelar actividad:', error);
    res.status(500).json({ message: 'Error al cancelar actividad', error: error.message });
  }
};

// Obtener actividades próximas
exports.getUpcomingActivities = async (req, res) => {
  try {
    const now = new Date();

    const activities = await Activity.findAll({
      where: {
        fecha_inicio: { [Op.gte]: now },
        estado: 'Programada'
      },
      include: [
        {
          model: User,
          as: 'organizador',
          attributes: ['id', 'nombre', 'apellido']
        }
      ],
      order: [['fecha_inicio', 'ASC']],
      limit: 10
    });

    res.json({ activities, count: activities.length });
  } catch (error) {
    console.error('Error al obtener actividades próximas:', error);
    res.status(500).json({ message: 'Error al obtener actividades próximas', error: error.message });
  }
};

// Incrementar contador de inscritos
exports.registerAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    if (activity.max_participantes && activity.inscritos_count >= activity.max_participantes) {
      return res.status(400).json({ message: 'La actividad ha alcanzado el cupo máximo' });
    }

    await activity.update({
      inscritos_count: activity.inscritos_count + 1
    });

    res.json({
      message: 'Inscripción registrada exitosamente',
      activity
    });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ message: 'Error al registrar asistencia', error: error.message });
  }
};

// Eliminar actividad
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    await activity.destroy();
    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    res.status(500).json({ message: 'Error al eliminar actividad', error: error.message });
  }
};
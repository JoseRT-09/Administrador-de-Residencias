const { Report, Residence, User } = require('../models');
const { ESTADOS_REPORTE, TIPOS_REPORTE, PRIORIDADES } = require('../config/constants');

// Obtener todos los reportes
exports.getAllReports = async (req, res) => {
  try {
    const { tipo, estado, prioridad, residencia_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (residencia_id) where.residencia_id = residencia_id;

    const { count, rows } = await Report.findAndCountAll({
      where,
      include: [
        {
          model: Residence,
          attributes: ['id', 'numero_unidad', 'bloque', 'piso']
        },
        {
          model: User,
          as: 'reportadoPor',
          attributes: ['id', 'nombre', 'apellido', 'email']
        },
        {
          model: User,
          as: 'asignadoA',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      reports: rows
    });
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ message: 'Error al obtener reportes', error: error.message });
  }
};

// Obtener reporte por ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id, {
      include: [
        {
          model: Residence,
          attributes: ['id', 'numero_unidad', 'bloque', 'piso'],
          include: [
            { model: User, as: 'residenteActual', attributes: ['id', 'nombre', 'apellido', 'telefono'] }
          ]
        },
        {
          model: User,
          as: 'reportadoPor',
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono']
        },
        {
          model: User,
          as: 'asignadoA',
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono']
        }
      ]
    });

    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({ message: 'Error al obtener reporte', error: error.message });
  }
};

// Crear reporte
exports.createReport = async (req, res) => {
  try {
    const {
      tipo,
      residencia_id,
      titulo,
      descripcion,
      prioridad
    } = req.body;

    const report = await Report.create({
      tipo,
      residencia_id,
      reportado_por: req.user.id,
      titulo,
      descripcion,
      prioridad: prioridad || PRIORIDADES.MEDIA,
      estado: ESTADOS_REPORTE.ABIERTO
    });

    const reportWithDetails = await Report.findByPk(report.id, {
      include: [
        {
          model: Residence,
          attributes: ['id', 'numero_unidad', 'bloque']
        },
        {
          model: User,
          as: 'reportadoPor',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });

    res.status(201).json({
      message: 'Reporte creado exitosamente',
      report: reportWithDetails
    });
  } catch (error) {
    console.error('Error al crear reporte:', error);
    res.status(500).json({ message: 'Error al crear reporte', error: error.message });
  }
};

// Actualizar reporte
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, prioridad, estado, asignado_a } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    const updateData = {
      titulo: titulo || report.titulo,
      descripcion: descripcion || report.descripcion,
      prioridad: prioridad || report.prioridad,
      estado: estado || report.estado,
      asignado_a: asignado_a !== undefined ? asignado_a : report.asignado_a
    };

    // Si el estado cambia a resuelto o cerrado, registrar fecha de resolución
    if ((estado === ESTADOS_REPORTE.RESUELTO || estado === ESTADOS_REPORTE.CERRADO) && 
        report.estado !== estado) {
      updateData.fecha_resolucion = new Date();
    }

    await report.update(updateData);

    const updatedReport = await Report.findByPk(id, {
      include: [
        {
          model: Residence,
          attributes: ['id', 'numero_unidad', 'bloque']
        },
        {
          model: User,
          as: 'reportadoPor',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: User,
          as: 'asignadoA',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });

    res.json({
      message: 'Reporte actualizado exitosamente',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error al actualizar reporte:', error);
    res.status(500).json({ message: 'Error al actualizar reporte', error: error.message });
  }
};

// Asignar reporte a administrador
exports.assignReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { asignado_a } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    await report.update({
      asignado_a,
      estado: ESTADOS_REPORTE.EN_PROGRESO
    });

    const updatedReport = await Report.findByPk(id, {
      include: [
        {
          model: Residence,
          attributes: ['id', 'numero_unidad', 'bloque']
        },
        {
          model: User,
          as: 'asignadoA',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });

    res.json({
      message: 'Reporte asignado exitosamente',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error al asignar reporte:', error);
    res.status(500).json({ message: 'Error al asignar reporte', error: error.message });
  }
};

// Obtener reportes por usuario
exports.getReportsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const reports = await Report.findAll({
      where: { reportado_por: user_id },
      include: [
        {
          model: Residence,
          attributes: ['id', 'numero_unidad', 'bloque']
        },
        {
          model: User,
          as: 'asignadoA',
          attributes: ['id', 'nombre', 'apellido']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ reports, count: reports.length });
  } catch (error) {
    console.error('Error al obtener reportes del usuario:', error);
    res.status(500).json({ message: 'Error al obtener reportes del usuario', error: error.message });
  }
};

// Obtener estadísticas de reportes
exports.getReportsStatistics = async (req, res) => {
  try {
    const totalReports = await Report.count();
    const openReports = await Report.count({ where: { estado: ESTADOS_REPORTE.ABIERTO } });
    const inProgressReports = await Report.count({ where: { estado: ESTADOS_REPORTE.EN_PROGRESO } });
    const resolvedReports = await Report.count({ where: { estado: ESTADOS_REPORTE.RESUELTO } });
    const closedReports = await Report.count({ where: { estado: ESTADOS_REPORTE.CERRADO } });

    const criticalReports = await Report.count({ where: { prioridad: PRIORIDADES.CRITICA } });
    const highPriorityReports = await Report.count({ where: { prioridad: PRIORIDADES.ALTA } });

    const reportsByType = await Report.findAll({
      attributes: [
        'tipo',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['tipo'],
      raw: true
    });

    res.json({
      total: totalReports,
      byStatus: {
        abierto: openReports,
        enProgreso: inProgressReports,
        resuelto: resolvedReports,
        cerrado: closedReports
      },
      byPriority: {
        critica: criticalReports,
        alta: highPriorityReports
      },
      byType: reportsByType
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
};

// Eliminar reporte
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    await report.destroy();
    res.json({ message: 'Reporte eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    res.status(500).json({ message: 'Error al eliminar reporte', error: error.message });
  }
};
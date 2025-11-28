const { Complaint, User } = require('../models');

// Obtener todas las quejas
exports.getAllComplaints = async (req, res) => {
  try {
    const { estado, dirigido_a, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (dirigido_a) where.dirigido_a = dirigido_a;

    const { count, rows } = await Complaint.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'autor',
          attributes: ['id', 'nombre', 'apellido', 'email']
        },
        {
          model: User,
          as: 'residenteObjetivo',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Ocultar información del autor si es anónimo
    const complaintsFormatted = rows.map(complaint => {
      const complaintObj = complaint.toJSON();
      if (complaintObj.es_anonimo) {
        complaintObj.autor = null;
      }
      return complaintObj;
    });

    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      complaints: complaintsFormatted
    });
  } catch (error) {
    console.error('Error al obtener quejas:', error);
    res.status(500).json({ message: 'Error al obtener quejas', error: error.message });
  }
};

// Obtener queja por ID
exports.getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByPk(id, {
      include: [
        {
          model: User,
          as: 'autor',
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono']
        },
        {
          model: User,
          as: 'residenteObjetivo',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ]
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Queja no encontrada' });
    }

    const complaintObj = complaint.toJSON();
    
    // Ocultar información del autor si es anónimo y el usuario no es administrador
    if (complaintObj.es_anonimo && req.user.rol !== 'SuperAdmin' && req.user.rol !== 'Administrador') {
      complaintObj.autor = null;
    }

    res.json({ complaint: complaintObj });
  } catch (error) {
    console.error('Error al obtener queja:', error);
    res.status(500).json({ message: 'Error al obtener queja', error: error.message });
  }
};

// Crear queja
exports.createComplaint = async (req, res) => {
  try {
    const {
      asunto,
      dirigido_a,
      residente_objetivo_id,
      cuerpo_mensaje,
      es_anonimo
    } = req.body;

    const complaint = await Complaint.create({
      autor_id: req.user.id,
      asunto,
      dirigido_a,
      residente_objetivo_id,
      cuerpo_mensaje,
      es_anonimo: es_anonimo || false,
      estado: 'Nuevo'
    });

    const complaintWithDetails = await Complaint.findByPk(complaint.id, {
      include: [
        {
          model: User,
          as: 'autor',
          attributes: ['id', 'nombre', 'apellido']
        },
        {
          model: User,
          as: 'residenteObjetivo',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });

    const complaintObj = complaintWithDetails.toJSON();
    if (complaintObj.es_anonimo) {
      complaintObj.autor = null;
    }

    res.status(201).json({
      message: 'Queja registrada exitosamente',
      complaint: complaintObj
    });
  } catch (error) {
    console.error('Error al crear queja:', error);
    res.status(500).json({ message: 'Error al crear queja', error: error.message });
  }
};

// Actualizar estado de queja
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, respuesta } = req.body;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Queja no encontrada' });
    }

    await complaint.update({
      estado: estado || complaint.estado,
      respuesta: respuesta || complaint.respuesta
    });

    const updatedComplaint = await Complaint.findByPk(id, {
      include: [
        {
          model: User,
          as: 'autor',
          attributes: ['id', 'nombre', 'apellido', 'email']
        },
        {
          model: User,
          as: 'residenteObjetivo',
          attributes: ['id', 'nombre', 'apellido']
        }
      ]
    });

    const complaintObj = updatedComplaint.toJSON();
    if (complaintObj.es_anonimo && req.user.rol === 'Residente') {
      complaintObj.autor = null;
    }

    res.json({
      message: 'Queja actualizada exitosamente',
      complaint: complaintObj
    });
  } catch (error) {
    console.error('Error al actualizar queja:', error);
    res.status(500).json({ message: 'Error al actualizar queja', error: error.message });
  }
};

// Responder a una queja
exports.respondToComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Queja no encontrada' });
    }

    await complaint.update({
      respuesta,
      estado: 'Resuelto'
    });

    res.json({
      message: 'Respuesta registrada exitosamente',
      complaint
    });
  } catch (error) {
    console.error('Error al responder queja:', error);
    res.status(500).json({ message: 'Error al responder queja', error: error.message });
  }
};

// Obtener quejas por usuario
exports.getComplaintsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const complaints = await Complaint.findAll({
      where: { autor_id: user_id },
      include: [
        {
          model: User,
          as: 'residenteObjetivo',
          attributes: ['id', 'nombre', 'apellido']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ complaints, count: complaints.length });
  } catch (error) {
    console.error('Error al obtener quejas del usuario:', error);
    res.status(500).json({ message: 'Error al obtener quejas del usuario', error: error.message });
  }
};

// Eliminar queja
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Queja no encontrada' });
    }

    await complaint.destroy();
    res.json({ message: 'Queja eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar queja:', error);
    res.status(500).json({ message: 'Error al eliminar queja', error: error.message });
  }
};
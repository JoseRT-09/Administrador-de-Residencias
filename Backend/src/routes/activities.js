const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { ROLES } = require('../config/constants');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las actividades
router.get('/', activityController.getAllActivities);

// Obtener actividad por ID
router.get('/:id', activityController.getActivityById);

// Crear actividad (Solo Admin y SuperAdmin)
router.post('/', 
  authorizeRoles(ROLES.ADMINISTRADOR, ROLES.SUPER_ADMIN),
  activityController.createActivity
);

// Actualizar actividad (Solo Admin y SuperAdmin)
router.put('/:id', 
  authorizeRoles(ROLES.ADMINISTRADOR, ROLES.SUPER_ADMIN),
  activityController.updateActivity
);

// Cancelar actividad (Solo Admin y SuperAdmin)
router.post('/:id/cancel', 
  authorizeRoles(ROLES.ADMINISTRADOR, ROLES.SUPER_ADMIN),
  activityController.cancelActivity
);

// Obtener actividades próximas
router.get('/upcoming/list', activityController.getUpcomingActivities);

// Registrar asistencia a actividad
router.post('/:id/register', activityController.registerAttendance);

// Eliminar actividad (Solo SuperAdmin)
router.delete('/:id', 
  authorizeRoles(ROLES.SUPER_ADMIN),
  activityController.deleteActivity
);

module.exports = router;
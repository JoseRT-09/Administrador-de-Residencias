const sequelize = require('../config/database');
const User = require('./User');
const Residence = require('./Residence');
const ServiceCost = require('./ServiceCost');
const Payment = require('./Payment');
const Report = require('./Report');
const Complaint = require('./Complaint');
const Activity = require('./Activity');
const Amenity = require('./Amenity');
const AmenityReservation = require('./AmenityReservation');
const ReassignmentHistory = require('./ReassignmentHistory');

// Relaciones User - Residence
Residence.belongsTo(User, { as: 'dueno', foreignKey: 'dueno_id' });
Residence.belongsTo(User, { as: 'residenteActual', foreignKey: 'residente_actual_id' });
Residence.belongsTo(User, { as: 'administrador', foreignKey: 'administrador_id' });

User.hasMany(Residence, { as: 'residenciasPropiedad', foreignKey: 'dueno_id' });
User.hasMany(Residence, { as: 'residenciaActual', foreignKey: 'residente_actual_id' });
User.hasMany(Residence, { as: 'residenciasAdministradas', foreignKey: 'administrador_id' });

// Relaciones ServiceCost
ServiceCost.belongsTo(Residence, { foreignKey: 'residencia_id' });
Residence.hasMany(ServiceCost, { foreignKey: 'residencia_id' });

// Relaciones Payment
Payment.belongsTo(User, { as: 'residente', foreignKey: 'residente_id' });
Payment.belongsTo(ServiceCost, { as: 'servicioCosto', foreignKey: 'servicio_costo_id' });

User.hasMany(Payment, { foreignKey: 'residente_id' });
ServiceCost.hasMany(Payment, { foreignKey: 'servicio_costo_id' });

// Relaciones Report
Report.belongsTo(Residence, { foreignKey: 'residencia_id' });
Report.belongsTo(User, { as: 'reportadoPor', foreignKey: 'reportado_por' });
Report.belongsTo(User, { as: 'asignadoA', foreignKey: 'asignado_a' });

Residence.hasMany(Report, { foreignKey: 'residencia_id' });
User.hasMany(Report, { as: 'reportesCreados', foreignKey: 'reportado_por' });
User.hasMany(Report, { as: 'reportesAsignados', foreignKey: 'asignado_a' });

// Relaciones Complaint
Complaint.belongsTo(User, { as: 'autor', foreignKey: 'autor_id' });
Complaint.belongsTo(User, { as: 'residenteObjetivo', foreignKey: 'residente_objetivo_id' });

User.hasMany(Complaint, { as: 'quejasCreadas', foreignKey: 'autor_id' });
User.hasMany(Complaint, { as: 'quejasRecibidas', foreignKey: 'residente_objetivo_id' });

// Relaciones Activity
Activity.belongsTo(User, { as: 'organizador', foreignKey: 'organizador_id' });
User.hasMany(Activity, { as: 'actividadesOrganizadas', foreignKey: 'organizador_id' });

// Relaciones AmenityReservation
AmenityReservation.belongsTo(Amenity, { foreignKey: 'amenidad_id' });
AmenityReservation.belongsTo(User, { as: 'residente', foreignKey: 'residente_id' });

Amenity.hasMany(AmenityReservation, { foreignKey: 'amenidad_id' });
User.hasMany(AmenityReservation, { foreignKey: 'residente_id' });

// Relaciones ReassignmentHistory
ReassignmentHistory.belongsTo(Residence, { foreignKey: 'residencia_id' });
ReassignmentHistory.belongsTo(User, { as: 'residenteAnterior', foreignKey: 'residente_anterior_id' });
ReassignmentHistory.belongsTo(User, { as: 'residenteNuevo', foreignKey: 'residente_nuevo_id' });
ReassignmentHistory.belongsTo(User, { as: 'autorizadoPor', foreignKey: 'autorizado_por' });

Residence.hasMany(ReassignmentHistory, { foreignKey: 'residencia_id' });

module.exports = {
  sequelize,
  User,
  Residence,
  ServiceCost,
  Payment,
  Report,
  Complaint,
  Activity,
  Amenity,
  AmenityReservation,
  ReassignmentHistory
};
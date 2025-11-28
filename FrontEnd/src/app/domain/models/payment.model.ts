import { User } from './user.model';
import { ServiceCost } from './service-cost.model';

export enum PaymentMethod {
  EFECTIVO = 'Efectivo',
  TRANSFERENCIA = 'Transferencia',
  TARJETA = 'Tarjeta',
  CHEQUE = 'Cheque'
}

export interface Payment {
  id: number;
  residente_id: number;
  servicio_costo_id: number;
  monto_pagado: number;
  fecha_pago: Date | string;
  metodo_pago: PaymentMethod;
  referencia?: string;
  comprobante_url?: string;
  created_at?: Date;
  
  // Relaciones
  residente?: User;
  servicioCosto?: ServiceCost;
}

export interface CreatePaymentDto {
  residente_id: number;
  servicio_costo_id: number;
  monto_pagado: number;
  metodo_pago: PaymentMethod;
  referencia?: string;
  comprobante_url?: string;
}
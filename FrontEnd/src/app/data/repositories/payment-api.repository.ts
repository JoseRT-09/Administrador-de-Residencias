import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { PaginatedResponse, QueryParams } from '../../domain/repositories/base.repository';
import { Payment, CreatePaymentDto } from '../../domain/models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentApiRepository extends PaymentRepository {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  getAll(params?: QueryParams): Observable<PaginatedResponse<Payment>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(response => ({
        total: response.total,
        pages: response.pages,
        currentPage: response.currentPage,
        data: response.payments
      }))
    );
  }

  getById(id: number): Observable<Payment> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.payment)
    );
  }

  create(payment: CreatePaymentDto): Observable<Payment> {
    return this.http.post<any>(this.apiUrl, payment).pipe(
      map(response => response.payment)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByResident(residentId: number): Observable<{ payments: Payment[], totalPaid: number }> {
    return this.http.get<any>(`${this.apiUrl}/resident/${residentId}`);
  }

  getSummary(year?: number): Observable<any> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/summary/monthly`, { params });
  }
}
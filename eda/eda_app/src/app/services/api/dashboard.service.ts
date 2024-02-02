import { Injectable, Output, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable()
export class DashboardService extends ApiService {

    private route = '/dashboard/';
    private routeDataManager = '/database-manager';

    public _notSaved = new BehaviorSubject<boolean>(false); // [{ display_name: { default: '' }, eda-columns: [] }] --> just in case
    public notSaved = this._notSaved.asObservable();

    getDashboards(): Observable<any> {
        return this.get(this.route);
    }

    getDashboard(id: string): Observable<any> {
        return this.get(`${this.route}${id}`);
    }

    getColumnRelations(body: any) {
        return this.post(this.route+'relations', body);
    }

    addNewDashboard(dashboard: any): Observable<any> {
        return this.post(this.route, dashboard);
    }

    updateDashboard(id: string, body: any): Observable<any> {
        return this.put(`${this.route}${id}`, body);
    }

    deleteDashboard(id: string): Observable<any> {
        return this.delete(`${this.route}${id}`);
    }

    executeQuery(body: any): Observable<any> {
        return this.post(`${this.route}query`, body);
    }

    executeSqlQuery(body: any): Observable<any> {
        return this.post(`${this.route}sql-query`, body);
    }
    executeView(body: any): Observable<any> {
        return this.post(`${this.route}view-query`, body);
    }

    getBuildedQuery(body: any): Observable<any> {
        return this.post(`${this.route}getQuey`, body);
    }

    cleanCache(body: any): Observable<any> {
        return this.post(`${this.route}clean-refresh`, body);
    }

}

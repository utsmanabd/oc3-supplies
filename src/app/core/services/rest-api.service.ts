import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, map, of, tap, throwError } from "rxjs";
import { GlobalComponent } from "../../global-component";

const httpOptions = {
  headers: new HttpHeaders({"Content-Type": "application/json"}),
};

@Injectable({
  providedIn: "root",
})
export class restApiService {
  constructor(private http: HttpClient) {}

  cache: any[] = []

  // Cache Management
  resetCachedData(cachedData?:string) {
    if (cachedData) {
      const index = this.cache.findIndex((item) => item[cachedData])
      if (index >= 0) {
        this.cache.splice(index, 1)
      } else throwError(`${cachedData} not found!`)
    } else {
      this.cache.splice(0)
    }
  }

  isCachedDataExists(cachedData:string): boolean {
    const data = this.cache.find((item) => item[cachedData])
    return data ? true : false
  }
  
  getCachedData(cachedData: string): any {
    const data = this.cache.find((item) => item[cachedData])
    if (data) {
      return data[cachedData]
    } else throwError(`${cachedData} not found`)
  }

  setCachedData(cacheKey: string, data: any) {
    this.cache.push({[cacheKey]: data})
  }

  // Fixed HTTP Request Methods
  requestCachedHttpGet(urlParams: string, cacheKey: string): Observable<any> {
    if (this.isCachedDataExists(cacheKey)) {
      return of(this.getCachedData(cacheKey))
    } else {
      return this.http.get(GlobalComponent.API_URL + urlParams, httpOptions).pipe(
        tap((data) => this.setCachedData(cacheKey, data))
      )
    }
  }

  requestHttpGet(urlParams: string): Observable<any> {
    return this.http.get(GlobalComponent.API_URL + urlParams, httpOptions)
  }

  requestHttpPost(urlParams: string, data: any): Observable<any> {
    return this.http.post(GlobalComponent.API_URL + urlParams, { form_data: data }, httpOptions).pipe(
      tap(() => {
        this.resetCachedData()
      })
    )
  }

  requestHttpPut(urlParams: string, id: any, data: any): Observable<any> {
    return this.http.put(GlobalComponent.API_URL + urlParams + `/${id}`, { form_data: data }, httpOptions).pipe(
      tap(() => this.resetCachedData())
    )
  }

  // Employee / Users API
  getEmployeeData(term: string) {
    if (term === "") {
      return of([]);
    }

    return this.http.post(GlobalComponent.AIO_API + "employee", { search: term }, httpOptions)
      .pipe(
        map((response: any) =>
          Array.isArray(response.data)
            ? response.data
                .filter((data: any) =>
                  new RegExp(term, "mi").test(
                    `${data.nik} - ${data.employee_name}`
                  )
                )
                .slice(0, 10)
            : []
        )
      );
  }

  getUsers() {
    const cacheKey = "userData"
    return this.requestCachedHttpGet('users', cacheKey)
  }

  getUserRole() {
    const cacheKey = "roles"
    return this.requestCachedHttpGet('users/role', cacheKey)
  }

  // Prodplan API
  getProdplan() {
    const cacheKey = "prodplan"
    return this.requestCachedHttpGet('prodplan', cacheKey)
  }

  getProdplanByYearAndLine(year: number, lineId: number) {
    const cacheKey = "prodplanYearLine"
    return this.requestCachedHttpGet(`prodplan/year-line/${year}/${lineId}`, cacheKey)
  }

  getProdplanGroupYears() {
    const cacheKey = "prodplanGroupYears"
    return this.requestCachedHttpGet(`prodplan/year`, cacheKey)
  }
  
  insertProdplan(data: any) {
    return this.requestHttpPost(`prodplan`, data)
  }

  updateProdplan(id: any, data: any) {
    return this.requestHttpPut(`prodplan`, id, data)
  }

  isProdplanAvailable(year: number, lineId: number) {
    return this.requestHttpGet(`prodplan/year-line/is-available/${year}/${lineId}`)
  }

  // Factory Line API
  getFactoryLine() {
    const cacheKey = "factoryLine"
    return this.requestCachedHttpGet(`line`, cacheKey)
  }

  insertFactoryLine(data: any) {
    return this.requestHttpPost(`line`, data)
  }

  updateFactoryLine(id: any, data: any) {
    return this.requestHttpPut(`line`, id, data)
  }

  // Supplies Budget API
  getSuppliesByYearAndLine(year: number, lineId: number) {
    const cacheKey = "suppliesYearLine"
    return this.requestCachedHttpGet(`supplies/year-line/${year}/${lineId}`, cacheKey)
  }

  insertSupplies(data: any) {
    return this.requestHttpPost(`supplies`, data)
  }

  updateSupplies(budgetId: any, data: any) {
    return this.requestHttpPut(`supplies`, budgetId, data)
  }

  updateMultipleSupplies(data: any) {
    return this.requestHttpPost(`supplies/multiple`, data)
  }

  updateSuppliesByBudgetAndProdplanId(budgetId: any, data: any) {
    return this.requestHttpPost(`supplies/budget-prodplan/${budgetId}`, data)
  }

  isBudgetIdAvailable(budgetId: string) {
    return this.requestHttpGet(`supplies/budget-id/is-available/${budgetId}`)
  }

  // Calculation Budget
  getCalculationBudget() {
    const cacheKey = "calculationBudget"
    return this.requestCachedHttpGet(`calculation`, cacheKey)
  }

  insertCalculationBudget(data: any) {
    return this.requestHttpPost(`calculation`, data)
  }

  updateCalculationBudget(id: any, data: any) {
    return this.requestHttpPut(`calculation`, id, data)
  }

  // Material API
  searchMaterial(term: string) {
    if (term === '') {
      return of([])
    }
    return this.http.post(GlobalComponent.API_URL + "material/search", { search: term }, httpOptions)
      .pipe(
        map((res: any) => Array.isArray(res.data) 
          ? res.data
              .filter((data: any) => new RegExp(term, 'mi')
                .test(`${data.material_code} - ${data.material_desc}`))
              .slice(0, 10)
          : []
        )
      )
  }

  insertMaterial(data: any) {
    return this.requestHttpPost(`material`, data)
  }

  updateMaterial(id: any, data: any) {
    return this.requestHttpPut(`material`, id, data)
  }

  // Line Cost Center
  searchCostCenter(term: string) {
    if (term === '') {
      return of([])
    }
    return this.http.post(GlobalComponent.API_URL + "costctr/search", { search: term }, httpOptions)
      .pipe(
        map((res: any) => Array.isArray(res.data) 
          ? res.data
              .filter((data: any) => new RegExp(term, 'mi')
                .test(`${data.section} (${data.cost_ctr})`))
              .slice(0, 10)
          : []
        )
      )
  }
}

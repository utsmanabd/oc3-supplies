import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, debounceTime, delay, map, of, switchMap, tap, throwError } from "rxjs";
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
      }
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
      return this.http.get(GlobalComponent.MASTER_API_URL + urlParams, httpOptions).pipe(
        tap((data) => this.setCachedData(cacheKey, data))
      )
    }
  }

  requestHttpGet(urlParams: string): Observable<any> {
    return this.http.get(GlobalComponent.MASTER_API_URL + urlParams, httpOptions)
  }

  requestHttpPost(urlParams: string, data: any): Observable<any> {
    return this.http.post(GlobalComponent.MASTER_API_URL + urlParams, { form_data: data }, httpOptions).pipe(
      tap(() => {
        this.resetCachedData()
      })
    )
  }

  requestHttpPut(urlParams: string, id: any, data: any): Observable<any> {
    return this.http.put(GlobalComponent.MASTER_API_URL + urlParams + `/${id}`, { form_data: data }, httpOptions).pipe(
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
  getMaterialByPagination(page: number, pageSize: number) {
    return this.requestHttpGet(`material/pagination?page=${page}&pageSize=${pageSize}`)
  }

  searchMaterial(term: string) {
    if (term === '') {
      return of([])
    }
    return this.http.post(GlobalComponent.MASTER_API_URL + "material/search", { search: term }, httpOptions)
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
    return this.http.post(GlobalComponent.MASTER_API_URL + "costctr/search", { search: term }, httpOptions)
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

  // Dummy API

  private totalItems = 100;
  getDummyData(page: number, itemsPerPage: number):Observable<string[]>{
   const startIndex = (page - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const items = [];
   for(let i = startIndex; i < endIndex; i++){
    if(i < this.totalItems){
      items.push(`Item ${i + 1}`);
    }
   }
   return of(items).pipe(delay(500));
  }

  // Dashboard
  getBudgetPerLine(year: number) {
    return this.requestHttpGet(`dashboard/line-by-year?year=${year}`)
  }
  
  getBudgetPerSection(year: number, lineId: number) {
    return this.requestHttpGet(`dashboard/section-by-line?year=${year}&lineId=${lineId}`)
  }
  
  getBudgetPerMonthByLine(year: number, lineId: number) {
    return this.requestHttpGet(`dashboard/month-by-line?year=${year}&lineId=${lineId}`)
  }

  getBudgetPerSupply(year: number, lineId: number) {
    return this.requestHttpGet(`dashboard/supply-by-line?year=${year}&lineId=${lineId}`)
  }

  getBudgetTop5PerSupply(year: number, lineId: number) {
    return this.requestHttpGet(`dashboard/top-by-line?year=${year}&lineId=${lineId}`)
  }

  getBudgetPerSectionAndMonth(year: number, lineId: number) {
    return this.requestHttpGet(`dashboard/sectionmonth-by-line?year=${year}&lineId=${lineId}`)
  }

  getBudgetPerMonthBySection(year: number, lineId: number, costCenterId: number) {
    return this.requestHttpGet(`dashboard/month-by-section?year=${year}&lineId=${lineId}&costCenterId=${costCenterId}`)
  }

  // Actual
  getActualPerLine(year: number) {
    return this.requestHttpGet(`actual/line-by-year?year=${year}`)
  }
  
  getActualPerSection(year: number, lineId: number) {
    return this.requestHttpGet(`actual/section-by-line?year=${year}&lineId=${lineId}`)
  }

  getActualPerSectionAndMonth(year: number, lineId: number) {
    return this.requestHttpGet(`actual/sectionmonth-by-line?year=${year}&lineId=${lineId}`)
  }

  getActualProdplanByLine(year: number, lineId: number) {
    return this.requestHttpGet(`actual/prodplan/year-line/${year}/${lineId}`)
  }

  getActualSuppliesByYearAndLine(year: number, lineId: number) {
    const cacheKey = `actualSuppliesYearLine`
    return this.requestCachedHttpGet(`actual/supplies/${year}/${lineId}`, cacheKey)
  }

  getActualPerSupply(year: number, lineId: number) {
    return this.requestHttpGet(`actual/supply-by-line?year=${year}&lineId=${lineId}`)
  }

  // Import XLSX
  uploadActualXlsx(file: FormData) {
    return this.http.post(GlobalComponent.MASTER_API_URL + 'xlsx/actual', file).pipe(
      tap(() => this.resetCachedData())
    )
  }

  uploadPlanXlsx(file: FormData) {
    return this.http.post(GlobalComponent.MASTER_API_URL + 'xlsx/plan', file).pipe(
      tap(() => this.resetCachedData())
    )
  }

}

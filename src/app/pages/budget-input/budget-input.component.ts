import { Component, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, OperatorFunction, Subject, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';
import { Material } from './material.model';
import { Router } from '@angular/router';
import { ToastService } from '../dashboards/dashboard/toast-service';

@Component({
  selector: 'app-budget-input',
  templateUrl: './budget-input.component.html',
  styleUrls: ['./budget-input.component.scss']
})
export class BudgetInputComponent {
  
  tableColumns = ['Section / Cost Center', 'Material Code', 'Material Description', 'Calculation by', 'UOM', 'Average Price', 'BOM', 'Total Quantity', 'Total Price', ' ']
  index: number = 0;

  _year: number = 0
  year: number = 0;
  selectedLine = {
    lineId: 0,
    lineName: ''
  };
  selectedCalculationBy =  {
    id: 0,
    name: '',
    detail: '',
  }

  detailModalForm: { concatenate: string, materialDesc: string, calculationBy: string, budgetingData: any[] } = {
    concatenate: "",
    materialDesc: "",
    calculationBy: "",
    budgetingData: []
  }

  lineIdBefore!: number;
  lineData: any[] = [];
  suppliesData: any[] = [];
  calculationData: any[] = [];
  prodplanData: any[] = [];

  avgPrice!: number | null
  bom!: number | null
  material: any

  costCenter: any

  materialSearching = false;
  costCenterSearching = false;

  searchLength: number | null = null;
  isNotHaveAveragePrice = false

  materialFormatter = (mat: Material) => mat.material_code ? `${mat.material_code} - ${mat.material_desc}` : ``
  costCenterFormatter = (item: any) => item.cost_ctr ? `${item.section} (${item.cost_ctr})` : ``

  searchMaterial: OperatorFunction<string, any[]> = (text$: Observable<any>) =>
    text$.pipe(debounceTime(300), distinctUntilChanged(), tap(() => (this.materialSearching = true)), switchMap((term: string) => {
      if (term.length >= 3) {
        this.searchLength = null
        return this.apiService.searchMaterial(term)
      } else {
        this.searchLength = term.length
        return of([])
      }
    }),
    tap(() => this.materialSearching = false)
  )
  
  searchCostCenter: OperatorFunction<string, any[]> = (text$: Observable<any>) =>
    text$.pipe(debounceTime(300), distinctUntilChanged(), tap(() => (this.costCenterSearching = true)), switchMap((term: string) => {
      return this.apiService.searchCostCenter(term)
    }),
    tap(() => this.costCenterSearching = false)
  )

  isFormInvalid = false;
  isLoading: boolean = false;
  breadCrumbItems!: Array<{}>;

  totalPrice: number = 0;
  totalQuantity: number = 0;

  private clickSubject = new Subject<string>()

  constructor(
    private apiService: restApiService, 
    public common: CommonService, 
    private modalService: NgbModal, 
    private router: Router,
  ) {
      this.year = new Date().getFullYear();
      this._year = this.year
      this.breadCrumbItems = [
        { label: 'Supplies Budgeting', active: true }
      ];
      this.clickSubject.pipe(debounceTime(350)).subscribe(async value => {
        this._year = this.year
        this.apiService.resetCachedData("suppliesYearLine")
        this.apiService.resetCachedData("prodplanYearLine")
        await this.getSuppliesByYearAndLine(this.year, this.selectedLine.lineId)
        await this.getProdplanByYearAndLine(this.year, this.selectedLine.lineId)
      })
  }

  async ngOnInit() {
    await this.getFactoryLine()
    await this.getCalculationBudget()
    await this.getSuppliesByYearAndLine(this.year, this.selectedLine.lineId)
    await this.getProdplanByYearAndLine(this.year, this.selectedLine.lineId)
  }

  ngOnDestroy() {
    const yearNow = new Date().getFullYear();
    if (this.year != yearNow || this.selectedLine.lineId != this.lineIdBefore) {
      this.apiService.resetCachedData("factoryLine")
      this.apiService.resetCachedData("suppliesYearLine")
      this.apiService.resetCachedData("prodplanYearLine")
    }
  }

  async getSuppliesByYearAndLine(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.getSuppliesByYearAndLine(year, lineId).subscribe({
        next: (res: any) => {
          this.isLoading = false
          this.suppliesData = res.data;
          this.suppliesData.forEach(item => {
            item.is_selected = false;
            item.average_price = +item.average_price
            item.bom = +item.bom
            item.budgeting_data.forEach((data: any) => {
              data.prodplan = +data.prodplan
              data.quantity = +data.quantity
              data.price = +data.price
            })
          })
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Supplies"), err)
          reject(err)
        },
        complete: () => {
          console.log(this.suppliesData);
          
          this.getTotalQuantityAndPrice(this.suppliesData)
          resolve(true)
        }
      })
    })
  }

  async getCalculationBudget() {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.getCalculationBudget().subscribe({
        next: (res: any) => {
          this.isLoading = false
          this.calculationData = res.data
          this.calculationData.forEach(data => {
            const valueObj = {
              id: data.id,
              name: data.name,
              detail: data.detail ? data.detail : ''
            }
            data.value = JSON.stringify(valueObj)
          })
          if (this.calculationData.length > 0) {
            this.selectedCalculationBy = JSON.parse(this.calculationData[0].value)
            resolve(true)
          } else reject(false)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Calculation Budget"), err)
          reject(err)
        }
      })
    })
  }

  async getFactoryLine() {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.getFactoryLine().subscribe({
        next: (res: any) => {
          this.isLoading = false
          this.lineData = res.data
          this.lineData.forEach(line => {
            const valueObj = {
              lineId: line.id,
              lineName: line.name
            }
            line.value = JSON.stringify(valueObj)
          })
          if (this.lineData.length > 0) {
            this.selectedLine.lineId = this.lineData[0].id
            this.selectedLine.lineName = this.lineData[0].name
            this.lineIdBefore = this.lineData[0].id
            resolve(true)
          } else reject(false)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Factory Line"), err)
          reject(err)
        }
      })
    })
  }

  async getProdplanByYearAndLine(year: number, line: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.getProdplanByYearAndLine(year, line).subscribe({
        next: (res: any) => {
          this.isLoading = false
          this.prodplanData = res.data
          if (this.prodplanData.length == 12) {
            resolve(true)
          } else {
            resolve(false)
          }
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Prodplan"), err)
          reject(err)
        }
      })
    })
  }

  getTotalQuantityAndPrice(suppliesData: any[]) {
    let totalQuantity = 0
    let totalPrice = 0
    suppliesData.forEach(supply => {
      totalQuantity += this.common.sumElementFromArray(supply.budgeting_data, "quantity")
      totalPrice += this.common.sumElementFromArray(supply.budgeting_data, "price")
    })
    this.totalQuantity = totalQuantity
    this.totalPrice = totalPrice
  }

  showProdplanNotFoundAlert() {
    this.common.showDeleteWarningAlert(
      `Prodplan data on factory line ${ this.selectedLine.lineName } in ${this. _year } are not found`, 
      `Warning!`, 
      `Create Prodplan`,
      false
    ).then(result => {
      if (result.value) {
        this.router.navigate(['prodplan'], { queryParams: {
          lineId: this.selectedLine.lineId,
          year: this.year
        }})
      }
    })
  }

  onMaterialFormSearch(event: any) {
    setTimeout(() => {
      if (this.material) {
        console.log(this.material);
        
        if (!this.material.average_price) {
          this.isNotHaveAveragePrice = true
          this.avgPrice = null
        } else {
          this.isNotHaveAveragePrice = false
          this.avgPrice = +this.material.average_price
        }
      }
    }, 50)
  }

  onCostCenterFormSearch() {
    setTimeout(() => {
      if (this.costCenter) {
        console.log(this.costCenter);
      }
    }, 50)
  }

  onFactoryLineChange(event: any) {
    if (event.target.value) {
      const selectedLineIndex = this.common.getIndexById(this.lineData, +event.target.value, "id")
      this.selectedLine = JSON.parse(this.lineData[selectedLineIndex].value)
      this.clickSubject.next("line")
    }
  }

  onCalculationBudgetChange(event: any) {
    if (event.target.value) {
      const selectedCalculationIndex = this.common.getIndexById(this.calculationData, +event.target.value, "id")
      this.selectedCalculationBy = JSON.parse(this.calculationData[selectedCalculationIndex].value)
      const selectedId = this.selectedCalculationBy.id
    }
  }

  onButtonChangeYear(action: string) {
    if (action === "next") this.year += 1
    if (action === "prev") this.year -= 1
    this.clickSubject.next("year")
  }

  onYearChange(event: any) {
    if (event.target.value) {
      this.clickSubject.next("year")
    }
  }

  openDetailModal(content: TemplateRef<any>, data: any) {
    this.detailModalForm.concatenate = `${data.cost_center}-${data.material_code}`
    this.detailModalForm.materialDesc = data.material_desc
    this.detailModalForm.calculationBy = data.calculation_by
    this.detailModalForm.budgetingData = data.budgeting_data

    this.modalService.open(content, { size: 'lg' })
  }

  openUpdateModal(content: TemplateRef<any>, data?: any) {
    if (data) {

    }

    if (this.prodplanData.length !== 12) {
      this.showProdplanNotFoundAlert()
    } else {
      this.modalService.open(content, { size: 'xl', centered: true }).result.then(
        (result) => this.resetModalValue(),
        (reason) => this.resetModalValue()
      )
    }
  }

  resetModalValue() {
    this.isLoading = false;
    this.material = null;
    this.bom = null;
    this.avgPrice = null;
    this.isNotHaveAveragePrice = false;
    this.isFormInvalid = false;
  }

  onAddSupply() {
    if (this.material && this.bom && this.avgPrice && this.prodplanData && this.costCenter) {
      this.isFormInvalid = false
      if (!this.material.average_price) {
        this.updateMaterial(this.material.id, { average_price: this.avgPrice }).then(success => {
          console.log(`average price has been added on ${this.material.material_code}`);
          if (success) this.saveChanges()
        })
      } else {
        this.saveChanges()
      }
    } else {
      this.isFormInvalid = true
    }
  }

  saveChanges() {
    const data: any[] = []
    const budgetId = `${this.year}-${this.selectedLine.lineId}-${this.costCenter.id}-${this.material.id}`
    const bom = this.bom ? this.bom! : 0

    this.prodplanData.forEach(item => {
      let quantity = 0
      let price = 0

      if (this.selectedCalculationBy.id == 1) {
        // Prodplan (Per 1000 btl) Calculation
        quantity = item.prodplan / 1000 * bom
      } else if (this.selectedCalculationBy.id == 2) {
        // Daily Calculation
        quantity = item.daily_count * bom
      } else if (this.selectedCalculationBy.id == 3) {
        // Weekly Calculation
        quantity = item.weekly_count * bom
      } else if (this.selectedCalculationBy.id == 4) {
        // Monthly Calculation
        quantity = item.monthly_count * bom
      }

      price = quantity * this.avgPrice!

      data.push({
        budget_id: budgetId,
        material_id: this.material.id,
        cost_ctr_id: this.costCenter.id,
        calc_budget_id: this.selectedCalculationBy.id,
        prodplan_id: item.id,
        bom: bom,
        quantity: quantity,
        price: price
      })
    })
    console.log(data);

    this.apiService.isBudgetIdAvailable(budgetId).subscribe({
      next: (res: any) => {
        if (!res.is_available) {
          this.common.showErrorAlert(`Supply is already exist on ${this.costCenter.section} - ${this.costCenter.cost_ctr}!`, "Already Exist")
        } else {
          this.insertSupplyBudget(data)
        }
      },
      error: (err) => this.common.showErrorAlert(Const.ERR_GET_MSG("Budget Id"), err)
    })
  }

  onDeleteSupplyBudget(data?: any) {
    if (data) {
      this.common.showDeleteWarningAlert(Const.ALERT_DEL_MSG(`${data.material_desc} (${data.section})`)).then(async result => {
        if (result.value) {
          const removeData = { is_removed: 1 }
          await this.updateSupplyBudget(data.budget_id, removeData).then((isSuccess) => this.clickSubject.next("Delete"))
        }
      })
    } else {
      let selectedCount = 0
      this.suppliesData.forEach(item => {
        if (item.is_selected) selectedCount += 1
      })
      if (selectedCount > 0) {
        this.common.showDeleteWarningAlert(Const.ALERT_DEL_MSG(`${selectedCount} Supplies`)).then(async result => {
          if (result.value) {
            const removeData: any[] = []
            this.suppliesData.forEach(supply => {
              if (supply.is_selected) {
                removeData.push({ budget_id: supply.budget_id, data: { is_removed: 1 } })
              }
            })
            console.log(removeData);
            if (removeData.length > 0) {
              await this.updateMultipleSupplyBudget(removeData).then((isSuccess) => {
                if (isSuccess) this.clickSubject.next("RemoveMultiple")
              })
            }
          }
        })
      }
    }
  }

  onChecklistAll(event: any) {
    this.suppliesData.forEach(supply => event.target.checked ? supply.is_selected = true : supply.is_selected = false)
  }

  onCheckedSupplyBudget(event: any) {
    const condition = event.target.checked
    const budgetId = event.target.value
    const index = this.common.getIndexById(this.suppliesData, budgetId, "budget_id")
    this.suppliesData[index].is_selected = condition
  }

  async updateMaterial(id: any, data: any) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.updateMaterial(id, data).subscribe({
        next: (res: any) => {
          this.isLoading = false
          resolve(true)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_UPDATE_MSG("Material"), err)
          reject(err)
        }
      })
    })
  }

  async updateSupplyBudget(id: any, data: any) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.updateSupplies(id, data).subscribe({
        next: (res: any) => {
          this.isLoading = false
          resolve(true)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_UPDATE_MSG("Supply"), err)
          reject(err)
        }
      })
    })
  }

  async updateMultipleSupplyBudget(data: any) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.updateMultipleSupplies(data).subscribe({
        next: (res: any) => {
          this.isLoading = false
          resolve(true)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_UPDATE_MSG("Supplies"), err)
          reject(err)
        }
      })
    })
  }

  insertSupplyBudget(data: any) {
    this.isLoading = true
    this.apiService.insertSupplies(data).subscribe({
      next: (res: any) => {
        this.clickSubject.next("Insert")
        this.isLoading = false
        this.modalService.dismissAll()
        this.common.showSuccessAlert("Supply updated successfully!").then((result) => {
          if (result.value) {
            
          }
        })
      },
      error: (err) => {
        this.isLoading = false
        this.common.showErrorAlert(Const.ERR_INSERT_MSG("Supply"), err)
      }
    })
  }
  
}

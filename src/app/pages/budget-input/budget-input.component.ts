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
  
  monthData = [1,2,3,4,5,6,7,8,9,10,11,12]
  sectionData: any[] = []
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

  budgetId: string = ''

  lineIdBefore!: number;
  lineData: any[] = [];
  suppliesData: any[] = [];
  suppliesDataBefore: any[] = [];
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

  selectedMonthFilter = -1
  selectedSectionFilter = -1
  isFilterChange = false;

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
        if (value !== "filterChange") {
          this.sectionData = []
          this.selectedMonthFilter = -1
          this.selectedSectionFilter = -1
        }
        await this.getSuppliesByYearAndLine(this.year, this.selectedLine.lineId).then(() => {
          if (value == "filterChange") {
            this.onSupplyFilter(null, this.selectedMonthFilter, this.selectedSectionFilter)
            console.log("AAA");
            console.log(this.selectedSectionFilter);
          }
        })
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
          let section = this.common.getUniqueData(this.suppliesData, 'cost_ctr_id')
          if (this.sectionData.length <= 0) {
            section.forEach(item => {
              this.sectionData.push({cost_ctr_id: item.cost_ctr_id, section: item.section, cost_center: item.cost_center})
            })
          }
          this.suppliesDataBefore = this.suppliesData.map(supply => ({...supply}))
          console.log("sectionData: ", this.sectionData);
          
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
    if (this.prodplanData.length !== 12) {
      this.showProdplanNotFoundAlert()
    } else {
      if (data) {
        this.costCenter = { id: data.cost_ctr_id, section: data.section, cost_ctr: data.cost_center }
        this.material = { id: data.material_id, material_code: data.material_code, material_desc: data.material_desc, average_price: data.average_price }
        this.bom = data.bom
        this.selectedCalculationBy.id = data.calculation_id
        this.selectedCalculationBy.name = data.calculation_by
        this.avgPrice = data.average_price
        this.budgetId = data.budget_id
      }

      this.modalService.open(content, { size: 'xl', centered: true }).result.then(
        (result) => this.resetModalValue(),
        (reason) => {
          if (reason == 'Edit') {
            this.costCenter = undefined;
          }
          this.resetModalValue()
        }
      )
    }
  }

  resetModalValue() {
    this.budgetId = ''
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
          if (success) this.budgetId ? this.saveChanges(true) : this.saveChanges()
        })
      } else {
        this.budgetId ? this.saveChanges(true) : this.saveChanges()
      }
    } else {
      this.isFormInvalid = true
    }
  }

  async saveChanges(isEditMode: boolean = false) {
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

    if (isEditMode) {
      data.forEach(item => {
        delete item.budget_id
      })
      this.isLoading = true
      this.apiService.updateSuppliesByBudgetAndProdplanId(this.budgetId, data).subscribe({
        next: (res: any) => {
          this.isLoading = false
          this.clickSubject.next(this.isFilterChange ? "filterChange" : "Update")
          this.modalService.dismissAll("Edit")
        },
        error: (err) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_UPDATE_MSG("Supplies"), err)
        }
      })
    } else {
      this.apiService.isBudgetIdAvailable(budgetId).subscribe({
        next: async (res: any) => {
          if (!res.is_available) {
            this.common.showErrorAlert(`Supply is already exist on ${this.costCenter.section} - ${this.costCenter.cost_ctr}!`, "Already Exist")
          } else {
            this.insertSupplyBudget(data)
          }
        },
        error: (err) => this.common.showErrorAlert(Const.ERR_GET_MSG("Budget Id"), err)
      })
    }
  }

  onDeleteSupplyBudget(data?: any) {
    if (data) {
      this.common.showDeleteWarningAlert(Const.ALERT_DEL_MSG(`${data.material_desc} (${data.section})`)).then(async result => {
        if (result.value) {
          const removeData = { is_removed: 1 }
          await this.updateSupplyBudget(data.budget_id, removeData).then((isSuccess) => this.clickSubject.next(this.isFilterChange ? "filterChange" : "Delete"))
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
            if (removeData.length > 0) {
              await this.updateMultipleSupplyBudget(removeData).then((isSuccess) => {
                if (isSuccess) {
                  if (removeData.length > 10) {
                    console.log("> 10");
                    
                    this.isLoading = true
                    setTimeout(() => {
                      this.isLoading = false
                      this.clickSubject.next(this.isFilterChange ? "filterChange" : "RemoveMultiple")
                    }, 5000)
                  } else {
                    console.log("< 10");
                    
                    this.clickSubject.next(this.isFilterChange ? "filterChange" : "RemoveMultiple")
                  }
                }
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
        this.clickSubject.next(this.isFilterChange ? "filterChange" : "Insert")
        this.isLoading = false
        if (this.modalService.hasOpenModals()) {
          this.modalService.dismissAll()
        }
        this.common.showSuccessAlert("Supply updated successfully!")
      },
      error: (err) => {
        this.isLoading = false
        this.common.showErrorAlert(Const.ERR_INSERT_MSG("Supply"), err)
      }
    })
  }

  onPreviousYearFetchData() {
    if (this.prodplanData.length !== 12) {
      this.showProdplanNotFoundAlert()
    } else {
      this.common.showDeleteWarningAlert(
        "This action will directly create budgeting data based on the previous year's data. Are you sure you want to continue?",
        "Alert", "Yes"
        ).then(result => {
          if (result.value) {
            const previousYear = this.year - 1
            let temporarySuppliesData: any[] = []
            this.isLoading = true
            this.apiService.resetCachedData("suppliesYearLine")
            this.apiService.getSuppliesByYearAndLine(previousYear, this.selectedLine.lineId).subscribe({
              next: (res: any) => {
                let data: any[] = res.data
                if (data.length > 0) {
                  data.forEach(item => {
                    let [, , ...rest] = item.budget_id.split('-')
                    this.prodplanData.forEach((prodplan) => {
                      let quantity = 0
                      let price = 0
                      if (item.calculation_id == 1) {
                        quantity = +prodplan.prodplan / 1000 * +item.bom
                      } else if (item.calculation_id == 2) {
                        quantity = prodplan.daily_count * +item.bom
                      } else if (item.calculation_id == 3) {
                        quantity = prodplan.weekly_count * +item.bom
                      } else if (item.calculation_id == 4) {
                        quantity = prodplan.monthly_count * +item.bom
                      }
                      price = quantity * +item.average_price
                      temporarySuppliesData.push({
                        budget_id: `${this.year}-${this.selectedLine.lineId}-${rest.join('-')}`,
                        material_id: item.material_id,
                        cost_ctr_id: item.cost_ctr_id,
                        calc_budget_id: item.calculation_id,
                        prodplan_id: prodplan.id,
                        bom: +item.bom,
                        quantity: quantity,
                        price: price
                      })
                    })
                  })
        
                  setTimeout(() => {
                    this.insertSupplyBudget(temporarySuppliesData)
                  }, 1500)
                } else {
                  this.isLoading = false
                  this.common.showErrorAlert("The previous year's data is empty!", "Failed")
                }
              },
              error: (err) => {
                this.isLoading = false
                this.common.showErrorAlert(Const.ERR_GET_MSG("Supplies"), err)
              }
            })
          }
        })
    }
  }

  onSupplyFilter(event: any, month?: number, sectionId?: number) {
    this.suppliesData = this.suppliesDataBefore

    const getFilteredMonthData = () => {
      return this.suppliesData.map(supply => {
        const filteredMonth = supply.budgeting_data.filter((data: any) => data.month == this.selectedMonthFilter)
        return {
          budget_id: supply.budget_id,
          line: supply.line,
          year: supply.year,
          section: supply.section,
          cost_center: supply.cost_center,
          material_code: supply.material_code,
          material_desc: supply.material_desc,
          calculation_by: supply.calculation_by,
          uom: supply.uom,
          average_price: supply.average_price,
          bom: supply.bom,
          calculation_id: supply.calculation_id,
          cost_ctr_id: supply.cost_ctr_id,
          line_id: supply.line_id,
          material_id: supply.material_id,
          budgeting_data: filteredMonth
        }
      })
    }

    if (event != null) {
      console.log(event.target.id);
      if (event.target.id === 'monthFilter') {
        this.selectedMonthFilter = +event.target.value;
      }
  
      if (event.target.id === 'sectionFilter') {
        this.selectedSectionFilter = +event.target.value;
      }
    } else {
      console.log("BBB");
      
      if (month && sectionId) {
        console.log(sectionId);
        
        this.selectedMonthFilter = month
        this.selectedSectionFilter = sectionId
      }
    }

    this.isFilterChange = true

    if (this.selectedMonthFilter !== -1 && this.selectedSectionFilter !== -1) {
      this.suppliesData = getFilteredMonthData().filter(supply => supply.cost_ctr_id === this.selectedSectionFilter)
    } else if (this.selectedMonthFilter === -1 && this.selectedSectionFilter !== -1) {
      this.suppliesData = this.suppliesData.filter(supply => supply.cost_ctr_id === this.selectedSectionFilter);
    } else if (this.selectedMonthFilter !== -1 && this.selectedSectionFilter === -1) {
      this.suppliesData = getFilteredMonthData()
    } else {
      this.suppliesData = this.suppliesDataBefore
      this.isFilterChange = false
    }

    this.getTotalQuantityAndPrice(this.suppliesData)
    
  }

  searchKeyword = ''
  supplies() {
    return this.suppliesData.filter(
      (data) =>
        data.section
          .toLowerCase()
          .includes(this.searchKeyword.trim().toLowerCase()) ||
        data.material_desc
          .toLowerCase()
          .includes(this.searchKeyword.trim().toLowerCase()) ||
        data.uom
          .toLowerCase()
          .includes(this.searchKeyword.trim().toLowerCase()) ||
        data.calculation_by
          .toLowerCase()
          .includes(this.searchKeyword.trim().toLowerCase()) ||
        data.cost_center.toString()
          .includes(this.searchKeyword.trim()) ||
        data.material_code.toString()
          .includes(this.searchKeyword.trim()) ||
        `${data.cost_center}-${data.material_code}`
          .includes(this.searchKeyword.trim().toLowerCase())
    )
  }
  
}

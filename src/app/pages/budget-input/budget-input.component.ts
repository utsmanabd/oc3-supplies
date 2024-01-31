import { Component, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';

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

  lineIdBefore!: number;
  lineData: any[] = [];
  suppliesData: any[] = [];
  calculationData: any[] = [];

  isLoading: boolean = false;
  breadCrumbItems!: Array<{}>;

  totalPrice: number = 0;
  totalQuantity: number = 0;

  private clickSubject = new Subject<string>()

  constructor(private apiService: restApiService, public common: CommonService, private modalService: NgbModal) {
    this.year = new Date().getFullYear();
    this._year = this.year
    this.breadCrumbItems = [
      { label: 'Supplies Budgeting', active: true }
    ];
    this.clickSubject.pipe(debounceTime(350)).subscribe(value => {
      this._year = this.year
      this.apiService.resetCachedData("suppliesYearLine")
      this.getSuppliesByYearAndLine(this.year, this.selectedLine.lineId)
    })
  }

  async ngOnInit() {
    await this.getFactoryLine()
    await this.getCalculationBudget()
    await this.getSuppliesByYearAndLine(this.year, this.selectedLine.lineId)
  }

  ngOnDestroy() {
    const yearNow = new Date().getFullYear();
    if (this.year != yearNow || this.selectedLine.lineId != this.lineIdBefore) {
      this.apiService.resetCachedData("factoryLine")
      this.apiService.resetCachedData("suppliesYearLine")
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
          this.getTotalQuantityAndPrice(this.suppliesData)
          console.log(this.suppliesData);
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
            console.log(this.lineData);
            console.log(this.selectedLine);
            
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

  onFactoryLineChange(event: any) {
    if (event.target.value) {
      const selectedLineIndex = this.common.getIndexById(this.lineData, +event.target.value, "id")
      this.selectedLine = JSON.parse(this.lineData[selectedLineIndex].value)
      console.log(this.selectedLine);
      this.clickSubject.next("line")
    }
  }

  onCalculationBudgetChange(event: any) {
    console.log(event.target.value);
    
    if (event.target.value) {
      const selectedCalculationIndex = this.common.getIndexById(this.calculationData, +event.target.value, "id")
      this.selectedCalculationBy = JSON.parse(this.calculationData[selectedCalculationIndex].value)
      const selectedId = this.selectedCalculationBy.id
      console.log(selectedId, this.selectedCalculationBy);
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

  detailModalForm: { concatenate: string, materialDesc: string, calculationBy: string, budgetingData: any[] } = {
    concatenate: "",
    materialDesc: "",
    calculationBy: "",
    budgetingData: []
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
    this.modalService.open(content, { size: 'lg', centered: true }).result.then(
      (result) => this.resetModalValue(),
			(reason) => this.resetModalValue()
    )
  }

  resetModalValue() {
    this.isLoading = false;
  }
  
}

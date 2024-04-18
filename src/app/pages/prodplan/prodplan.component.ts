import { Component } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-prodplan',
  templateUrl: './prodplan.component.html',
  styleUrls: ['./prodplan.component.scss']
})
export class ProdplanComponent {
  isLoading: boolean = false;
  breadCrumbItems!: Array<{}>;
  index = 0;
  month = [
    "January", "February", "March", "April", 
    "May", "June", "July", "August", "September", 
    "October", "November", "December"
  ];

  year!: number
  _year!: number
  lineId!: number
  lineIdBefore!: number

  prodplanData: any[] = []
  lineData: any[] = []
  selectedLine: string = ''
  totalProdplan: number = 0
  totalWeeks!: number

  temporaryProdplan: any[] = []

  isSmallScreen: boolean = false
  isCreateMode: boolean = false

  modalForm: {id: number, actualId?: 0 | null, monthId: number, month: string, daily: number, weekly: number, prodplan: number, actualProdplan?: number | null} = {
    id: 0,
    actualId: null,
    monthId: 0,
    month: '',
    daily: 0,
    weekly: 0,
    prodplan: 0,
    actualProdplan: null
  }

  private clickSubject = new Subject()

  constructor(
    private apiService: restApiService,
    public common: CommonService,
    private breakpointObserver: BreakpointObserver,
    private modalService: NgbModal,
    private route: ActivatedRoute
  ) {
    this.year = new Date().getFullYear()
    this._year = this.year

    this.breadCrumbItems = [
      { label: 'Prodplan', active: true }
    ];
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe(result => {
      this.isSmallScreen = result.breakpoints[Breakpoints.XSmall];
    })

    this.clickSubject.pipe(debounceTime(350)).subscribe(async (value: any) => {
      if (isNaN(value)) {
        this._year = this.year
      } else {
        this.selectedLine = this.lineData[value].name
      }
      this.apiService.resetCachedData("prodplanYearLine")
      await this.getProdplanByYearAndLine(this.year, this.lineId)
      await this.getActualProdplanByYearAndLine(this.year, this.lineId)
    })
  }

  ngOnDestroy() {
    const yearNow = new Date().getFullYear()
    if (this.year != yearNow || this.lineId != this.lineIdBefore) {
      this.apiService.resetCachedData("prodplanYearLine")
      this.apiService.resetCachedData("factoryLine")
    }
  }

  async ngOnInit() {
    await this.getFactoryLine().then(result => {
      if (result && this.lineData.length > 0) {
        this.lineIdBefore = this.lineData[0].id
        this.route.queryParams.subscribe((params: any) => {
          if (params.lineId && params.year) {
            this.lineId = +params.lineId
            this.year = +params.year
            const index = this.common.getIndexById(this.lineData, this.lineId, "id")
            this.selectedLine = this.lineData[index].name
            this.onCreateModeChange()
          } else {
            this.selectedLine = this.lineData[0].name
            this.lineId = this.lineData[0].id
          }
        })
      }
    })
    await this.getProdplanByYearAndLine(this.year, this.lineId)
    await this.getActualProdplanByYearAndLine(this.year, this.lineId)
  }

  async getProdplanByYearAndLine(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getProdplanByYearAndLine(year, lineId).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.prodplanData = res.data;
        },
        error: (err) => {
          this.isLoading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Prodplan"), err)
          reject(err)
        },
        complete: () => {
          this.getTotalProdplan(this.prodplanData)
          this.getTotalWeeks(this.prodplanData)
          resolve(true)
        }
      })
    })
  }

  async getActualProdplanByYearAndLine(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getActualProdplanByLine(year, lineId).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          let data: any[] = res.data
          this.prodplanData.forEach(plan => {
            const actualItem = data.find(actual => actual.month === plan.month)
            plan.actual_id = actualItem ? actualItem.id : null;
            plan.prodplan_actual = actualItem ? actualItem.prodplan : null;
          })
        },
        error: (err) => {
          this.isLoading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Actual Prodplan"), err)
          reject(err)
        }
      })
    })
  }

  getTotalProdplan(prodplanData: any[]) {
    this.totalProdplan = this.common.sumElementFromArray(prodplanData, "prodplan")
  }
  
  getTotalWeeks(prodplanData: any[]) {
    this.totalWeeks = this.common.sumElementFromArray(prodplanData, "weekly_count")
  }

  async getFactoryLine() {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.getFactoryLine().subscribe({
        next: (res: any) => {
          this.isLoading = false
          this.lineData = res.data
          resolve(true)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Factory Line"), err)
          reject(err)
        }
      })
    })
  }

  openEditModal(content: any, prodplanData: any) {
    this.modalForm = {
      id: prodplanData.id,
      actualId: prodplanData.actual_id || null,
      monthId: prodplanData.month,
      month: this.common.getMonthName(prodplanData.month),
      daily: prodplanData.daily_count,
      weekly: prodplanData.weekly_count,
      prodplan: prodplanData.prodplan,
      actualProdplan: prodplanData.prodplan_actual || null
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => this.resetModalValue(),
			(reason) => this.resetModalValue()
    )
  }


  async onEditChange() {
    const prodplanData = {
      daily_count: this.modalForm.daily, 
      weekly_count: this.modalForm.weekly, 
      prodplan: this.modalForm.prodplan
    }
    const actualData = {
      prodplan: this.modalForm.actualProdplan, month: this.modalForm.monthId, year: this.year, line_id: this.lineId
    }

    await this.updateProdplan(this.modalForm.id, prodplanData).then(async () => {
      if (this.modalForm.actualId) {
        await this.updateActualProdplan(this.modalForm.actualId, { prodplan: this.modalForm.actualProdplan ? this.modalForm.actualProdplan : null})
      } else {
        await this.insertActualProdplan(actualData)
      }
      this.modalService.dismissAll()
      this.clickSubject.next('subject')
    })
  }

  resetModalValue() {
    this.isLoading = false;
    this.modalForm = {id: 0, actualId: null, monthId: 0, month: '', daily: 0, weekly: 0, prodplan: 0, actualProdplan: null}
  }

  onButtonChangeYear(action: string) {
    if (action === "next") this.year += 1
    if (action === "prev") this.year -= 1
    this.clickSubject.next("subject")
  }

  onYearChange(event: any) {
    if (event.target.value) {
      this.clickSubject.next("subject")
    }
  }

  onFactoryLineChange(event: any) {
    if (event.target.value) {
      const selectedLineIndex = this.common.getIndexById(this.lineData, +event.target.value, "id")
      this.clickSubject.next(selectedLineIndex)
    }
  }

  onCreateModeChange() {
    if (this.isCreateMode == false) {
      this.isCreateMode = true
      const temporaryData: any[] = []
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      const lineId = this.lineId
      const yearSelected = this.year
      months.forEach(monthNumber => {
        temporaryData.push({
          line_id: +lineId,
          year: yearSelected,
          month: monthNumber,
          prodplan: 0,
          daily_count: 21,
          weekly_count: this.common.getTotalWeekInMonth(monthNumber, yearSelected)
        })
      })
      this.temporaryProdplan = temporaryData
      setTimeout(() => {this.getTotalWeeks(this.temporaryProdplan)}, 50)
    } else {
      this.isCreateMode = false
      this.temporaryProdplan = []
      this.totalProdplan = 0
    }
  }

  onSaveChanges() {
    this.isLoading = true
    this.apiService.insertProdplan(this.temporaryProdplan).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.common.goToTop()
          this.isLoading = false
          this.isCreateMode = false
          this.clickSubject.next("subject")
          this.common.showSuccessAlert("Prodplan has been created successfully")
        }, 200)
      },
      error: (err) => {
        this.isLoading = false
        this.common.showErrorAlert(Const.ERR_INSERT_MSG('Prodplan'), err)
      }
    })
  }

  onWeekAutoSelect() {
    this.modalForm.weekly = this.common.getTotalWeekInMonth(this.modalForm.monthId, this.year)
  }

  async onDelete() {
    this.common.showDeleteWarningAlert(Const.ALERT_DEL_MSG(`${this.selectedLine} (${this._year}) Prodplan`)).then(async (result) => {
      if (result.value) {
        this.isLoading = true
        const remove = { is_removed: 1 }
        const removeData: number[] = []
        this.prodplanData.forEach(data => {
          removeData.push(data.id)
        })
        removeData.forEach(async (id) => {
          await this.removeProdplan(id, remove)
        })
        this.apiService.resetCachedData("prodplanYearLine")
        setTimeout(async() => {
          await this.getProdplanByYearAndLine(this.year, this.lineId).then(resolve => {
            if (resolve && this.prodplanData.length == 0) {
              this.common.goToTop()
              this.common.showSuccessAlert("Prodplan deleted successfully")
              this.isLoading = false
            }
          })
        }, 200)
      }
    })
  }

  async removeProdplan(id: number, removeData: any) {
    return new Promise((resolve, reject) => {
      this.apiService.updateProdplan(id, removeData).subscribe({
        next: (res: any) => resolve(true),
        error: (err) => {
          this.common.showErrorAlert(Const.ERR_DELETE_MSG("Prodplan"), err)
          reject(err)
        }
      })
    })
  }

  async updateProdplan(id: number, data: any) {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.updateProdplan(id, data).subscribe({
        next: (res: any) => {
          this.isLoading = false
          resolve(res)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_UPDATE_MSG("Prodplan"), err)
          reject(err)
        }
      })
    })
  }

  async insertActualProdplan(data: any) {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.insertActualProdplan(data).subscribe({
        next: (res: any) => {
          this.isLoading = false
          resolve(res)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_INSERT_MSG("Actual Prodplan"), err)
          reject(err)
        }
      })
    })
  }

  async updateActualProdplan(id: number, data: any) {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.updateActualProdplan(id, data).subscribe({
        next: (res: any) => {
          this.isLoading = false
          resolve(res)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_UPDATE_MSG("Actual Prodplan"), err)
          reject(err)
        }
      })
    })
  }

  prevProdplanPercentage: number = 100

  openPrevModal(content: any) {

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'sm', centered: true }).result.then(
      (result) => this.prevProdplanPercentage = 100,
			(reason) => this.prevProdplanPercentage = 100
    )
  }

  getpreviousYearProdplan() {
    const previousYear = this.year - 1
    this.isLoading = true
    this.apiService.resetCachedData("prodplanYearLine")
    this.apiService.getProdplanByYearAndLine(previousYear, this.lineId).subscribe({
      next: (res: any) => {
        this.isLoading = false
        let previousYearData: any[] = res.data
        if (previousYearData.length > 0) {
          for (let i in previousYearData) {
            this.temporaryProdplan[i].prodplan = +previousYearData[i].prodplan * (this.prevProdplanPercentage / 100)
          }
          this.getTotalProdplan(this.temporaryProdplan)
          this.modalService.dismissAll()
        }
        else this.common.showErrorAlert(`Previous year prodplan data not available`, `Not Found`)
      },
      error: (err) => {
        this.isLoading = false
        this.common.showErrorAlert(Const.ERR_GET_MSG("Prodplan"), err)
      }
    })
  }

}

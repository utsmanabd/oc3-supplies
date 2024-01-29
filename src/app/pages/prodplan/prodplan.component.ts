import { Component } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  totalProdplan!: number
  totalWeeks!: number

  temporaryProdplan: any[] = []

  isSmallScreen: boolean = false
  isCreateMode: boolean = false

  modalForm = {
    id: 0,
    monthId: 0,
    month: '',
    daily: 0,
    weekly: 0,
    prodplan: 0
  }

  private clickSubject = new Subject()

  constructor(
    private apiService: restApiService,
    public common: CommonService,
    private breakpointObserver: BreakpointObserver,
    private modalService: NgbModal
  ) {
    this.year = new Date().getFullYear()
    this._year = this.year

    this.breadCrumbItems = [
      { label: 'Prodplan', active: true }
    ];
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe(result => {
      this.isSmallScreen = result.breakpoints[Breakpoints.XSmall];
    })

    this.clickSubject.pipe(debounceTime(350)).subscribe((value: any) => {
      if (isNaN(value)) {
        this._year = this.year
      } else {
        this.selectedLine = this.lineData[value].name
      }
      this.apiService.resetCachedData("prodplanYearLine")
      this.getProdplanByYearAndLine(this.year, this.lineId)
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
    await this.getFactoryLine()
    await this.getProdplanByYearAndLine(this.year, this.lineId)
  }

  async getProdplanByYearAndLine(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getProdplanByYearAndLine(year, lineId).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.prodplanData = res.data;
          this.prodplanData.forEach(item => {
            item.prodplan = +item.prodplan;
          })
          console.log("lineId: ", this.lineId);
          console.log("year: ", this.year);
          console.log(this.prodplanData);
          
          resolve(true)
        },
        error: (err) => {
          reject(err)
          this.isLoading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Prodplan"), err)
        },
        complete: () => {
          this.getTotalProdplan(this.prodplanData)
          this.getTotalWeeks(this.prodplanData)
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
          if (this.lineData.length > 0) {
            this.selectedLine = this.lineData[0].name
            this.lineId = this.lineData[0].id
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

  openEditModal(content: any, prodplanData: any) {
    this.modalForm = {
      id: prodplanData.id,
      monthId: prodplanData.month,
      month: this.common.getMonthName(prodplanData.month),
      daily: prodplanData.daily_count,
      weekly: prodplanData.weekly_count,
      prodplan: prodplanData.prodplan
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => this.resetModalValue(),
			(reason) => this.resetModalValue()
    )
  }


  onEditChange() {
    const id = this.modalForm.id
    const data = {
      daily_count: this.modalForm.daily, 
      weekly_count: this.modalForm.weekly, 
      prodplan: this.modalForm.prodplan
    }
    this.updateProdplan(id, data)
  }

  resetModalValue() {
    this.isLoading = false;
    this.modalForm = {id: 0, monthId: 0, month: '', daily: 0, weekly: 0, prodplan: 0}
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
          weekly_count: this.common.getTotalWeekInMonth(monthNumber, this.year)
        })
      })
      this.temporaryProdplan = temporaryData
      this.getTotalWeeks(this.temporaryProdplan)
      console.log(this.temporaryProdplan);
    } else {
      this.isCreateMode = false
      this.temporaryProdplan = []
      this.totalProdplan = 0
      console.log(this.temporaryProdplan);
      
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

  updateProdplan(id: number, data: any) {
    this.isLoading = true
    this.apiService.updateProdplan(id, data).subscribe({
      next: (res: any) => {
        this.isLoading = false
        this.getProdplanByYearAndLine(this.year, this.lineId)
        this.modalService.dismissAll()
      },
      error: (err) => {
        this.isLoading = false
        this.common.showErrorAlert(Const.ERR_UPDATE_MSG("Prodplan"), err)
      }
    })
  }

}
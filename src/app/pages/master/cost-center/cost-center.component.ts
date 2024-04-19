import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';

@Component({
  selector: 'app-cost-center',
  templateUrl: './cost-center.component.html',
  styleUrls: ['./cost-center.component.scss']
})
export class CostCenterComponent {
  tableColumns = ["#", "Cost Center", "Section", "Line", "Language", "COAR", "COCD", "CCTC", "Valid From", "Valid To", "Action"]

  isLoading = false;
  costCtrData: any[] = []
  lineData: any[] = []

  pageSize = 10;
  currentPage = 1;
  totalPages!: number;
  totalItems = 0;
  breadCrumbItems!: Array<{}>;

  searchTerm = ''
  searchSubject = new Subject<string>()

  form = {
    cost_ctr: '',
    section: '',
    line_id: '',
    language: '',
    coar: '',
    cocd: '',
    cctc: '',
    valid_from: '',
    valid_to: '',
  }
  costCenterId!: number | null

  selectedLine = {
    id: 0,
    name: ''
  }
  countriesData: any[] = []

  constructor(private datePipe: DatePipe, private apiService: restApiService, public common: CommonService, private modalService: NgbModal) {
    this.breadCrumbItems = [
      { label: 'Master', active: false },
      { label: 'Cost Center', active: true }
    ];

    this.searchSubject.pipe(debounceTime(350)).subscribe((term) => {
      this.searchCostCenterWithPagination(term, this.currentPage, this.pageSize)
    })
  }

  async ngOnInit() {
    this.getCountries()
    this.searchCostCenterWithPagination(this.searchTerm, this.currentPage, this.pageSize)
    this.lineData = await this.getFactoryLineData()
    this.selectedLine = { id: this.lineData[0].id, name: this.lineData[0].name }
  }
  async searchCostCenterWithPagination(term: string, page: number, pageSize: number) {
    return new Promise((resolve, reject) => {
      this.apiService.searchCostCenterByPagination(term, page, pageSize).subscribe({
        next: (res: any) => {
          this.costCtrData = res.data
          this.totalItems = res.total_cost_ctr
          resolve(true)
        },
        error: (err) => {
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Cost Center"), err)
          reject(err)
        }
      })
    })
  }

  async getFactoryLineData() {
    return new Promise<any[]>((resolve, reject) => {
      this.isLoading = true
      this.apiService.getFactoryLine().subscribe({
        next: (res: any) => {
          this.isLoading = false
          resolve(res.data)
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Factory Line"), err)
          reject(err)
        }
      })
    })
  }

  getCountries() {
    this.isLoading = true
    this.apiService.getCountries().subscribe({
      next: (res: any) => {
        this.isLoading = false
        this.countriesData = res.data.map((item: any) => {
          return { name: item.name, code: `${item.code}`.toUpperCase(), lang: item.name + ` (${item.code})`.toUpperCase() }
        })
      },
      error: (err) => {
        this.isLoading = false
        this.common.showServerErrorAlert(Const.ERR_GET_MSG("Country"), err)
      }
    })
  }
  
  calculateStartingIndex(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }

  onDateChange(event: any, type: string) {
    const date = event.target.value;
    if (type === 'from') {
      this.form.valid_from = date
    } else if (type === 'to') {
      this.form.valid_to = date
    }
  }

  openModal(template: any, data?: any) {
    if (data) {
      Object.keys(this.form).forEach(key => {
        (this.form as any)[key] = data[key]
      })
      this.costCenterId = data.id
      this.form.valid_from = this.datePipe.transform(data.valid_from, 'yyyy-MM-dd')!
      this.form.valid_to = this.datePipe.transform(data.valid_to, 'yyyy-MM-dd')!
    } else {
      this.form.line_id = this.lineData[0].id
    }
    this.modalService.open(template, { centered: true, size: 'xl' }).result.then(
      (result) => this.resetModalValue(),
      (reason) => this.resetModalValue()
    )
  }

  resetModalValue() {
    Object.keys(this.form).forEach(key => {
      (this.form as any)[key] = '' 
    })
    this.costCenterId = null
  }

  isFormInvalid: boolean = false

  onSaveChanges() {
    const isFormFilled = Object.keys(this.form).every(key => (this.form as any)[key])
    if (isFormFilled) {
      this.isFormInvalid = false
      this.isLoading = true
      if (this.costCenterId) {
        this.apiService.updateCostCenter(this.costCenterId, this.form).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.searchSubject.next(this.searchTerm);
            this.modalService.dismissAll()
          },
          error: (err: any) => {
            this.isLoading = false
            this.common.showServerErrorAlert(Const.ERR_UPDATE_MSG("Cost Center"), err)
          }
        })
      } else {
        this.apiService.insertCostCenter(this.form).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.searchSubject.next(this.searchTerm)
            this.modalService.dismissAll()
          },
          error: (err: any) => {
            this.isLoading = false
            this.common.showServerErrorAlert(Const.ERR_INSERT_MSG("Cost Center"), err)
          }
        })
      }
    } else {
      this.isFormInvalid = true
    }
  }

  onDeleteCostCenter(id: number) {
    this.common.showDeleteWarningAlert().then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true
        this.apiService.updateCostCenter(id, { is_removed: 1 }).subscribe({
          next: (res: any) => {
            this.isLoading = false
            this.searchSubject.next(this.searchTerm)
            this.modalService.dismissAll()
          },
          error: (err) => {
            this.isLoading = false
            this.common.showServerErrorAlert(Const.ERR_DELETE_MSG("Cost Center"), err)
          }
        })
      }
    })
  }

  setCountryCode() {
    setTimeout(() => {
      const language = this.countriesData.find(country => country.code === (this.form.language as any).code)
      this.form.language = language.code
    }, 50)
  }

}

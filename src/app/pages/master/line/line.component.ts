import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss']
})
export class LineComponent {
  tableColumns = ["#", "Line", "Detail", "Action"]
  lineData: any[] = []
  lineId!: number | null

  isLoading = false;
  breadCrumbItems!: Array<{}>

  searchTerm = ''
  searchSubject = new Subject<string>()

  totalItems = 0
  currentPage = 1
  pageSize = 10
  totalPages!: number

  form = {
    name: '',
    detail: ''
  }
  isFormInvalid = false

  constructor(private apiService: restApiService, private modalService: NgbModal, public common: CommonService) {
    this.breadCrumbItems = [
      { label: 'Master', active: false },
      { label: 'Factory Line', active: true }
    ];
    this.searchSubject.pipe(debounceTime(350)).subscribe((term) => {
      this.searchFactoryLineByPagination(term, this.currentPage, this.pageSize)
    })
  }

  ngOnInit() {
    this.searchFactoryLineByPagination(this.searchTerm, this.currentPage, this.pageSize)
  }
  searchFactoryLineByPagination(term: string, currentPage: number, pageSize: number) {
    this.apiService.searchFactoryLineByPagination(term, currentPage, pageSize).subscribe({
      next: (res: any) => {
        this.lineData = res.data
        this.totalItems = res.total_line
      },
      error: (err) => this.common.showServerErrorAlert(Const.ERR_GET_MSG("Line"), err)
    })
  }

  calculateStartingIndex(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }
  
  openModal(template: any, data?: any) {
    if (data) {
      this.lineId = data.id
      this.form = { name: data.name, detail: data.detail }
    }
    this.modalService.open(template, { centered: true }).result.then(
      (result) => this.resetModalValue(),
      (reason) => this.resetModalValue()
    )
  }

  resetModalValue() {
    this.form = { name: '', detail: '' }
    this.lineId = null
    this.isFormInvalid = false
  }

  onDeleteLine(id: number) {
    this.common.showDeleteWarningAlert().then((result) => {
      if (result.isConfirmed) {
        this.apiService.updateFactoryLine(id, { is_removed: 1 }).subscribe({
          next: (res: any) => {
            this.searchSubject.next(this.searchTerm)
            this.modalService.dismissAll()
          },
          error: (err) => {
            this.common.showServerErrorAlert(Const.ERR_DELETE_MSG("Line"), err)
          }
        })
      }
    })
  }

  onSaveChanges() {
    if (this.form.name) {
      this.form.name = `${this.form.name}`.toUpperCase()
      this.isFormInvalid = false;
      if (!this.lineId) {
        this.apiService.insertFactoryLine(this.form).subscribe({
          next: (res: any) => {
            this.searchSubject.next(this.searchTerm)
            this.modalService.dismissAll()
          },
          error: (err) => this.common.showServerErrorAlert(Const.ERR_INSERT_MSG("Line"), err)
        })
      } else {
        this.apiService.updateFactoryLine(this.lineId, this.form).subscribe({
          next: (res: any) => {
            this.searchSubject.next(this.searchTerm)
            this.modalService.dismissAll()
          },
          error: (err) => this.common.showServerErrorAlert(Const.ERR_UPDATE_MSG("Line"), err)
        })
      }
    } else {
      this.isFormInvalid = true;
    }
  }
}

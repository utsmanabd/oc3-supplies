import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';

@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.scss']
})
export class MaterialComponent {
  tableColumns = ['#', 'Material Code', 'Material Description', 'UOM', 'Latest Average Price', 'Action']

  year: number = new Date().getFullYear()

  isLoading = false;
  materialData: any[] = []
  uomData: string[] = []

  pageSize = 10;
  currentPage = 1;
  totalPages!: number;
  totalItems = 0;

  breadCrumbItems!: Array<{}>;

  searchTerm = ''
  searchSubject = new Subject<string>()

  constructor(private apiService: restApiService, public common: CommonService, private modalService: NgbModal) {
    this.breadCrumbItems = [
      { label: 'Master', active: false },
      { label: 'Material Supplies', active: true }
    ];

    this.searchSubject.pipe(debounceTime(350)).subscribe((term) => {
      this.searchMaterialWithPagination(term, this.currentPage, this.pageSize)
    })
  }

  ngOnInit() {
    this.isLoading = true;
    this.getMaterialUOM()
    this.searchMaterialWithPagination(this.searchTerm, this.currentPage, this.pageSize).finally(() => this.isLoading = false)
  }

  // async getMaterialWithPagination(page: number, pageSize: number) {
  //   return new Promise((resolve, reject) => {
  //     this.apiService.getMaterialByPagination(page, pageSize).subscribe({
  //       next: (res: any) => {
  //         this.materialData = res.data
  //         this.totalItems = res.total_material
  //         resolve(true)
  //       },
  //       error: (err) => {
  //         this.common.showServerErrorAlert(Const.ERR_GET_MSG("Material"), err)
  //         reject(err)
  //       }
  //     })
  //   })
  // }

  async searchMaterialWithPagination(term: string, page: number, pageSize: number) {
    return new Promise((resolve, reject) => {
      this.apiService.searchMaterialByPagination(term, page, pageSize).subscribe({
        next: (res: any) => {
          this.materialData = res.data
          this.totalItems = res.total_material
          resolve(true)
        },
        error: (err) => {
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Material"), err)
          reject(err)
        }
      })
    })
  }

  getMaterialUOM() {
    this.isLoading = true
    this.apiService.getMaterialUOM().subscribe({
      next: (res) => {
        this.isLoading = false
        this.uomData = res.data
      },
      error: (err) => {
        this.isLoading = false
        this.common.showServerErrorAlert(Const.ERR_GET_MSG("Material UOM"), err)
      }
    })
  }

  calculateStartingIndex(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }

  getLatestAveragePrice(detailPrice: any[]): number {
    const years = detailPrice.map((item) => item.year)
    const latestYear = Math.max(...years)
    return detailPrice.filter((item) => item.year === latestYear)[0].average_price || 0
  }

  openModal(template: any) {
    this.modalService.open(template, { size: 'lg' })
  }

  onSearch() {
    this.searchSubject.next(this.searchTerm)
  }

  onYearChange(event: any) {
    this.year = +event.target.value
  }

  onButtonChangeYear(action: string) {
    if (action === 'next') {
      this.year++
    }
    if (action === 'prev') {
      this.year--
    }
  }

}

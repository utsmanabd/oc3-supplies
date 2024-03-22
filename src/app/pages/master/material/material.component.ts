import { Component } from '@angular/core';
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

  isLoading = false;
  materialData: any[] = []

  pageSize = 10;
  currentPage = 1;
  totalPages!: number;
  totalItems = 0;

  breadCrumbItems!: Array<{}>;

  constructor(private apiService: restApiService, public common: CommonService) {
    this.breadCrumbItems = [
      { label: 'Master', active: false },
      { label: 'Material Supplies', active: true }
    ];
  }

  ngOnInit() {
    this.isLoading = true;
    this.getMaterialWithPagination(this.currentPage, this.pageSize).finally(() => this.isLoading = false)
  }

  async getMaterialWithPagination(page: number, pageSize: number) {
    return new Promise((resolve, reject) => {
      this.apiService.getMaterialByPagination(page, pageSize).subscribe({
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

  calculateStartingIndex(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }

  getLatestAveragePrice(detailPrice: any[]): number {
    const years = detailPrice.map((item) => item.year)
    const latestYear = Math.max(...years)
    return detailPrice.filter((item) => item.year === latestYear)[0].average_price || 0
  }

}

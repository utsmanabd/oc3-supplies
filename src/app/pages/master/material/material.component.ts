import { HttpErrorResponse } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject, debounceTime } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';
import { GlobalComponent } from 'src/app/global-component';

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

  uploadedFiles: File | null = null;
  materialXlsxLink: string = GlobalComponent.API_URL + `file/xlsx/material-template`
  avgPriceXlsxLink: string = GlobalComponent.API_URL + `file/xlsx/avgprice-template`

  err: {duplicatesMaterial?: any[], notFoundMaterial?: number[], existMaterial?: any[]} = {
    duplicatesMaterial: [],
    notFoundMaterial: [],
    existMaterial: []
  }

  material: any = { material_code: '', material_desc: '', uom: '', average_price: '' }

  activeTabImport = 'Material'

  @ViewChild('importDetailModal') importDetailModal: any

  constructor(private apiService: restApiService, public common: CommonService, private modalService: NgbModal, private router: Router, private route: ActivatedRoute) {
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
    if (!detailPrice || detailPrice.length < 1) {
      return 0
    }
    const years = detailPrice.map((item) => item.year)
    const latestYear = Math.max(...years)
    return detailPrice.filter((item) => item.year === latestYear)[0].average_price || 0
  }

  openModal(template: any) {
    this.modalService.open(template, { size: 'lg', centered: true }).result.then(
      (result) => this.resetModalValue(),
      (reason) => this.resetModalValue()
    )
  }

  resetModalValue() {
    this.isFormInvalid = false
    this.uploadedFiles = null
    Object.keys(this.material).forEach(key => this.material[key] = null)
  }

  onYearChange(event: any) {
    this.year = +event.target.value
  }

  onImportModalNavChange() {
    this.uploadedFiles = null
  }

  onButtonChangeYear(action: string) {
    if (action === 'next') {
      this.year++
    }
    if (action === 'prev') {
      this.year--
    }
  }

  onXLSXFileChange(event: any) {
    this.uploadedFiles = event.target.files[0]
  }
  
  onImportXLSX(type: string) {
    if (this.uploadedFiles) {

      this.isLoading = true
      
      const formData = new FormData();
      formData.append("file", this.uploadedFiles)

      const handleObserver = {
        next: (res: any) => {
          this.isLoading = false
          this.modalService.dismissAll()
          this.common.showSuccessAlert("Data imported successfully")
          this.searchSubject.next("")
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false
          this.modalService.dismissAll()
          let res = err.error.data
          if (err.status === 400) {
            this.common.showCustomAlert(
              "Operation Cancelled", 
              `${res.message}`,
              res.missing_columns || res.message === "Invalid year" ? 'Close' : 'See Details'
            ).then((result) => {
              if (result.value && (!res.missing_columns && res.message !== "Invalid year")) {
                this.err = {
                  duplicatesMaterial: res.duplicates_material || [],
                  notFoundMaterial: res.not_included_material || [],
                  existMaterial: res.exists_material || []
                }
                this.modalService.open(this.importDetailModal, { ariaLabelledBy: 'modal-basic-title', centered: true , scrollable: true})
              }
            })
          } else {
            this.common.showErrorAlert(Const.ERR_INSERT_MSG("Material"), err.statusText)
          }
        }
      }

      if (type === "Material") {
        this.apiService.uploadMaterialXlsx(formData, this.year).subscribe(handleObserver)
      }

      if (type === "AvgPrice") {
        this.apiService.uploadAvgPriceXlsx(formData, this.year).subscribe(handleObserver)
      }
    }
  }

  isFormInvalid = false

  async onSaveChanges() {
    let isFormFilled = Object.keys(this.material).every(key => this.material[key])
    if (isFormFilled && this.year > 0) {
      this.isFormInvalid = false 

      let materialData = {...this.material}
      delete materialData.average_price

      await this.insertMaterial(materialData).then(async(res) => {
        let avgPriceData = {
          material_id: res.data[0],
          year: this.year,
          average_price: this.material.average_price
        }
        await this.insertAveragePrice(avgPriceData).then(() => {
          this.modalService.dismissAll()
          this.searchSubject.next('')
          this.common.showSuccessAlert("Data inserted successfully")
        })
      })

    } else this.isFormInvalid = true

  }

  async insertMaterial(materialData: any) {
    return new Promise<any>((resolve, reject) => {
      this.isLoading = true
      this.apiService.insertMaterial(materialData).subscribe({
        next: (res) => {
          this.isLoading = false
          resolve(res)
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_INSERT_MSG("Material"), err.error.data.message || err.statusText)
          reject(err)
        }
      })
    })
  }

  async insertAveragePrice(avgPriceData: any) {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.insertAveragePrice(avgPriceData).subscribe({
        next: (res) => {
          this.isLoading = false
          resolve(res)
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_INSERT_MSG("Average Price"), err.error.data.message || err.statusText)
          reject(err)
        }
      })
    })
  }

  onDeleteMaterial(data: any) {
    this.common.showDeleteWarningAlert().then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true
        this.apiService.updateMaterial(data.id, { is_removed: 1 }).subscribe({
          next: (res: any) => {
            if (data.detail_price.length > 0) {
              const avgDeleteData: any[] = []
              data.detail_price.forEach((price: any) => {
                avgDeleteData.push({
                  id: price.avg_price_id,
                  data: { is_removed: 1 }
                })
              })
              this.apiService.updateMultipleAvgPrice(avgDeleteData).subscribe({
                next: (res: any) => {
                  this.isLoading = false
                  this.searchSubject.next('')
                },
                error: (err) => {
                  this.isLoading = false
                  this.common.showErrorAlert(Const.ERR_DELETE_MSG("Average Price"), err)
                }
              })
            } else {
              this.isLoading = false
              this.searchSubject.next('')
            }
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false
            this.common.showErrorAlert(Const.ERR_DELETE_MSG("Material"), err.statusText)
          }
        })
      }
    })
  }

}

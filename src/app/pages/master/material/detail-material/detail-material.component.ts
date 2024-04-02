import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';

interface AveragePrice { 
  avg_price_id?: number,
  material_id?: number, 
  year?: number, 
  average_price?: number,
  updated_at?: string,
  is_removed?: number 
}

@Component({
  selector: 'app-detail-material',
  templateUrl: './detail-material.component.html',
  styleUrls: ['./detail-material.component.scss']
})
export class DetailMaterialComponent {
  materialData: any;
  materialDataBefore: any;
  detailPrice: AveragePrice[] = []
  detailPriceBefore: AveragePrice[] = []

  isMaterialEditMode = false;
  isAvgPriceEditMode = false;

  isLoading = false;

  avgData: AveragePrice = {
    material_id: 0,
    year: new Date().getFullYear(),
    average_price: 0,
  }

  isYearExist = false;

  breadCrumbItems!: Array<{}>;

  constructor(
    private route: ActivatedRoute, 
    private apiService: restApiService, 
    public common: CommonService, 
    private modalService: NgbModal,
    private router: Router
    ) {
    this.breadCrumbItems = [
      { label: 'Master', active: false },
      { label: 'Material Supplies', active: false },
      { label: 'Detail', active: true }
    ];
  }

  ngOnInit() {
    this.route.params.subscribe( async params => {
      this.materialData = await this.getDetailMaterial(+params['code'])
      this.materialDataBefore = {...this.materialData}
      this.detailPrice = this.materialData.detail_price.sort((a: any, b: any) => b.year - a.year)
      this.detailPriceBefore = this.detailPrice.map(a => ({...a}))
      if (this.detailPrice.length > 0) {
        this.avgData.year = Math.max(...this.detailPrice.map(item => item.year!)) 
      }
    })
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  async getDetailMaterial(materialCode: number) {
    return new Promise<any>((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getMaterialByCode(materialCode).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log(res.data[0]);
          
          resolve(res.data[0])
        },
        error: (err) => {
          this.isLoading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Material"), err)
          reject(err)
        }
      })
    })
  }

  getLatestAveragePrice(detailPrice: any[]): number {
    if (!detailPrice || detailPrice.length < 1) {
      return 0
    }
    const years = detailPrice.map((item) => item.year)
    const latestYear = Math.max(...years)
    return detailPrice.filter((item) => item.year === latestYear)[0].average_price || 0
  }

  setAveragePricePercentage(avgBefore: number, avgNow: number) {
    if (avgBefore == 0 && avgNow == 0) return 0
    const difference = avgNow - avgBefore
    const percentage = (difference / avgBefore) * 100;
    return avgBefore == 0 ? 0 : percentage
  }

  onMaterialEditModeChange() {
    this.isMaterialEditMode = true
  }

  onAvgPriceEditModeChange() {
    this.isAvgPriceEditMode = true
  }
  
  onYearTypeChange() {
    this.isYearExist = !this.detailPrice.every(item => item.year !== this.avgData.year)
  }

  isFormInvalid = false
  onAddNewAvgPrice() {
    if (this.avgData.average_price! > 0 &&  !this.isYearExist) {
      this.isFormInvalid = false;
      this.avgData.material_id = this.materialData.id
      this.isLoading = true
      this.apiService.insertAveragePrice(this.avgData).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.modalService.dismissAll()
          this.ngOnInit()
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_INSERT_MSG("Average Price"), err.error.data.message || err.statusText)
        }
      })
      
    } else {
      this.isFormInvalid = true
    }
  }

  onUpdateMaterial() {
    const material = {
      material_code: parseInt(this.materialData.material_code) || null,
      material_desc: `${this.materialData.material_desc}` || null,
      uom: `${this.materialData.uom}`.toUpperCase() || null
    }
    if (Object.keys(material).every(key => this.materialData[key])) {
      this.materialData.uom = `${this.materialData.uom}`.toUpperCase()
      this.isLoading = true
      this.apiService.updateMaterial(this.materialData.id, material).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.router.navigateByUrl(`master/material/${material.material_code}`).then(() => {
            this.isMaterialEditMode = false;
          })
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_UPDATE_MSG("Material"), err.error.data.message || err.statusText)
        }
      })
    }
  }

  onDeleteAvgPrice(id: number) {
    const index = this.common.getIndexById(this.detailPrice, id, 'avg_price_id')
    this.detailPrice[index].is_removed = 1
  }

  onUpdateAvgPrice() {
    const avgPriceData: any[] = [];
    let form = this.detailPrice.filter((item, index) => {
      let result = false;
      for (let element in item) {
        if ((this.detailPrice as any)[index][element] !== (this.detailPriceBefore as any)[index][element]) {
          result = true;
        }
      }
      return result
    })

    if (form.length > 0) {
      form.forEach((item, index) => {
        avgPriceData.push({
          id: item.avg_price_id,
          data: { ...item }
        })
        Object.keys(avgPriceData[index].data).forEach(key => {
          delete avgPriceData[index].data['updated_at']
          delete avgPriceData[index].data['avg_price_id']
          if (avgPriceData[index].data[key] === undefined) {
            delete avgPriceData[index].data[key]
          }
        })
      })

      console.log(avgPriceData);
      
      
      this.isLoading = true
      this.apiService.updateMultipleAvgPrice(avgPriceData).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.ngOnInit();
          this.isAvgPriceEditMode = false;
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_UPDATE_MSG("Average Price"), err)
        }
      })
    }
    
  }

  onCancelUpdateMaterial() {
    this.materialData = {...this.materialDataBefore}
    this.isMaterialEditMode = false
  }

  onCancelUpdateAvgPrice() {
    this.detailPrice = this.detailPriceBefore.map(a => ({...a}))
    this.isAvgPriceEditMode = false
  }

  openModal(template: any) {
    while (!this.detailPrice.every(item => item.year !== this.avgData.year)) {
      this.avgData.year!++
    }
    this.modalService.open(template)
  }

  updateMultipleAvgPrice(data: any) {
    this.isLoading = true;
    
  }
}

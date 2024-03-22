import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';

@Component({
  selector: 'app-detail-material',
  templateUrl: './detail-material.component.html',
  styleUrls: ['./detail-material.component.scss']
})
export class DetailMaterialComponent {
  materialData: any;

  dd = [
    {year: 2024, avg_price_id: 875, average_price: 49735.56}, 
    {year: 2025, avg_price_id: 3123, average_price: 52938.43}, 
    {year: 2026, avg_price_id: 233, average_price: 50992.34}, 
    {year: 2027, avg_price_id: 1773, average_price: 54239.56},
    {year: 2028, avg_price_id: 1723, average_price: 50029.56},
    {year: 2029, avg_price_id: 1793, average_price: 50239.56},
    {year: 2030, avg_price_id: 1273, average_price: 56239.56},
  ]

  constructor(private route: ActivatedRoute, private apiService: restApiService, public common: CommonService) {}

  ngOnInit() {
    this.dd.sort((a, b) => b.year - a.year)
    this.route.params.subscribe( async params => {
      console.log(params['code']);
      await this.getDetailMaterial(+params['code']).then(data => {
        this.materialData = data[0]
        this.materialData.detail_price.sort((a: any, b: any) => b.year - a.year)
      })
      console.log(this.materialData);
      
    })
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  async getDetailMaterial(materialCode: number) {
    return new Promise<any[]>((resolve, reject) => {
      this.apiService.getMaterialByCode(materialCode).subscribe({
        next: (res: any) => resolve(res.data),
        error: (err) => {
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Material"), err)
          reject(err)
        }
      })
    })
  }

  getLatestAveragePrice(detailPrice: any[]): number {
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
}

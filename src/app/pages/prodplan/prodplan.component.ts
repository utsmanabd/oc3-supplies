import { Component } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';

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

  prodplanData: any[] = []
  totalProdplan!: number

  private clickSubject = new Subject()

  constructor(private apiService: restApiService, public common: CommonService) {
    this.breadCrumbItems = [
      { label: 'Prodplan', active: true }
    ];
    this.clickSubject.pipe(debounceTime(350)).subscribe(() => {
      this.apiService.resetCachedData("prodplanYear")
      this.getProdplanByYear(this.year)
    })
  }

  async ngOnInit() {
    this.year = new Date().getFullYear()
    await this.getProdplanByYear(this.year)
    
  }

  async getProdplanByYear(year: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getProdplanByYear(year).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.prodplanData = res.data;
          this.prodplanData.forEach(item => {
            item.prodplan = +item.prodplan;
          })
          resolve(true)
        },
        error: (err) => {
          reject(err)
          this.isLoading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Prodplan"), err)
        },
        complete: () => {
          this.totalProdplan = this.common.sumElementFromArray(this.prodplanData, "prodplan")
          
        }
      })
    })
  }

  onButtonChangeYear(action: string) {
    if (action === "next") this.year += 1
    if (action === "prev") this.year -= 1
    this.clickSubject.next(this.year)
  }

  onYearChange(event: any) {
    if (event.target.value) {
      this.clickSubject.next(this.year)
    }
  }

}

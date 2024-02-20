import { Component, HostListener } from '@angular/core';
import { delay } from 'rxjs';
import { restApiService } from 'src/app/core/services/rest-api.service';

@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.scss']
})
export class MaterialComponent {
  data: any[] = [];
  page = 1;
  pageSize = 25;

  isEndScrolling = false;
  isLoading = false;

  constructor(private apiService: restApiService) { }

  async ngOnInit() {
    console.log("on init page: " + this.page);
    await this.loadData().then((resolve) => this.page++)
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    if (!this.isEndScrolling && (window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      this.loadData().then((resolve) => this.page++)
    }
  }

  async loadData() {
    return new Promise((resolve, reject) => {
      console.log("page: " + this.page);
    
      console.log("Scrolling...");
      console.log("Length: ", this.data.length);
      
      this.isLoading = true;
      this.apiService.getMaterialByPagination(this.page, this.pageSize).pipe(delay(1000)).subscribe({
        next: (res: any) => {
          console.log(res);
          
          this.isLoading = false;
          if (res.data.length > 0) {
            this.data = [...this.data, ...res.data];
          } else {
            this.isEndScrolling = true;
            console.log("End of page");
          }

          resolve(true)
        },
        error: (err) => {
          this.isLoading = false;
          this.isEndScrolling = true;
          reject(err)
        }
      });
    })
    
  }
}

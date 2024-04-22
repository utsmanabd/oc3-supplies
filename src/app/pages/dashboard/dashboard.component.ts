import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { ChartType } from './dashboard.model';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Subject, debounceTime } from 'rxjs';
import { Const } from 'src/app/core/static/const';
import { Router } from '@angular/router';

interface DashboardChart {
  rawData?: any[];
  series?: any[];
  categories?: any[];
}

interface ProdplanData {
  plan?: number;
  actual?: number;
  month?: number;
  budgetPlan?: number;
  budgetActual?: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  emptyChartData = () => { return { rawData: [], series: [], categories: [] } as DashboardChart }

  prodplanData: ProdplanData[] = []

  factoryLineBudgetColumnChart!: ChartType;
  factoryLineBudgetData = this.emptyChartData()
  factoryLineActualData = this.emptyChartData()

  sectionBudgetBarChart!: ChartType;
  sectionBudgetData = this.emptyChartData()
  sectionActualData = this.emptyChartData()
  sectionBudgetBefore: any[] = []
  sectionActualBefore: any[] = []

  lineMonthColumnChart!: ChartType;
  lineMonthBudgetData = this.emptyChartData()
  lineMonthActualData = this.emptyChartData()

  totalLineBudgetDonutChart!: ChartType;
  totalLineBudgetData = this.emptyChartData()
  totalLineActualData = this.emptyChartData()
  
  supplyBudgetTreemapChart!: ChartType;
  supplyBudgetData = this.emptyChartData()
  supplyActualData = this.emptyChartData()
  
  sectionBudgetMonthHeatmapChart!: ChartType;
  sectionBudgetMonthHeatmapData = this.emptyChartData()
  sectionActualMonthHeatmapData = this.emptyChartData()

  sectionBudgetMonthColumnChart!: ChartType
  sectionBudgetMonthColumnData = this.emptyChartData()
  sectionActualMonthColumnData = this.emptyChartData()
  
  sectionSupplyTreemapChart!: ChartType;
  sectionSupplyBudgetData = this.emptyChartData()
  sectionSupplyActualData = this.emptyChartData()
  

  lineFiveBiggestSupply: any[] = []
  lineFiveBiggestBudget: any[] = []
  lineFiveBiggestActual: any[] = []

  sectionFiveBiggestSupply: any[] = []
  sectionFiveBiggestBudget: any[] = []
  sectionFiveBiggestActual: any[] = []

  tabData = [{id: 1, name: 'Budget'}, {id: 2, name: 'Actual'}]
  isTabOpen = { budget: true, actual: false }
  activeTab = 1

  yearSubject = new Subject<number>()

  isLoading = false;

  lineData: any[] = []
  selectedLine = { id: 0, name: '' }

  sectionData: any[] = []
  selectedSection = { id: 0, name: '' }

  year: number
  costCenterId: number = 0

  totalFactoryBudget: number = 0;
  totalFactoryActual: number = 0;

  isBudgetNotEmpty: boolean = false
  showTreemapLabels = false

  months: any[] = []
  selectedMonth = {
    number: -1,
    name: 'All Month'
  }

  @ViewChild("line") line!: ElementRef
  @ViewChild("section") section!: ElementRef

  constructor(public common: CommonService, private apiService: restApiService, private router: Router, private ngZone: NgZone) {
    this.year = new Date().getFullYear()
    this.yearSubject.pipe(debounceTime(350)).subscribe(year => {
      this.ngOnInit()
    })
  }

  async ngOnInit() {
    this.months = [{ number: -1, name: 'All Month'}]
    await this.getBudgetPerLine(this.year)
    await this.getActualPerLine(this.year)
    await this.getBudgetPerSectionAndMonth(this.year, this.selectedLine.id)
    await this.getActualPerSectionAndMonth(this.year, this.selectedLine.id)
    // await this.getBudgetPerSection(this.year, this.selectedLine.id)
    // await this.getActualPerSection(this.year, this.selectedLine.id)
    await this.getBudgetPerSupply(this.year, this.selectedLine.id).then(() => {
      this.showTreemapLabels = true;
      this.lineFiveBiggestSupply = this.lineFiveBiggestBudget
      this.sectionFiveBiggestSupply = this.sectionFiveBiggestBudget
    })
    await this.getActualPerSupply(this.year, this.selectedLine.id)
    await this.getProdplanByLine(this.year, this.selectedLine.id)
    await this.getActualProdplanByLine(this.year, this.selectedLine.id)
    this._factoryLineBudgetColumnChart('["--vz-primary", "--vz-success"]');
    this._sectionBudgetBarChart('["--vz-primary", "--vz-info"]');
    this._lineBudgetMonthColumnChart('["--vz-primary", "--vz-success"]')
    this._totalLineBudgetDonutChart('["--vz-success", "--vz-primary", "--vz-info", "--vz-success-rgb, 0.60", "--vz-primary-rgb, 0.45", "--vz-info-rgb, 0.30"]');
    this._supplyBudgetTreemapChart('["--vz-primary"]');
    this._sectionBudgetMonthHeatmapChart('["--vz-success", "--vz-card-bg-custom"]');
    this._sectionBudgetMonthColumnChart('["--vz-primary", "--vz-success"]');
    this._sectionSupplyTreemapChart('["--vz-primary"]')
  }

  async getBudgetPerLine(year: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getBudgetPerLine(year).subscribe({
        next: (res: any) => {
          let data: any[] = res.data
          if (data.length > 0) {
            this.factoryLineBudgetData = {
              rawData: data,
              categories: [...data].map(item => item.line),
              series: [...data].map(item => item.price)
            }
            this.totalFactoryBudget = this.common.sumElementFromArray([...data], 'price')
  
            this.lineData = [...data].map(item => { return { lineId: item.line_id, line: item.line } })
            this.selectedLine = {
              id: this.lineData[0].lineId,
              name: this.lineData[0].line
            }

            this.isBudgetNotEmpty = true
            resolve(true)
          } else this.isBudgetNotEmpty = false
          
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Budget Per Line"), err)
          reject(err)
        },
        complete: () => {
          this.isLoading = false;
        }
      })
    })
  }

  async getActualPerLine(year: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true
      this.apiService.getActualPerLine(year).subscribe({
        next: (res: any) => {
          let data: any[] = res.data;

          this.transformBudgetActual(this.factoryLineBudgetData.rawData!, data, 'line_id')
          this.factoryLineBudgetData.rawData?.sort((a, b) => a.line_id - b.line_id)
          data.sort((a, b) => a.line_id - b.line_id)

          this.factoryLineActualData = {
            rawData: data,
            categories: [...data].map(item => item.line),
            series: [...data].map(item => item.price)
          }

          this.totalFactoryActual = data.length > 0 ? this.common.sumElementFromArray([...data], 'price') : 0
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Actual Per Line"), err)
          reject(err)
        },
        complete: () => {
          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  async getBudgetPerSupply(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getBudgetPerSupply(year, lineId).subscribe({
        next: (res: any) => {
          let data: any[] = res.data.sort((a: any, b: any) => b.price - a.price)
          this.lineFiveBiggestBudget = [...data].slice(0, 5)

          this.supplyBudgetData = {
            rawData: data,
            series: [...data].map(item => ({ x: item.material_desc, y: item.price }))
          }

          const filteredSectionSupply = [...data].filter(item => item.section == this.selectedSection.name)
          this.sectionSupplyBudgetData = {
            rawData: filteredSectionSupply,
            series: [...filteredSectionSupply].map(item => ({x: item.material_desc, y: item.price}))
          }
          this.sectionFiveBiggestBudget = [...filteredSectionSupply].slice(0, 5)
          
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Budget Per Supply"), err)
          reject(err)
        },
        complete: () => {
          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  async getActualPerSupply(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getActualPerSupply(year, lineId).subscribe({
        next: (res: any) => {
          let data: any[] = res.data.sort((a: any, b: any) => b.price - a.price)
          this.lineFiveBiggestActual = [...data].slice(0, 5)

          this.supplyActualData = {
            rawData: data,
            series: [...data].map(item => ({ x: item.material_desc, y: item.price }))
          }

          const filteredSectionSupply = [...data].filter(item => item.section == this.selectedSection.name)
          this.sectionSupplyActualData = {
            rawData: filteredSectionSupply,
            series: [...filteredSectionSupply].map(item => ({x: item.material_desc, y: item.price}))
          }
          this.sectionFiveBiggestActual = [...filteredSectionSupply].slice(0, 5)
          
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Actual Per Supply"), err)
          reject(err)
        },
        complete: () => {
          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  async getBudgetPerSectionAndMonth(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getBudgetPerSectionAndMonth(year, lineId).subscribe({
        next: (res: any) => {
          let data: any[] = res.data

          const allMonthsData = Array.from(
            [...data].reduce((acc, { cost_ctr_id, section, price }) => {
                const existingItem = acc.get(cost_ctr_id);
                if (existingItem) {
                    existingItem.price += price;
                } else {
                    acc.set(cost_ctr_id, { cost_ctr_id, section, price });
                }
                return acc;
            }, new Map()),
            ([, value]) => value
          );

          // sectionBudgetData init
          this.sectionBudgetData = {
            rawData: allMonthsData,
            categories: [...allMonthsData].map(item => item.section),
            series: [...allMonthsData].map(item => item.price)
          }

          this.sectionBudgetBefore = [...this.sectionBudgetData.series!].map(price => price)

          data.forEach((item) => item.id = +`${item.month}${item.cost_ctr_id}`)
          
          // sectionBudgetMonthHeatmapData init
          this.sectionBudgetMonthHeatmapData = {
            rawData: [...data],
            series: this.transformHeatmapSeries([...data])
          }

          const lineMonthBudgetData = Object.values([...data].reduce((acc, { month, price }) => {
            acc[month] = (acc[month] || 0) + price;
            return acc;
          }, {})).map((price, index) => ({ month: index + 1, price }));

          // lineMonthBudgetData init
          this.lineMonthBudgetData = {
            rawData: lineMonthBudgetData,
            series: [...lineMonthBudgetData].map(item => item.price),
            categories: [...lineMonthBudgetData].map(item => this.common.getSimpleMonthName(item.month))
          }

        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Budget Per Section and Month"), err)
          reject(err)
        },
        complete: () => {
          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  async getActualPerSectionAndMonth(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getActualPerSectionAndMonth(year, lineId).subscribe({
        next: (res: any) => {
          let data: any[] = res.data

          const allMonthsData = Array.from(
            [...data].reduce((acc, { cost_ctr_id, section, price }) => {
                const existingItem = acc.get(cost_ctr_id);
                if (existingItem) {
                    existingItem.price += price;
                } else {
                    acc.set(cost_ctr_id, { cost_ctr_id, section, price });
                }
                return acc;
            }, new Map()),
            ([, value]) => value
          );
          
          // Merging section actual and budget
          this.transformBudgetActual(this.sectionBudgetData.rawData!, allMonthsData, "cost_ctr_id")

          this.sectionBudgetData.rawData?.sort((a, b) => a.cost_ctr_id - b.cost_ctr_id);
          this.sectionBudgetData.series = [...this.sectionBudgetData.rawData!].map(item => item.price)
          this.sectionBudgetData.categories = [...this.sectionBudgetData.rawData!].map(item => item.section)

          allMonthsData.sort((a, b) => a.cost_ctr_id - b.cost_ctr_id);

          // sectionData init
          this.sectionData = [...allMonthsData].map(item => { return { sectionId: item.cost_ctr_id, section: item.section } }).sort((a, b) => a.sectionId - b.sectionId)
          this.selectedSection = {
            id: this.sectionData[0].sectionId,
            name: this.sectionData[0].section
          }

          // sectionActualData init
          this.sectionActualData = {
            rawData: allMonthsData,
            categories: [...allMonthsData].map(item => item.section),
            series: [...allMonthsData].map(item => item.price)
          }
          this.sectionActualBefore = [...this.sectionActualData.series!].map(price => price)

          data.forEach((item) => item.id = +`${item.month}${item.cost_ctr_id}`)

          // Merging heatmap actual and budget data
          this.transformBudgetActual(this.sectionBudgetMonthHeatmapData.rawData!, data, 'id')
          
          this.sectionBudgetMonthHeatmapData.rawData?.sort((a, b) => a.cost_ctr_id - b.cost_ctr_id);
          data.sort((a, b) => a.cost_ctr_id - b.cost_ctr_id);

          this.sectionBudgetMonthHeatmapData.series = this.transformHeatmapSeries([...this.sectionBudgetMonthHeatmapData.rawData!])

          // sectionActualMonthHeatmapData init
          this.sectionActualMonthHeatmapData = {
            rawData: data,
            series: this.transformHeatmapSeries([...data])
          }
          
          const sectionMonthBudgetData = [...this.sectionBudgetMonthHeatmapData.rawData!].filter(item => item.cost_ctr_id === this.selectedSection.id)

          // sectionBudgetMonthColumnData init
          this.sectionBudgetMonthColumnData = {
            rawData: sectionMonthBudgetData,
            series: [...sectionMonthBudgetData].map(item => item.price),
            categories: [...sectionMonthBudgetData].map(item => this.common.getSimpleMonthName(item.month))
          }

          const months = [...sectionMonthBudgetData].map(item => ({ number: +item.month, name: this.common.getMonthName(+item.month)}))
          this.selectedMonth = this.months[0]
          this.months.splice(1)
          months.forEach(month => this.months.push(month))

          let sectionMonthActualData = [...data].filter(item => item.cost_ctr_id === this.selectedSection.id)

          // Merging section month column actual and budget
          this.transformBudgetActual(this.sectionBudgetMonthColumnData.rawData!, sectionMonthActualData, 'month')

          // sectionActualMonthColumnData init
          this.sectionActualMonthColumnData = {
            rawData: sectionMonthActualData.sort((a, b) => a.month - b.month),
            series: [...sectionMonthActualData].map(item => item.price),
            categories: [...sectionMonthActualData].map(item => this.common.getSimpleMonthName(item.month))
          }

          const lineMonthActualData = Object.values([...data].reduce((acc, { month, price }) => {
            acc[month] = (acc[month] || 0) + price;
            return acc;
          }, {})).map((price, index) => ({ month: index + 1, price }));

          // lineMonthActualData init
          this.lineMonthActualData = {
            rawData: lineMonthActualData,
            series: [...lineMonthActualData].map(item => item.price),
            categories: [...lineMonthActualData].map(item => this.common.getSimpleMonthName(item.month))
          }
          
        },
        error: (err) => {
          this.isLoading = false
          this.common.showErrorAlert(Const.ERR_GET_MSG("Actual Per Section and Month"), err)
          reject(err)
        },
        complete: () => {
          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  async getProdplanByLine(year: number, line: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.resetCachedData("prodplanYearLine")
      this.apiService.getProdplanByYearAndLine(year, line).subscribe({
        next: (res: any) => {
          let data: any[] = res.data

          const planActualMonth = [...this.lineMonthBudgetData.rawData!].map(plan => ({
            month: parseInt(plan.month),
            budgetPlan: parseInt(plan.price) || 0,
            budgetActual: parseInt(([...this.lineMonthActualData.rawData!].find(act => act.month === plan.month)).price) || 0
          }))
          
          this.prodplanData.splice(0)
          data.forEach((item) => {
            this.prodplanData.push({
              actual: 0,
              plan: item.prodplan,
              month: item.month,
              budgetPlan: (planActualMonth.find(plan => plan.month === item.month))?.budgetPlan,
              budgetActual: (planActualMonth.find(actual => actual.month === item.month))?.budgetActual
            })
          })
        },
        error: (err) => {
          this.isLoading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Prodplan"), err)
          reject(err);
        },
        complete: () => {
          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  async getActualProdplanByLine(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getActualProdplanByLine(year, lineId).subscribe({
        next: (res: any) => {
          let data: any[] = res.data
          data.forEach(item => {
            const index = this.prodplanData.findIndex(obj => obj.month === item.month)
            if (index !== -1) {
              this.prodplanData[index].actual = item.prodplan
            }
          })
        },
        error: (err) => {
          this.isLoading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Actual Prodplan"), err)
          reject(err);
        },
        complete: () => {
          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  transformBudgetActual(budgetArr: any[], actualArr: any[], key: string) {
    let budgetData: any = {}
    let actualData: any = {}

    budgetArr.forEach(obj => budgetData[obj[key]] = obj)
    actualArr.forEach(obj => actualData[obj[key]] = obj)
    
    // Transform Budget
    Object.keys(actualData).forEach(id => {
      if (!budgetData[id]) budgetArr.push({...actualData[id], price: 0})
    })

    // Transform Actual
    Object.keys(budgetData).forEach(id => {
      if (!actualData[id]) actualArr.push({...budgetData[id], price: 0})
    })
  }

  transformHeatmapSeries(rawData: any[]): any[] {
    const transformedData = rawData.reduce((acc: any[], curr: any) => {
      const existingSection = acc.find((item: any) => item.name === curr.section);
      if (existingSection) {
        existingSection.data.push({x: curr.month, y: curr.price});
      } else {
        acc.push({name: curr.section, data: [{x: curr.month, y: curr.price}]});
      }
      return acc;
    }, [])
    
    transformedData.forEach(section => {
      const existingMonths = section.data.map((item: any) => item.x);
      for (let i = 1; i <= 12; i++) {
        if (!existingMonths.includes(i)) {
          section.data.push({x: i, y: 0});
        }
      }
      section.data.sort((a: any, b: any) => a.x - b.x);
      section.data.forEach((item: any) => item.x = this.common.getSimpleMonthName(item.x))
    })

    return transformedData;
  }

  
  onLineMonthChange(month: any) {
    this.selectedMonth = { number: month.number, name: month.name }
    if (this.selectedMonth.number !== -1) {
      this.sectionBudgetData.series = [...this.sectionBudgetMonthHeatmapData.rawData!].filter(item => item.month === this.selectedMonth.number).map(i => i.price)
      this.sectionActualData.series = [...this.sectionActualMonthHeatmapData.rawData!].filter(item => item.month === this.selectedMonth.number).map(i => i.price)
    } else {
      this.sectionBudgetData.series = [...this.sectionBudgetBefore]
      this.sectionActualData.series = [...this.sectionActualBefore]
    }
    
    this.setSectionBudgetChartValue()
  }

  onFactoryLineChange(event$: any) {
    const lineData = JSON.parse(event$.target.id)
    const lineId = lineData.lineId
    this.changeFactoryLine(lineId)
  }

  async changeFactoryLine(lineId: number) {
    const index = this.common.getIndexById(this.lineData, lineId, "lineId")
    this.selectedLine = { id: lineId, name: this.lineData[index].line }
    await this.getBudgetPerSupply(this.year, lineId).then(() => {
      if (this.isTabOpen.budget) {
        this.lineFiveBiggestSupply = this.lineFiveBiggestBudget
        this.sectionFiveBiggestSupply = this.sectionFiveBiggestBudget
        this.setSupplyBudgetChartValue()
      }
    })
    await this.getActualPerSupply(this.year, lineId).then(() => {
      if (this.isTabOpen.actual) {
        this.lineFiveBiggestSupply = this.lineFiveBiggestActual
        this.sectionFiveBiggestSupply = this.sectionFiveBiggestActual
        this.setSupplyBudgetChartValue(true)
      }
    })
    await this.getBudgetPerSectionAndMonth(this.year, lineId)
    await this.getActualPerSectionAndMonth(this.year, lineId).then(() => {
      this.setSupplyBudgetMonthChartValue(this.isTabOpen.actual)
      this.setBudgetMonthSectionChartValue()
      this.setLineMonthChartValue()

      this.setSectionBudgetChartValue()
      this.setTotaLineBudgetChartValue(this.isTabOpen.actual)
    })
    await this.getProdplanByLine(this.year, lineId)
    await this.getActualProdplanByLine(this.year, lineId)
    
    this.onSectionChange(this.sectionData[0])
  }

  setLineMonthChartValue() {
    this.lineMonthColumnChart.series = [
      { name: 'Budget', data: this.lineMonthBudgetData.series },
      { name: 'Actual', data: this.lineMonthActualData.series }
    ]
    this.lineMonthColumnChart.xaxis = { categories: this.lineMonthBudgetData.categories }
  }

  setSectionBudgetChartValue() {
    this.sectionBudgetBarChart.series = [
      { name: 'Budget', data: this.sectionBudgetData.series },
      { name: 'Actual', data: this.sectionActualData.series },
    ]
    this.sectionBudgetBarChart.xaxis = {
      categories: this.sectionActualData.categories,
      labels: {
        show: true,
        formatter: (val: any) => this.common.formatBigNumber(+val)
      }
    }
  }

  setTotaLineBudgetChartValue(isActual = false) {
    this.totalLineBudgetDonutChart.series = isActual ? this.sectionActualBefore : this.sectionBudgetBefore
    this.totalLineBudgetDonutChart.labels = isActual ? this.sectionActualData.categories : this.sectionBudgetData.categories
  }

  setSupplyBudgetChartValue(isActual = false) {
    this.supplyBudgetTreemapChart.series = [{ data: isActual ? this.supplyActualData.series : this.supplyBudgetData.series }]
    this.supplyBudgetTreemapChart.tooltip = {
      x: {
        show: true,
        formatter: (val: any, opt: any) => {
          const data = isActual ? this.supplyActualData.rawData! : this.supplyBudgetData.rawData!
          return `${data[opt.dataPointIndex].section}`
        }
      },
      y: {
        formatter: (val: any, opt: any) => this.common.getRupiahFormat(+val)
      },
    }
  }

  setSupplyBudgetMonthChartValue(isActual = false) {
    this.sectionBudgetMonthHeatmapChart.series = isActual ? this.sectionActualMonthHeatmapData.series : this.sectionBudgetMonthHeatmapData.series
  }

  setBudgetMonthSectionChartValue() {
    this.sectionBudgetMonthColumnChart.series = [
      { name: 'Budget', data: this.sectionBudgetMonthColumnData.series },
      { name: 'Actual', data: this.sectionActualMonthColumnData.series }
    ]
    this.sectionBudgetMonthColumnChart.xaxis = { categories: this.sectionBudgetMonthColumnData.categories }
  }

  setSectionSupplyChartValue(isActual = false) {
    this.sectionSupplyTreemapChart.series = [{ data: isActual ? this.sectionSupplyActualData.series : this.sectionSupplyBudgetData.series }]
    this.sectionSupplyTreemapChart.tooltip = {
      x: {
        show: true,
        formatter: (val: any, opt: any) => {
          return `${this.selectedSection.name}`
        }
      },
      y: {
        formatter: (val: any, opt: any) => this.common.getRupiahFormat(+val)
      },
    }
  }

  setProdplanPercentage(plan: number, actual: number) {
    const difference = actual - plan
    const percentage = (difference / plan) * 100;
    return (plan && actual) == 0 ? 0 : percentage
  }

  onSectionChange(sectionData: any) {
    this.selectedSection = { name: sectionData.section, id: sectionData.sectionId }
    const budgetData = [...this.sectionBudgetMonthHeatmapData.rawData!].filter(item => item.cost_ctr_id === sectionData.sectionId)
    const actualData = [...this.sectionActualMonthHeatmapData.rawData!].filter(item => item.cost_ctr_id === sectionData.sectionId)

    this.sectionBudgetMonthColumnData = {
      rawData: budgetData,
      series: [...budgetData].map(item => item.price),
      categories: [...budgetData].map(item => this.common.getSimpleMonthName(item.month))
    }
    this.sectionActualMonthColumnData = {
      rawData: actualData,
      series: [...actualData].map(item => item.price),
      categories: [...budgetData].map(item => this.common.getSimpleMonthName(item.month))
    }

    this.sectionFiveBiggestActual = [...this.supplyActualData.rawData!]
      .filter(item => item.section === sectionData.section)
      .slice(0, 5)
    this.sectionFiveBiggestBudget = [...this.supplyBudgetData.rawData!]
      .filter(item => item.section === sectionData.section)
      .slice(0, 5)
    this.sectionFiveBiggestSupply = this.isTabOpen.budget ? this.sectionFiveBiggestBudget : this.sectionFiveBiggestActual
    this.setBudgetMonthSectionChartValue()
    
    const filteredSectionActual = [...this.supplyActualData.rawData!].filter(item => item.section == sectionData.section)
    const filteredSectionBudget = [...this.supplyBudgetData.rawData!].filter(item => item.section == sectionData.section)
    this.sectionSupplyActualData = {
      rawData: filteredSectionActual,
      series: [...filteredSectionActual].map(item => ({x: item.material_desc, y: item.price}))
    }
    this.sectionSupplyBudgetData = {
      rawData: filteredSectionBudget,
      series: [...filteredSectionBudget].map(item => ({x: item.material_desc, y: item.price}))
    }

    setTimeout(() => {
      this.setSectionSupplyChartValue(this.isTabOpen.actual)
    }, 300)
    
  }

  onTreemapShowLabels(event: any) {
    this.showTreemapLabels = !this.showTreemapLabels ? true : false 
    this.isLoading = true
    setTimeout(() => {
      this.supplyBudgetTreemapChart.dataLabels = { enabled: event.target.checked }
      this.sectionSupplyTreemapChart.dataLabels = { enabled: event.target.checked }
      this.isLoading = false;
    }, 50)
  }

  private getChartColorsArray(colors: any) {
    colors = JSON.parse(colors);
    return colors.map(function (value: any) {
      var newValue = value.replace(" ", "");
      if (newValue.indexOf(",") === -1) {
        var color = getComputedStyle(document.documentElement).getPropertyValue(newValue);
        if (color) {
          color = color.replace(" ", "");
          return color;
        }
        else return newValue;;
      } else {
        var val = value.split(',');
        if (val.length == 2) {
          var rgbaColor = getComputedStyle(document.documentElement).getPropertyValue(val[0]);
          rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
          return rgbaColor;
        } else {
          return newValue;
        }
      }
    });
  }

  onButtonChangeYear(action: string) {
    switch (action) {
      case "prev":
        this.year--;
        break;
      case "next":
        this.year++;
        break;
      default:
        break;
    }
    this.yearSubject.next(this.year)
  }

  onYearChange(event: any) {
    if (event.target.value) this.yearSubject.next(this.year)
  }

  onBudgetActualDropdownChange(mode: string) {
    const event = { target: { name: JSON.stringify({id: mode == 'Budget' ? 1 : 2, name: mode}) } }
    this.onBudgetActualTabChange(event)
  }

  onBudgetActualTabChange(event: any) {
    const tab = JSON.parse(event.target.name)
    
    if (!this.isTabOpen.actual && tab.name === 'Actual') {
      this.lineFiveBiggestSupply = this.lineFiveBiggestActual
      this.sectionFiveBiggestSupply = this.sectionFiveBiggestActual
      this.setTotaLineBudgetChartValue(true)
      this.setSupplyBudgetChartValue(true)
      this.setSupplyBudgetMonthChartValue(true)
      this.setSectionSupplyChartValue(true)
      this.isTabOpen = {actual: true, budget: false}
      this.activeTab = 2
    } 
    else if (!this.isTabOpen.budget && tab.name === 'Budget') {
      this.lineFiveBiggestSupply = this.lineFiveBiggestBudget
      this.sectionFiveBiggestSupply = this.sectionFiveBiggestBudget
      this.setTotaLineBudgetChartValue()
      this.setSupplyBudgetChartValue()
      this.setSupplyBudgetMonthChartValue()
      this.setSectionSupplyChartValue()
      this.isTabOpen = {actual: false, budget: true}
      this.activeTab = 1
    }
    
  }

  private _factoryLineBudgetColumnChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.factoryLineBudgetColumnChart = {
      series: [{
        name: "Budget",
        data: this.factoryLineBudgetData.series,
      },
      {
        name: "Actual",
        data: this.factoryLineActualData.series,
      }
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false,
        },
        events: {
          click: (event: any, context: any, config: any) => {
            const index = config.dataPointIndex
            if (this.factoryLineBudgetData.rawData && index !== -1) {
              const lineId = this.factoryLineBudgetData.rawData[index].line_id
              this.changeFactoryLine(lineId)
              this.line.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
              setTimeout(() => {
                const currentPos = window.scrollY || window.pageYOffset
                this.isLoading = false
                window.scrollTo({top: currentPos - 65, behavior: 'auto'})
              }, 750)
            }
            
          }
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
          dataLabels: {
            position: 'top'
          }
        },
      },
      dataLabels: {
        enabled: true,
        textAnchor: 'middle',
        offsetY: -20,
        style: {
          fontSize: "10px",
          colors: ["#000"],
        },
        formatter: (val: any) => this.common.formatBigNumber(+val)
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      colors: colors,
      xaxis: {
        categories: this.factoryLineBudgetData.categories,
        labels: {
          style: {
            fontWeight: "bold",
          }
        }
      },
      yaxis: {
        title: {
          text: "Rp (Rupiah)",
        },
        labels: {
          show: true,
          formatter: (val: any) => this.common.formatBigNumber(+val)
        }
      },
      grid: {
        borderColor: "#f1f1f1",
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (val: any) => this.common.getRupiahFormat(+val)
        },
      },
    };
  }

  private _sectionBudgetBarChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.sectionBudgetBarChart = {
      series: [
        {
          name: 'Budget',
          data: this.sectionBudgetData.series
        },
        {
          name: 'Actual',
          data: this.sectionActualData.series,
        },
      ],
      chart: {
        type: "bar",
        height: 410,
        toolbar: {
          show: false,
        },
        events: {
          click: (event: any, context: any, config: any) => {
            if (config.dataPointIndex !== -1) {
              const sectionData = {
                sectionId: this.sectionBudgetData.rawData![config.dataPointIndex].cost_ctr_id,
                section: this.sectionBudgetData.rawData![config.dataPointIndex].section
              }
              
              this.onSectionChange(sectionData)
              this.section.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
              setTimeout(() => {
                const currentPos = window.scrollY || window.pageYOffset
                this.isLoading = false
                window.scrollTo({top: currentPos - 65, behavior: 'auto'})
              }, 500)
            }
          }
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: {
            position: "top",
          },
        },
      },
      dataLabels: {
        enabled: true,
        offsetX: -6,
        style: {
          fontSize: "10px",
          fontWeight: 400,
          colors: ["#000"],
        },
        formatter: (val: any) => this.common.formatBigNumber(+val)
      },
      stroke: {
        show: true,
        width: 1,
        colors: ["#fff"],
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: any) => this.common.getRupiahFormat(+val)
        },
      },
      xaxis: {
        categories: this.sectionActualData.categories,
        labels: {
          show: true,
          formatter: (val: any) => this.common.formatBigNumber(+val)
        }
      },
      yaxis: {
        labels: {
          style: {
            fontWeight: "bold",
          }
        }
      },
      colors: colors,
    };
  }

  private _totalLineBudgetDonutChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.totalLineBudgetDonutChart = {
      series: this.sectionBudgetBefore,
      labels: this.sectionBudgetData.categories,
      chart: {
        type: "donut",
        height: 250,
      },
      plotOptions: {
        pie: {
          offsetX: 0,
          offsetY: 0,
          donut: {
            size: "85%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                offsetY: -5,
              },
              value: {
                show: true,
                fontSize: '16px',
                color: '#343a40',
                fontWeight: 500,
                offsetY: 5,
                formatter: (val: any) => this.common.getRupiahFormat(+val)
              },
              total: {
                show: true,
                fontSize: '12px',
                label: 'Total value',
                color: '#9599ad',
                fontWeight: 500,
                formatter: (val: any) => this.common.getRupiahFormat(this.common.sumElementFromArray(val.globals.series))
              }
            }
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      yaxis: {
        labels: {
          formatter: (value: any) => this.common.getRupiahFormat(+value)
        }
      },
      stroke: {
        lineCap: "round",
        width: 2
      },
      colors: colors
    };
  }

  private _supplyBudgetTreemapChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.supplyBudgetTreemapChart = {
      series: [{
        data: this.supplyBudgetData.series
      },],
      legend: {
        show: false,
      },
      chart: {
        height: 350,
        type: "treemap",
        toolbar: {
          show: false,
        },
        events: {
          click: (event: any, context: any, config: any) => {
            if (config.dataPointIndex !== -1) {
              let materialCode = 0
              if (this.isTabOpen.actual) {
                materialCode = this.supplyActualData.rawData![config.dataPointIndex].material_code
              } else {
                materialCode = this.supplyBudgetData.rawData![config.dataPointIndex].material_code
              }
              this.ngZone.run(() => {
                this.router.navigate([`./master/material/${materialCode}`])
              })
            }
          }
        }
      },
      colors: colors,
      dataLabels: {
        enabled: true
      },
      tooltip: {
        x: {
          show: true,
          formatter: (val: any, opt: any) => `${this.supplyBudgetData.rawData![opt.dataPointIndex].section}`
        },
        y: {
          formatter: (val: any, opt: any) => this.common.getRupiahFormat(+val)
        },
      },
    };
  }

  private _sectionBudgetMonthHeatmapChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.sectionBudgetMonthHeatmapChart = {
      series: this.sectionBudgetMonthHeatmapData.series,
      chart: {
        height: 450,
        type: "heatmap",
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: [colors[0]],
      stroke: {
        width: 0.5,
        colors: ["#009176"]
      },
      tooltip: {
        x: {
          show: true,
          formatter: (val: any, opt: any) => `${this.common.getMonthName(+opt.dataPointIndex + 1)}`
        },
        y: {
          formatter: (val: any) => this.common.getRupiahFormat(+val)
        }
      },
      yaxis: {
        labels: {
          style: {
            fontWeight: "bold",
          }
        }
      }
    };
  }

  private _sectionBudgetMonthColumnChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.sectionBudgetMonthColumnChart = {
      series: [{
        name: "Budget",
        data: this.sectionBudgetMonthColumnData.series,
      },
      {
        name: "Actual",
        data: this.sectionActualMonthColumnData.series,
      },
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false,
        },
        events: {
          click: (event: any, context: any, config: any) => {
            const index = config.dataPointIndex
            if (index !== -1) {
              this.ngZone.run(() => {
                this.router.navigate(['supplies'], {queryParams: {
                  lineId: this.selectedLine.id,
                  year: this.year,
                  month: this.sectionActualMonthColumnData.rawData![index].month,
                  costCtrId: this.sectionActualMonthColumnData.rawData![index].cost_ctr_id,
                  tab: config.seriesIndex == 0 ? 'Plan' : 'Actual'
                }})
              })
            }
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
          dataLabels: {
            position: 'top'
          }
        },
      },
      dataLabels: {
        enabled: true,
        textAnchor: 'middle',
        offsetY: -20,
        style: {
          fontWeight: 400,
          fontSize: "10px",
          colors: ["#000"],
        },
        formatter: (val: any) => this.common.formatBigNumber(+val)
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      colors: colors,
      xaxis: {
        categories: this.sectionBudgetMonthColumnData.categories,
      },
      yaxis: {
        title: {
          text: "Rp (Rupiah)",
        },
        labels: {
          show: true,
          formatter: (val: any) => this.common.formatBigNumber(+val)
        }
      },
      grid: {
        borderColor: "#f1f1f1",
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        x: {
          formatter: (val: any, opt: any) => `${this.common.getMonthName(this.sectionBudgetMonthColumnData.rawData![opt.dataPointIndex].month)}`
        },
        y: {
          formatter: (val: any) => this.common.getRupiahFormat(+val)
        },
      },
    };
  }

  private _sectionSupplyTreemapChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.sectionSupplyTreemapChart = {
      series: [{
        data: this.sectionSupplyBudgetData.series
      }],
      legend: {
        show: false,
      },
      chart: {
        height: 350,
        type: "treemap",
        toolbar: {
          show: false,
        },
        events: {
          click: (event: any, context: any, config: any) => {
            if (config.dataPointIndex !== -1) {
              let materialCode = 0
              if (this.isTabOpen.actual) {
                materialCode = this.sectionSupplyActualData.rawData![config.dataPointIndex].material_code
              } else {
                materialCode = this.sectionSupplyBudgetData.rawData![config.dataPointIndex].material_code
              }
              this.ngZone.run(() => {
                this.router.navigate([`./master/material/${materialCode}`])
              })
            }
          }
        }
      },
      colors: colors,
      dataLabels: {
        enabled: true
      },
      tooltip: {
        x: {
          show: true,
          formatter: (val: any, opt: any) => `${this.selectedSection.name}`
        },
        y: {
          formatter: (val: any, opt: any) => this.common.getRupiahFormat(+val)
        },
      },
    };
  }


  private _lineBudgetMonthColumnChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.lineMonthColumnChart = {
      series: [{
        name: "Budget",
        data: this.lineMonthBudgetData.series,
      },
      {
        name: "Actual",
        data: this.lineMonthActualData.series,
      },
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false,
        },
        events: {
          click: (event: any, context: any, config: any) => {
            const index = config.dataPointIndex
            if (index !== -1) {
              this.ngZone.run(() => {
                this.router.navigate(['supplies'], {queryParams: {
                  lineId: this.selectedLine.id,
                  year: this.year,
                  month: this.lineMonthActualData.rawData![index].month,
                  tab: config.seriesIndex == 0 ? 'Plan' : 'Actual'
                }})
              })
            }
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
          dataLabels: {
            position: 'top'
          }
        },
      },
      dataLabels: {
        enabled: true,
        textAnchor: 'middle',
        offsetY: -20,
        style: {
          fontWeight: 400,
          fontSize: "10px",
          colors: ["#000"],
        },
        formatter: (val: any) => this.common.formatBigNumber(+val)
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      colors: colors,
      xaxis: {
        categories: this.lineMonthBudgetData.categories,
      },
      yaxis: {
        title: {
          text: "Rp (Rupiah)",
        },
        labels: {
          show: true,
          formatter: (val: any) => this.common.formatBigNumber(+val)
        }
      },
      grid: {
        borderColor: "#f1f1f1",
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        x: {
          formatter: (val: any, opt: any) => `${this.common.getMonthName(this.lineMonthBudgetData.rawData![opt.dataPointIndex].month)}`
        },
        y: {
          formatter: (val: any) => this.common.getRupiahFormat(+val)
        },
      },
    };
  }
}

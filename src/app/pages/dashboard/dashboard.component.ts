import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChartType } from './dashboard.model';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Subject, debounceTime } from 'rxjs';
import { Const } from 'src/app/core/static/const';

interface DashboardChart {
  rawData?: any[];
  series?: any[];
  categories?: any[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  clearChartData = () => { return { rawData: [], series: [], categories: [] } as DashboardChart }

  totalLineBudgetDonutChart!: ChartType;
  totalLineBudgetData: DashboardChart = this.clearChartData()

  factoryLineBudgetColumnChart!: ChartType;
  factoryLineBudgetData: DashboardChart = this.clearChartData()

  sectionBudgetBarChart!: ChartType;
  sectionBudgetData: DashboardChart = this.clearChartData()
  
  supplyBudgetTreemapChart!: ChartType;
  supplyBudgetData: DashboardChart = this.clearChartData()
  
  sectionBudgetMonthHeatmapChart!: ChartType;
  sectionBudgetMonthHeatmapData: DashboardChart = this.clearChartData()

  sectionBudgetMonthColumnChart!: ChartType
  sectionBudgetMonthColumnData: DashboardChart = this.clearChartData()

  fiveBiggestBudget: any[] = []

  clickSubject = new Subject<string>()

  isLoading = false;

  lineData: any[] = []
  selectedLine = { id: 0, name: '' }

  sectionData: any[] = []
  selectedSection = { id: 0, name: '' }

  year: number
  costCenterId: number = 0

  totalFactoryBudget: number = 0;
  totalFactoryActual: number = 0;

  @ViewChild("line") line!: ElementRef
  @ViewChild("section") section!: ElementRef

  constructor(public common: CommonService, private apiService: restApiService) {
    this.year = new Date().getFullYear()
    this.clickSubject.pipe(debounceTime(350)).subscribe(value => {
      console.log("year change: " + value);
      
    })
  }

  async ngOnInit() {
    await this.getBudgetPerLine(this.year)
    await this.getBudgetPerSection(this.year, this.selectedLine.id)
    await this.getBudgetPerSupply(this.year, this.selectedLine.id)
    await this.getBudgetPerSectionAndMonth(this.year, this.selectedLine.id)
    this._factoryLineBudgetColumnChart('["--vz-primary", "--vz-success"]');
    this._sectionBudgetBarChart('["--vz-primary", "--vz-info"]');
    this._totalLineBudgetDonutChart('["--vz-success", "--vz-primary", "--vz-info", "--vz-success-rgb, 0.60", "--vz-primary-rgb, 0.45", "--vz-info-rgb, 0.30"]');
    this._supplyBudgetTreemapChart('["--vz-primary"]');
    this._sectionBudgetMonthHeatmapChart('["--vz-success", "--vz-card-bg-custom"]');
    this._sectionBudgetMonthColumnChart('["--vz-primary", "--vz-success"]');
    setTimeout(() => {
      console.log(this.section)
      console.log(this.section.nativeElement);
      
    }, 1500)
  }

  async getBudgetPerLine(year: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getBudgetPerLine(year).subscribe({
        next: (res: any) => {
          let data: any[] = res.data
          this.factoryLineBudgetData = this.clearChartData()
          this.factoryLineBudgetData.rawData = data
          this.factoryLineBudgetData.categories = [...data].map(item => item.line)
          this.factoryLineBudgetData.series = [...data].map(item => item.price)
          this.totalFactoryBudget = this.common.sumElementFromArray([...data], 'price')

          this.lineData = [...data].map(item => { return { lineId: item.line_id, line: item.line } })
          this.selectedLine.id = this.lineData[0].lineId
          this.selectedLine.name = this.lineData[0].line
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Budget Per Line"), err)
          reject(err)
        },
        complete: () => {
          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  async getBudgetPerSection(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getBudgetPerSection(year, lineId).subscribe({
        next: (res: any) => {
          let data: any[] = res.data
          this.sectionBudgetData = this.clearChartData()
          this.sectionBudgetData.rawData = data
          this.sectionBudgetData.series = [...data].map(item => item.price)
          this.sectionBudgetData.categories = [...data].map(item => item.section)

          this.sectionData = [...data].map(item => { return { sectionId: item.cost_ctr_id, section: item.section } }).sort((a, b) => a.sectionId - b.sectionId)
          this.selectedSection.id = this.sectionData[0].sectionId
          this.selectedSection.name = this.sectionData[0].section
          
        },
        error: (err) => {
          this.isLoading = false
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Budget Per Section"), err)
          reject(err)
        },
        complete: () => {
          // this.setSectionBudgetChartValue()

          this.isLoading = false;
          resolve(true)
        }
      })
    })
  }

  // async getBudgetPerMonth(year: number, lineId: number) {
  //   return new Promise((resolve, reject) => {
  //     this.isLoading = true;
  //     this.apiService.getBudgetPerMonthByLine(year, lineId).subscribe({
  //       next: (res: any) => {

  //         this.isLoading = false;
  //         resolve(true)
  //       },
  //       error: (err) => {
  //         this.isLoading = false
  //         this.common.showServerErrorAlert(Const.ERR_GET_MSG("Budget Per Month"), err)
  //         reject(err)
  //       }
  //     })
  //   })
  // }

  async getBudgetPerSupply(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getBudgetPerSupply(year, lineId).subscribe({
        next: (res: any) => {
          let data: any[] = res.data.sort((a: any, b: any) => b.price - a.price)
          this.supplyBudgetData = this.clearChartData()
          this.fiveBiggestBudget = [...data].slice(0, 5)

          this.supplyBudgetData.rawData = data
          this.supplyBudgetData.series = [...data].map(item => {
            return { x: item.material_desc, y: item.price }
          })
          this.supplyBudgetData.categories = [...data].map(item => item.material_desc)
          
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

  async getBudgetPerSectionAndMonth(year: number, lineId: number) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.apiService.getBudgetPerSectionAndMonth(year, lineId).subscribe({
        next: (res: any) => {
          let data: any[] = res.data
          const transformedData: any[] = [...data].reduce((acc: any[], curr: any) => {
            const existingSection = acc.find((item: any) => item.name === curr.section);
            if (existingSection) {
              existingSection.data.push({x: this.common.getSimpleMonthName(curr.month), y: curr.price});
            } else {
              acc.push({name: curr.section, data: [{x: this.common.getSimpleMonthName(curr.month), y: curr.price}]});
            }
            return acc;
          }, []);
          
          this.sectionBudgetMonthHeatmapData = this.clearChartData()
          this.sectionBudgetMonthHeatmapData.rawData = data
          this.sectionBudgetMonthHeatmapData.series = transformedData

          const sectionMonthBudgetData = [...data].filter(item => item.cost_ctr_id === this.selectedSection.id)
          this.sectionBudgetMonthColumnData = {
            rawData: sectionMonthBudgetData,
            series: [...sectionMonthBudgetData].map(item => item.price),
            categories: [...sectionMonthBudgetData].map(item => this.common.getSimpleMonthName(item.month))
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

  jsonToString(data: any): string {
    return JSON.stringify(data)
  }

  onFactoryLineChange(event$: any) {
    const lineData = JSON.parse(event$.target.id)
    const lineId = lineData.lineId
    this.changeFactoryLine(lineId)
  }

  async changeFactoryLine(lineId: number) {
    const index = this.common.getIndexById(this.lineData, lineId, "lineId")
    this.selectedLine.id = lineId
    this.selectedLine.name = this.lineData[index].line
    await this.getBudgetPerSection(this.year, lineId).then(() => {
      this.setSectionBudgetChartValue()
      this.setTotaLineBudgetChartValue()
    })
    await this.getBudgetPerSupply(this.year, lineId).then(() => this.setSupplyBudgetChartValue())
    await this.getBudgetPerSectionAndMonth(this.year, lineId).then(() => this.setSupplyBudgetMonthChartValue())
    this.onSectionChange(this.sectionData[0])
  }

  setSectionBudgetChartValue() {
    this.sectionBudgetBarChart.series = [{ name: 'Budget', data: this.sectionBudgetData.series }]
    this.sectionBudgetBarChart.xaxis = {
      categories: this.sectionBudgetData.categories,
      labels: {
        show: true,
        formatter: (val: any) => this.common.formatBigNumber(+val)
      }
    }
  }

  setTotaLineBudgetChartValue() {
    this.totalLineBudgetDonutChart.series = this.sectionBudgetData.series
    this.totalLineBudgetDonutChart.labels = this.sectionBudgetData.categories
  }

  setSupplyBudgetChartValue() {
    this.supplyBudgetTreemapChart.series = [{ data: this.supplyBudgetData.series }]
  }

  setSupplyBudgetMonthChartValue() {
    this.sectionBudgetMonthHeatmapChart.series = this.sectionBudgetMonthHeatmapData.series
  }

  setBudgetMonthSectionChartValue() {
    this.sectionBudgetMonthColumnChart.series = [{ name: 'Budget', data: this.sectionBudgetMonthColumnData.series}]
    this.sectionBudgetMonthColumnChart.xaxis = { categories: this.sectionBudgetMonthColumnData.categories }
  }

  onSectionChange(sectionData: any) {
    this.selectedSection = { name: sectionData.section, id: sectionData.sectionId }
    const data = [...this.sectionBudgetMonthHeatmapData.rawData!].filter(item => item.cost_ctr_id === sectionData.sectionId)
    this.sectionBudgetMonthColumnData.rawData = data
    this.sectionBudgetMonthColumnData.series = [...data].map(item => item.price)
    this.setBudgetMonthSectionChartValue()
  }

  onTreemapShowLabels(event: any) {
    this.isLoading = true
    setTimeout(() => {
      this.supplyBudgetTreemapChart.dataLabels = { enabled: event.target.checked }
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
    this.clickSubject.next(`${this.year}`)
  }

  onYearChange(event: any) {
    if (event.target.value) this.clickSubject.next(`${this.year}`)
  }

  private _factoryLineBudgetColumnChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.factoryLineBudgetColumnChart = {
      series: [{
        name: "Budget",
        data: this.factoryLineBudgetData.series,
      },
      // {
      //   name: "Actual",
      //   data: [4673829839, 5787283928, 5982372891, 5498384938, 6287238278, 5772847388, 6293829104, 6023928170],
      // }
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false,
        },
        events: {
          click: (event: any, context: any, config: any) => {
            const data = config.config.xaxis.categories[config.dataPointIndex]
            const index = config.dataPointIndex
            const lineId = this.factoryLineBudgetData.rawData![index].line_id
            this.changeFactoryLine(lineId)
            this.line.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            // window.scrollTo(0, 725)
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
        }
        // {
        //   name: 'Actual',
        //   data: [53, 32, 33, 52, 13, 44, 32],
        // },
      ],
      chart: {
        type: "bar",
        height: 410,
        toolbar: {
          show: false,
        },
        events: {
          click: (event: any, context: any, config: any) => {
            console.log(this.sectionBudgetData.rawData![config.dataPointIndex]);
            const sectionData = {
              sectionId: this.sectionBudgetData.rawData![config.dataPointIndex].cost_ctr_id,
              section: this.sectionBudgetData.rawData![config.dataPointIndex].section
            }
            this.onSectionChange(sectionData)
            this.section.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            // const data = config.config.xaxis.categories[config.dataPointIndex]
            // const index = config.dataPointIndex
            // const section = this.factoryLineBudgetData.rawData![index].line_id
            // this.changeFactoryLine(lineId)
            // window.scrollTo(0, 725)
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
        categories: this.sectionBudgetData.categories,
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
      series: this.sectionBudgetData.series,
      labels: this.sectionBudgetData.categories,
      chart: {
        type: "donut",
        height: 300,
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
                fontSize: '18px',
                offsetY: -5,
              },
              value: {
                show: true,
                fontSize: '18px',
                color: '#343a40',
                fontWeight: 500,
                offsetY: 5,
                formatter: (val: any) => this.common.getRupiahFormat(+val)
              },
              total: {
                show: true,
                fontSize: '13px',
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
      },
      colors: colors,
      dataLabels: {
        enabled: false
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
      // {
      //   name: "Actual",
      //   data: [467329839, 578728928, 582372891, 549838498, 628738278, 572847388, 629382104, 602328170, 923283948, 429382910, 223912837, 328371423],
      // },
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false,
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
}

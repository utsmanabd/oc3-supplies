import {
    ApexAxisChartSeries,
    ApexChart,
    ChartComponent,
    ApexDataLabels,
    ApexPlotOptions,
    ApexYAxis,
    ApexLegend,
    ApexStroke,
    ApexXAxis,
    ApexFill,
    ApexTooltip,
    ApexTitleSubtitle,
    ApexResponsive,
    ApexAnnotations,
    ApexGrid,
    ApexStates
} from "ng-apexcharts";

export interface ChartType {
  series?: any;
  chart?: any;
  dataLabels?: any;
  plotOptions?: any;
  yaxis?: any;
  xaxis?: any;
  fill?: any;
  tooltip?: any;
  stroke?: any;
  legend?: any;
  title?: any;
  responsive?: any;
  colors?: any;
  annotations?: any;
  grid?: any;
  subtitle?: any;
  states?: any;
  labels?: any;
}
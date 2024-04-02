import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { Const } from '../static/const';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  // -- Object manipulation
  jsonToString(data: any): string {
    return JSON.stringify(data)
  }

  // -- Number format
  getRupiahFormat(number: number): string {
    const formattedNumber = number.toFixed(2);
    const [numberPart, decimalPart] = formattedNumber.split('.');
    const thousand = numberPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatResult = thousand + ',' + decimalPart;
  
    return 'Rp' + formatResult;
  }

  formatDecimal(number: number, decimalFixed: number = 2): string {
    const decimalPart = number.toString().split('.')[1];
    const decimalLength = decimalPart ? decimalPart.length : 0;

    const formattedNumber = decimalLength <= decimalFixed ? number.toFixed(decimalLength).replace('.', ',') : number.toFixed(decimalFixed).replace('.', ',');

    return formattedNumber;
}


  getFormattedDecimalNumber(input: number, decimalFixed: number = 2): string {
    const parts = input.toFixed(decimalFixed).toString().split('.');
    const formattedIntegerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formattedNumber = formattedIntegerPart + ',' + parts[1];

    return formattedNumber;
  }

  replaceDotWithComma(number: number): string {
    const formattedNumber = number.toString().replace('.', ',');
    return formattedNumber;
}

  formattedNumber(input: number): string {
    const parts = input.toFixed(2).toString().split('.');
    const formattedIntegerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return formattedIntegerPart
  }

  roundNumber(number: number): number {
    const numberWithoutDecimal = Math.floor(number);
    const decimal = number - numberWithoutDecimal;
    const rounding = decimal >= 0.5 ? 1 : 0;

    return numberWithoutDecimal + rounding;
}

  sumElementFromArray(array: any[], key?: string): number {
    let result: number = 0;
    if (key) {
      result = array.reduce((total, item) => total + item[key] , 0);
    } else result = array.reduce((total, item) => total + item, 0);
    return result;
  }


  formatBigNumber(number: number) {
    if (number < 1000) {
        return number.toString();
    } else if (number < 1000000) {
        return 'Rp' + (number / 1000).toFixed(1) + 'K';
    } else if (number < 1000000000) {
        return 'Rp' + (number / 1000000).toFixed(1) + 'M';
    } else if (number < 1000000000000) {
        return 'Rp' + (number / 1000000000).toFixed(1) + 'B';
    } else {
        return 'Rp' + (number / 1000000000000).toFixed(1) + 'T';
    }
}
  // -- Date Function
  getMonthName(month: number): string {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return monthNames[month - 1];
  }

  getSimpleMonthName(month: number): string {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    return monthNames[month - 1];
  }

  getTotalWeekInYear(year: number, weeksOfMonth?: number[]): number {
    let totalWeeks = 0
    if (weeksOfMonth) {
      weeksOfMonth.forEach(month => totalWeeks += month)
    } else {
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      months.forEach(month => {
        totalWeeks += this.getTotalWeekInMonth(year, month)
      })
    }
    return totalWeeks;
  }

  getTotalWeekInMonth(month: number, year: number): number {
    const totalDays = new Date(year, month, 0).getDate();
    let totalWeeks = 0;

    if (month === 1 && new Date(year, 0, 1).getDay() >= 2 && new Date(year, 0, 1).getDay() <= 4) {
      totalWeeks++;
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() === 1) {
        totalWeeks++;
      }
    }

    if (month === 12 && new Date(year, 11, 31).getDay() >= 1 && new Date(year, 11, 31).getDay() <= 3) {
      totalWeeks--;
    }

    return totalWeeks;
  }

  getLocaleDate(date: string | number | Date): string {
    const dateObj = new Date(date);
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${day} ${month}, ${year}`;
  }

  getTime(date: string): string {
    const dateObj = new Date(date);
    const time = dateObj.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return time;
  }

  // Array manipulation
  getIndexById(arr: any[], id: any, idKey: string): number {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][idKey] === id) {
        return i;
      }
    }
    return -1;
  }

  getUniqueData(arr: any[], property: string): any[] {
    let uniqueData: { [key: string]: any } = {};
    let result: any[] = [];
  
    for (let obj of arr) {
      let value = obj[property];
      if (!uniqueData[value]) {
        uniqueData[value] = obj;
        result.push(obj);
      }
    }
  
    return result;
  }

  isFirstOrLastIndex(array: any[], element: any) {
    if (array.length === 0) {
        return false;
    }

    if (JSON.stringify(array[0]) === JSON.stringify(element)) {
        return true;
    }
    
    if (JSON.stringify(array[array.length - 1]) === JSON.stringify(element)) {
        return true;
    }
    
    return false;
}

  // HTML Doc Manipulation
  goToTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  // Table Pagination
  getComputedRowNumber(globalIndex: number, index: number): number {
    return globalIndex + index + 1;
  }

  calculateActivePages(currentPage: number, totalPages: number): number[] {
    const visiblePages = 5;
    const activePages: number[] = [];

    const startPage = Math.max(
      1,
      currentPage - Math.floor(visiblePages / 2)
    );
    const endPage = Math.min(totalPages, startPage + visiblePages - 1);

    for (let page = startPage; page <= endPage; page++) {
      activePages.push(page);
    }

    return activePages;
  }

  // -- Show alerts
  showSuccessAlert(message?: string, cancelText?: string, confirmText?: string) {
    return Swal.fire({
      title: 'Success!',
      text: message ? message : 'Great job!',
      icon: 'success',
      showDenyButton: cancelText ? true : false,
      denyButtonColor: 'rgb(243, 78, 78)',
      confirmButtonColor: "rgb(3, 142, 220)",
      confirmButtonText: confirmText ? confirmText : 'OK',
      denyButtonText: cancelText ? cancelText : 'Cancel'
    })
  }

  async showServerErrorAlert(message: string = Const.ERR_SERVER_MSG, title: string = Const.ERR_SERVER_TITLE) {
    return this.showErrorAlert(message, title, 'Retry').then((result) => {
      if (result.value) location.reload()
    })
  }

  showErrorAlert(message?: string, title?: string, confirmButton?: string) {
    return Swal.fire({
      title: title ? title : 'Not Found',
      text: message ? message : 'Something went wrong',
      icon: 'error',
      showCloseButton: true,
      confirmButtonColor: "rgb(3, 142, 220)",
      confirmButtonText: confirmButton ? confirmButton : 'Close'
    })
  }

  showDeleteWarningAlert(message?: string, title?: string, confirmButton?: string, showCancelButton: boolean = true) {
    return Swal.fire({
      title: title ? title : "Delete Warning",
      text: message ? message : "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: showCancelButton,
      showCloseButton: !showCancelButton,
      cancelButtonColor: 'rgb(243, 78, 78)',
      confirmButtonColor: "rgb(3, 142, 220)",
      confirmButtonText: confirmButton ? confirmButton : "Delete",
    })
  }

  showCustomAlert(title?: string, content?: string, confirmButtonText?: string, showCancelButton?: boolean, cancelButtonText?: string) {
    return Swal.fire({
      title: title ? title : 'Alert',
      icon: 'warning',
      html: content ? content : 'Are you sure?',
      showCloseButton: true,
      showCancelButton: showCancelButton ? true : false,
      focusConfirm: false,
      confirmButtonText: confirmButtonText ? confirmButtonText : 'Ok',
      cancelButtonText: cancelButtonText ? cancelButtonText : 'Cancel',
      confirmButtonColor: 'rgb(3, 142, 220)',
      cancelButtonColor: 'rgb(243, 78, 78)',
    });
  }
}

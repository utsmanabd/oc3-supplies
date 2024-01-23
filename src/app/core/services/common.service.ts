import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { Const } from '../static/const';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor() { }

  // -- Number format
  getRupiahFormat(number: number): string {
    const formattedNumber = number.toFixed(2);
    const [numberPart, decimalPart] = formattedNumber.split('.');
    const thousand = numberPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatResult = thousand + ',' + decimalPart;
  
    return 'Rp ' + formatResult;
  }

  sumElementFromArray(array: any[], key?: string): number {
    let result: number = 0;
    if (key) {
      result = array.reduce((total, item) => total + item[key] , 0);
    } else result = array.reduce((total, item) => total + item, 0);
    return result;
  }

  // -- Date Function
  getMonthName(month: number): string {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return monthNames[month - 1];
  }

  // -- Show alerts
  showSuccessAlert(message?: string, cancelMessage?: string) {
    return Swal.fire({
      title: 'Success!',
      text: message ? message : 'Great job!',
      icon: 'success',
      showDenyButton: cancelMessage ? true : false,
      denyButtonColor: 'rgb(240, 101, 72)',
      confirmButtonText: 'OK',
      denyButtonText: cancelMessage ? cancelMessage : 'Cancel'
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
      confirmButtonText: confirmButton ? confirmButton : 'Close'
    })
  }

  showDeleteWarningAlert(message?: string) {
    return Swal.fire({
      title: "Are you sure?",
      text: message ? message : "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      cancelButtonColor: "rgb(243, 78, 78)",
      confirmButtonText: "Delete",
    })
  }
}

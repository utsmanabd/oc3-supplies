import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, OperatorFunction, Subject, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import { CommonService } from 'src/app/core/services/common.service';
import { restApiService } from 'src/app/core/services/rest-api.service';
import { Const } from 'src/app/core/static/const';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {
  tableColumns = ["#", "Role", "NIK", "Name", "Email", "Action"]

  roleData: any[] = []
  usersData: any[] = []
  userId!: number | null

  isLoading = false;
  breadCrumbItems!: Array<{}>;

  searchTerm = '';
  searchSubject = new Subject<string>();

  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  form = { nik: '', name: '', email: '', role_id: '' }
  isFormInvalid = false;

  employee: any
  employeeFormatter = (employee: any) => employee.nik ? `${employee.nik} - ${employee.employee_name}` : ""
  employeeSearching = false
  employeeSearchLength: number | null = null
  employeeSearchFailed = false
  employeeSearch: OperatorFunction<string, any[]> = (text$: Observable<any>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => (this.employeeSearching = true)),
      switchMap((query: string) => {
        if (query.length >= 3) {
          this.employeeSearchLength = null
          return this.apiService.getEmployeeData(query).pipe(
            tap((data) => {
              this.employeeSearchFailed = false
            })
          )
        } else {
          this.employeeSearchLength = query.length
          return of([])
        }
      }),
      tap(() => {
        this.employeeSearching = false
      })
    )
  
  constructor (private apiService: restApiService, private modalService: NgbModal, public common: CommonService) {
    this.breadCrumbItems = [
      { label: 'Master', active: false },
      { label: 'Users', active: true }
    ];
    this.searchSubject.pipe(debounceTime(350)).subscribe((term) => {
      this.searchUsersByPagination(term, this.currentPage, this.pageSize)
    })
  }

  ngOnInit() {
    this.getUserRoles()
    this.searchUsersByPagination(this.searchTerm, this.currentPage, this.pageSize)
  }
  getUserRoles() {
    this.isLoading = true
    this.apiService.getUserRole().subscribe({
      next: (res) => {
        this.isLoading = false
        this.roleData = res.data
        this.form.role_id = this.roleData[0].role_id
      },
      error: (err) => {
        this.isLoading = false
        this.common.showServerErrorAlert(Const.ERR_GET_MSG("Role"), err)
      }
    })
  }

  searchUsersByPagination(term: string, currentPage: number, pageSize: number) {
    this.apiService.searchUsersByPagination(term, currentPage, pageSize).subscribe({
      next: (res: any) => {
        this.usersData = res.data
        this.totalItems = res.total_users
      },
      error: (err) => {
        this.common.showServerErrorAlert(Const.ERR_GET_MSG("User"), err)
      }
    })
  }

  onEmployeeFormSearch(event: any) {
    setTimeout(() => {
      if (this.employee) {
        this.form.nik = this.employee.nik
        this.form.email = this.employee.email
        this.form.name = this.employee.employee_name
      }
    }, 50)
  }

  calculateStartingIndex(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }

  openModal(template: any, data?: any) {
    if (data) {
      Object.keys(this.form).forEach(key => {
        (this.form as any)[key] = data[key]
      })
      this.userId = data.user_id
    } else {
      this.form.role_id = this.roleData[0].role_id
    }
    this.modalService.open(template, { centered: true, size: 'lg' }).result.then(
      (result) => this.resetModalValue(),
      (reason) => this.resetModalValue()
    )
  }

  resetModalValue() {
    Object.keys(this.form).forEach(key => {
      (this.form as any)[key] = '' 
    })
    this.userId = null
    this.employee = null
  }

  onDeleteUser(userId: number) {
    this.common.showDeleteWarningAlert().then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true
        this.apiService.deleteUser(userId).subscribe({
          next: (res: any) => {
            this.isLoading = false
            this.searchSubject.next(this.searchTerm)
            this.modalService.dismissAll()
          },
          error: (err) => {
            this.isLoading = false
            this.common.showErrorAlert(Const.ERR_DELETE_MSG("User"), err)
          }
        })
      }
    })
  }

  onSaveChanges() {
    console.log(this.form);
    
    const isFormFilled = Object.keys(this.form).every(key => (this.form as any)[key])
    if (isFormFilled) {
      this.isFormInvalid = false
      this.isLoading = true
      if (this.userId) {
        this.apiService.updateUser(this.userId, this.form).subscribe({
          next: (res) => {
            this.isLoading = false
            this.searchSubject.next(this.searchTerm)
            this.modalService.dismissAll()
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false
            this.common.showErrorAlert(Const.ERR_UPDATE_MSG("User"), err.error.data.message || err.statusText)
          }
        })
      } else {
        this.apiService.insertUser(this.form).subscribe({
          next: (res: any) => {
            this.isLoading = false
            this.searchSubject.next(this.searchTerm)
            this.modalService.dismissAll()
          },
          error: (err: HttpErrorResponse) => {
            this.isLoading = false
            this.common.showErrorAlert(Const.ERR_INSERT_MSG("User"), err.error.data.message || err.statusText)
          }
        })
      }

    } else {
      this.isFormInvalid = true
    }
  }
}

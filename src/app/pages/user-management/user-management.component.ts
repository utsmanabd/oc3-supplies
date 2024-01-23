import { Component, QueryList, ViewChildren } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  Observable,
  OperatorFunction,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap,
} from "rxjs";
import { CommonService } from "src/app/core/services/common.service";
import { restApiService } from "src/app/core/services/rest-api.service";
import Swal from "sweetalert2";
import { UserSortableHeader, listSortEvent } from "./users-sort.directive";
import { UserModel } from "./user.model";
import { Const } from "src/app/core/static/const";
import { UsersService } from "./users.service";

type Employee = { nik: string; employee_name: string; email: string };

@Component({
  selector: "app-user-management",
  templateUrl: "./user-management.component.html",
  styleUrls: ["./user-management.component.scss"],
})
export class UserManagementComponent {
  userId: any;
  usersData: UserModel[] = [];
  rolesData: any[] = []
  users: any;

  loading: boolean = false;

  userDataForm!: UntypedFormGroup;
  submitted: boolean = false;
  error: string = "";

  searching = false;
  searchFailed = false;
  employee: any;
  searchLength: number | null = null;

  userList!: Observable<UserModel[]>;
  total: Observable<number>;

  masterSelected!: boolean;

  formatter = (employee: Employee) =>
    employee.nik ? `${employee.nik} - ${employee.employee_name}` : "";

  search: OperatorFunction<string, any[]> = (text$: Observable<any>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => (this.searching = true)),
      switchMap((query: string) => {
        if (query.length >= 3) {
          this.searchLength = null;
          return this.apiService.getEmployeeData(query).pipe(
            tap((data) => {
              this.searchFailed = false;
            })
          );
        } else {
          this.searchLength = query.length;
          return of([]);
        }
      }),
      tap(() => {
        this.searching = false;
      })
    );

  @ViewChildren(UserSortableHeader) headers!: QueryList<UserSortableHeader>;
  constructor(
    private formBuilder: UntypedFormBuilder,
    private apiService: restApiService,
    public service: UsersService,
    public common: CommonService,
    private modalService: NgbModal
  ) {
    this.userList = service.users$
    this.total = service.total$;
  }

  async ngOnInit() {
    this.userDataForm = this.createForm()
    await this.getUserData()
    console.log(this.usersData);
    await this.getUserRole()
    this.service.setUserData(this.usersData)

    this.userList.subscribe(x => {
      this.users = Object.assign([], x)
    })
    
  }

  async getUserData() {
    return new Promise((resolve, reject) => {
      this.loading = true;
      this.apiService.getUsers().subscribe({
        next: (res: any) => {
          this.loading = false;
          this.usersData = res.data
          resolve(true)
        },
        error: (err) => {
          this.loading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("User"), err)
          reject(err)
        }
      })
    })
  }

  async getUserRole() {
    return new Promise((resolve, reject) => {
      this.loading = true;
      this.apiService.getUserRole().subscribe({
        next: (res: any) => {
          this.loading = false;
          this.rolesData = res.data
          resolve(true)
        },
        error: (err) => {
          this.loading = false;
          this.common.showServerErrorAlert(Const.ERR_GET_MSG("Role"), err)
          reject(err)
        }
      })
    })
  }

  createForm() {
    return this.formBuilder.group({
      user_id: [''],
      nik: ["", [Validators.required]],
      name: ["", [Validators.required]],
      email: ["", [Validators.required, Validators.email]],
      role_id: [null, [Validators.required]]
    }) 
  }

  get f() {
    return this.userDataForm.controls
  }

  onEmployeeFormSearch() {
    setTimeout(() => {
      if (this.employee) {
        this.f["nik"].setValue(this.employee.nik)
        this.f["email"].setValue(this.employee.email)
        this.f["name"].setValue(this.employee.employee_name)
      }
    }, 50)
  }

  editModal(content: any, userId: any) {
    this.submitted = false;
    this.modalService.open(content, { size: 'md', centered: true });
    var listData = this.users.filter((data: { user_id: number; }) => data.user_id === userId);
    var updatebtn = document.getElementById('add-btn') as HTMLElement;
    updatebtn.innerHTML = 'Update';
    this.userDataForm.controls['user_id'].setValue(listData[0].user_id);
    this.userDataForm.controls['nik'].setValue(listData[0].nik);
    this.userDataForm.controls['name'].setValue(listData[0].name);
    this.userDataForm.controls['email'].setValue(listData[0].email);
    this.userDataForm.controls['role_id'].setValue(listData[0].role_id);
  }

  openModal(content: any) {
    this.submitted = false;
    this.modalService.open(content, { size: "md", centered: true });
  }

  checkedValGet: any[] = [];
  deleteMultiple() {
    var checkboxes: any = document.getElementsByName("checkAll");
    var result;
    var checkedVal: any[] = [];
    for (var i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        result = checkboxes[i].value;
        checkedVal.push(result);
      }
    }
    this.checkedValGet = checkedVal;
    if (checkedVal.length > 0) {
      this.common.showDeleteWarningAlert().then(result => {
        if (result.value) this.deleteData()
      })
      
    } else {
      Swal.fire({
        text: "Please select at least one checkbox",
        confirmButtonColor: "#239eba",
      });
    }
  }

  deleteData(id?: any) {
    if (id) {
      document.getElementById('lj_' + id)?.remove();
    }
    else {
      this.checkedValGet.forEach((item: any) => {
        document.getElementById('lj_' + item)?.remove();
      });
    }
  }

  onSort({ column, direction }: listSortEvent) {
    // resetting other headers
    this.headers.forEach((header) => {
      if (header.listsortable !== column) {
        header.direction = "";
      }
    });

    this.service.sortColumn = column;
    this.service.sortDirection = direction;
  }

  checkUncheckAll(ev: any) {
    this.users.forEach((x: { state: any }) => (x.state = ev.target.checked));
  }

  deleteUser(userId: any) {
    this.common.showDeleteWarningAlert().then(result => {
      if (result.value) {
        this.common.showSuccessAlert("Data has been deleted")
      }
    })
  }

  saveUser() {
    if (this.userDataForm.valid) {
      if (this.userDataForm.get('ids')?.value) {
        this.users = this.users.map((data: { user_id: number; }) => data.user_id === this.userDataForm.get('user_id')?.value ? { ...data, ...this.userDataForm.value } : data)
      } else {
        const nik = this.userDataForm.get('nik')?.value;
        const name = this.userDataForm.get('name')?.value;
        const email = this.userDataForm.get('email')?.value;
        const roleId = this.userDataForm.get('role_id')?.value;
        this.users.push({nik, name, email, roleId});
        this.modalService.dismissAll()
      }
    }
    this.modalService.dismissAll();
    setTimeout(() => {
      this.userDataForm.reset();
    }, 2000);
    this.submitted = true
  }

}

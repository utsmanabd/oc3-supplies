import { Injectable, PipeTransform } from '@angular/core';
import { UserModel } from './user.model';
import { SortColumn, SortDirection } from './users-sort.directive';
import { BehaviorSubject, Observable, Subject, debounceTime, delay, of, switchMap, tap } from 'rxjs';
import { DecimalPipe } from '@angular/common';

interface SearchResult {
  users: UserModel[];
  total: number;
}

interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  startIndex: number;
  endIndex: number;
  totalRecords: number;
}

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

function sort(users: UserModel[], column: SortColumn, direction: string): UserModel[] {
  if (direction === '' || column === '') {
    return users;
  } else {
    return [...users].sort((a, b) => {
      const res = compare(a[column], b[column]);
      return direction === 'asc' ? res : -res;
    });
  }
}

function matches(users: UserModel, term: string, pipe: PipeTransform) {
  return users.nik.includes(term)
  || users.name.toLowerCase().includes(term.toLowerCase())
  || users.email.toLowerCase().includes(term.toLowerCase())
  || users.role_name.toLowerCase().includes(term.toLowerCase());

}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private _loading$ = new BehaviorSubject<boolean>(true);
  private _search$ = new Subject<void>();
  private _users$ = new BehaviorSubject<UserModel[]>([]);
  private _total$ = new BehaviorSubject<number>(0);

  private _state: State = {
    page: 1,
    pageSize: 8,
    searchTerm: '',
    sortColumn: '',
    sortDirection: '',
    startIndex: 0,
    endIndex: 9,
    totalRecords: 0
  };

  constructor(private pipe: DecimalPipe) {
    // this._search$.pipe(
    //   tap(() => this._loading$.next(true)),
    //   debounceTime(200),
    //   switchMap(() => this._search()),
    //   delay(200),
    //   tap(() => this._loading$.next(false))
    // ).subscribe(result => {
    //   this._users$.next(result.users);
    //   this._total$.next(result.total);
    // });

    // this._search$.next();
  }

  get users$() { return this._users$.asObservable(); }
  get total$() { return this._total$.asObservable(); }
  get loading$() { return this._loading$.asObservable(); }
  get page() { return this._state.page; }
  get pageSize() { return this._state.pageSize; }
  get searchTerm() { return this._state.searchTerm; }
  get startIndex() { return this._state.startIndex; }
  get endIndex() { return this._state.endIndex; }
  get totalRecords() { return this._state.totalRecords; }

  set page(page: number) { this._set({page}); }
  set pageSize(pageSize: number) { this._set({pageSize}); }
  set searchTerm(searchTerm: string) { this._set({searchTerm}); }
  set sortColumn(sortColumn: SortColumn) { this._set({sortColumn}); }
  set sortDirection(sortDirection: SortDirection) { this._set({sortDirection}); }
  set startIndex(startIndex: number) { this._set({ startIndex }); }
  set endIndex(endIndex: number) { this._set({ endIndex }); }
  set totalRecords(totalRecords: number) { this._set({ totalRecords }); }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
    this._search$.next();
  }

  userData: UserModel[] = [];
  setUserData(userData: UserModel[]): void {
    this.userData = userData
  }
  async getUserData() { 
    return new Promise<UserModel[]>((resolve, reject) => {
      if (this.userData.length > 0) {
        resolve(this.userData);
      } else {
        let nullData: UserModel[] = [];
        resolve(nullData);
      }
    })
  }

  private _search(): Observable<SearchResult> {
    const {sortColumn, sortDirection, pageSize, page, searchTerm} = this._state;

    let userData: UserModel[] = [];
    this.getUserData().then(data => {
      userData = data
    })

    console.log(userData);

    // 1. sort
    let users = sort(userData, sortColumn, sortDirection);

    // 2. filter
    users = users.filter(data => matches(data, searchTerm, this.pipe));
    const total = users.length;

    // 3. paginate
    this.totalRecords = users.length;
    this._state.startIndex = (page - 1) * this.pageSize + 1;
    this._state.endIndex = (page - 1) * this.pageSize + this.pageSize;
    if (this.endIndex > this.totalRecords) {
        this.endIndex = this.totalRecords;
    }
    users = users.slice(this._state.startIndex - 1, this._state.endIndex);
    return of({users, total});
  }
}

import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

// Login Auth
import { environment } from "../../../environments/environment";
import { AuthenticationService } from "../../core/services/auth.service";
import { AuthfakeauthenticationService } from "../../core/services/authfake.service";
import { first } from "rxjs/operators";
import { ToastService } from "./toast-service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})

/**
 * Login Component
 */
export class LoginComponent implements OnInit {
  // Login Form
  loginForm!: FormGroup;
  submitted = false;
  fieldTextType!: boolean;
  returnUrl!: string;
  isRemembered: boolean = false;
  isLoginFailed: boolean = false;
  errorMessage: string = "";
  isOnRefresh: boolean = false;
  loading: boolean = false;
  // set the current year
  year: number = new Date().getFullYear();

  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router,
    private tokenService: TokenStorageService,
    private route: ActivatedRoute,
    public toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {
      if (params.returnUrl) {
        this.returnUrl = params.returnUrl;
      }
    });

    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required]],
      password: ["", [Validators.required]],
    });

    // get return url from route parameters or default to '/'
    if (!this.authenticationService.isAuthenticated()) {
      const refreshToken = this.tokenService.getRefreshToken();
      if (refreshToken !== null) {
        this.updateToken(refreshToken);
      } else {
        return;
      }
    } else {
      this.isOnRefresh = true;
      if (this.returnUrl) this.router.navigateByUrl(this.returnUrl);
      else this.router.navigate(["/"]);
    }
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  onRememberMeChecked() {
    if (!this.isRemembered) {
      this.isRemembered = true;
    } else this.isRemembered = false;
  }

  /**
   * Form submit
   */
  onSubmit() {
    this.loading = true;
    this.submitted = false;
    this.isLoginFailed = false;
    // Login Api
    this.authenticationService
      .login(this.f["email"].value, this.f["password"].value)
      .subscribe({
        next: (data: any) => {
          this.loading = false;
          if (!data.error) {
            if (!this.isRemembered) {
              this.tokenService.setToken(data.token);
              this.tokenService.setUserData(data.userData);
            } else {
              this.tokenService.setAuthData(
                data.token,
                data.refreshToken,
                data.userData
              );
            }
            if (this.returnUrl) this.router.navigateByUrl(this.returnUrl);
            else this.router.navigate(["/"]);

            localStorage.setItem("toast", "true");
          } else {
            this.errorMessage = data.message;
            this.isLoginFailed = true;
          }
          this.submitted = true;
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.submitted = true;
          this.errorMessage = err.error.message || err.statusText;
          this.isLoginFailed = true;
        },
      });
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  updateToken(token: any) {
    this.isOnRefresh = true;
    this.authenticationService.updateToken(token).subscribe({
      next: (res: any) => {
        if (!res.error && res.accessToken) {
          this.tokenService.setToken(res.accessToken);
          this.tokenService.setUserData(res.payload.data);
        } else {
          console.error(res.message);
          this.isOnRefresh = false;
        }
      },
      error: (err) => console.error(err),
      complete: () => {
        this.isOnRefresh = false;
        if (this.returnUrl) this.router.navigateByUrl(this.returnUrl);
        else this.router.navigate(["/"]);
      },
    });
  }
}

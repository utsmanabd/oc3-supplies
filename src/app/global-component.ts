import { environment } from "src/environments/environment";

export const GlobalComponent = {
    // General URL
    API_URL: `${environment.baseUrl}api/`,
    
    // Auth Api
    AUTH_API:`${environment.baseUrl}api/auth/`,

    // Master URL
    MASTER_API_URL: `${environment.baseUrl}api/master/`,

    // AIO Api
    AIO_API: "https://myapps.aio.co.id/otsuka-api/api/",

    // Auth
    login: 'login',
    refreshToken: 'update-token',

    // Local Storage
    REFRESH_TOKEN_KEY: 'SBM_refreshToken',
    TOKEN_KEY: 'SBM_token',
    USER_KEY: 'SBM_currentUser',

    // Crypto Token
    USER_ENCRYPTION_KEY: 'intern-prodOC3-1',
    ACCESS_TOKEN_ENCRYPTION_KEY: 'intern-prodOC3-2',
    REFRESH_TOKEN_ENCRYPTION_KEY: 'intern-prodOC3-3'
   
}
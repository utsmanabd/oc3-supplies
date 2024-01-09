export const GlobalComponent = {
    // Api Calling
    API_URL : 'https://api-node.themesbrand.website/',
    headerToken : {'Authorization': `Bearer ${localStorage.getItem('token')}`},

    // Auth Api
    AUTH_API:"http://localhost:3333/api/auth/",

    // Products Api
    product:'apps/product',
    productDelete:'apps/product/',

    // Orders Api
    order:'apps/order',
    orderId:'apps/order/',

    // Customers Api
    customer:'apps/customer',

    // Auth
    login: 'login',
    refreshToken: 'update-token',

    // Crypto Token
    REFRESH_TOKEN_KEY: 'refreshToken',
    TOKEN_KEY: 'token',
    USER_KEY: 'currentUser',

    USER_ENCRYPTION_KEY: 'intern-prodOC3-1',
    ACCESS_TOKEN_ENCRYPTION_KEY: 'intern-prodOC3-2',
    REFRESH_TOKEN_ENCRYPTION_KEY: 'intern-prodOC3-3'
   
}
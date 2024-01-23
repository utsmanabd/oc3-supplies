export const Const = {
    ERR_SERVER_TITLE: 'Failed to Connect',
    ERR_SERVER_MSG: 'Failed to connect to the server',

    ERR_GET_MSG: (dataName?: string, errMsg?: string) => `Failed to retrieve${dataName ? ' ' + dataName : ''} Data from the server. ${errMsg ? 'Error: ' + errMsg : ''}`,
    ERR_INSERT_MSG: (dataName?: string, errMsg?: string) => `Failed to input${dataName ? ' ' + dataName : ''} Data to the server. ${errMsg ? 'Error: ' + errMsg : ''}`,
    ERR_UPDATE_MSG: (dataName?: string, errMsg?: string) => `Failed to update${dataName ? ' ' + dataName : ''} Data to the server. ${errMsg ? 'Error: ' + errMsg : ''}`,
    ERR_DELETE_MSG: (dataName?: string, errMsg?: string) => `Failed to delete${dataName ? ' ' + dataName : ''} Data from the server. ${errMsg ? 'Error: ' + errMsg : ''}`,

    ALERT_DEL_MSG: (dataName?: string) => `Are you sure you want to delete ${dataName ? ' ' + dataName : ''} Data?`,
    SUCCESS_DEL_MSG: (dataName?: string) => `${dataName ? ' ' + dataName : ''} Data has been deleted`
}
console.log('background script ran');
let dev = true;
let domain = dev ? "http://localhost:3000/" : 'https://myamazonhistory.com/';

let lastRequestURL = '';
let lastRequest = {
    lastRequestType: 'GET',
    lastRequestPath: '',
    lastRequestData: {},
    lastRequestResponseType: 'json'
}

function ajaxCallRefreshTokens(type, path = 'authentication/refresh-tokens', {}, responseType, callback) {
    let token = '';
    getStorageItem('user', function (userData) {
        if (userData) {
            token = userData;
        }

        fetch(domain + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: null
        })
            .then(response => {
                if (responseType === 'json') {
                    return response.json();
                } else if (responseType === '') {
                    return response;
                } else {
                    response.text();
                }
            })
            .then(response => {
                callback(response);
            })
            .catch(error => {
                console.error('Error:', error);
                callback({ error: 'Request failed' });
            });
    });
}

let isHandlingError = false;

function ajaxCall(type, path, data, responseType, callback) {
    let token = '';
    getStorageItem('user', function (userData) {
        if (userData) {
            token = userData;
        }

        // Store the URL before sending the request
        lastRequestURL = domain + path;
        lastRequest.lastRequestType = type;
        lastRequest.lastRequestPath = path;
        lastRequest.lastRequestData = data;
        lastRequest.lastRequestResponseType = responseType;

        fetch(lastRequestURL, {
            method: type,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: type === 'POST' ? JSON.stringify(data) : null
        })
            .then(response => {
                console.log('Response status code:', response.status);
                console.log('Response:', response);

                if (response.status === 401) {
                    if (!isHandlingError) {
                        isHandlingError = true;
                            ajaxCallRefreshTokens("POST", "authentication/refresh-tokens", {}, 'json', function (response) {
                                if (!response.accessToken) {
                                    chrome.runtime.sendMessage({ type: 'redirect', data: {} });
                                }
                                setStorageItem('user', response.accessToken);
                                ajaxCall(
                                    lastRequest.lastRequestType, 
                                    lastRequest.lastRequestPath, 
                                    lastRequest.lastRequestData, 
                                    lastRequest.lastRequestResponseType,
                                    function (response) {
                                        isHandlingError = false;
                                        chrome.runtime.sendMessage({ 
                                            type: 'updateState', 
                                            data: { name: `${ response ? response.email : null} restored` } 
                                        });
                                    
                                    }
                                )
                            });
                        }
                }

                if (responseType === 'json') {
                    return response.json();
                } else if (responseType === '') {
                    return response;
                } else {
                    response.text();
                }
            })
            .then(response => {
                console.log('Response body from server:', response);
                callback(response);
            })
            .catch(error => {
                console.error('Error:', error);
                callback({ error: 'Request failed' });
            });
    });
}

function setStorageItem(varName, data) {
    if (varName !== 'searchPageData') {
        const storageData = {};
        storageData[varName] = data;

        chrome.storage.sync.set(storageData, function () {
            // console.log('Item saved:', varName);
        });
    }
}

function getStorageItem(varName, callback) {
    chrome.storage.sync.get([varName], function (result) {
        if (result[varName]) {
            const parsedData = result[varName];
            callback(parsedData);
        } else {
            callback(null);
        }
    });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case "login":
            // console.log('2. login logic ran with formData =', message.data);
            let userLoginCreds = message.data;
            // userLoginCreds.username = message.data.email.split('@')[0];
            ajaxCall("POST", "authentication/sign-in", userLoginCreds, 'json', function (response) {
                // console.log('3. response from server is: ', response.accessToken);
                setStorageItem('user', response.accessToken);
                sendResponse(response);
            });
            break;
        case "signup":
            console.log('signup logic with formData =', message.data);
            let userCreds = message.data;
            // userCreds.username = message.data.email.split('@')[0];
            ajaxCall("POST", "authentication/sign-up", userCreds, 'json', function (response) {
                // console.log('response from server is: ', response);
                setStorageItem('user', response.accessToken);
                sendResponse(response);
            });
            break;
        case "initWelcomePage":
            // console.log('initWelcomePage logic ran with data =', message.data);
            let id = message.data.id;
            ajaxCall("GET", `users/${id}`, {}, 'json', function (response) {
                console.log('response from server is: ', response);
                sendResponse(response);
            });
            break;    
        default:
            console.log('couldnt find matching case');
    }
    return true;
});

chrome.runtime.onInstalled.addListener(() => {
    // This event listener is triggered when the extension is installed or updated.
    console.log('Extension installed or updated.');
  });

// js fetch interceptor
// https://blog.logrocket.com/intercepting-javascript-fetch-api-requests-responses/
// chrome.webRequest.onBeforeRequest.addListener(
//     function(details) {
//     },
//     {urls: ["<all_urls>"]},
//     ["requestBody"]
// );

// chrome.webRequest.onResponseStarted.addListener(
//     function(details) {
//         console.log('!!! onResponseStarted');
//         console.log(details.statusCode);
//         console.log(details);
//         console.log(lastRequest);
//         console.log('Last request URL:', lastRequestURL);
//         console.log('!!!');
//     },
//     {urls: ["<all_urls>"]},
//     // for onBeforeRequest blocking - , extraHeaders ?, requestBody. 
//     // for onHeadersReceived blocking, extraHeaders, responseHeaders.
//     // onResponseStarted = onCompleted
//     ["responseHeaders"]
//   );

  

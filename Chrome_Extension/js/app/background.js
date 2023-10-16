console.log('background script ran');
let dev = true;
let domain = dev ? "http://localhost:3000/" : 'https://myamazonhistory.com/';
let domainOF = "https://onlyfans.com/api2/v2/";

const chatUrlString = 'https://onlyfans.com/api2/v2/chats/';
let lastRequestURL = '';
let lastRequest = {
    lastRequestType: 'GET',
    lastRequestPath: '',
    lastRequestData: {},
    lastRequestResponseType: 'json'
}
let requestHeaders = {};
let cookieString = '';
let tabIdScrapper = 0;

// ----- init -----

chrome.runtime.onInstalled.addListener(({reason}) => {
    console.log('Extension installed or updated.');

    if (reason === 'install' || reason === 'update') {
        chrome.tabs.create({
            // url: "../../views/popup.html"
            // https://onlyfans.com/spicyjasmine.vip
                url: "https://onlyfans.com/my/chats/",
                active: false,
                index: 0,
                pinned: true,
        }, (info) => {
            tabIdScrapper = info.id;
        });
      }
});

chrome.tabs.onCreated.addListener(
    (tab) => {
        console.log(tab.id);
        if ( tab.id === tabIdScrapper) {
            setTimeout(() => sendContentMessage(tabIdScrapper), 1000*1)
        }
    }
)

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    // console.log('!!! onRemoved');
    // console.log(tabId);
    if (tabIdScrapper === tabId) {
        // console.log('!!! GOTCHA');
        // logout()
        // changeExtensionIcon();
    }
});

// ----- ajax requests -----

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

function ajaxCallToOF(type, path, data, responseType, callback) {
    fetch(domainOF + path, {
        method: type,
        headers: requestHeaders,
        body: type === 'POST' ? JSON.stringify(data) : null
    })
        .then(response => {
            console.log('Response status code:', response.status);
            console.log('Response:', response);

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
}

// Get request to ajaxCallToOF
// setTimeout(() => 
//     ajaxCallToOF("GET", "chats/112299545/messages?limit=10&order=desc&skip_users=all", {}, 'json', function (response) {
//         console.log('XXXX response from server is: ', response);
//     })
// , 1000*20)

// Scrapping logic
// setTimeout(() => 
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//     // chrome.tabs.update(tabs[0].id, { url: 'https://onlyfans.com/api2/v2/chats/168522236/messages?limit=10&order=desc&skip_users=all' });
//     // https://onlyfans.com/my/chats/chat/112299545/
//     chrome.tabs.update(tabs[0].id, { url: 'https://onlyfans.com/my/chats/chat/112299545/' });
//   })
// , 1000*20)
// setTimeout(() => 
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//     // chrome.tabs.update(tabs[0].id, { url: 'https://onlyfans.com/api2/v2/chats/168522236/messages?limit=10&order=desc&skip_users=all' });
//     // https://onlyfans.com/my/chats/chat/112299545/
//     chrome.tabs.update(tabs[0].id, { url: 'https://onlyfans.com/my/chats/chat/171917545/' });
//   })
// , 1000*30)

// ----- message listeners -----

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

// ----- utils -----

function logout() {
    chrome.storage.sync.get(['user'], function (result) {
        console.log('Value before removal: ', result.user);
        chrome.storage.sync.remove(['user'], function (result) {
            console.log('Result of removal: ', result);
        });
    });

    utils.removeStorageItem('user')
        .then((result) => {
            console.log('Successfully removed "user" storage item', result);
            $state.go('login');
        })
        .catch((error) => {
            console.error('Error removing "user" storage item', error);
        });
}

// TODO: use utils
function setStorageItem(varName, data) {
    if (varName !== 'searchPageData') {
        const storageData = {};
        storageData[varName] = data;

        chrome.storage.sync.set(storageData, function () {
            // console.log('Item saved:', varName);
        });
    }
}

// TODO: use utils
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

function sendContentMessage(tabIdScrapper) {
    const resp = chrome.tabs.sendMessage(tabIdScrapper, { type: 'showBanner' })
}

function convertHeadersArrayToObject(headersArray) {
    const headersObject = {};
  
    const fieldMappings = {
      'User-Agent': 'User-Agent',
      'accept': 'Accept',
      'app-token': 'App-Token',
      'sec-ch-ua': 'Sec-Ch-Ua',
      'sec-ch-ua-mobile': 'Sec-Ch-Ua-Mobile',
      'sec-ch-ua-platform': 'Sec-Ch-Ua-Platform',
      'sign': 'Sign',
      'time': 'Time',
      'user-id': 'User-Id',
      'x-bc': 'X-Bc',
      
      'User-Id': 'User-Id',
      'Accept': 'Accept',
      'Time': 'Time',
      'X-Bc': 'X-Bc',
      'User-Agent': 'User-Agent',
      'App-Token': 'App-Token',
      'Sign': 'Sign,'
    };
  
    headersArray.forEach(header => {
      const name = header.name;
      let value = header.value;
  
      // Проверяем, содержит ли значение кавычки и слеши, и не добавляем лишние
      if (value.startsWith('"') && value.endsWith('"')) {
        // Убираем начальную и конечную кавычки
        value = value.slice(1, -1);
      }
  
      // Проверяем, есть ли соответствующее поле в fieldMappings, и если есть, добавляем в объект
      if (fieldMappings[name]) {
        headersObject[fieldMappings[name]] = value;
      }
    });
  
    return headersObject;
}

function convertCookiesToString(cookies) {
    const cookieStrings = [];
  
    cookies.forEach(cookie => {
      if (cookie.domain === ".onlyfans.com") {
        cookieStrings.push(`${cookie.name}=${cookie.value}`);
      }
    });
  
    return cookieStrings.join('; ');
}

function changeExtensionIcon() {
    chrome.action.setIcon({ path: {
        // "128": "../../assets/logoSuccess128.png" 
        // "128": "../../assets/logoError128.png" 
        // "16": "../../assets/logoWarning16.png", 
        // "48": "../../assets/logoWarning48.png", 
        "128": "../../assets/logoWarning128.png" 
    }})
}

// ----- listeners -----

// js fetch interceptor
// https://blog.logrocket.com/intercepting-javascript-fetch-api-requests-responses/
// chrome.webRequest.onBeforeRequest.addListener(
//     function(details) {
//     },
//     {urls: ["<all_urls>"]},
//     ["requestBody"]
// );

// chrome.webRequest.onSendHeaders.addListener(
//     function(details) {
//         console.log('!!! SSS onSendHeaders');
//         if (details.url.includes(chatUrlString)) {

//             console.log('!!! INSIDE');
//             console.log(details.url);
//             console.log(details); 

//             requestHeaders = convertHeadersArrayToObject(details.requestHeaders)

//             const cookie = chrome.cookies;
//             chrome.cookies.getAll(
//                 {},
//                 (cookies) => {
//                     // console.log('XXXX get all cookie: ');
//                     // console.log(cookies);
//                     cookieString = convertCookiesToString(cookies);
//                     requestHeaders['Cookie'] = cookieString;
//                     // requestHeaders['Accept-Encoding'] = 'gzip, deflate, br';
//                     // requestHeaders['Accept-Language'] = 'en-US,en;q=0.9';
//                     // requestHeaders['Referer'] = 'https://onlyfans.com/my/chats/chat/112299545/';
//                     // requestHeaders['Sec-Fetch-Dest'] = 'empty';
//                     // requestHeaders['Sec-Fetch-Mode'] = 'cors';
//                     // requestHeaders['Sec-Fetch-Site'] = 'same-origin';
//                 }
//             )
//             console.log(requestHeaders);
//         }
     
//         console.log('!!!');
//     },
//     {urls: ["<all_urls>"]},
//     ["requestHeaders"]
// );
  

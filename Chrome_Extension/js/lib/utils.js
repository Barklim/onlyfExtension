window.utils = {};

function setStorageItem(varName, data) {
    if (varName !== 'searchPageData') {
        const storageData = {};
        storageData[varName] = JSON.stringify(data);
        chrome.storage.sync.set(storageData, function () {
            // console.log('Item saved:', varName);
            console.log('STORAGE:', varName);
            console.log(data);
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

function removeStorageItem(varName) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.remove(varName, function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

function getDecoded(token) {
    if (token) {
        var decoded = jwt_decode(token);
        return decoded;
    }
    return null;
}

function getLSUserId() {
    return new Promise((resolve, reject) => {
        utils.getStorageItem('user', (result) => {
            const decoded = utils.getDecoded(result);
            if (decoded) {
                resolve(decoded.sub);
            } else {
                reject('Unable to decode the token');
            }
        });
    });
}

window.utils.setStorageItem = setStorageItem;
window.utils.getStorageItem = getStorageItem; 
window.utils.removeStorageItem = removeStorageItem; 
window.utils.getDecoded = getDecoded;
window.utils.getLSUserId = getLSUserId;
window.test = () => console.log('!!! test');
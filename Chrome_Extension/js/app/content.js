console.log('content script ran');

const textAreaId = 'new_post_text_input';
const buttonClassname = 'b-chat__btn-submit';
const stopWords = 'Anus vagina putana pedrila Shalava huilo moshonka elda'.toLowerCase();
let previousText = '';
let violationWord = '';

let countdownInterval = null;

const disable = (taId, btnClsname) => {
    const textAreaEl = document.getElementById(taId)
    const buttonEl = document.getElementsByClassName(btnClsname)

    setStorageItem('isInterruption', true);

    textAreaEl.style.height = '70px'
    textAreaEl.setAttribute('maxlength', 1)
    textAreaEl.style.opacity = '0.9'
    textAreaEl.style.background = '#3caff0'
    textAreaEl.value = `Вы ввели запретное слово: ${violationWord}! Впредь будьте аккуратнее... \nПриостановка, запуск таймера`
    // at-attr="send_btn" or disable
    buttonEl[0].innerHTML = 'blocked'
    buttonEl[0].style.opacity = '0.2'

    let countdown = 5;
    countdownInterval = setInterval(() => {
        textAreaEl.value = `Вы ввели запретное слово: ${violationWord}! Впредь будьте аккуратнее... \nДоступ через⏳ ${countdown.toString()} ...`
        countdown--;
        if (countdown < 0) {
            clearInterval(countdownInterval);
            setStorageItem('isInterruption', false);
            enable(taId, btnClsname);
        }
    }, 1000);
}
const enable = (taId, btnClsname) => {
    const textAreaEl = document.getElementById(taId)
    const buttonEl = document.getElementsByClassName(btnClsname)
    textAreaEl.style.height = '46px'
    textAreaEl.setAttribute('maxlength', 20000)
    textAreaEl.style.opacity = '1'
    textAreaEl.style.background = '#161618'
    textAreaEl.value = previousText;
    buttonEl[0].innerHTML = 'send'
    buttonEl[0].style.opacity = '1'
}

function findForbiddenWord(inputText, stopWords) {
    const stopWordsArray = stopWords.split(' ');

    for (const word of stopWordsArray) {
        if (inputText.toLowerCase().includes(word)) {
            return word;
        }
    }

    return null;
}

const inputHandler = (taId, btnClsname) => {
    const stopWord = 'nig***'
    const textAreaEl = document.getElementById(taId)
    const buttonEl = document.getElementsByClassName(btnClsname)

    textAreaEl?.addEventListener('input', function(e) {
        const forbiddenWord = findForbiddenWord(e.target.value, stopWords);

        previousText = e.target.value.slice(0, -1);
        violationWord = forbiddenWord;

        // Если найдено запрещенное слово, вызываем функцию disable
        if (forbiddenWord) {
            disable(textAreaId, buttonClassname);
        }
    });
}

// ----- init -----

document.addEventListener('DOMContentLoaded', () => {
    getCurrentTab();

    console.log('!!! DOMContentLoaded');
    console.log('!!!');

    getStorageItem('isInterruption', function (interrupted) {
        if (interrupted) {
            disable(textAreaId, buttonClassname);
        }
    });
    inputHandler(textAreaId, buttonClassname);
});

// setTimeout(() => getStorageItem('isInterruption', function (interrupted) {
//     if (interrupted) {
//         disable(textAreaId, buttonClassname);
//     }
// }), 4000)
// setTimeout(() => inputHandler(textAreaId, buttonClassname), 4000)
// const currentTab = getCurrentTab()

// ----- utils -----

function setStorageItem(varName, data) {
    const storageData = {};
    storageData[varName] = data;

    chrome.storage.sync.set(storageData, function () {
        // console.log('Item saved:', varName);
    });
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

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    console.log('!!! getCurrentTab');
    let tab = await chrome.tabs.query(queryOptions);    
    return tab;
}

// ----- listeners -----

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'showBanner') {
        createBanner();
    }
});

// ----- create banner -----

function createBanner() {
    var links = document.querySelectorAll("link[rel~='icon']");
    if (!links) {
        const link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    } else {
    links.forEach((link) => {
        // link.href = './assets/logo.ico';
        // link.href = 'https://stackoverflow.com/favicon.ico';
        link.href = 'https://main--sprightly-toffee-821aa4.netlify.app/favicon.ico';
        })
    }
    
    const body = document.getElementsByTagName('body')[0];

    const wrapperEl = document.createElement('div');
    wrapperEl.classList.add("wrapperContent");
    body.appendChild(wrapperEl);

    const wrappeContainerEl = document.createElement('div');
    wrappeContainerEl.classList.add("wrappeContainer");
    wrapperEl.appendChild(wrappeContainerEl);

    const containerEl = document.createElement('div');
    containerEl.classList.add("container");
    wrappeContainerEl.appendChild(containerEl);

    const divOneEl = document.createElement('div');
    divOneEl.classList.add("card");
    divOneEl.classList.add("border-primar");
    divOneEl.classList.add("mb-3");
    containerEl.appendChild(divOneEl);

    const divHeaderEl = document.createElement('div');
    divHeaderEl.classList.add("card-header");
    divHeaderEl.innerHTML = 'OFTracker';
    divOneEl.appendChild(divHeaderEl);

    const divCardBodyEl = document.createElement('div');
    divCardBodyEl.classList.add("card-body");
    divOneEl.appendChild(divCardBodyEl);

    const divCardTitleEl = document.createElement('h4');
    divCardTitleEl.classList.add("card-title");
    divCardTitleEl.innerHTML = 'Please read the message ⚠️';
    divCardBodyEl.appendChild(divCardTitleEl);

    const divCardTextEl = document.createElement('p');
    divCardTextEl.classList.add("card-text");
    divCardTextEl.innerHTML = "<br />Do not close this page!!! <br />If you close this page, the extension OFTracker will not be able to scrape user activity and application statistics.";
    divCardBodyEl.appendChild(divCardTextEl);
}
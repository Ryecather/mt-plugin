var chrome = chrome || browser

// ===== 翻译语言列表（作为 API 不可用时的 fallback）=====
const FALLBACK_LANGUAGES = [
    { code: "zh-CN", name: "中文（简体）" },
    { code: "zh-TW", name: "中文（繁体）" },
    { code: "en", name: "英语" },
    { code: "ja", name: "日语" },
    { code: "ko", name: "韩语" },
    { code: "fr", name: "法语" },
    { code: "de", name: "德语" },
    { code: "es", name: "西班牙语" },
    { code: "pt", name: "葡萄牙语" },
    { code: "ru", name: "俄语" },
    { code: "ar", name: "阿拉伯语" },
    { code: "vi", name: "越南语" },
    { code: "th", name: "泰语" },
    { code: "it", name: "意大利语" },
    { code: "nl", name: "荷兰语" },
    { code: "pl", name: "波兰语" },
    { code: "tr", name: "土耳其语" },
    { code: "id", name: "印尼语" },
    { code: "ms", name: "马来语" },
    { code: "hi", name: "印地语" },
    { code: "sv", name: "瑞典语" },
    { code: "da", name: "丹麦语" },
    { code: "fi", name: "芬兰语" },
    { code: "no", name: "挪威语" },
    { code: "cs", name: "捷克语" },
    { code: "ro", name: "罗马尼亚语" },
    { code: "hu", name: "匈牙利语" },
    { code: "el", name: "希腊语" },
    { code: "he", name: "希伯来语" },
    { code: "uk", name: "乌克兰语" },
    { code: "fa", name: "波斯语" },
];


document.addEventListener('DOMContentLoaded', async function () {
    await populateLanguages();

    setView('main');

    document.getElementById('doTranslate').addEventListener('click', async function () {
        console.log("sending msg");
        var ak = document.getElementById('api_key').value || '';

        var resp = await chrome.runtime.sendMessage({
            action: "inject",
            sl: document.getElementById('translatefrom').value,
            tl: document.getElementById('translateto').value,
            api_key: ak
        });

        var source_lang = document.getElementById('translatefrom').value;
        if (source_lang == "ar") {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { todo: "change" });
            });
        }
        console.log("rcv'd ", resp);
        window.close();
    });

    document.getElementById('settingsbtn').addEventListener('click', function () {
        setView('settings');
    });

    document.querySelectorAll('.btnToMainView').forEach(function (item) {
        item.addEventListener('click', function () {
            setView('main');
        });
    });

    getSettings(function (data) {
        var settings = document.querySelectorAll('.setting');
        for (var i = 0; i < settings.length; i++) {
            var s = settings[i];
            var key = s.dataset['storename'];
            s.value = data.settings[key] || '';
        }
    });

    document.getElementById('saveSettings').addEventListener('click', function () {
        var settings = document.querySelectorAll('.setting');
        var collection = {};
        for (var i = 0; i < settings.length; i++) {
            var s = settings[i];
            if (!('storename' in s.dataset)) continue;
            collection[s.dataset['storename']] = s.value;
        }
        chrome.storage.local.set({ settings: collection });
        setView('main');
    });
});

async function populateLanguages() {
    var languages = null;

    try {
        var resp = await APIQuery('GET', 'languages', null);
        if (resp && Array.isArray(resp) && resp.length > 0) {
            languages = resp;
        }
    } catch (e) {
        console.log('无法从服务器获取语言列表，使用内置列表');
    }

    if (!languages) {
        languages = FALLBACK_LANGUAGES;
    }

    var trTo = document.getElementById('translateto');
    var trFrom = document.getElementById('translatefrom');
    var settingsLang = document.getElementById('settingsDefaultLang');

    var opt = document.createElement('option');
    opt.value = "auto";
    opt.innerText = "自动检测";
    trFrom.appendChild(opt);

    var browserLang = navigator.language.split("-")[0];

    for (var i = 0; i < languages.length; i++) {
        var lang = languages[i];

        var optFrom = document.createElement('option');
        optFrom.value = lang.code;
        optFrom.innerText = lang.name;
        trFrom.appendChild(optFrom);

        var optTo = document.createElement('option');
        optTo.value = lang.code;
        optTo.innerText = lang.name;
        if (lang.code === browserLang) {
            optTo.selected = true;
        }
        if (!trTo.querySelector('option[selected]') && lang.code === 'zh-CN') {
            optTo.selected = true;
        }
        trTo.appendChild(optTo);

        var optSet = document.createElement('option');
        optSet.value = lang.code;
        optSet.innerText = lang.name;
        settingsLang.appendChild(optSet);
    }
}


function setView() {
    var views = document.querySelectorAll('.view');
    for (var i = 0; i < views.length; i++) {
        views[i].style.display = 'none';
    }
    for (var i = 0; i < arguments.length; i++) {
        var el = document.querySelector('.view_' + arguments[i]);
        if (el) el.style.display = 'block';
    }
}

document.getElementById('goback').addEventListener('click', async function () {
    console.log("sending msg");
    function sendMessageToContentScript(message, callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
                if (callback) callback(response);
            });
        });
    }
    sendMessageToContentScript({ cmd: 'goback', value: '你好，我是popup！' }, function (response) {
        console.log('来自content的回复：' + response);
    });
    window.close();
});


/* FIXME 2 functions below are duplicated */
function APIQuery(method, route, body) {
    return new Promise(function (resolve, reject) {
        getSettings(function (data) {
            fetch(data.settings['api-endpoint'] + route, {
                method: method,
                body: body,
                headers: { "Content-Type": "application/json" }
            })
            .then(function (res) {
                res.json().then(function (jsn) { resolve(jsn); })
                    .catch(function (err) { reject(err); });
            })
            .catch(function (err) { reject(err); });
        });
    });
}


function getSettings(cb) {
    chrome.storage.local.get('settings', function (data) {
        if (!data.settings) {
            var defaults = {
                'provider': 'baidu',
                'api-endpoint': 'http://127.0.0.1:5555/',
                'api-key': '',
                'default-lang': 'zh',
                'baidu-appid': '',
                'baidu-secret': ''
            };
            cb({ settings: defaults });
            return;
        }
        var settings = data.settings;
        if (!settings['api-endpoint'].endsWith('/')) {
            settings['api-endpoint'] += '/';
        }
        if (!settings['provider']) {
            settings['provider'] = 'baidu';
        }
        if (!settings['default-lang']) {
            settings['default-lang'] = 'zh';
        }
        if (!settings['baidu-appid']) {
            settings['baidu-appid'] = '';
        }
        if (!settings['baidu-secret']) {
            settings['baidu-secret'] = '';
        }
        cb({ settings: settings });
    });
}
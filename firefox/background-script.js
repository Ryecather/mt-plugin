var chrome = chrome || browser;

let notificationShown = false;

function showErrorNotification(type, message) {
    if(!notificationShown){
        notificationShown = true;
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon-48.png",
            title: type,
            message: message
        }, function () {
            setTimeout(function () {
                notificationShown = false;
            }, 2000);
        });
    }
}

// ===== 右键菜单 =====
chrome.runtime.onInstalled.addListener(async function () {
    chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
        "id": "translate",
        "title": "翻译",
        "contexts": ["selection"]
    });

    var commonLangs = [
        {id: "zh", title: "中文"},
        {id: "en", title: "英语"},
        {id: "ja", title: "日语"},
        {id: "ko", title: "韩语"},
        {id: "fr", title: "法语"},
        {id: "de", title: "德语"},
        {id: "es", title: "西班牙语"},
        {id: "ru", title: "俄语"},
        {id: "vi", title: "越南语"},
        {id: "th", title: "泰语"},
        {id: "ar", title: "阿拉伯语"},
        {id: "pt", title: "葡萄牙语"},
    ];

    for (var i = 0; i < commonLangs.length; i++) {
        chrome.contextMenus.create({
            "id": commonLangs[i].id,
            "title": commonLangs[i].name,
            "contexts": ["selection"],
            "parentId": "translate"
        });
    }
    });
});

// ===== 快捷键 =====
browser.commands.onCommand.addListener(async function (command) {
    if (command === 'translate-selection') {
        var tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) return;

        try {
            var resp = await browser.tabs.sendMessage(tabs[0].id, { todo: 'getSelection' });
            if (!resp || !resp.text) return;

            var settings = await getSettingsAsync();
            var tgt = settings['default-lang'] || 'zh';

            var result = await doTranslateRequest(resp.text, 'auto', tgt, 'text', '');
            if (!result.error) {
                browser.tabs.sendMessage(tabs[0].id, { todo: 'translate', result: result.translatedText });
            }
        } catch (e) {
            console.log('Shortcut translate failed:', e.message);
        }
    }
});

// ===== 取词翻译处理（右键菜单）=====
chrome.contextMenus.onClicked.addListener(async function (clickData) {
    if (clickData.selectionText) {
        var transword = clickData.selectionText;
        var target_lang = clickData.menuItemId;

        try {
            var trans_json = await doTranslateRequest(transword, 'auto', target_lang, "text", "");

            if (trans_json.error) {
                showErrorNotification("translate error", "Translation failed: " + trans_json.error);
            } else {
                console.log(trans_json.translatedText);
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { todo: "translate", result: trans_json.translatedText });
                });
            }
        } catch (err) {
            console.log(err);
            showErrorNotification("translate error", "Translation failed: " + err.message);
        }
    }
});

// ===== popup 和 content 脚本消息处理 =====
browser.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log('request service');
        if (request.action === "translate") {
            if (request.sl === "ar") {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { todo: "change" });
                });
            }

            var ak = request.ak || "";
            doTranslateRequest(request.text, request.sl, request.tl, request.type, ak)
                .then(function (jsn) {
                    if(jsn.error){
                        showErrorNotification("translate fail", "Translation failed: " + jsn.error);
                    }else{
                        sendResponse({ type: request.type, text: jsn.translatedText });
                    }
                })
                .catch(function (err) {
                    showErrorNotification("translate fail", "Translation failed: " + err.message);
                });

            return true;
        }
        if (request.action === "restore") {
            browser.tabs.query({ active: true }).then(function (tabs) {
                if (!tabs || tabs.length === 0) {
                    console.log('Restore: no active tab');
                    sendResponse(null);
                    return;
                }
                return browser.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: restorePage,
                }).then(function () { sendResponse(null); });
            }).catch(function (err) {
                console.log('Restore failed:', err.message);
                sendResponse(null);
            });
            return true;
        }
        if (request.action === "inject") {
            browser.tabs.query({ active: true }).then(function (tabId) {
                console.log(tabId);
                browser.scripting.executeScript({
                    target: { tabId: tabId[0].id },
                    func: doTranslate,
                    args: [request.sl, request.tl, request.api_key],
                });
                sendResponse(null);
            });
        }
        if (request.action === "detect-lang") {
            browser.i18n.detectLanguage(request.text).then(function (info) {
                sendResponse(info);
            });
        }
        return true;
    }
);

// ===== 和服务器通信（仅用于请求语言列表和广告）=====
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
            .catch(function (err) {
                reject(err);
                showErrorNotification("request failed", "Translation failed: " + err);
            });
        });
    });
}

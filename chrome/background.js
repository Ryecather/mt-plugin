import { LANG_LIST } from './lib/lang-list.js';
import { toBaiduLang, translateWithBaidu, doTranslateRequest } from './lib/baidu-translate.js';
import { getSettings, getSettingsAsync } from './lib/settings.js';
import { doTranslate } from './lib/injected-translate.js';
import { restorePage } from './lib/injected-restore.js';

var chrome = chrome || browser;

let notificationShown = false;

function showErrorNotification(title, message) {
    if(!notificationShown){
        notificationShown = true;
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon-48.png",
            title: title,
            message: message
        }, function () {
            setTimeout(function () {
                notificationShown = false;
            }, 2000);
        });
    }
}

// ===== 创建取词翻译语言菜单（常用12种）=====
chrome.runtime.onInstalled.addListener(async function () {
    chrome.contextMenus.removeAll(function () {
    var menuItem = {
        "id": "pickTranslate",
        "title": "YiMT翻译",
        "contexts": ["selection"]
    };
    chrome.contextMenus.create(menuItem);

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
        commonLangs[i].contexts = ["selection"];
        commonLangs[i].parentId = "pickTranslate";
        chrome.contextMenus.create(commonLangs[i]);
    }
    });
});

// ===== 快捷键处理：Ctrl+Shift+T = 翻译选中文字 =====
chrome.commands.onCommand.addListener(async function (command) {
    if (command === 'translate-selection') {
        var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) return;

        try {
            var resp = await chrome.tabs.sendMessage(tabs[0].id, { todo: 'getSelection' });
            if (!resp || !resp.text) return;

            var settings = await getSettingsAsync();
            var tgt = settings['default-lang'] || 'zh';

            var result = await doTranslateRequest(resp.text, 'auto', tgt, 'text', '');
            if (!result.error) {
                chrome.tabs.sendMessage(tabs[0].id, { todo: 'translated', result: result.translatedText });
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

        if(target_lang == "pickTranslate") return;

        try {
            var result = await doTranslateRequest(transword, 'auto', target_lang, "text", "");

            if (result.error) {
                showErrorNotification("翻译失败", result.error);
            } else {
                console.log(result.translatedText);
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {todo: "translated", result: result.translatedText});
                });
            }
        } catch (err) {
            console.log(err);
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {todo: "failed", message: err.message});
            });
        }
    }
});

// ===== popup 和 content 脚本消息处理 =====
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === "translate") {
            console.log('Get translation from server');

            if (request.sl === "ar") {
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, { todo: "text_direction" });
                });
            }

            var ak = request.ak || "";
            doTranslateRequest(request.text, request.sl, request.tl, request.type, ak)
                .then(function (jsn) { sendResponse(jsn); })
                .catch(function (err) {
                    console.log('Translation error: ' + err.message);
                    sendResponse({error: err.message});
                });

            return true;
        }

        if (request.action === "restore") {
            console.log('Restore page');

            chrome.tabs.query({ active: true })
                .then(function (tabs) {
                    if (!tabs || tabs.length === 0) {
                        console.log('Restore: no active tab');
                        sendResponse(null);
                        return;
                    }
                    return chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: restorePage
                    });
                })
                .then(function () { sendResponse(null); })
                .catch(function (err) {
                    console.log('Restore failed:', err.message);
                    sendResponse(null);
                });

            return true;
        }

        if (request.action === "inject") {
            console.log('Inject script for translation');

            chrome.tabs.query({ active: true })
                .then(function (tabId) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabId[0].id },
                        func: doTranslate,
                        args: [request.sl, request.tl, request.api_key],
                    });
                });

            // 立即响应，不等待翻译完成，让 popup 能立刻关闭
            sendResponse(null);

            return true;
        }
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
            .then(function (response) { return response.json(); })
            .then(function (jsn) { resolve(jsn); })
            .catch(function (err) { reject(err); });
        });
    });
}

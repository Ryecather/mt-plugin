var chrome = chrome || browser

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

// ===== 翻译语言列表 =====
const LANG_LIST = [
    {"code": "auto", "name": "自动检测"},
    {"code": "zh", "name": "中文"},
    {"code": "en", "name": "英语"},
    {"code": "ja", "name": "日语"},
    {"code": "jp", "name": "日语"},
    {"code": "ko", "name": "韩语"},
    {"code": "kor","name": "韩语"},
    {"code": "fr", "name": "法语"},
    {"code": "fra","name": "法语"},
    {"code": "de", "name": "德语"},
    {"code": "es", "name": "西班牙语"},
    {"code": "spa","name": "西班牙语"},
    {"code": "pt", "name": "葡萄牙语"},
    {"code": "ru", "name": "俄语"},
    {"code": "ar", "name": "阿拉伯语"},
    {"code": "ara","name": "阿拉伯语"},
    {"code": "vi", "name": "越南语"},
    {"code": "th", "name": "泰语"},
    {"code": "it", "name": "意大利语"},
    {"code": "nl", "name": "荷兰语"},
    {"code": "pl", "name": "波兰语"},
    {"code": "tr", "name": "土耳其语"},
    {"code": "id", "name": "印尼语"},
    {"code": "ms", "name": "马来语"},
    {"code": "hi", "name": "印地语"},
    {"code": "sv", "name": "瑞典语"},
    {"code": "da", "name": "丹麦语"},
    {"code": "fi", "name": "芬兰语"},
    {"code": "no", "name": "挪威语"},
    {"code": "cs", "name": "捷克语"},
    {"code": "ro", "name": "罗马尼亚语"},
    {"code": "hu", "name": "匈牙利语"},
    {"code": "el", "name": "希腊语"},
    {"code": "he", "name": "希伯来语"},
    {"code": "uk", "name": "乌克兰语"},
    {"code": "fa", "name": "波斯语"},
];

// ===== 纯 JS MD5（字节级 + UTF-8 编码）=====
function utf8Bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        if (c < 128) { bytes.push(c); }
        else if (c < 2048) { bytes.push(192 | c >> 6, 128 | c & 63); }
        else if (c < 55296 || c >= 57344) { bytes.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63); }
        else { i++; var c2 = str.charCodeAt(i); c = 65536 + ((c & 1023) << 10) + (c2 & 1023); bytes.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63); }
    }
    return bytes;
}

var MD5 = (function () {
    function add32(a, b) { var lsw = (a & 0xFFFF) + (b & 0xFFFF); var msw = (a >> 16) + (b >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }
    function cmn(q, a, b, x, s, t) { return add32((add32(add32(a, q), add32(x, t)) << s) | (add32(add32(a, q), add32(x, t)) >>> (32 - s)), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

    function md5Cycle(state, words) {
        var a = state[0], b = state[1], c = state[2], d = state[3];
        a = ff(a, b, c, d, words[0],  7,  -680876936); d = ff(d, a, b, c, words[1],  12, -389564586); c = ff(c, d, a, b, words[2],  17,  606105819);
        b = ff(b, c, d, a, words[3],  22, -1044525330); a = ff(a, b, c, d, words[4],  7,  -176418897); d = ff(d, a, b, c, words[5],  12,  1200080426);
        c = ff(c, d, a, b, words[6],  17, -1473231341); b = ff(b, c, d, a, words[7],  22, -45705983);  a = ff(a, b, c, d, words[8],  7,   1770035416);
        d = ff(d, a, b, c, words[9],  12, -1958414417); c = ff(c, d, a, b, words[10], 17, -42063);     b = ff(b, c, d, a, words[11], 22, -1990404162);
        a = ff(a, b, c, d, words[12], 7,   1804603682); d = ff(d, a, b, c, words[13], 12, -40341101);  c = ff(c, d, a, b, words[14], 17, -1502002290);
        b = ff(b, c, d, a, words[15], 22,  1236535329); a = gg(a, b, c, d, words[1],  5,  -165796510); d = gg(d, a, b, c, words[6],  9,  -1069501632);
        c = gg(c, d, a, b, words[11], 14,  643717713);  b = gg(b, c, d, a, words[0],  20, -373897302); a = gg(a, b, c, d, words[5],  5,  -701558691);
        d = gg(d, a, b, c, words[10], 9,   38016083);   c = gg(c, d, a, b, words[15], 14, -660478335); b = gg(b, c, d, a, words[4],  20, -405537848);
        a = gg(a, b, c, d, words[9],  5,   568446438);  d = gg(d, a, b, c, words[14], 9,  -1019803690); c = gg(c, d, a, b, words[3],  14, -187363961);
        b = gg(b, c, d, a, words[8],  20,  1163531501); a = gg(a, b, c, d, words[13], 5,  -1444681467); d = gg(d, a, b, c, words[2],  9,  -51403784);
        c = gg(c, d, a, b, words[7],  14,  1735328473); b = gg(b, c, d, a, words[12], 20, -1926607734); a = hh(a, b, c, d, words[5],  4,  -378558);
        d = hh(d, a, b, c, words[8],  11, -2022574463); c = hh(c, d, a, b, words[11], 16,  1839030562); b = hh(b, c, d, a, words[14], 23, -35309556);
        a = hh(a, b, c, d, words[1],  4,  -1530992060); d = hh(d, a, b, c, words[4],  11,  1272893353); c = hh(c, d, a, b, words[7],  16, -155497632);
        b = hh(b, c, d, a, words[10], 23, -1094730640); a = hh(a, b, c, d, words[13], 4,   681279174);  d = hh(d, a, b, c, words[0],  11, -358537222);
        c = hh(c, d, a, b, words[3],  16, -722521979);  b = hh(b, c, d, a, words[6],  23,  76029189);  a = hh(a, b, c, d, words[9],  4,  -640364487);
        d = hh(d, a, b, c, words[12], 11, -421815835);  c = hh(c, d, a, b, words[15], 16,  530742520);  b = hh(b, c, d, a, words[2],  23, -995338651);
        a = ii(a, b, c, d, words[0],  6,  -198630844);  d = ii(d, a, b, c, words[7],  10,  1126891415); c = ii(c, d, a, b, words[14], 15, -1416354905);
        b = ii(b, c, d, a, words[5],  21, -57434055);   a = ii(a, b, c, d, words[12], 6,   1700485571); d = ii(d, a, b, c, words[3],  10, -1894986606);
        c = ii(c, d, a, b, words[10], 15, -1051523);    b = ii(b, c, d, a, words[1],  21, -2054922799); a = ii(a, b, c, d, words[8],  6,   1873313359);
        d = ii(d, a, b, c, words[15], 10, -30611744);   c = ii(c, d, a, b, words[6],  15, -1560198380); b = ii(b, c, d, a, words[13], 21,  1309151649);
        a = ii(a, b, c, d, words[4],  6,  -145523070);  d = ii(d, a, b, c, words[11], 10, -1120210379); c = ii(c, d, a, b, words[2],  15,  718787259);
        b = ii(b, c, d, a, words[9],  21, -343485551);
        state[0] = add32(a, state[0]); state[1] = add32(b, state[1]); state[2] = add32(c, state[2]); state[3] = add32(d, state[3]);
    }

    function bytesToWords(bytes, off) {
        var words = [];
        for (var i = 0; i < 16; i++) words[i] = bytes[off + i * 4] | (bytes[off + i * 4 + 1] << 8) | (bytes[off + i * 4 + 2] << 16) | (bytes[off + i * 4 + 3] << 24);
        return words;
    }

    function md5(arr) {
        var state = [1732584193, -271733879, -1732584194, 271733878];
        var len = arr.length;
        // 补齐到 64 字节的倍数 + 8（最后 8 字节放原始长度）
        var paddedLen = ((len + 8) >>> 6) + 1;
        var padded = new Array(paddedLen * 64);
        var i;
        for (i = 0; i < len; i++) padded[i] = arr[i];
        padded[len] = 0x80;
        for (i = len + 1; i < paddedLen * 64 - 8; i++) padded[i] = 0;
        // 原始消息的 bit 长度（little-endian 64-bit，只用低 32 位就够，高 32 位填 0）
        var bits = len * 8;
        var off = paddedLen * 64 - 8;
        padded[off] = bits & 0xFF;
        padded[off + 1] = (bits >>> 8) & 0xFF;
        padded[off + 2] = (bits >>> 16) & 0xFF;
        padded[off + 3] = (bits >>> 24) & 0xFF;

        for (i = 0; i < paddedLen; i++) md5Cycle(state, bytesToWords(padded, i * 64));

        function hex(n) {
            var u = n >>> 0;
            var h = '0123456789abcdef';
            return h.charAt(u >>> 4 & 0xF) + h.charAt(u & 0xF)
                 + h.charAt(u >>> 12 & 0xF) + h.charAt(u >>> 8 & 0xF)
                 + h.charAt(u >>> 20 & 0xF) + h.charAt(u >>> 16 & 0xF)
                 + h.charAt(u >>> 28 & 0xF) + h.charAt(u >>> 24 & 0xF);
        }
        return hex(state[0]) + hex(state[1]) + hex(state[2]) + hex(state[3]);
    }
    return function (s) { return md5(utf8Bytes(s)); };
})();

// ===== 百度翻译 API（国内可用，需 APP ID + Secret Key）=====
var BAIDU_API = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

function toBaiduLang(code) {
    var map = {
        'auto': 'auto',
        'zh-CN': 'zh',
        'zh-TW': 'cht',
        'zh': 'zh',
        'en': 'en',
        'ja': 'jp',
        'jp': 'jp',
        'ko': 'kor',
        'kor': 'kor',
        'fr': 'fra',
        'fra': 'fra',
        'de': 'de',
        'es': 'spa',
        'spa': 'spa',
        'pt': 'pt',
        'ru': 'ru',
        'ar': 'ara',
        'ara': 'ara',
        'vi': 'vi',
        'th': 'th',
        'it': 'it',
        'nl': 'nl',
        'pl': 'pl',
        'tr': 'tr',
        'id': 'id',
        'ms': 'ms',
        'hi': 'hi',
    };
    return map[code] || (code || '');
}

async function translateWithBaidu(text, source, target) {
    if (!text) return { translatedText: '' };

    var settings = await getSettingsAsync();
    var appid = settings['baidu-appid'] || '';
    var secretKey = settings['baidu-secret'] || '';
    if (!appid || !secretKey) throw new Error('请先在设置中填写百度 APP ID 和 Secret Key');

    var srcLang = toBaiduLang(source) || 'auto';
    var tgtLang = toBaiduLang(target);
    if (!tgtLang) throw new Error('目标语言不能为空');

    var salt = String(Date.now());
    var sign = MD5(appid + text + salt + secretKey);

    var body = 'q=' + encodeURIComponent(text)
        + '&from=' + srcLang
        + '&to=' + tgtLang
        + '&appid=' + appid
        + '&salt=' + salt
        + '&sign=' + sign;

    var resp = await fetch(BAIDU_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
    });
    if (!resp.ok) throw new Error('Baidu HTTP ' + resp.status);
    var data = await resp.json();
    // 响应: {"from":"en","to":"zh","trans_result":[{"src":"hello","dst":"你好"}]}
    if (data.error_code) {
        throw new Error('Baidu error ' + data.error_code + ': ' + (data.error_msg || ''));
    }
    var translated = '';
    if (data.trans_result && data.trans_result.length > 0) {
        translated = data.trans_result.map(function (r) { return r.dst; }).join('');
    }
    return { translatedText: translated };
}

// 逐个翻译（百度免费 QPS=1，间隔 1 秒，配合仅译 block 元素通常<20 段）
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function batchTranslateWithBaidu(texts, source, target) {
    var results = new Array(texts.length);
    for (var i = 0; i < texts.length; i++) {
        try {
            var r = await translateWithBaidu(texts[i], source, target);
            results[i] = r.translatedText;
        } catch(e) {
            results[i] = texts[i];
        }
        if (i < texts.length - 1) await sleep(1000);
    }
    return { translatedText: results };
}

// 翻译路由：百度 或 自定义 API
async function doTranslateRequest(text, source, target, format, apiKey) {
    var settings = await getSettingsAsync();
    var provider = settings['provider'] || 'baidu';

    if (provider === 'custom') {
        var endpoint = settings['api-endpoint'];
        if (!endpoint.endsWith('/')) endpoint += '/';
        var resp = await fetch(endpoint + "translate", {
            method: "POST",
            body: JSON.stringify({
                q: text, source: source, target: target,
                format: format, api_key: apiKey
            }),
            headers: { "Content-Type": "application/json" }
        });
        return resp.json();
    }

    // 默认百度翻译
    if (Array.isArray(text)) {
        return batchTranslateWithBaidu(text, source, target);
    } else {
        return translateWithBaidu(text, source, target);
    }
}

// 创建取词翻译语言菜单（常用12种）
chrome.runtime.onInstalled.addListener(async function () {
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

// 取词翻译处理（右键菜单）
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

// popup和content脚本消息处理
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

        if (request.action === "inject") {
            console.log('Inject script for translation');

            chrome.tabs.query({ active: true })
                .then(function (tabId) {
                    return chrome.scripting.executeScript({
                        target: { tabId: tabId[0].id },
                        func: doTranslate,
                        args: [request.sl, request.tl, request.api_key],
                    });
                })
                .then(function () { sendResponse(null); });

            return true;
        }
    }
);

// 和服务器通信（仅用于请求语言列表和广告）
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

function getSettings(cb) {
    chrome.storage.sync.get('settings', function (data) {
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
        var s = data.settings;
        if (!s['api-endpoint'] || !s['api-endpoint'].endsWith('/')) {
            s['api-endpoint'] = (s['api-endpoint'] || 'http://127.0.0.1:5555/');
            if (!s['api-endpoint'].endsWith('/')) s['api-endpoint'] += '/';
        }
        if (!s['provider']) s['provider'] = 'baidu';
        if (!s['default-lang']) s['default-lang'] = 'zh';
        if (!s['baidu-appid']) s['baidu-appid'] = '';
        if (!s['baidu-secret']) s['baidu-secret'] = '';
        cb({ settings: s });
    });
}

function getSettingsAsync() {
    return new Promise(function (resolve) {
        getSettings(function (data) { resolve(data.settings); });
    });
}


/*************************************
 *     content-script注入脚本函数
 *************************************/
async function doTranslate(sl, tl, ak) {
    if (window.__ltActive) return;
    window.__ltActive = true;

    var __nodesToTranslate = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                              'p', 'div', 'li', 'td', 'th'];
    var __translationCache = {};

    if (document.title && document.title.trim()) {
        var resp = await translate(document.title, 'text', sl, tl);
        if (resp && resp.translatedText) document.title = resp.translatedText;
    }

    var scrollTimer, resizeTimer, clickTimer;

    document.addEventListener('scroll', function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(translateDom, 200);
    });

    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(translateDom, 200);
    });

    window.addEventListener('click', function () {
        clearTimeout(clickTimer);
        clickTimer = setTimeout(translateDom, 200);
    });

    translateDom();

    async function translateDom() {
        var nodes = findtranslatableElements();
        translateNodes(nodes, sl, tl);
    }

    async function translateBatch(texts, type, sl, tl) {
        var responses = await chrome.runtime.sendMessage({
            action: "translate",
            type: type,
            text: texts,
            sl: sl,
            tl: tl,
            ak: ak
        });
        return responses;
    }

    async function translateNodes(allNodes, sl, tl) {
        var textRequests = [];
        var htmlRequests = [];

        for (var i = 0; i < allNodes.length; i++) {
            var node = allNodes[i];

            if (node.innerHTML == node.innerText) {
                if (node.innerText.length <= 100 && __translationCache[node.innerText]) {
                    node.innerText = __translationCache[node.innerText];
                    setNodeTranslated(node);
                    continue;
                }
                textRequests.push({ text: node.innerText, node: node });
            } else {
                if (node.innerHTML.length <= 200 && __translationCache[node.innerHTML]) {
                    node.innerHTML = __translationCache[node.innerHTML];
                    setNodeTranslated(node);
                    continue;
                }
                htmlRequests.push({ text: node.innerHTML, node: node });
            }
        }

        if (textRequests.length > 0) {
            var textResponses = await translateBatch(textRequests.map(function (r) { return r.text; }), 'text', sl, tl);
            if (textResponses.error) return;

            var texttranslations = textResponses.translatedText;
            for (var i = 0; i < texttranslations.length; i++) {
                var respText = texttranslations[i];
                var req = textRequests[i];

                if (req.text.length <= 100) __translationCache[req.text] = respText;
                req.node.innerText = respText;
                setNodeTranslated(req.node);
            }
        }

        if (htmlRequests.length > 0) {
            var htmlResponses = await translateBatch(htmlRequests.map(function (r) { return r.text; }), 'html', sl, tl);
            if (htmlResponses.error) return;

            var htmltranslations = htmlResponses.translatedText;
            for (var i = 0; i < htmltranslations.length; i++) {
                var respHtml = htmltranslations[i];
                var reqHtml = htmlRequests[i];

                if (reqHtml.text.length <= 200) __translationCache[reqHtml.text] = respHtml;
                reqHtml.node.innerHTML = respHtml;
                setNodeTranslated(reqHtml.node);

                if (reqHtml.node.childNodes) {
                    [].slice.call(reqHtml.node.childNodes).forEach(function (n) {
                        var tagName = n.tagName ? n.tagName.toLowerCase() : '';
                        if (n && __nodesToTranslate.indexOf(tagName) !== -1) setNodeTranslated(n);
                    });
                }
            }
        }
    }

    function setNodeTranslated(node) { node.dataset.__ltTranslated = 'true'; }
    function getNodeTranslated(node) { return node.dataset.__ltTranslated === 'true'; }
    function setNodeQueued(node) { node.dataset.__ltQueued = 'true'; }
    function getNodeQueued(node) { return node.dataset.__ltQueued === 'true'; }

    function findtranslatableElements() {
        var allNodes = [];

        for (var ti = 0; ti < __nodesToTranslate.length; ti++) {
            var tagName = __nodesToTranslate[ti];
            var nodeList = document.getElementsByTagName(tagName);
            var nodes = [].slice.call(nodeList);
            nodes = filterTranslatable(nodes);
            nodes = filterInViewport(nodes);
            nodes = filterTranslated(nodes);
            nodes = filterQueued(nodes);

            for (var ni = 0; ni < nodes.length; ni++) setNodeQueued(nodes[ni]);
            allNodes = allNodes.concat(nodes);
        }

        allNodes = filterChilds(allNodes);

        allNodes.sort(function (a, b) {
            return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        });

        return allNodes;
    }

    function filterQueued(nodes) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            if (!getNodeQueued(nodes[i])) result.push(nodes[i]);
        }
        return result;
    }

    function filterTranslated(nodes) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            if (!getNodeTranslated(nodes[i])) result.push(nodes[i]);
        }
        return result;
    }

    function filterInViewport(nodes) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            if (isInViewport(nodes[i])) result.push(nodes[i]);
        }
        return result;
    }

    function isInViewport(node) {
        var bounding = node.getBoundingClientRect();
        return (
            bounding.top >= 0 &&
            bounding.left >= 0 &&
            bounding.top <= (window.innerHeight || document.documentElement.clientHeight) * 1.5 &&
            bounding.left <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function filterTranslatable(nodes) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            if (hasTranslateableText(nodes[i])) result.push(nodes[i]);
        }
        return result;
    }

    function hasTranslateableText(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() != "") return true;
        node = node.firstChild;
        while (node) {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() != "") return true;
            node = node.nextSibling;
        }
        return false;
    }

    function filterChilds(nodes) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            var child = nodes[i];
            var node = child;
            var found = false;
            while (node.parentNode) {
                node = node.parentNode;
                if (indexOfNode(nodes, node)) { found = true; break; }
            }
            if (!found) result.push(child);
        }
        return result;
    }

    function indexOfNode(haystack, needle) {
        for (var i = 0; i < haystack.length; i++) {
            if (needle.isSameNode(haystack[i])) return true;
        }
        return false;
    }

    async function translate(txt, type, sl, tl) {
        return await chrome.runtime.sendMessage({
            action: "translate", type: type, text: txt, sl: sl, tl: tl, ak: ak
        });
    }
}
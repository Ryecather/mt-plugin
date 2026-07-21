// ===== 百度翻译 API =====
var BAIDU_API = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

function toBaiduLang(code) {
    var map = {
        'auto': 'auto', 'zh-CN': 'zh', 'zh-TW': 'cht', 'zh': 'zh',
        'en': 'en', 'ja': 'jp', 'jp': 'jp', 'ko': 'kor', 'kor': 'kor',
        'fr': 'fra', 'fra': 'fra', 'de': 'de', 'es': 'spa', 'spa': 'spa',
        'pt': 'pt', 'ru': 'ru', 'ar': 'ara', 'ara': 'ara', 'vi': 'vi',
        'th': 'th', 'it': 'it', 'nl': 'nl', 'pl': 'pl', 'tr': 'tr',
        'id': 'id', 'ms': 'ms', 'hi': 'hi',
    };
    return map[code] || (code || '');
}

async function translateWithBaidu(texts, source, target) {
    if (!texts || (Array.isArray(texts) && texts.length === 0)) return { translatedText: [] };

    var settings = await getSettingsAsync();
    var appid = settings['baidu-appid'] || '';
    var secretKey = settings['baidu-secret'] || '';
    if (!appid || !secretKey) throw new Error('请先在设置中填写百度 APP ID 和 Secret Key');

    var srcLang = toBaiduLang(source) || 'auto';
    var tgtLang = toBaiduLang(target);
    if (!tgtLang) throw new Error('目标语言不能为空');

    // 多条文本批量翻译：用 \n 分隔，但 text 自身可能含 \n（如 <br>），
    // 所以先把文本内的 \n 替换为占位符，join 后再发请求，结果再换回来。
    var NL = ''; // Unicode PUA，正常文本中几乎不可能出现
    var rawText;
    if (Array.isArray(texts)) {
        rawText = texts.map(function (t) { return t.replace(/\n/g, NL); }).join('\n');
    } else {
        rawText = texts;
    }
    var salt = String(Date.now());
    var sign = MD5(appid + rawText + salt + secretKey);

    var body = 'q=' + encodeURIComponent(rawText)
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
    if (data.error_code) {
        throw new Error('Baidu error ' + data.error_code + ': ' + (data.error_msg || ''));
    }

    // 百度按 \n 分隔返回多个 trans_result，每条对应一个片段
    if (data.trans_result && data.trans_result.length > 0) {
        var translated = data.trans_result.map(function (r) { return r.dst.replace(new RegExp(NL, 'g'), '\n'); });
        if (Array.isArray(texts)) {
            return { translatedText: translated };
        }
        return { translatedText: translated.join('') };
    }
    return { translatedText: Array.isArray(texts) ? texts.map(function(){return ''}) : '' };
}

// 翻译路由
async function doTranslateRequest(text, source, target, format, apiKey) {
    var settings = await getSettingsAsync();
    var provider = settings['provider'] || 'baidu';

    if (provider === 'custom') {
        var endpoint = settings['api-endpoint'];
        if (!endpoint.endsWith('/')) endpoint += '/';
        var resp = await fetch(endpoint + "translate", {
            method: "POST",
            body: JSON.stringify({ q: text, source: source, target: target, format: format, api_key: apiKey }),
            headers: { "Content-Type": "application/json" }
        });
        return resp.json();
    }

    return translateWithBaidu(text, source, target);
}

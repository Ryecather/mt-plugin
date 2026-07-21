// Firefox 使用 storage.local（Chrome 用 storage.sync）
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

var _bubbleHost = null;
var _bubbleCss = '';

// ===== 气泡样式（CSS 字符串独立维护，不写任何 inline style）=====
(function loadBubbleCss() {
    // 通过 fetch 加载独立 CSS 文件，失败则用内联兜底
    var cssUrl = (typeof browser !== 'undefined' ? browser : chrome).runtime.getURL('content_scripts.css');
    fetch(cssUrl)
        .then(function (r) { if (r.ok) return r.text(); throw new Error('css fetch failed'); })
        .then(function (css) { _bubbleCss = css; })
        .catch(function () {
            // 兜底 CSS — 与 content_scripts.css 保持同步
            _bubbleCss = ':host{all:initial;position:fixed;z-index:2147483647;display:flex;flex-direction:column;min-width:200px;max-width:420px;background:#292a2d;border:1px solid rgba(255,255,255,0.12);border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.4);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.6;color:#e8eaed}.bubble-header{display:flex;align-items:center;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0}.bubble-title{font-size:12px;color:#8ab4f8;white-space:nowrap}.bubble-spacer{flex:1}.bubble-btn{background:none;border:none;color:#9aa0a6;cursor:pointer;padding:2px 6px;border-radius:3px;font-size:inherit;font-family:inherit;line-height:inherit}.bubble-btn:hover{color:#e8eaed;background:rgba(255,255,255,0.08)}.bubble-btn-close{font-size:14px}.bubble-body{padding:10px 12px;overflow-y:auto;flex:1;min-height:0;word-break:break-word}';
        });
})();

function removeBubble() {
    if (_bubbleHost) {
        _bubbleHost.remove();
        _bubbleHost = null;
    }
}

function showBubble(text, selectionRect) {
    removeBubble();

    var maxBubbleH = Math.max(120, Math.floor(window.innerHeight * 0.6));

    // ---- Shadow DOM 宿主 ----
    var host = document.createElement('div');
    host.id = '__yimt_host';
    // 先隐藏，等 DOM 构建完+计算好位置再显示，避免闪烁
    host.setAttribute('style', 'position:fixed;z-index:2147483647;visibility:hidden;');
    host.addEventListener('click', function (e) { e.stopPropagation(); });

    var shadow = host.attachShadow({ mode: 'closed' });

    // ---- CSS ----
    var style = document.createElement('style');
    style.textContent = _bubbleCss;

    // ---- 容器 ----
    var container = document.createElement('div');
    container.style.maxHeight = maxBubbleH + 'px';

    // ---- 标题栏 ----
    var header = document.createElement('div');
    header.className = 'bubble-header';

    var titleSpan = document.createElement('span');
    titleSpan.className = 'bubble-title';
    titleSpan.textContent = '翻译结果';

    var spacer = document.createElement('span');
    spacer.className = 'bubble-spacer';

    var copyBtn = document.createElement('button');
    copyBtn.className = 'bubble-btn';
    copyBtn.title = '复制';
    copyBtn.textContent = '📋';
    copyBtn.onclick = function () {
        navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = '✓';
            setTimeout(function () { copyBtn.textContent = '📋'; }, 1500);
        });
    };

    var closeBtn = document.createElement('button');
    closeBtn.className = 'bubble-btn bubble-btn-close';
    closeBtn.title = '关闭';
    closeBtn.textContent = '✕';
    closeBtn.onclick = removeBubble;

    header.appendChild(titleSpan);
    header.appendChild(spacer);
    header.appendChild(copyBtn);
    header.appendChild(closeBtn);

    // ---- 内容区 ----
    var body = document.createElement('div');
    body.className = 'bubble-body';
    body.textContent = text;

    // ---- 组装 ----
    container.appendChild(header);
    container.appendChild(body);
    shadow.appendChild(style);
    shadow.appendChild(container);

    document.body.appendChild(host);
    _bubbleHost = host;

    // ---- 计算位置 ----
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var top = selectionRect.bottom + 8;
    var left = selectionRect.left;

    if (top + 120 > vh - 10) {
        top = selectionRect.top - maxBubbleH - 8;
    }
    if (top < 10) top = 10;
    if (left + 420 > vw - 10) left = vw - 430;
    if (left < 10) left = 10;

    host.style.top = top + 'px';
    host.style.left = left + 'px';
    host.style.visibility = 'visible';

    // 微调：如果渲染后超出视口，向上偏移
    requestAnimationFrame(function () {
        var actual = host.getBoundingClientRect();
        if (actual.bottom > vh - 10) {
            top = vh - actual.height - 10;
            if (top < 10) top = 10;
            host.style.top = top + 'px';
        }
    });
}

function getSelectionRect() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    var range = sel.getRangeAt(0);
    if (range.collapsed) return null;
    var rects = range.getClientRects();
    if (rects.length === 0) return null;
    var rect = rects[rects.length - 1];
    return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
}

document.addEventListener('mousedown', function (e) {
    if (_bubbleHost && !_bubbleHost.contains(e.target)) {
        removeBubble();
    }
}, true);

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _bubbleHost) {
        removeBubble();
    }
}, true);

chrome.runtime.onMessage.addListener(function (request, sender, sendMessage) {
    if (request.todo === "translated") {
        var rect = getSelectionRect();
        showBubble(request.result, rect || { top: 200, bottom: 220, left: 200, right: 300 });
    }

    if (request.todo === 'text_direction') {
        document.body.style.direction = "ltr";
    }

    if (request.todo === 'failed') {
        var rect = getSelectionRect();
        showBubble('翻译失败: ' + (request.message || '未知错误'), rect || { top: 200, bottom: 220, left: 200, right: 300 });
    }

    if (request.todo === 'getSelection') {
        var sel = window.getSelection();
        var text = sel ? sel.toString().trim() : '';
        sendMessage({ text: text });
        return true;
    }
});

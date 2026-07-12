var _bubbleEl = null;

function removeBubble() {
    if (_bubbleEl) {
        _bubbleEl.remove();
        _bubbleEl = null;
    }
}

function showBubble(text, selectionRect) {
    removeBubble();

    // 计算气泡的最大可用高度（视口高度的 60%，最小 120px）
    var maxBubbleH = Math.max(120, Math.floor(window.innerHeight * 0.6));

    var bubble = document.createElement('div');
    bubble.id = '__yimt_bubble';
    bubble.innerHTML =
        '<div style="display:flex;align-items:center;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;">'
        + '<span style="font-size:12px;color:#8ab4f8;white-space:nowrap;">翻译结果</span>'
        + '<span style="flex:1;"></span>'
        + '<button id="__yimt_copy" style="background:none;border:none;color:#9aa0a6;cursor:pointer;font-size:12px;padding:2px 6px;border-radius:3px;" title="复制">📋</button>'
        + '<button id="__yimt_close" style="background:none;border:none;color:#9aa0a6;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:3px;" title="关闭">✕</button>'
        + '</div>'
        + '<div class="__yimt_body" style="padding:10px 12px;color:#e8eaed;font-size:14px;line-height:1.6;overflow-y:auto;flex:1;min-height:0;word-break:break-word;">'
        + text
        + '</div>';

    bubble.style.cssText =
        'position:fixed;z-index:2147483647;background:#292a2d;border:1px solid rgba(255,255,255,0.12);'
        + 'border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.4);min-width:200px;max-width:420px;'
        + 'max-height:' + maxBubbleH + 'px;'
        + 'display:flex;flex-direction:column;'
        + 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    document.body.appendChild(bubble);

    bubble.querySelector('#__yimt_close').onclick = removeBubble;
    bubble.querySelector('#__yimt_copy').onclick = function () {
        navigator.clipboard.writeText(text).then(function () {
            var btn = bubble.querySelector('#__yimt_copy');
            btn.textContent = '✓';
            setTimeout(function () { btn.textContent = '📋'; }, 1500);
        });
    };

    // 计算位置：优先在选区下方，空间不够则放上方
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var top = selectionRect.bottom + 8;
    var left = selectionRect.left;

    // 估算：如果下方放不下（剩 100px 不够），就放上方
    if (top + 120 > vh - 10) {
        top = selectionRect.top - maxBubbleH - 8;
    }
    // 上方也放不下，贴顶部
    if (top < 10) top = 10;

    // 左右边界保护
    if (left + 420 > vw - 10) left = vw - 430;
    if (left < 10) left = 10;

    bubble.style.top = top + 'px';
    bubble.style.left = left + 'px';

    // 如果 top + maxBubbleH 超出视口，重新校准（确保气泡完全可见）
    var actualRect = bubble.getBoundingClientRect();
    if (actualRect.bottom > vh - 10) {
        top = vh - actualRect.height - 10;
        if (top < 10) top = 10;
        bubble.style.top = top + 'px';
    }

    bubble.addEventListener('click', function (e) { e.stopPropagation(); });
    _bubbleEl = bubble;
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
    if (_bubbleEl && !_bubbleEl.contains(e.target)) {
        removeBubble();
    }
}, true);

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _bubbleEl) {
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
// 恢复网页（独立函数，注入到页面执行）
function restorePage() {
    if (typeof window.__ltActive === 'undefined' || !window.__ltActive) return;
    var nodes = document.querySelectorAll('[data-__lt-translated="true"]');
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var original = n.dataset.__ltOriginal;
        // 只恢复顶级节点（父节点不在翻译列表中）
        var isChild = false;
        var p = n.parentNode;
        while (p && p !== document.documentElement) {
            if (p.dataset && p.dataset.__ltTranslated === 'true') { isChild = true; break; }
            p = p.parentNode;
        }
        if (isChild) continue;
        if (original !== undefined) {
            if (n.dataset.__ltOriginalType === 'html') {
                n.innerHTML = original;
            } else {
                n.innerText = original;
            }
        }
        delete n.dataset.__ltOriginal;
        delete n.dataset.__ltOriginalType;
        delete n.dataset.__ltTranslated;
        delete n.dataset.__ltQueued;
    }
    document.title = (window.__ltOriginalTitle) || document.title;
    delete window.__ltOriginalTitle;
    window.__ltActive = false;
}

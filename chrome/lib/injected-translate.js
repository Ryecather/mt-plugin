/*************************************
 *     content-script 注入脚本函数
 *     在页面上下文执行，通过 chrome.runtime.sendMessage 与 background 通信
 *************************************/
export async function doTranslate(sl, tl, ak) {
    if (window.__ltActive) return;
    window.__ltActive = true;

    var __nodesToTranslate = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                              'p', 'span', 'div',
                              'li', 'a', 'label', 'figcaption', 'td', 'th',
                              'button', 'header',
                              'em', 'strong', 'b', 'i', 'legend'];
    var __translationCache = {};

    if (!window.__ltOriginalTitle) window.__ltOriginalTitle = document.title;

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
        if (!window.__ltActive) return;
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

    // 从 HTML 字符串中移除翻译标记属性，防止还原后出现"僵尸"已翻译节点
    function stripTranslationAttrs(html) {
        return html.replace(/\s*data-__lt-(?:original|translated|queued|original-type)(?:\s*=\s*"[^"]*")?/gi, '');
    }

    // 将翻译文本应用到节点，同时保留子元素（如 <a> 链接）DOM 结构
    function applyTranslationToNode(node, translatedText) {
        // 纯文本节点：直接替换 innerText
        if (node.innerHTML === node.innerText) {
            node.innerText = translatedText;
            return;
        }

        // 收集直接的文本子节点（不包括子元素内部的文本）
        var textNodes = [];
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
                textNodes.push(node.childNodes[i]);
            }
        }

        if (textNodes.length === 0) {
            // 没有直接文本子节点，如 <p><a>...</a></p>
            // fallback：替换 innerText（会丢失子元素，但很少见）
            node.innerText = translatedText;
            return;
        }

        // 只有一个直接文本子节点：直接设置值
        if (textNodes.length === 1) {
            textNodes[0].nodeValue = translatedText;
            return;
        }

        // 多个直接文本子节点（被 <a> 等内联元素隔开）
        // 把翻译结果放进第一个文本节点，清空后面的
        textNodes[0].nodeValue = translatedText;
        for (var j = 1; j < textNodes.length; j++) {
            textNodes[j].nodeValue = '';
        }
    }

    async function translateNodes(allNodes, sl, tl) {
        var requests = [];

        for (var i = 0; i < allNodes.length; i++) {
            var node = allNodes[i];
            var text = node.innerText;
            if (!text || !text.trim()) continue;

            // 跳过内部已有已翻译子节点的节点：
            // 否则 innerText 里是已翻译文本（再翻译会乱），__ltOriginal 也会存污染数据
            if (node.querySelector('[data-__lt-translated="true"]')) continue;

            // 缓存命中：只用 innerText 做 key
            if (text.length <= 100 && __translationCache[text]) {
                if (!node.dataset.__ltOriginal) {
                    var isHtmlCache = (node.innerHTML != node.innerText);
                    if (isHtmlCache) {
                        node.dataset.__ltOriginal = stripTranslationAttrs(node.innerHTML);
                        node.dataset.__ltOriginalType = 'html';
                    } else {
                        node.dataset.__ltOriginal = text;
                        node.dataset.__ltOriginalType = 'text';
                    }
                }
                applyTranslationToNode(node, __translationCache[text]);
                setNodeTranslated(node);
                continue;
            }

            requests.push({ text: text, node: node });
        }

        if (requests.length === 0) return;

        var responses = await translateBatch(requests.map(function (r) { return r.text; }), 'text', sl, tl);
        if (responses.error) return;

        var translations = responses.translatedText;
        for (var i = 0; i < translations.length; i++) {
            var respText = translations[i];
            var req = requests[i];

            if (req.text.length <= 100) __translationCache[req.text] = respText;

            // 保存原始内容和类型，供 restorePage 使用
            if (!req.node.dataset.__ltOriginal) {
                var isHtml = (req.node.innerHTML != req.node.innerText);
                if (isHtml) {
                    req.node.dataset.__ltOriginal = stripTranslationAttrs(req.node.innerHTML);
                    req.node.dataset.__ltOriginalType = 'html';
                } else {
                    req.node.dataset.__ltOriginal = req.text;
                    req.node.dataset.__ltOriginalType = 'text';
                }
            }

            applyTranslationToNode(req.node, respText);
            setNodeTranslated(req.node);
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

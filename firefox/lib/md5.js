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
        var paddedLen = ((len + 8) >>> 6) + 1;
        var padded = new Array(paddedLen * 64);
        var i;
        for (i = 0; i < len; i++) padded[i] = arr[i];
        padded[len] = 0x80;
        for (i = len + 1; i < paddedLen * 64 - 8; i++) padded[i] = 0;
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

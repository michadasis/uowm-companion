/**
 * The token sign-in works by watching the real Universis web app inside a
 * WebView. The student signs in through the University's own pages (CAS and
 * MFA), so no password ever reaches this app. Once the web app makes its first
 * authenticated call, this script reads the Bearer token off that request —
 * with a fallback that scans the page's own storage — and hands it back to the
 * app, which keeps only the token.
 */
export const INJECTED_TOKEN_HOOK = String.raw`
(function () {
  if (window.__uowmHook) return;
  window.__uowmHook = true;
  // Every new token goes to the app, not just the first: the page may open
  // with one left from an earlier session, long expired, before the student
  // signs in & a live one takes its place. The app keeps the live one.
  function send(token) {
    if (!token || token === window.__uowmLast) return;
    window.__uowmLast = token;
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'universis-token', token: token }));
    } catch (e) {}
  }
  function fromHeader(value) {
    if (typeof value === 'string' && /^bearer\s+/i.test(value)) return value.replace(/^bearer\s+/i, '').trim();
    return null;
  }
  var setHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
    try { if (String(key).toLowerCase() === 'authorization') { var t = fromHeader(value); if (t) send(t); } } catch (e) {}
    return setHeader.apply(this, arguments);
  };
  var nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function (input, init) {
      try {
        var h = init && init.headers;
        if (h) {
          var a = typeof h.get === 'function' ? h.get('Authorization') : (h.Authorization || h.authorization);
          var t = fromHeader(a);
          if (t) send(t);
        }
      } catch (e) {}
      return nativeFetch.apply(this, arguments);
    };
  }
  function scan() {
    try {
      for (var s = 0; s < 2; s++) {
        var store = s === 0 ? sessionStorage : localStorage;
        for (var i = 0; i < store.length; i++) {
          var v = store.getItem(store.key(i));
          if (!v) continue;
          if (/^ey[A-Za-z0-9_-]+\.ey[A-Za-z0-9_-]+\./.test(v)) { send(v); return; }
          try {
            var o = JSON.parse(v);
            var t = o && (o.access_token || o.accessToken || (o.token && (o.token.access_token || o.token.accessToken)));
            if (t) { send(t); return; }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }
  setInterval(scan, 1500);
})();
true;
`;

interface TokenMessage {
  type: 'universis-token';
  token: string;
}

function isTokenMessage(value: unknown): value is TokenMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'universis-token' &&
    typeof (value as { token?: unknown }).token === 'string' &&
    (value as TokenMessage).token.length > 0
  );
}

/** Reads a token out of a WebView message, or null when it is anything else. */
export function parseTokenMessage(raw: string): string | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isTokenMessage(parsed) ? parsed.token : null;
  } catch {
    return null;
  }
}

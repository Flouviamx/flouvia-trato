/* ============================================================================
 * TRATO Elements — loader del cotizador embebible.
 *
 * Uso en el sitio de un tercero (una sola línea + un div):
 *
 *   <script src="https://trato.flouvia.com/embed.js" async></script>
 *   <div data-trato-cotizador data-token="abc123"></div>
 *
 * El loader inyecta un <iframe> a /embed/{token}, muestra un skeleton mientras
 * carga, ajusta la altura sola (postMessage 'trato:resize') y re-emite los
 * eventos del cotizador como CustomEvents sobre el <div> anfitrión:
 *
 *   document.querySelector('[data-trato-cotizador]')
 *     .addEventListener('trato:approved', (e) => console.log(e.detail));
 *
 * Atributos opcionales del <div>:
 *   data-token   (requerido) token público de la cotización
 *   data-base    origen alterno (self-host / staging)
 *   data-min-height  alto inicial del skeleton en px (default 420)
 *
 * Eventos: trato:ready · trato:approved · trato:rejected · trato:message · trato:pay
 * ========================================================================== */
(function () {
    'use strict';

    var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Origen de Trato: derivado del src de ESTE script (funciona en prod y en dev).
    var ORIGIN = (function () {
        try {
            var s = document.currentScript || (function () {
                var all = document.getElementsByTagName('script');
                return all[all.length - 1];
            })();
            return new URL(s.src).origin;
        } catch (e) {
            return 'https://trato.flouvia.com';
        }
    })();

    // Inyecta una sola vez los estilos del skeleton/transición.
    function injectStyles() {
        if (document.getElementById('trato-embed-style')) return;
        var css =
            '.trato-embed{position:relative;width:100%;}' +
            '.trato-embed iframe{width:100%;border:0;display:block;background:transparent;' +
            'opacity:0;transition:opacity .35s ease,height .2s ease;color-scheme:normal;}' +
            '.trato-embed.is-ready iframe{opacity:1;}' +
            '.trato-embed-skeleton{position:absolute;inset:0;border-radius:18px;overflow:hidden;' +
            'background:#fcfcfc;box-shadow:inset 0 0 0 1px rgba(10,25,47,.06);}' +
            '.trato-embed.is-ready .trato-embed-skeleton{opacity:0;transition:opacity .3s ease;pointer-events:none;}' +
            '.trato-embed-shimmer{position:absolute;inset:0;background:linear-gradient(100deg,' +
            'transparent 20%,rgba(10,25,47,.05) 40%,rgba(10,25,47,.07) 50%,rgba(10,25,47,.05) 60%,transparent 80%);' +
            'background-size:200% 100%;' + (REDUCED ? '' : 'animation:trato-shimmer 1.4s infinite linear;') + '}' +
            '@keyframes trato-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
        var st = document.createElement('style');
        st.id = 'trato-embed-style';
        st.textContent = css;
        (document.head || document.documentElement).appendChild(st);
    }

    function mount(el) {
        if (el.__tratoMounted) return;
        el.__tratoMounted = true;

        var token = el.getAttribute('data-token');
        if (!token) {
            console.warn('[Trato] Falta data-token en', el);
            return;
        }
        injectStyles();

        // Permite apuntar a otro origen (self-host / staging) con data-base.
        var base = el.getAttribute('data-base') || ORIGIN;
        var minH = parseInt(el.getAttribute('data-min-height') || '420', 10);

        el.classList.add('trato-embed');

        // Skeleton mientras carga (evita el salto / caja vacía).
        var skeleton = document.createElement('div');
        skeleton.className = 'trato-embed-skeleton';
        skeleton.innerHTML = '<div class="trato-embed-shimmer"></div>';
        el.appendChild(skeleton);

        var iframe = document.createElement('iframe');
        iframe.src = base + '/embed/' + encodeURIComponent(token);
        iframe.setAttribute('title', 'Cotización');
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        // 'payment' habilita Stripe dentro del iframe; 'clipboard-write' por si se copia.
        iframe.setAttribute('allow', 'payment; clipboard-write');
        iframe.style.height = (minH > 0 ? minH : 420) + 'px';
        el.appendChild(iframe);
        el.__tratoIframe = iframe;

        // Marca como listo: revela el iframe y oculta el skeleton.
        el.__tratoReveal = function () {
            if (el.__tratoReady) return;
            el.__tratoReady = true;
            el.classList.add('is-ready');
            setTimeout(function () { if (skeleton.parentNode) skeleton.parentNode.removeChild(skeleton); }, 400);
        };
        // Fallback: si por alguna razón no llega 'trato:ready', revela al cargar.
        iframe.addEventListener('load', function () { setTimeout(el.__tratoReveal, 250); });
    }

    // Un solo listener global despacha al iframe correcto por contentWindow.
    window.addEventListener('message', function (ev) {
        if (ev.origin !== ORIGIN) return;
        var data = ev.data;
        if (!data || data.source !== 'trato' || !data.type) return;

        // Localiza el host cuyo iframe envió el mensaje.
        var hosts = document.querySelectorAll('.trato-embed');
        var host = null;
        for (var i = 0; i < hosts.length; i++) {
            if (hosts[i].__tratoIframe && hosts[i].__tratoIframe.contentWindow === ev.source) {
                host = hosts[i];
                break;
            }
        }
        if (!host) return;

        if (data.type === 'trato:resize' && data.height) {
            host.__tratoIframe.style.height = data.height + 'px';
            return;
        }
        if (data.type === 'trato:ready' && host.__tratoReveal) {
            host.__tratoReveal();
        }
        // Re-emite todo como CustomEvent sobre el div anfitrión.
        host.dispatchEvent(new CustomEvent(data.type, { detail: data.detail || {}, bubbles: true }));
    });

    function init() {
        var els = document.querySelectorAll('[data-trato-cotizador]');
        for (var i = 0; i < els.length; i++) mount(els[i]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Auto-monta cotizadores inyectados DESPUÉS de la carga (SPAs, modales…).
    if ('MutationObserver' in window) {
        var mo = new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var added = muts[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var n = added[j];
                    if (n.nodeType !== 1) continue;
                    if (n.matches && n.matches('[data-trato-cotizador]')) mount(n);
                    if (n.querySelectorAll) {
                        var inner = n.querySelectorAll('[data-trato-cotizador]');
                        for (var k = 0; k < inner.length; k++) mount(inner[k]);
                    }
                }
            }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Expuesto por si el host quiere montar manualmente.
    window.Trato = window.Trato || {};
    window.Trato.mount = init;
})();

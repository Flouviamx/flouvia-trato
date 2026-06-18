import { defineComponent, h, ref, onMounted, onUnmounted, watch } from 'vue';
import { mountCotizador } from './core';
import type { CordElementOptions, CordEventDetail, CordController } from './types';

export const CordCotizador = defineComponent({
  name: 'CordCotizador',
  props: {
    token: {
      type: String,
      required: true,
    },
    baseUrl: {
      type: String,
      required: false,
    },
    minHeight: {
      type: Number,
      required: false,
    },
  },
  emits: ['ready', 'approved', 'rejected', 'message', 'pay', 'event'],
  setup(props, { emit, attrs }) {
    const rootEl = ref<HTMLDivElement | null>(null);
    let controller: CordController | null = null;

    const mount = () => {
      if (!rootEl.value) return;
      if (controller) {
        controller.destroy();
      }

      const opts: CordElementOptions = {
        token: props.token,
        baseUrl: props.baseUrl,
        minHeight: props.minHeight,
        onReady: () => emit('ready'),
        onApproved: (d: CordEventDetail) => emit('approved', d),
        onRejected: (d: CordEventDetail) => emit('rejected', d),
        onMessage: (d: CordEventDetail) => emit('message', d),
        onPay: (d: CordEventDetail) => emit('pay', d),
        onEvent: (t: string, d: CordEventDetail) => emit('event', t, d),
      };

      controller = mountCotizador(rootEl.value, opts);
    };

    onMounted(() => {
      mount();
    });

    onUnmounted(() => {
      if (controller) {
        controller.destroy();
        controller = null;
      }
    });

    watch(() => [props.token, props.baseUrl, props.minHeight], () => {
      mount();
    });

    return () => h('div', { ref: rootEl, ...attrs });
  },
});

export default CordCotizador;
export type { CordEventDetail } from './types';

import { nextTick, onBeforeUnmount, onMounted, type Ref } from 'vue';

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useDialogFocus(dialog: Ref<HTMLElement | null>, close: () => void) {
  let previousElement: HTMLElement | null = null;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab' || !dialog.value) {
      return;
    }

    const focusable = Array.from(
      dialog.value.querySelectorAll<HTMLElement>(focusableSelector),
    );
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  onMounted(async () => {
    previousElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    window.addEventListener('keydown', handleKeyDown);
    await nextTick();
    dialog.value?.querySelector<HTMLElement>(focusableSelector)?.focus();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
    previousElement?.focus();
  });
}

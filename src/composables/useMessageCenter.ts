import { onUnmounted, reactive } from 'vue';

export type MessageType = 'success' | 'info' | 'warning' | 'error';

export interface AppMessage {
  id: number;
  type: MessageType;
  text: string;
  count: number;
}

const messageDurations: Record<MessageType, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 8000,
};

export function useMessageCenter() {
  const messages = reactive<AppMessage[]>([]);
  const timeouts = new Map<number, ReturnType<typeof setTimeout>>();
  let nextId = 0;

  function dismiss(id: number) {
    const timeout = timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.delete(id);
    }

    const index = messages.findIndex((message) => message.id === id);
    if (index >= 0) {
      messages.splice(index, 1);
    }
  }

  function schedule(message: AppMessage) {
    const existingTimeout = timeouts.get(message.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    timeouts.set(message.id, setTimeout(() => dismiss(message.id), messageDurations[message.type]));
  }

  function showMessage(type: MessageType, text: string) {
    const existing = messages.find((message) =>
      message.type === type && message.text === text,
    );
    if (existing) {
      existing.count += 1;
      schedule(existing);
      return;
    }

    const message = { id: ++nextId, type, text, count: 1 };
    messages.push(message);
    schedule(message);
  }

  onUnmounted(() => {
    timeouts.forEach((timeout) => clearTimeout(timeout));
    timeouts.clear();
  });

  return { messages, dismiss, showMessage };
}

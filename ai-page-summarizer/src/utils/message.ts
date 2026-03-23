import type { Message, MessageType } from '@/types';

export function sendMessage<T = unknown>(
  type: MessageType,
  payload?: T,
): Promise<unknown> {
  return chrome.runtime.sendMessage({ type, payload } satisfies Message<T>);
}

export function onMessage(
  handler: (message: Message, sender: chrome.runtime.MessageSender) => void | Promise<unknown>,
): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message as Message, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch((err) => {
        sendResponse({ error: String(err) });
      });
      return true; // keep the message channel open for async response
    }
  });
}

/**
 * Message Passing Helper Functions
 */

import { browserAPI } from '../browser';
import type { Message } from './types';

export * from './types';

/**
 * Send a message from UI to background script
 */
export async function sendMessage<TPayload = any, TResponse = any>(
  type: string,
  payload?: TPayload
): Promise<TResponse> {
  const message: Message<TPayload> = { type: type as any, payload };
  return browserAPI.runtime.sendMessage<Message<TPayload>, TResponse>(message);
}

/**
 * Listen for messages in background script
 */
export function onMessage<TPayload = any, TResponse = any>(
  handler: (
    message: Message<TPayload>,
    sender: any
  ) => TResponse | Promise<TResponse> | void
): void {
  browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message, sender);

    // Handle async responses
    if (result instanceof Promise) {
      result.then(sendResponse).catch(error => {
        console.error('Message handler error:', error);
        sendResponse({ error: error.message });
      });
      return true; // Indicates async response
    }

    // Handle sync responses
    if (result !== undefined) {
      sendResponse(result);
    }
  });
}

/**
 * Wiki.js Chatbot Plugin
 * This file integrates the chatbot component into Wiki.js
 */

import ChatBot from './ChatBot.vue';

export default {
  install(Vue) {
    // Register the chatbot component globally
    Vue.component('ChatBot', ChatBot);
  }
};

// Auto-install when included via script tag
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(ChatBotPlugin);
}

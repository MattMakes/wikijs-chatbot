<template>
  <div class="chatbot-container">
    <!-- Chat Button -->
    <v-btn
      v-if="!isOpen"
      fab
      fixed
      bottom
      right
      color="primary"
      large
      class="chatbot-button"
      @click="toggleChat"
    >
      <v-icon>mdi-chat</v-icon>
    </v-btn>

    <!-- Chat Window -->
    <v-card
      v-if="isOpen"
      class="chatbot-window"
      elevation="24"
    >
      <!-- Header -->
      <v-card-title class="chatbot-header primary white--text">
        <v-icon left color="white">mdi-robot</v-icon>
        <span>Wiki Assistant</span>
        <v-spacer></v-spacer>
        <v-btn icon dark @click="toggleChat">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Messages Container -->
      <v-card-text class="chatbot-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="welcome-message">
          <v-icon large color="primary">mdi-hand-wave</v-icon>
          <h3>Hello! How can I help you?</h3>
          <p>Ask me anything about the content in this wiki.</p>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message', message.role]"
        >
          <div class="message-avatar">
            <v-icon :color="message.role === 'user' ? 'primary' : 'secondary'">
              {{ message.role === 'user' ? 'mdi-account' : 'mdi-robot' }}
            </v-icon>
          </div>

          <div class="message-content">
            <div class="message-text" v-html="renderMarkdown(message.content)"></div>

            <!-- Sources -->
            <div v-if="message.sources && message.sources.length > 0" class="message-sources">
              <v-divider class="my-2"></v-divider>
              <div class="sources-label">
                <v-icon small>mdi-file-document</v-icon>
                <span>Sources:</span>
              </div>
              <a
                v-for="(source, idx) in message.sources"
                :key="idx"
                :href="`/${source.path}`"
                target="_blank"
                style="text-decoration: none;"
              >
                <v-chip
                  small
                  outlined
                  class="source-chip"
                >
                  {{ source.title }}
                </v-chip>
              </a>
            </div>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="message assistant">
          <div class="message-avatar">
            <v-icon color="secondary">mdi-robot</v-icon>
          </div>
          <div class="message-content">
            <v-progress-circular indeterminate size="20" width="2"></v-progress-circular>
            <span class="ml-2">Thinking...</span>
          </div>
        </div>
      </v-card-text>

      <!-- Input Area -->
      <v-divider></v-divider>
      <v-card-actions class="chatbot-input">
        <v-text-field
          v-model="userInput"
          placeholder="Type your question..."
          outlined
          dense
          hide-details
          :disabled="isLoading"
          @keyup.enter="sendMessage"
          append-icon="mdi-send"
          @click:append="sendMessage"
        ></v-text-field>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import axios from 'axios';
import DOMPurify from 'dompurify';
// Support both marked v4+ (named export) and earlier versions (default export)
import marked from 'marked';
const markedParser = marked.parse || marked;

export default {
  name: 'ChatBot',

  data() {
    return {
      isOpen: false,
      messages: [],
      userInput: '',
      isLoading: false,
      sessionId: null,
      apiBaseUrl: process.env.VUE_APP_CHATBOT_API || 'http://localhost:3001'
    };
  },

  mounted() {
    this.initSession();
  },

  methods: {
    async initSession() {
      try {
        // Get user ID from Vuex store if available
        const userId = this.$store?.state?.user?.id || null;

        const response = await axios.post(`${this.apiBaseUrl}/api/chat/session`, {
          userId
        });
        this.sessionId = response.data.sessionId;
      } catch (error) {
        console.error('Failed to create chat session:', error);
      }
    },

    toggleChat() {
      this.isOpen = !this.isOpen;

      if (this.isOpen) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },

    async sendMessage() {
      if (!this.userInput.trim() || this.isLoading) return;

      const message = this.userInput.trim();
      this.userInput = '';

      // Add user message to UI
      this.messages.push({
        role: 'user',
        content: message
      });

      this.scrollToBottom();
      this.isLoading = true;

      try {
        const response = await axios.post(`${this.apiBaseUrl}/api/chat/message`, {
          sessionId: this.sessionId,
          message: message
        });

        // Add assistant response to UI
        this.messages.push({
          role: 'assistant',
          content: response.data.message,
          sources: response.data.sources
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.'
        });
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    },

    renderMarkdown(text) {
      if (!text) return '';
      try {
        const html = markedParser(text);
        return DOMPurify.sanitize(html);
      } catch (error) {
        console.error('Failed to render markdown:', error);
        return DOMPurify.sanitize(text);
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }
};
</script>

<style scoped>
.chatbot-button {
  z-index: 1000;
  margin: 0 16px 16px 0;
}

.chatbot-window {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 400px;
  max-width: calc(100vw - 32px);
  height: 600px;
  max-height: calc(100vh - 32px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.chatbot-header {
  flex-shrink: 0;
}

.chatbot-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f5f5;
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.welcome-message h3 {
  margin: 16px 0 8px;
  color: #333;
}

.message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin: 0 8px;
}

.message-content {
  max-width: 70%;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.user .message-content {
  background: #1976d2;
  color: white;
}

.message-text {
  word-wrap: break-word;
}

.message-text >>> p {
  margin: 0 0 8px;
}

.message-text >>> p:last-child {
  margin-bottom: 0;
}

.message-text >>> code {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.message-text >>> pre {
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.message.user .message-text >>> code,
.message.user .message-text >>> pre {
  background: rgba(255, 255, 255, 0.2);
}

.message-sources {
  margin-top: 8px;
}

.sources-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
  color: #666;
  margin-bottom: 4px;
}

.source-chip {
  margin: 2px;
  text-decoration: none;
}

.chatbot-input {
  flex-shrink: 0;
  padding: 12px;
}

.chatbot-input .v-text-field {
  width: 100%;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .chatbot-window {
    width: 100%;
    height: 100%;
    max-width: 100vw;
    max-height: 100vh;
    bottom: 0;
    right: 0;
    border-radius: 0;
  }

  .message-content {
    max-width: 85%;
  }
}
</style>

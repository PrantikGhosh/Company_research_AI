import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Chat with the AI agent
  async chat(conversationId, message, history = []) {
    try {
      const response = await this.api.post('/chat', {
        conversationId,
        message,
        history,
      });
      return response.data;
    } catch (error) {
      console.error('Chat API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  }

  // Research a company
  async researchCompany(companyName) {
    try {
      console.log('🔍 Sending research request for:', companyName);
      const response = await this.api.post('/research', {
        companyName,
      });
      console.log('✅ Research response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Research API Error:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || 'Failed to research company');
    }
  }

  // Generate account plan
  async generateAccountPlan(companyName, researchData, additionalContext = '') {
    try {
      const response = await this.api.post('/generate-plan', {
        companyName,
        researchData,
        additionalContext,
      });
      return response.data;
    } catch (error) {
      console.error('Generate Plan API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate account plan');
    }
  }

  // Update a section of the account plan
  async updateSection(sectionName, currentContent, updateInstructions) {
    try {
      const response = await this.api.post('/update-section', {
        sectionName,
        currentContent,
        updateInstructions,
      });
      return response.data;
    } catch (error) {
      console.error('Update Section API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to update section');
    }
  }

  // Get conversation history
  async getConversationHistory(conversationId) {
    try {
      const response = await this.api.get(`/conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Get Conversation API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to get conversation history');
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health Check Error:', error);
      return { status: 'error' };
    }
  }
}

export default new ApiService();

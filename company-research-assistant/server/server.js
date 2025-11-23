import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Groq with LangChain
if (!process.env.GROQ_API_KEY) {
  console.error('❌ ERROR: GROQ_API_KEY is not set in .env file');
  console.error('Get your API key from: https://console.groq.com/keys');
  process.exit(1);
}

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
});

const llmAccountPlan = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.6,
  maxTokens: 3000,
});

const llmSectionUpdate = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.6,
  maxTokens: 1000,
});

console.log('✅ Groq API key loaded successfully');
console.log('🤖 Using LangChain with Groq (llama-3.3-70b-versatile)');

// In-memory storage for conversations
const conversations = new Map();

// LangChain prompt templates
const chatPromptTemplate = ChatPromptTemplate.fromMessages([
  ['system', `You are an intelligent Company Research Assistant specialized in creating comprehensive account plans. 

Your capabilities:
1. Research companies from multiple sources and synthesize findings
2. Provide real-time updates during research with conversational insights
3. Ask clarifying questions when you encounter conflicting information
4. Generate structured account plans with key sections
5. Help users update specific sections of account plans

When researching:
- Be thorough but concise
- Highlight important findings
- Ask for clarification when needed
- Suggest areas that need more investigation

When generating account plans, include these sections:
1. Executive Summary
2. Company Overview
3. Market Position & Competitors
4. Key Stakeholders
5. Business Challenges & Opportunities
6. Product/Service Fit
7. Engagement Strategy
8. Success Metrics
9. Timeline & Milestones
10. Risk Assessment

Always maintain a professional yet conversational tone.`],
  new MessagesPlaceholder('history'),
  ['human', '{input}']
]);

const researchPromptTemplate = ChatPromptTemplate.fromMessages([
  ['system', 'You are a professional business researcher. Provide factual, well-structured company research.'],
  ['human', `Research the company "{companyName}" and provide comprehensive information including:
1. Company overview (founding, mission, size, location)
2. Products/Services
3. Market position and key competitors
4. Recent news and developments
5. Financial highlights (if public)
6. Key leadership
7. Strategic initiatives

Format the response as a detailed but structured report.`]
]);

const accountPlanPromptTemplate = ChatPromptTemplate.fromMessages([
  ['system', 'You are an expert account planner. Create comprehensive, actionable account plans.'],
  ['human', `Based on the following research about {companyName}, generate a comprehensive account plan.

Research Data:
{researchData}

Additional Context:
{additionalContext}

Create a detailed account plan with all 10 sections:
1. Executive Summary
2. Company Overview
3. Market Position & Competitors
4. Key Stakeholders
5. Business Challenges & Opportunities
6. Product/Service Fit
7. Engagement Strategy
8. Success Metrics
9. Timeline & Milestones
10. Risk Assessment

Format each section with a clear heading (use ## for section titles) and detailed content.`]
]);


// Research Assistant Agent using LangChain
class ResearchAgent {
  constructor() {
    // Create chains
    this.chatChain = RunnableSequence.from([
      chatPromptTemplate,
      llm,
      new StringOutputParser()
    ]);

    this.researchChain = RunnableSequence.from([
      researchPromptTemplate,
      llm,
      new StringOutputParser()
    ]);

    this.accountPlanChain = RunnableSequence.from([
      accountPlanPromptTemplate,
      llmAccountPlan,
      new StringOutputParser()
    ]);
  }

  convertToLangChainMessages(conversationHistory) {
    return conversationHistory.map(msg => {
      if (msg.role === 'system') return new SystemMessage(msg.content);
      if (msg.role === 'user') return new HumanMessage(msg.content);
      if (msg.role === 'assistant') return new AIMessage(msg.content);
      return new HumanMessage(msg.content);
    });
  }

  async chat(conversationId, userMessage, conversationHistory = []) {
    try {
      const history = this.convertToLangChainMessages(conversationHistory);
      
      const responseText = await this.chatChain.invoke({
        history: history,
        input: userMessage
      });

      return {
        message: responseText,
        role: 'assistant'
      };
    } catch (error) {
      console.error('LangChain Chat Error:', error);
      console.error('Error message:', error.message);
      throw new Error(`Failed to get response from AI agent: ${error.message}`);
    }
  }

  async researchCompany(companyName) {
    try {
      // Simulate multi-source research with progressive updates
      const researchPhases = [
        {
          phase: 'basic_info',
          update: `Starting research on ${companyName}... Gathering basic company information.`
        },
        {
          phase: 'market_analysis',
          update: `Analyzing market position and competitors...`
        },
        {
          phase: 'financials',
          update: `Looking into financial data and business model...`
        },
        {
          phase: 'synthesis',
          update: `Synthesizing findings from multiple sources...`
        }
      ];

      // Generate comprehensive research using LangChain
      const responseText = await this.researchChain.invoke({
        companyName: companyName
      });

      return {
        phases: researchPhases,
        research: responseText
      };
    } catch (error) {
      console.error('Research Error:', error);
      console.error('Error details:', error.message);
      throw new Error(`Failed to research company: ${error.message}`);
    }
  }

  async generateAccountPlan(companyName, researchData, additionalContext = '') {
    try {
      const responseText = await this.accountPlanChain.invoke({
        companyName: companyName,
        researchData: researchData,
        additionalContext: additionalContext || 'None provided'
      });

      return this.parseAccountPlan(responseText);
    } catch (error) {
      console.error('Account Plan Generation Error:', error);
      throw new Error('Failed to generate account plan');
    }
  }

  parseAccountPlan(planText) {
    // Parse the plan into sections
    const sections = {};
    const sectionTitles = [
      'Executive Summary',
      'Company Overview',
      'Market Position & Competitors',
      'Key Stakeholders',
      'Business Challenges & Opportunities',
      'Product/Service Fit',
      'Engagement Strategy',
      'Success Metrics',
      'Timeline & Milestones',
      'Risk Assessment'
    ];

    let currentSection = null;
    let currentContent = [];

    const lines = planText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line is a section header
      let isSectionHeader = false;
      for (const title of sectionTitles) {
        if (trimmedLine.includes(title)) {
          // Save previous section
          if (currentSection) {
            sections[currentSection] = currentContent.join('\n').trim();
          }
          currentSection = title;
          currentContent = [];
          isSectionHeader = true;
          break;
        }
      }
      
      if (!isSectionHeader && currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return {
      fullText: planText,
      sections: sections
    };
  }

  async updateSection(sectionName, currentContent, updateInstructions) {
    try {
      const updatePromptTemplate = ChatPromptTemplate.fromMessages([
        ['system', 'You are an expert account planner helping to refine account plan sections.'],
        ['human', `You are updating the "{sectionName}" section of an account plan.

Current Content:
{currentContent}

Update Instructions:
{updateInstructions}

Provide the updated content for this section only. Maintain the same format and style.`]
      ]);

      const updateChain = RunnableSequence.from([
        updatePromptTemplate,
        llmSectionUpdate,
        new StringOutputParser()
      ]);

      const responseText = await updateChain.invoke({
        sectionName: sectionName,
        currentContent: currentContent,
        updateInstructions: updateInstructions
      });

      return responseText;
    } catch (error) {
      console.error('Section Update Error:', error);
      throw new Error('Failed to update section');
    }
  }
}

const agent = new ResearchAgent();

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Test AI connection
app.get('/api/test-ai', async (req, res) => {
  try {
    console.log(`🧪 Testing ${AI_PROVIDER.toUpperCase()} connection...`);
    
    const testMessage = AI_PROVIDER === 'openai' 
      ? 'Say "Hello, OpenAI is working!"'
      : 'Say "Hello, Gemini is working!"';
    
    const responseText = await callAI([
      { role: 'user', content: testMessage }
    ], { maxTokens: 50 });
    
    console.log(`✅ ${AI_PROVIDER.toUpperCase()} test successful`);
    res.json({ 
      status: 'success', 
      message: responseText,
      provider: AI_PROVIDER,
      model: AI_PROVIDER === 'openai' ? 'gpt-4o-mini' : 'gemini-pro'
    });
  } catch (error) {
    console.error(`❌ ${AI_PROVIDER.toUpperCase()} test failed:`, error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      provider: AI_PROVIDER,
      details: error.response?.data || 'No additional details'
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await agent.chat(conversationId, message, history || []);
    
    // Store conversation
    if (conversationId) {
      const conversation = conversations.get(conversationId) || [];
      conversation.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response.message }
      );
      conversations.set(conversationId, conversation);
    }

    res.json(response);
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Research company endpoint
app.post('/api/research', async (req, res) => {
  try {
    const { companyName } = req.body;
    
    console.log(`📊 Research request received for: ${companyName}`);

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    console.log(`🔍 Starting research for ${companyName}...`);
    const research = await agent.researchCompany(companyName);
    console.log(`✅ Research completed for ${companyName}`);
    res.json(research);
  } catch (error) {
    console.error('❌ Research Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Generate account plan endpoint
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { companyName, researchData, additionalContext } = req.body;

    if (!companyName || !researchData) {
      return res.status(400).json({ error: 'Company name and research data are required' });
    }

    const accountPlan = await agent.generateAccountPlan(companyName, researchData, additionalContext);
    res.json(accountPlan);
  } catch (error) {
    console.error('Plan Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update section endpoint
app.post('/api/update-section', async (req, res) => {
  try {
    const { sectionName, currentContent, updateInstructions } = req.body;

    if (!sectionName || !currentContent || !updateInstructions) {
      return res.status(400).json({ error: 'Section name, current content, and update instructions are required' });
    }

    const updatedContent = await agent.updateSection(sectionName, currentContent, updateInstructions);
    res.json({ updatedContent });
  } catch (error) {
    console.error('Section Update Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation history
app.get('/api/conversation/:id', (req, res) => {
  const conversationId = req.params.id;
  const history = conversations.get(conversationId) || [];
  res.json({ history });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

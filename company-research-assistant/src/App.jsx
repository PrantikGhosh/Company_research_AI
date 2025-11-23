import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Mic, Server, AlertCircle, History, Sun, Moon, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import VoiceControl from './components/VoiceControl';
import ResearchPanel from './components/ResearchPanel';
import AccountPlan from './components/AccountPlan';
import apiService from './services/api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('research'); // 'chat', 'research', 'plan', 'history'
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => `conv-${Date.now()}`);
  const [voiceMode, setVoiceMode] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  
  // Research state
  const [research, setResearch] = useState(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchPhases, setResearchPhases] = useState(null);
  const [currentCompany, setCurrentCompany] = useState('');
  
  // Account plan state
  const [accountPlan, setAccountPlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isUpdatingSection, setIsUpdatingSection] = useState(false);
  
  // Version history state
  const [researchHistory, setResearchHistory] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState({});
  
  // Server status
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    checkServerStatus();
    // Apply theme on mount
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    // Update theme when it changes
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const checkServerStatus = async () => {
    try {
      const response = await apiService.healthCheck();
      setServerStatus(response.status === 'ok' ? 'online' : 'offline');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  const handleSendMessage = async (message) => {
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiService.chat(
        conversationId,
        message,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak response in voice mode
      if (voiceMode && window.voiceSpeak) {
        window.voiceSpeak(response.message);
      }

      // Check if message contains keywords for actions
      if (message.toLowerCase().includes('research') || message.toLowerCase().includes('tell me about')) {
        const companyMatch = message.match(/research\s+(\w+)|about\s+(\w+)/i);
        if (companyMatch) {
          const company = companyMatch[1] || companyMatch[2];
          if (company && company.length > 2) {
            handleResearch(company);
          }
        }
      }

      if (message.toLowerCase().includes('generate') && message.toLowerCase().includes('account plan')) {
        if (research && currentCompany) {
          handleGeneratePlan();
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure the server is running.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    if (transcript.trim()) {
      handleSendMessage(transcript);
    }
  };

  const handleResearch = async (companyName) => {
    setCurrentCompany(companyName);
    setIsResearching(true);
    setResearch(null); // Clear previous research
    setAccountPlan(null); // Clear previous account plan
    setActiveTab('research');

    try {
      const result = await apiService.researchCompany(companyName);
      
      // Show research phases progressively
      if (result.phases) {
        for (let i = 0; i < result.phases.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setResearchPhases(result.phases.slice(0, i + 1));
        }
      }

      setResearch(result.research);
      
      // Add to research history
      const historyEntry = {
        id: `research-${Date.now()}`,
        company: companyName,
        researchData: result.research,
        timestamp: new Date().toISOString(),
        hasAccountPlan: false
      };
      setResearchHistory(prev => [historyEntry, ...prev]);
      
      // Add to chat
      const researchMessage = {
        role: 'assistant',
        content: `I've completed researching ${companyName}. Check the Research tab for detailed findings. Would you like me to generate an account plan based on this research?`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, researchMessage]);

    } catch (error) {
      console.error('Research error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I couldn't complete the research: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsResearching(false);
      setResearchPhases(null);
    }
  };

  const handleGeneratePlan = async () => {
    if (!research || !currentCompany) {
      alert('Please research a company first');
      return;
    }

    setIsGeneratingPlan(true);
    setActiveTab('plan');

    try {
      const plan = await apiService.generateAccountPlan(currentCompany, research);
      setAccountPlan(plan);

      // Update history entry with account plan
      setResearchHistory(prev => 
        prev.map(entry => 
          entry.company === currentCompany && !entry.hasAccountPlan
            ? { ...entry, accountPlan: plan, hasAccountPlan: true }
            : entry
        )
      );

      const planMessage = {
        role: 'assistant',
        content: `I've generated a comprehensive account plan for ${currentCompany}. Check the Account Plan tab to view and edit sections.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, planMessage]);

    } catch (error) {
      console.error('Plan generation error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I couldn't generate the account plan: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleUpdateSection = async (sectionName, currentContent, updateInstructions) => {
    setIsUpdatingSection(true);

    try {
      const result = await apiService.updateSection(sectionName, currentContent, updateInstructions);
      
      // Update the account plan with new section content
      setAccountPlan(prev => ({
        ...prev,
        sections: {
          ...prev.sections,
          [sectionName]: result.updatedContent
        }
      }));

      const updateMessage = {
        role: 'assistant',
        content: `I've updated the "${sectionName}" section as requested.`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, updateMessage]);

    } catch (error) {
      console.error('Section update error:', error);
      alert(`Failed to update section: ${error.message}`);
    } finally {
      setIsUpdatingSection(false);
    }
  };

  const loadFromHistory = (historyEntry) => {
    setCurrentCompany(historyEntry.company);
    setResearch(historyEntry.researchData);
    setAccountPlan(historyEntry.accountPlan || null);
    setActiveTab('research');
  };

  // Sanitize markdown artifacts for history preview snippets
  const sanitizePreview = (text) => {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, ' ')        // fenced code blocks
      .replace(/`[^`]*`/g, ' ')                // inline code
      .replace(/\*\*(.*?)\*\*/g, '$1')      // bold **text**
      .replace(/\*(.*?)\*/g, '$1')           // italic *text*
      .replace(/__(.*?)__/g, '$1')             // bold __text__
      .replace(/_(.*?)_/g, '$1')               // italic _text_
      .replace(/^#{1,6}\s*/gm, '')            // headings
      .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '$1') // markdown links
      .replace(/^>\s?/gm, '')                 // blockquotes
      .replace(/\*{1,}/g, '')                 // stray asterisks
      .replace(/\r?\n+/g, ' ')               // newlines to space
      .replace(/\s{2,}/g, ' ')                // collapse multiple spaces
      .trim();
  };

  const toggleHistoryExpand = (id) => {
    setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick summary preview: 2-3 sentence overview
  const buildQuickSnapshot = (raw, companyName = '') => {
    if (!raw) return <p className="snapshot-empty">No data available.</p>;
    
    const cleaned = raw
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
      .replace(/^>\s?/gm, '')
      // Remove common report headings
      .replace(/\d+\.\s*Company Overview\s*/gi, '')
      .replace(/Company Research Report\s*/gi, '')
      .replace(/Company Overview\s*/gi, '')
      .replace(/\r?\n+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Remove duplicate company name at the start if present
    if (companyName) {
      const namePattern = new RegExp(`^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i');
      const cleanedText = cleaned.replace(namePattern, '');
      
      // Split into sentences
      const sentences = cleanedText
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Pick first 2-3 sentences (max ~300 chars total)
      let preview = '';
      let count = 0;
      for (const sent of sentences) {
        if (count >= 3) break;
        if (preview.length + sent.length > 300) break;
        preview += (preview ? ' ' : '') + sent;
        count++;
      }

      if (!preview) return <p className="snapshot-empty">No preview available.</p>;
      
      return <p className="snapshot-summary">{preview}</p>;
    }

    // Fallback if no company name provided
    const sentences = cleaned
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let preview = '';
    let count = 0;
    for (const sent of sentences) {
      if (count >= 3) break;
      if (preview.length + sent.length > 300) break;
      preview += (preview ? ' ' : '') + sent;
      count++;
    }

    if (!preview) return <p className="snapshot-empty">No preview available.</p>;
    
    return <p className="snapshot-summary">{preview}</p>;
  };

  // Generate single initial from company name
  const companyInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <FileText size={32} />
          <div>
            <h1>Company Research Assistant</h1>
            <p>AI-powered account plan generator</p>
          </div>
        </div>
        <div className="header-right">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <div className={`server-status ${serverStatus}`}>
            <Server size={16} />
            <span>{serverStatus === 'online' ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button
            className={`voice-mode-toggle ${voiceMode ? 'active' : ''}`}
            onClick={() => setVoiceMode(!voiceMode)}
            title={voiceMode ? 'Disable voice mode' : 'Enable voice mode'}
          >
            <Mic size={20} />
            <span>{voiceMode ? 'Voice On' : 'Voice Off'}</span>
          </button>
        </div>
      </header>

      {serverStatus === 'offline' && (
        <div className="server-warning">
          <AlertCircle size={20} />
          <span>Server is offline. Please start the backend server to use the assistant.</span>
        </div>
      )}

      <div className="app-tabs">
        <button
          className={`tab ${activeTab === 'research' ? 'active' : ''}`}
          onClick={() => setActiveTab('research')}
        >
          <FileText size={20} />
          <span>Research</span>
          {research && <span className="badge">✓</span>}
        </button>
        <button
          className={`tab ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
          disabled={!accountPlan}
        >
          <FileText size={20} />
          <span>Account Plan</span>
          {accountPlan && <span className="badge">✓</span>}
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={20} />
          <span>History</span>
          {researchHistory.length > 0 && <span className="badge">{researchHistory.length}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={20} />
          <span>Chat</span>
        </button>
      </div>

      <div className="app-content">
        {activeTab === 'research' && (
          <div className="tab-content full-width">
            <ResearchPanel
              onResearch={handleResearch}
              research={research}
              isResearching={isResearching}
              researchPhases={researchPhases}
              currentCompany={currentCompany}
              onGeneratePlan={handleGeneratePlan}
              isGeneratingPlan={isGeneratingPlan}
            />
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="tab-content full-width">
            {accountPlan ? (
              <div className="plan-fade">
                <AccountPlan
                  plan={accountPlan}
                  onUpdateSection={handleUpdateSection}
                  isUpdating={isUpdatingSection}
                  companyName={currentCompany}
                />
              </div>
            ) : isGeneratingPlan ? (
              <div className="plan-loading-state">
                <Loader2 size={56} className="spinning" />
                <h2>Generating Account Plan</h2>
                <p>{currentCompany ? `Working on a comprehensive plan for ${currentCompany}...` : 'Assembling structured sections...'}</p>
                <p className="loading-hint">This can take a moment while the AI synthesizes research into 10 sections.</p>
              </div>
            ) : (
              <div className="empty-state">
                <FileText size={64} />
                <h2>No Account Plan Yet</h2>
                <p>Research a company first, then generate an account plan.</p>
                <button onClick={() => setActiveTab('research')}>Go to Research</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="tab-content centered history-tab">
            <div className="history-header">
              <h2>Research History</h2>
              <p>Track all companies you've researched and their account plans</p>
            </div>
            
            {researchHistory.length === 0 ? (
              <div className="empty-state">
                <History size={64} />
                <h2>No History Yet</h2>
                <p>Start researching companies to build your history.</p>
                <button onClick={() => setActiveTab('research')}>Start Research</button>
              </div>
            ) : (
              <div className="history-list">
                {researchHistory.map((entry) => {
                  const expanded = expandedHistory[entry.id];
                  return (
                    <div key={entry.id} className={`history-card ${expanded ? 'expanded' : 'collapsed'}`}>
                      <div className="history-card-header" onClick={() => toggleHistoryExpand(entry.id)}>
                        <div className="history-title-block">
                          <div className="history-company-row">
                            <span className="history-initial" aria-hidden="true">{companyInitials(entry.company)}</span>
                            <h3>{entry.company}</h3>
                          </div>
                          <div className="history-meta-row">
                            <span className="history-timestamp">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                            <div className="history-status">
                              <span className="status-badge">
                                <FileText size={14} />
                                Research
                              </span>
                              {entry.hasAccountPlan && (
                                <span className="status-badge success">
                                  <FileText size={14} />
                                  Account Plan
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="history-chevron">
                          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                      </div>
                      {expanded && (
                        <>
                          <div className="history-card-content">
                            {buildQuickSnapshot(entry.researchData, entry.company)}
                          </div>
                          <div className="history-card-actions">
                            <button 
                              className="btn-secondary"
                              onClick={() => loadFromHistory(entry)}
                            >
                              Load Research
                            </button>
                            {entry.hasAccountPlan && (
                              <button 
                                className="btn-primary"
                                onClick={() => {
                                  loadFromHistory(entry);
                                  setActiveTab('plan');
                                }}
                              >
                                View Account Plan
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="tab-content centered">
            {voiceMode && (
              <VoiceControl
                onTranscript={handleVoiceTranscript}
                isEnabled={!isLoading}
              />
            )}
            <ChatInterface
              messages={messages}
              onMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import '../styles/ResearchPanel.css';

const ResearchPanel = ({ 
  onResearch, 
  research, 
  isResearching, 
  researchPhases, 
  currentCompany,
  onGeneratePlan,
  isGeneratingPlan 
}) => {
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (companyName.trim() && !isResearching) {
      onResearch(companyName);
      setCompanyName(''); // Clear input after submission
    }
  };

  return (
    <div className="research-panel">
      <div className="research-header">
        <h2>Company Research</h2>
      </div>

      <form className="research-form" onSubmit={handleSubmit}>
        <div className="search-input-group">
          <Search size={20} />
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter company name (e.g., Microsoft, Tesla, Apple)"
            disabled={isResearching}
          />
          <button type="submit" disabled={!companyName.trim() || isResearching}>
            {isResearching ? (
              <Loader2 className="spinning" size={20} />
            ) : (
              'Research'
            )}
          </button>
        </div>
      </form>

      {isResearching && researchPhases && (
        <div className="research-progress">
          <h3>Research in Progress</h3>
          <div className="phases">
            {researchPhases.map((phase, index) => (
              <div key={index} className="phase-item">
                <div className="phase-icon">
                  {index < researchPhases.length - 1 ? (
                    <CheckCircle size={18} className="complete" />
                  ) : (
                    <Loader2 size={18} className="spinning" />
                  )}
                </div>
                <div className="phase-text">{phase.update}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {research && !isResearching && (
        <div className="research-results">
          <div className="results-header">
            <CheckCircle size={20} className="success" />
            <h3>Research Complete: {currentCompany}</h3>
          </div>
          <div className="results-content">
            <ReactMarkdown>{research}</ReactMarkdown>
          </div>
          
          {/* Generate Account Plan Button - appears after research content */}
          {onGeneratePlan && (
            <div className="generate-plan-section">
              {!isGeneratingPlan ? (
                <button
                  className="generate-plan-button"
                  onClick={onGeneratePlan}
                  disabled={isGeneratingPlan}
                >
                  Generate Account Plan
                </button>
              ) : (
                <div className="generating-message">
                  <Loader2 className="spinning" size={24} />
                  <p>Generating comprehensive account plan for {currentCompany}...</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!research && !isResearching && (
        <div className="research-empty">
          <Search size={48} />
          <p>Enter a company name to start researching</p>
          <div className="research-tips">
            <h4>What I can research:</h4>
            <ul>
              <li>Company overview and history</li>
              <li>Products and services</li>
              <li>Market position and competitors</li>
              <li>Recent news and developments</li>
              <li>Financial highlights</li>
              <li>Key leadership</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchPanel;

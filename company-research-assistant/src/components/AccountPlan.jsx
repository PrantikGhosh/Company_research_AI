import React, { useState } from 'react';
import { FileText, Download, Edit2, Save, X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import '../styles/AccountPlan.css';

const AccountPlan = ({ plan, onUpdateSection, isUpdating, companyName }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [updateInstructions, setUpdateInstructions] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const sections = plan?.sections || {};
  const sectionNames = Object.keys(sections);

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const handleEditSection = (sectionName) => {
    setEditingSection(sectionName);
    setUpdateInstructions('');
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setUpdateInstructions('');
  };

  const handleSaveSection = async () => {
    if (!updateInstructions.trim() || !editingSection) return;

    await onUpdateSection(editingSection, sections[editingSection], updateInstructions);
    setEditingSection(null);
    setUpdateInstructions('');
  };

  const handleDownload = async () => {
    setIsGeneratingPdf(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace = 10) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to add text with word wrapping
      const addText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        
        yPosition += 3;
      };

      // Header with company name
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Account Plan', margin, 15);
      
      if (companyName) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text(companyName, margin, 28);
      }

      yPosition = 50;

      // Add generation date
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, margin, yPosition);
      yPosition += 15;

      // Process content
      if (sectionNames.length === 0) {
        // No sections, use full text
        const content = plan.fullText;
        const lines = content.split('\n');
        
        lines.forEach((line) => {
          if (!line.trim()) {
            yPosition += 5;
            return;
          }

          // Headings
          if (line.startsWith('# ')) {
            checkPageBreak(15);
            addText(line.substring(2), 18, true, [99, 102, 241]);
          } else if (line.startsWith('## ')) {
            checkPageBreak(12);
            addText(line.substring(3), 14, true, [99, 102, 241]);
          } else if (line.startsWith('### ')) {
            checkPageBreak(10);
            addText(line.substring(4), 12, true, [50, 50, 50]);
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            checkPageBreak(8);
            addText('• ' + line.substring(2), 10, false, [50, 50, 50]);
          } else if (line.match(/^\d+\./)) {
            checkPageBreak(8);
            addText(line, 10, false, [50, 50, 50]);
          } else {
            addText(line, 10, false, [50, 50, 50]);
          }
        });
      } else {
        // Has sections
        sectionNames.forEach((sectionName, index) => {
          if (index > 0) {
            yPosition += 10;
          }

          // Section header with colored background
          checkPageBreak(20);
          doc.setFillColor(240, 240, 255);
          doc.rect(margin - 5, yPosition - 7, maxWidth + 10, 12, 'F');
          
          doc.setTextColor(99, 102, 241);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(sectionName, margin, yPosition);
          yPosition += 15;

          // Section content
          const content = sections[sectionName];
          const lines = content.split('\n');
          
          lines.forEach((line) => {
            if (!line.trim()) {
              yPosition += 3;
              return;
            }

            if (line.startsWith('- ') || line.startsWith('* ')) {
              checkPageBreak(8);
              addText('• ' + line.substring(2), 10, false, [50, 50, 50]);
            } else if (line.match(/^\d+\./)) {
              checkPageBreak(8);
              addText(line, 10, false, [50, 50, 50]);
            } else if (line.startsWith('**') && line.endsWith('**')) {
              checkPageBreak(8);
              addText(line.replace(/\*\*/g, ''), 10, true, [50, 50, 50]);
            } else {
              addText(line.replace(/\*\*/g, ''), 10, false, [50, 50, 50]);
            }
          });
        });
      }

      // Footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = companyName 
        ? `${companyName.replace(/\s+/g, '_')}_Account_Plan.pdf`
        : 'Account_Plan.pdf';
      
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!plan) {
    return (
      <div className="account-plan-placeholder">
        <FileText size={48} />
        <p>Generate an account plan by researching a company first</p>
      </div>
    );
  }

  return (
    <div className="account-plan">
      <div className="account-plan-header">
        <div className="header-left">
          <FileText size={24} />
          <div>
            <h2>Account Plan</h2>
            {companyName && <p className="company-subtitle">{companyName}</p>}
          </div>
        </div>
        <button className="download-button" onClick={handleDownload} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? (
            <>
              <Loader2 className="spinning" size={18} />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>

      <div className="account-plan-content">
        {sectionNames.length === 0 ? (
          <div className="plan-full-text">
            <ReactMarkdown>{plan.fullText}</ReactMarkdown>
          </div>
        ) : (
          <div className="plan-sections">
            {sectionNames.map((sectionName, index) => (
              <div key={index} className="plan-section">
                <div className="section-header" onClick={() => toggleSection(sectionName)}>
                  <h3>{sectionName}</h3>
                  <div className="section-actions">
                    {editingSection !== sectionName && (
                      <button
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSection(sectionName);
                        }}
                        disabled={isUpdating}
                      >
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                    )}
                    <span className="expand-icon">
                      {expandedSections[sectionName] ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {(expandedSections[sectionName] || editingSection === sectionName) && (
                  <div className="section-content">
                    {editingSection === sectionName ? (
                      <div className="section-edit-mode">
                        <div className="current-content">
                          <label>Current Content:</label>
                          <div className="content-preview">
                            <ReactMarkdown>{sections[sectionName]}</ReactMarkdown>
                          </div>
                        </div>
                        
                        <div className="update-instructions">
                          <label>Update Instructions:</label>
                          <textarea
                            value={updateInstructions}
                            onChange={(e) => setUpdateInstructions(e.target.value)}
                            placeholder="Tell me how to update this section... (e.g., 'Add more details about competitive advantages')"
                            rows="4"
                          />
                        </div>

                        <div className="edit-actions">
                          <button
                            className="save-button"
                            onClick={handleSaveSection}
                            disabled={!updateInstructions.trim() || isUpdating}
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="spinning" size={16} />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <Save size={16} />
                                <span>Update Section</span>
                              </>
                            )}
                          </button>
                          <button
                            className="cancel-button"
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                          >
                            <X size={16} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="section-text">
                        <ReactMarkdown>{sections[sectionName]}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPlan;

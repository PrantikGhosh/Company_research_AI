import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import '../styles/VoiceControl.css';

const VoiceControl = ({ onTranscript, isEnabled = true }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && !listening && isListening) {
      // User stopped speaking, send transcript
      if (transcript.trim()) {
        onTranscript(transcript);
        resetTranscript();
      }
      setIsListening(false);
    }
  }, [transcript, listening, isListening, onTranscript, resetTranscript]);

  const toggleListening = () => {
    if (!isEnabled) return;

    if (listening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: false });
      setIsListening(true);
    }
  };

  const speak = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setSpeechEnabled(!speechEnabled);
  };

  // Expose speak function to parent
  useEffect(() => {
    window.voiceSpeak = speak;
    return () => {
      delete window.voiceSpeak;
    };
  }, [speechEnabled]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="voice-control">
        <div className="voice-unsupported">
          🎤 Voice input not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className="voice-control">
      <button
        className={`voice-button ${listening ? 'listening' : ''}`}
        onClick={toggleListening}
        disabled={!isEnabled}
        title={listening ? 'Stop listening' : 'Start listening'}
      >
        {listening ? <Mic size={20} /> : <MicOff size={20} />}
        <span>{listening ? 'Listening...' : 'Voice Input'}</span>
      </button>

      <button
        className={`voice-button ${speechEnabled ? 'enabled' : 'disabled'}`}
        onClick={toggleSpeech}
        title={speechEnabled ? 'Disable speech output' : 'Enable speech output'}
      >
        {speechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        <span>{speechEnabled ? 'Speech On' : 'Speech Off'}</span>
      </button>

      {transcript && (
        <div className="transcript-preview">
          <span className="transcript-label">Heard:</span>
          <span className="transcript-text">{transcript}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceControl;

import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { Mic, MicOff, Send, Volume2, VolumeX, Loader, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  confidence?: number;
  sources?: string[];
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'नमस्ते! मैं आपका कृषि सहायक हूँ। आप मुझसे सिंचाई, बाज़ार की कीमतें, मौसम, और खेती से जुड़े किसी भी सवाल पूछ सकते हैं।',
      timestamp: new Date(),
      confidence: 100
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const sampleResponses = [
    {
      query: ['irrigation', 'water', 'सिंचाई', 'पानी'],
      response: 'आज आपको सिंचाई नहीं करनी चाहिए। मिट्टी में नमी 65% है और कल बारिश की संभावना है। अगली सिंचाई 3 दिन बाद करें।',
      confidence: 92,
      sources: ['Soil Sensor Data', 'Weather Forecast', 'Crop Calendar']
    },
    {
      query: ['price', 'market', 'कीमत', 'बाज़ार', 'भाव'],
      response: 'आज धान का भाव ₹2,150 प्रति क्विंटल है। पिछले सप्ताह से 5% की वृद्धि हुई है। अगले हफ्ते और बढ़ने की संभावना है।',
      confidence: 88,
      sources: ['Local Mandi Prices', 'Market Trends', 'Government Data']
    },
    {
      query: ['weather', 'rain', 'मौसम', 'बारिश'],
      response: 'आज का मौसम: तापमान 28°C, आंशिक बादल। कल शाम को बारिश की 70% संभावना है। 15-20mm वर्षा हो सकती है।',
      confidence: 85,
      sources: ['Weather API', 'Satellite Data', 'Local Stations']
    },
    {
      query: ['fertilizer', 'खाद', 'उर्वरक'],
      response: 'आपकी धान की फसल के लिए अभी NPK 20-20-10 का उपयोग करें। 200 किलो प्रति हेक्टेयर की दर से डालें। वर्तमान कीमत ₹850 प्रति बोरी है।',
      confidence: 90,
      sources: ['Soil Test Report', 'Crop Stage', 'Expert Guidelines']
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAIResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const matchedResponse = sampleResponses.find(response => 
      response.query.some(keyword => lowerQuery.includes(keyword.toLowerCase()))
    );
    
    if (matchedResponse) {
      return matchedResponse;
    }
    
    return {
      response: 'मुझे खुशी है कि आपने सवाल पूछा। मैं इस विषय पर जानकारी इकट्ठा कर रहा हूँ। कृपया थोड़ी देर बाद फिर पूछें या अधिक विशिष्ट प्रश्न पूछें।',
      confidence: 75,
      sources: ['General Knowledge Base']
    };
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const response = getAIResponse(content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.response,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate voice recognition
      setTimeout(() => {
        const sampleQueries = [
          'आज पानी देना है क्या?',
          'बाजार में धान का भाव क्या है?',
          'कल बारिश होगी क्या?',
          'खाद कब डालना चाहिए?'
        ];
        const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
        handleSendMessage(randomQuery);
      }, 1000);
    } else {
      setIsRecording(true);
    }
  };

  const quickQuestions = [
    '💧 आज सिंचाई करूं?',
    '🌾 धान की कीमत क्या है?',
    '🌧️ बारिश की संभावना?',
    '🌱 खाद कब डालूं?',
    '🐛 कीट नियंत्रण सलाह',
    '📈 बाजार का ट्रेंड'
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Farm Assistant</h1>
                <p className="text-green-100">Your intelligent farming companion</p>
              </div>
            </div>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
            >
              {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-white border-x border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm lg:text-base">{message.content}</p>
                  
                  {message.type === 'ai' && message.confidence && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Confidence: {message.confidence}%</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>AI Verified</span>
                        </div>
                      </div>
                      {message.sources && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, index) => (
                              <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 animate-spin text-green-600" />
                    <span className="text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Questions */}
        <div className="bg-gray-50 border-x border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Questions:</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question.slice(2))}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-b-2xl p-6 border border-gray-200 border-t-0">
          <div className="flex items-center space-x-4">
            {/* Voice Input Button */}
            <button
              onClick={handleVoiceInput}
              className={`${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white p-4 rounded-full transition-all transform hover:scale-105 shadow-lg`}
              title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
            >
              {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            {/* Text Input */}
            <div className="flex-1 flex items-center bg-gray-100 rounded-full border focus-within:border-green-500">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                placeholder="Type your question in Hindi or English..."
                className="flex-1 bg-transparent px-6 py-4 focus:outline-none text-gray-800 placeholder-gray-500"
                disabled={isRecording || isProcessing}
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isRecording || isProcessing}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full m-1 transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isRecording && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Recording... Tap mic to stop</span>
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-gray-500">
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Supports Hindi, English, and regional languages
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIAssistant;
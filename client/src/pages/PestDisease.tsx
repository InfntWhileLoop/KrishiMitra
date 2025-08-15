import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Camera, Upload, Search, AlertTriangle, CheckCircle, Info, Bug, Leaf, Eye } from 'lucide-react';

const PestDisease: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const commonIssues = [
    {
      id: 1,
      name: 'Brown Planthopper',
      crop: 'Rice',
      severity: 'High',
      description: 'Small brown insects that suck plant juices, causing yellowing and stunting',
      treatment: 'Apply Imidacloprid 17.8 SL @ 0.3ml/lit or use yellow sticky traps',
      prevention: 'Maintain proper water levels, avoid over-fertilization',
      image: 'https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=400',
      confidence: 92
    },
    {
      id: 2,
      name: 'Late Blight',
      crop: 'Tomato',
      severity: 'Medium',
      description: 'Fungal disease causing dark spots on leaves and fruits',
      treatment: 'Spray Mancozeb 75% WP @ 2g/lit every 10-15 days',
      prevention: 'Ensure good air circulation, avoid overhead watering',
      image: 'https://images.pexels.com/photos/4503751/pexels-photo-4503751.jpeg?auto=compress&cs=tinysrgb&w=400',
      confidence: 88
    },
    {
      id: 3,
      name: 'Aphids',
      crop: 'Wheat',
      severity: 'Low',
      description: 'Small green insects clustering on young shoots and leaves',
      treatment: 'Apply Dimethoate 30% EC @ 1ml/lit or use neem oil spray',
      prevention: 'Regular monitoring, encourage beneficial insects',
      image: 'https://images.pexels.com/photos/4503275/pexels-photo-4503275.jpeg?auto=compress&cs=tinysrgb&w=400',
      confidence: 85
    }
  ];

  const preventiveTips = [
    {
      title: 'Regular Monitoring',
      description: 'Inspect crops weekly for early signs of pests and diseases',
      icon: Eye,
      color: 'blue'
    },
    {
      title: 'Crop Rotation',
      description: 'Rotate crops to break pest and disease cycles',
      icon: Leaf,
      color: 'green'
    },
    {
      title: 'Biological Control',
      description: 'Encourage beneficial insects and use bio-pesticides',
      icon: Bug,
      color: 'purple'
    }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResult({
        detected: 'Brown Planthopper',
        confidence: 87,
        crop: 'Rice',
        severity: 'High',
        treatment: 'Apply Imidacloprid 17.8 SL @ 0.3ml/lit of water. Spray during early morning or late evening.',
        prevention: 'Maintain proper water management, avoid excessive nitrogen fertilizer application.',
        additionalInfo: 'This pest is most active during warm, humid conditions. Monitor regularly during monsoon season.'
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Pest & Disease Management</h1>
              <p className="text-red-100 text-lg">AI-powered crop health monitoring and treatment guidance</p>
            </div>
            <Bug className="h-20 w-20 text-red-200 opacity-50" />
          </div>
        </div>

        {/* Image Analysis Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Pest & Disease Detection</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Area */}
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors">
                {selectedImage ? (
                  <div className="space-y-4">
                    <img 
                      src={selectedImage} 
                      alt="Uploaded crop" 
                      className="max-w-full h-64 mx-auto object-cover rounded-lg"
                    />
                    <button 
                      onClick={() => {
                        setSelectedImage(null);
                        setAnalysisResult(null);
                      }}
                      className="text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Upload Different Image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Camera className="h-16 w-16 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700 mb-2">Upload Crop Image</p>
                      <p className="text-gray-500 mb-4">Take or upload a clear photo of the affected plant</p>
                      <div className="flex justify-center space-x-4">
                        <label className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 cursor-pointer transition-colors flex items-center space-x-2">
                          <Camera className="h-5 w-5" />
                          <span>Take Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            onChange={handleImageUpload}
                            className="hidden" 
                          />
                        </label>
                        <label className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center space-x-2">
                          <Upload className="h-5 w-5" />
                          <span>Upload Image</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Results */}
            <div>
              {isAnalyzing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Analyzing image with AI...</p>
                  <p className="text-gray-500 text-sm mt-2">This may take a few seconds</p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-red-800">Detection Result</h3>
                      <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        {analysisResult.confidence}% Confidence
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="font-semibold text-red-900 text-lg">{analysisResult.detected}</p>
                        <p className="text-red-700">Detected in {analysisResult.crop} crop</p>
                      </div>
                      
                      <div className={`inline-block px-3 py-1 rounded-full border ${getSeverityColor(analysisResult.severity)}`}>
                        <span className="font-medium">{analysisResult.severity} Severity</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Recommended Treatment
                    </h4>
                    <p className="text-green-700">{analysisResult.treatment}</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      Prevention Tips
                    </h4>
                    <p className="text-blue-700 mb-3">{analysisResult.prevention}</p>
                    <p className="text-blue-600 text-sm italic">{analysisResult.additionalInfo}</p>
                  </div>
                </div>
              )}

              {!selectedImage && !isAnalyzing && !analysisResult && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Upload an image to get AI-powered pest and disease analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Pest & Disease Issues</h2>
          
          <div className="space-y-6">
            {commonIssues.map((issue) => (
              <div key={issue.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                  <img 
                    src={issue.image} 
                    alt={issue.name}
                    className="w-full lg:w-32 h-32 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{issue.name}</h3>
                        <p className="text-gray-600">Affects: {issue.crop}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full border text-sm font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className="text-sm text-gray-500">{issue.confidence}% match</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700">{issue.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Treatment
                        </h4>
                        <p className="text-green-700 text-sm">{issue.treatment}</p>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-1" />
                          Prevention
                        </h4>
                        <p className="text-blue-700 text-sm">{issue.prevention}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preventive Tips */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Preventive Care Tips</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {preventiveTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className={`bg-${tip.color}-50 border border-${tip.color}-200 rounded-xl p-6`}>
                  <Icon className={`h-8 w-8 text-${tip.color}-600 mb-4`} />
                  <h3 className={`text-lg font-semibold text-${tip.color}-800 mb-2`}>{tip.title}</h3>
                  <p className={`text-${tip.color}-700`}>{tip.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Alert */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-800 mb-2">Regional Alert: Brown Planthopper Outbreak</h3>
              <p className="text-yellow-700 mb-3">
                High activity reported in Maharashtra rice fields. Immediate action recommended for rice growers.
              </p>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium">
                View Full Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PestDisease;
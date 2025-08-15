import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Mic, Cloud, TrendingUp, MessageSquare, Calendar, Users, Leaf, ChevronRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickAccessTiles = [
    {
      title: 'Weather',
      icon: Cloud,
      color: 'blue',
      description: 'Today: 28°C, Partly Cloudy',
      onClick: () => navigate('/weather-market')
    },
    {
      title: 'Market Prices',
      icon: TrendingUp,
      color: 'green',
      description: 'Rice: ₹2,150/quintal',
      onClick: () => navigate('/market-price')
    },
    {
      title: 'Community',
      icon: Users,
      color: 'purple',
      description: 'Chat with local farmers',
      onClick: () => navigate('/marketplace')
    }
  ];

  const recentRecommendations = [
    {
      id: 1,
      query: "When should I irrigate my wheat crop?",
      answer: "Based on soil moisture and weather forecast, irrigate tomorrow morning. Expected rainfall in 3 days.",
      confidence: 95,
      timestamp: "2 hours ago",
      category: "Irrigation"
    },
    {
      id: 2,
      query: "Best fertilizer for rice in current season",
      answer: "Apply NPK 20-20-10 at 200kg/hectare during tillering stage. Current market price: ₹850/bag.",
      confidence: 88,
      timestamp: "1 day ago",
      category: "Fertilization"
    },
    {
      id: 3,
      query: "Pest control for cotton crop",
      answer: "Pink bollworm activity detected. Use pheromone traps and apply recommended bio-pesticide.",
      confidence: 92,
      timestamp: "2 days ago",
      category: "Pest Management"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name || 'Farmer'}!
              </h1>
              <p className="text-green-100 text-lg">
                Your AI farming assistant is ready to help
              </p>
              {user?.farmDetails && (
                <div className="mt-4 flex items-center space-x-4 text-green-100">
                  <span>📍 {user.farmDetails.location}</span>
                  <span>🌾 {user.farmDetails.landSize}</span>
                  <span>🌱 {user.farmDetails.crops.join(', ')}</span>
                </div>
              )}
            </div>
            <Leaf className="h-20 w-20 text-green-200 opacity-50" />
          </div>
        </div>

        {/* AI Assistant Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ask Your AI Assistant</h2>
            <p className="text-gray-600 mb-6">
              Get instant answers about irrigation, weather, market prices, and more
            </p>
            
            <button
              onClick={() => navigate('/ai-assistant')}
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 inline-flex items-center space-x-3 shadow-lg"
            >
              <Mic className="h-6 w-6" />
              <span>Ask Anything</span>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </button>
          </div>

          {/* Voice Interaction Demo */}
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-2">Try saying:</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>"आज पानी देना है क्या?" (Should I water today?)</p>
                <p>"बाजार में धान का भाव क्या है?" (What's the rice price in market?)</p>
                <p>"कल बारिश होगी क्या?" (Will it rain tomorrow?)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickAccessTiles.map((tile, index) => {
            const IconComponent = tile.icon;
            return (
              <button
                key={index}
                onClick={tile.onClick}
                className={`${getColorClasses(tile.color)} border-2 rounded-xl p-6 text-left hover:shadow-lg transition-all transform hover:scale-105`}
              >
                <div className="flex items-start justify-between mb-4">
                  <IconComponent className="h-8 w-8" />
                  <ChevronRight className="h-5 w-5 opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{tile.title}</h3>
                <p className="text-sm opacity-75">{tile.description}</p>
              </button>
            );
          })}
        </div>

        {/* Recent AI Recommendations */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Recommendations</h2>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="text-green-600 hover:text-green-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recentRecommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{rec.query}</h3>
                    <p className="text-gray-700">{rec.answer}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      {rec.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">{rec.confidence}% confidence</span>
                    </div>
                  </div>
                  <span className="text-gray-500">{rec.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Today's Schedule</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-blue-900">Morning Irrigation - Field A</p>
                <p className="text-blue-700 text-sm">6:00 AM - Based on soil moisture levels</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="font-medium text-yellow-900">Fertilizer Application - Field B</p>
                <p className="text-yellow-700 text-sm">10:00 AM - NPK application scheduled</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-green-900">Market Visit</p>
                <p className="text-green-700 text-sm">3:00 PM - Check rice prices at local mandi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
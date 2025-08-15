import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, TrendingUp, Users, Wifi, Globe, Smartphone, ChevronRight, Play, MapPin, Award, Leaf } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-800">KrishiMitra</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/auth')}
                className="text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-green-900 mb-6">
              AI for Every Farmer,<br />
              <span className="text-green-600">Everywhere</span>
            </h1>
            <p className="text-xl md:text-2xl text-green-700 mb-8 max-w-3xl mx-auto">
              Empowering farmers with intelligent agricultural guidance, market insights, 
              and community support through voice-first AI technology
            </p>
            <button 
              onClick={() => navigate('/auth')}
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
            >
              <Mic className="h-5 w-5" />
              <span>Try KrishiMitra</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Visual Demo */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">See KrishiMitra in Action</h3>
              <p className="text-gray-600">Voice-powered agricultural assistance in your language</p>
            </div>
            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center">
                <Play className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Demo: Ask → AI Answers → Smart Recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Transforming Agriculture Across India</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-green-800 mb-2">35%</div>
              <p className="text-green-700 font-medium">Average Yield Improvement</p>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-blue-800 mb-2">250K+</div>
              <p className="text-blue-700 font-medium">Farmers Served</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <MapPin className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <div className="text-4xl font-bold text-purple-800 mb-2">500+</div>
              <p className="text-purple-700 font-medium">Districts Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Snapshots */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything You Need in One Platform</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Precision Farming */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="bg-green-100 rounded-lg p-3 w-fit mb-6">
                <Globe className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Precision Farming</h3>
              <p className="text-gray-600 mb-6">
                Get hyperlocal irrigation advice, soil health insights, and crop-specific 
                recommendations powered by AI and real-time data.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-green-500 mr-2" />Smart Irrigation Scheduling</li>
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-green-500 mr-2" />Soil Health Monitoring</li>
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-green-500 mr-2" />Weather-based Planning</li>
              </ul>
            </div>

            {/* Community Marketplace */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 rounded-lg p-3 w-fit mb-6">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community Marketplace</h3>
              <p className="text-gray-600 mb-6">
                Connect with fellow farmers for machinery sharing, bulk purchasing, 
                and knowledge exchange in your local community.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-blue-500 mr-2" />Equipment Rental</li>
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-blue-500 mr-2" />Bulk Seed Purchasing</li>
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-blue-500 mr-2" />Farmer Groups</li>
              </ul>
            </div>

            {/* Offline-First Support */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="bg-purple-100 rounded-lg p-3 w-fit mb-6">
                <Smartphone className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Offline-First Support</h3>
              <p className="text-gray-600 mb-6">
                Access critical agricultural information even without internet connectivity. 
                Your farming assistant works everywhere.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-purple-500 mr-2" />Offline AI Assistance</li>
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-purple-500 mr-2" />Cached Data Access</li>
                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-purple-500 mr-2" />Voice-First Interface</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Award className="h-16 w-16 text-green-200 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">
            Join Thousands of Farmers Already Using KrishiMitra
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Start your journey towards smarter, more profitable farming today. 
            No internet required, available in your local language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/auth')}
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center space-x-2"
            >
              <Mic className="h-5 w-5" />
              <span>Start Free Trial</span>
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Leaf className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold">KrishiMitra</span>
            </div>
            <p className="text-gray-400 mb-6">Empowering farmers with AI-driven agricultural solutions</p>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
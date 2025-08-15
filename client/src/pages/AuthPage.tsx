import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Phone, User, Globe, ArrowLeft, MessageCircle } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [step, setStep] = useState(1); // 1: phone, 2: otp/details, 3: language selection
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const languages = [
    { code: 'hi', name: 'हिंदी', english: 'Hindi' },
    { code: 'en', name: 'English', english: 'English' },
    { code: 'mr', name: 'मराठी', english: 'Marathi' },
    { code: 'bn', name: 'বাংলা', english: 'Bengali' },
    { code: 'ta', name: 'தமிழ்', english: 'Tamil' },
    { code: 'te', name: 'తెలుగు', english: 'Telugu' },
    { code: 'gu', name: 'ગુજરાતી', english: 'Gujarati' },
    { code: 'kn', name: 'ಕನ್ನಡ', english: 'Kannada' },
  ];

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    
    // Simulate OTP sending
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const success = await login(phone, otp);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Invalid OTP. Please try again.');
        }
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        setStep(3);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelection = async (selectedLanguage: string) => {
    setLoading(true);
    try {
      const success = await signup(name, phone, selectedLanguage);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Leaf className="h-10 w-10 text-green-600" />
            <span className="text-3xl font-bold text-green-800">KrishiMitra</span>
          </div>
          {step < 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome Back' : 'Join KrishiMitra'}
              </h2>
              <p className="text-gray-600">
                {step === 1 
                  ? 'Enter your phone number to get started'
                  : isLogin 
                    ? 'Enter the OTP sent to your phone'
                    : 'Complete your registration'
                }
              </p>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Language</h2>
              <p className="text-gray-600">Choose your preferred language for the best experience</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Phone Number */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    <span>Send OTP</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: OTP & Name */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Change Phone Number
              </button>

              <div className="text-center bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">OTP sent to</p>
                <p className="font-semibold text-gray-900">+91 {phone}</p>
                <p className="text-xs text-gray-500 mt-1">For demo, use OTP: 123456</p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || (!isLogin && !name.trim())}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  isLogin ? 'Verify & Login' : 'Continue'
                )}
              </button>
            </form>
          )}

          {/* Step 3: Language Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </button>

              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelection(lang.english)}
                    disabled={loading}
                    className="p-4 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{lang.name}</p>
                        <p className="text-sm text-gray-600">{lang.english}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {loading && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Setting up your account...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Demo Instructions */}
        <div className="text-center text-sm text-gray-600 bg-white/70 rounded-lg p-4">
          <p className="font-medium mb-1">Demo Instructions:</p>
          <p>Use any 10-digit phone number and OTP: 123456</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
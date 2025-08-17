import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Cloud, Thermometer, Droplets, MapPin, Calculator, Mic, Star, Upload, Bell, Users, CaseSensitive as University, BarChart as ChartBar, Download, Eye, Wind, AlertTriangle, CheckCircle, Leaf, FlaskRound as Flask, Phone } from 'lucide-react';

const IrrigationWeather: React.FC = () => {
  const [irrigationHours, setIrrigationHours] = useState(6);
  const [cropType, setCropType] = useState('rice');
  const [location, setLocation] = useState('📍 Click to detect location');
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [soilTestUploaded, setSoilTestUploaded] = useState(false);
  const [cropSuggestionVisible, setCropSuggestionVisible] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');

  const [electricityBill, setElectricityBill] = useState(1750);
  const [dieselCost, setDieselCost] = useState(980);

  useEffect(() => {
    updateCostCalculations();
  }, [irrigationHours, cropType]);

  const updateCostCalculations = () => {
    const baseElectricity = irrigationHours * 40;
    const baseDiesel = irrigationHours * 35;

    const cropMultipliers: { [key: string]: number } = {
      rice: 1.2,
      wheat: 0.9,
      sugarcane: 1.5,
      cotton: 1.1,
      vegetables: 0.8,
      fruits: 1.0,
    };

    const multiplier = cropMultipliers[cropType] || 1.0;
    const weeklyElectricity = Math.round(baseElectricity * multiplier * 7);
    const weeklyDiesel = Math.round(baseDiesel * multiplier * 7);

    setElectricityBill(weeklyElectricity);
    setDieselCost(weeklyDiesel);
  };

  const getGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation(`📍 Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        },
        () => {
          setLocation('❌ Location access denied');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const startVoiceAssistant = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsListening(true);
      setVoiceStatus('🎤 Say something like "How much water today?"');

      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setVoiceStatus(`You said: "${transcript}"`);

        setTimeout(() => {
          if (transcript.includes('water') && transcript.includes('today')) {
            setVoiceStatus('💧 Based on weather and soil moisture, you need 2,500L today');
          } else if (transcript.includes('cost') || transcript.includes('bill')) {
            setVoiceStatus(`💰 Current week electricity bill estimate: ₹${electricityBill}`);
          } else {
            setVoiceStatus('🤖 Try asking: "How much water today?" or "What\'s my bill?"');
          }
        }, 1000);

        setIsListening(false);
      };

      recognition.onerror = () => {
        setVoiceStatus('❌ Speech recognition error. Please try again.');
        setIsListening(false);
      };
    } else {
      setVoiceStatus('❌ Speech recognition not supported in this browser');
    }
  };

  const handleSoilTestUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTimeout(() => {
        setSoilTestUploaded(true);
      }, 2000);
    }
  };

  const showCropSuggestion = () => {
    if (selectedCrop) {
      setCropSuggestionVisible(true);
    }
  };

  const generateReport = () => {
    const reportContent = `
IRRIGATION COST REPORT
=====================
Location: ${location}
Soil Type: Clay Loam (pH 6.8)
Groundwater: 12m depth ✅

WEEKLY COSTS:
Electricity: ₹${electricityBill}/week
Diesel: ₹${dieselCost}/week

Generated: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'irrigation_cost_report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">🌊 Smart Irrigation Planner</h1>
            <p className="text-xl opacity-90 mb-6">
              "Choose the right irrigation method, save costs, and grow better crops."
            </p>

            {/* Voice Assistant Button */}
            <div className="mt-6">
              <button
                onClick={startVoiceAssistant}
                disabled={isListening}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <Mic className="h-5 w-5 inline mr-2" />
                {isListening ? 'Listening...' : 'Ask: "How much water today?"'}
              </button>
              {voiceStatus && (
                <div className="mt-2 text-sm opacity-75">{voiceStatus}</div>
              )}
            </div>
          </div>
        </div>

        {/* Region-Specific Recommendation Card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              <MapPin className="h-6 w-6 text-red-500 inline mr-2" />
              Location-Based Recommendation
            </h2>
            <button
              onClick={getGPSLocation}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <MapPin className="h-4 w-4 mr-1" />
              Get GPS Location
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Location</div>
              <div className="text-lg font-semibold">{location}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Soil Type</div>
              <div className="text-lg font-semibold">Clay Loam (pH 6.8)</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Groundwater</div>
              <div className="text-lg font-semibold">12m depth ✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  🚀 Recommended: Tube Well Irrigation
                </h3>
                <div className="flex items-center mb-2">
                  <span className="text-sm mr-2">Suitability Score:</span>
                  <div className="flex text-yellow-300">
                    {[1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-current" />
                    ))}
                    <Star className="h-4 w-4" />
                  </div>
                  <span className="ml-2 font-semibold">85/100</span>
                </div>
                <p className="opacity-90">
                  Based on your soil type, groundwater availability, and regional climate data
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={() => setShowWhyModal(true)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors mb-2 block"
                >
                  ✅ Why this method?
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  🔄 See Alternatives
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Irrigation Method Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tube Well Irrigation Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
              <h3 className="text-xl font-bold mb-2">
                <Droplets className="h-5 w-5 inline mr-2" />
                Tube Well Irrigation
              </h3>
              <div className="text-sm opacity-90">Most suitable for your region</div>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Area Coverage:</span>
                  <span className="font-semibold">~2 ha/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Groundwater Depth:</span>
                  <span className="font-semibold text-green-600">12m ✔️ economical</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Electricity/Diesel Cost:</span>
                  <span className="font-semibold">~₹250/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Water Efficiency:</span>
                  <span className="font-semibold">60%</span>
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  ⚡ Estimate My Electricity Bill
                </button>
                <button className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors">
                  💧 Start Pump Alert
                </button>
                <button className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors">
                  📊 Compare With Canal/Tank
                </button>
              </div>
            </div>
          </div>

          {/* Drip Irrigation Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-400 to-green-500 text-white p-6">
              <h3 className="text-xl font-bold mb-2">
                <Leaf className="h-5 w-5 inline mr-2" />
                Drip Irrigation (Micro)
              </h3>
              <div className="text-sm opacity-90">High efficiency, low water usage</div>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className="font-semibold text-green-600">85–95%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Water Required:</span>
                  <span className="font-semibold">5L/hr per plant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Best For:</span>
                  <span className="font-semibold">Vegetables, orchards</span>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <span className="text-green-700 font-semibold">🌱 Govt Subsidy Available</span>
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors">
                  💰 Check Subsidy
                </button>
                <button className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors">
                  🔔 Low Pressure Alert
                </button>
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  🛠 Maintenance Tips
                </button>
              </div>
            </div>
          </div>

          {/* Tank Irrigation Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-6">
              <h3 className="text-xl font-bold mb-2">
                <Droplets className="h-5 w-5 inline mr-2" />
                Tank Irrigation
              </h3>
              <div className="text-sm opacity-90">Community-based irrigation</div>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage:</span>
                  <span className="font-semibold">~50 acres in cluster</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Feasible In:</span>
                  <span className="font-semibold">TN, Telangana, AP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Seasonal Use:</span>
                  <span className="font-semibold">Rainy → Winter crops</span>
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  👨‍👩‍👩 Pool With Neighbours
                </button>
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  📍 Find Local Tanks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cost & Energy Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            <Calculator className="h-6 w-6 text-yellow-500 inline mr-2" />
            Cost & Energy Calculator
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours of irrigation/day:
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={irrigationHours}
                  onChange={(e) => setIrrigationHours(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center mt-1 font-semibold">
                  {irrigationHours} hours
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Type:
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rice">Rice</option>
                  <option value="wheat">Wheat</option>
                  <option value="sugarcane">Sugarcane</option>
                  <option value="cotton">Cotton</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600 font-medium">
                  💡 Estimated Electricity Bill
                </div>
                <div className="text-2xl font-bold text-yellow-700">
                  ₹{electricityBill}/week
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600 font-medium">
                  ⛽ Diesel Cost (if applicable)
                </div>
                <div className="text-2xl font-bold text-red-700">
                  ₹{dieselCost}/week
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={generateReport}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Cost Report (PDF)
            </button>
            <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors">
              🧾 Check Local Subsidy/Policy
            </button>
          </div>
        </div>

        {/* Soil & Crop Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <Flask className="h-5 w-5 text-blue-500 inline mr-2" />
              Soil Analysis
            </h3>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Upload Soil Test Result</p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  onChange={handleSoilTestUpload}
                  className="hidden"
                  id="soilTestUpload"
                />
                <button
                  onClick={() => document.getElementById('soilTestUpload')?.click()}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  🔬 Upload Test Report
                </button>
              </div>
              {soilTestUploaded && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-green-700 font-medium">
                    AI Analysis Complete ✅
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Irrigation method updated based on soil data
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <Leaf className="h-5 w-5 text-green-500 inline mr-2" />
              Crop Selection
            </h3>
            <div className="space-y-3">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select your crop</option>
                <option value="rice-basmati">Rice - Basmati (Water-efficient)</option>
                <option value="wheat-dwarf">Wheat - Dwarf variety</option>
                <option value="cotton-bt">Cotton - BT variety</option>
                <option value="tomato-hybrid">Tomato - Hybrid</option>
                <option value="mango-alphonso">Mango - Alphonso</option>
              </select>
              <button
                onClick={showCropSuggestion}
                className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                🌾 Get Water-Efficient Varieties
              </button>
              {cropSuggestionVisible && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-green-700 font-medium">
                    💡 Recommended: IR64 Rice
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    30% less water requirement, high yield
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <Bell className="h-5 w-5 text-yellow-500 inline mr-2" />
              Smart Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">Soil Moisture Alert</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">Weather Alert</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm">SMS Notifications</span>
                <input type="checkbox" className="toggle" />
              </div>
              <button className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors">
                ⏰ Setup Auto-Irrigation Alerts
              </button>
            </div>
          </div>
        </div>

        {/* Government Subsidy & Community Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <University className="h-5 w-5 text-green-500 inline mr-2" />
              Government Schemes & Subsidies
            </h3>
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
                <div className="font-medium text-green-800">PM-KUSUM Scheme</div>
                <div className="text-sm text-green-700">Solar pump subsidy up to 90%</div>
                <button className="mt-2 text-xs bg-green-500 text-white px-3 py-1 rounded">
                  Apply Now
                </button>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-800">Micro Irrigation Scheme</div>
                <div className="text-sm text-blue-700">Drip/Sprinkler subsidy 55-75%</div>
                <button className="mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded">
                  Check Eligibility
                </button>
              </div>
              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-3 rounded">
                <div className="font-medium text-yellow-800">State Agriculture Policy</div>
                <div className="text-sm text-yellow-700">Free electricity for farming</div>
                <button className="mt-2 text-xs bg-yellow-500 text-white px-3 py-1 rounded">
                  Learn More
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <Users className="h-5 w-5 text-purple-500 inline mr-2" />
              Farmer Community Network
            </h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  RS
                </div>
                <div className="flex-1">
                  <div className="font-medium">Rajesh Singh</div>
                  <div className="text-sm text-gray-600">2.5km away • Shares tube well</div>
                </div>
                <button className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 transition-colors">
                  Connect
                </button>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  MP
                </div>
                <div className="flex-1">
                  <div className="font-medium">Mohan Patel</div>
                  <div className="text-sm text-gray-600">1.8km away • Tank irrigation expert</div>
                </div>
                <button className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600 transition-colors">
                  Connect
                </button>
              </div>
              <button className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors">
                <Users className="h-4 w-4 inline mr-2" />
                Find More Neighbors
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Weather & Alerts */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            <Cloud className="h-5 w-5 text-blue-500 inline mr-2" />
            Real-time Weather & Irrigation Alerts
          </h3>
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Thermometer className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Temperature</div>
              <div className="text-xl font-bold">28°C</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Droplets className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Humidity</div>
              <div className="text-xl font-bold">65%</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Wind className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Wind Speed</div>
              <div className="text-xl font-bold">12 km/h</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Eye className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-sm text-gray-600">Visibility</div>
              <div className="text-xl font-bold">10 km</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 mr-3" />
              <div>
                <div className="font-bold">Weather Alert</div>
                <div className="text-sm opacity-90">
                  High temperature expected tomorrow. Increase irrigation by 20%.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Method Modal */}
        {showWhyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-bold mb-4">Why Tube Well Irrigation?</h3>
              <ul className="space-y-2 text-sm">
                <li>• Your soil type (Clay Loam) retains water well, suitable for tube well</li>
                <li>• Groundwater at 12m depth is economically viable</li>
                <li>• Regional rainfall pattern supports groundwater recharge</li>
                <li>• Cost-effective for 2+ hectare farms</li>
              </ul>
              <button
                onClick={() => setShowWhyModal(false)}
                className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default IrrigationWeather;
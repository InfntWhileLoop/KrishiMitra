import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Cloud, Thermometer, Droplets, Calendar, MapPin, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

const IrrigationWeather: React.FC = () => {
  const [soilMoisture, setSoilMoisture] = useState(65);
  const [temperature, setTemperature] = useState(28);
  const [humidity, setHumidity] = useState(72);
  const [recommendation, setRecommendation] = useState<any>(null);

  const weatherData = {
    today: { temp: 28, humidity: 72, rainfall: 0, condition: 'Partly Cloudy' },
    tomorrow: { temp: 30, humidity: 68, rainfall: 15, condition: 'Light Rain' },
    dayAfter: { temp: 26, humidity: 80, rainfall: 25, condition: 'Moderate Rain' }
  };

  const fieldData = {
    location: 'Patna Village',
    plotId: '12-A',
    area: '2.5 ha',
    crop: 'Kharif Rice',
    sowingWindow: '15–30 June',
    soilPh: 6.4,
    organicCarbon: 0.55,
    soilType: 'Loam'
  };

  useEffect(() => {
    calculateIrrigationRecommendation();
  }, [soilMoisture, temperature, humidity]);

  const calculateIrrigationRecommendation = () => {
    const tomorrowRain = weatherData.tomorrow.rainfall;
    const dayAfterRain = weatherData.dayAfter.rainfall;
    
    let decision = 'wait';
    let reason = '';
    let confidence = 85;
    
    if (soilMoisture < 40) {
      decision = 'irrigate';
      reason = `Soil moisture is low at ${soilMoisture}%. Irrigate immediately to prevent crop stress.`;
    } else if (soilMoisture > 80) {
      decision = 'wait';
      reason = `Soil moisture is high at ${soilMoisture}%. Wait for soil to dry before next irrigation.`;
    } else if (tomorrowRain > 10 || dayAfterRain > 10) {
      decision = 'wait';
      reason = `Don't irrigate today. Expected rainfall: tomorrow ${tomorrowRain}mm, day after ${dayAfterRain}mm.`;
    } else if (temperature > 32 && soilMoisture < 60) {
      decision = 'irrigate';
      reason = `High temperature (${temperature}°C) and moderate soil moisture (${soilMoisture}%). Light irrigation recommended.`;
    } else {
      decision = 'wait';
      reason = `Current conditions are optimal. Soil moisture at ${soilMoisture}% is adequate for now.`;
    }

    setRecommendation({ decision, reason, confidence });
  };

  const getDecisionColor = (decision: string) => {
    return decision === 'irrigate' ? 'text-blue-600' : 'text-green-600';
  };

  const getDecisionIcon = (decision: string) => {
    return decision === 'irrigate' ? Droplets : CheckCircle;
  };

  const getMoistureColor = (moisture: number) => {
    if (moisture < 40) return 'bg-red-500';
    if (moisture < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 35) return 'text-red-600';
    if (temp > 30) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Context Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-green-700 flex items-center">
                <Cloud className="h-6 w-6 mr-2" />
                Irrigation & Weather
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{fieldData.location}</span>
                <span>•</span>
                <span>Plot ID: {fieldData.plotId}</span>
                <span>•</span>
                <span>{fieldData.area}</span>
              </div>
            </div>
            <div className="bg-green-100 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-green-700">High Confidence</span>
            </div>
          </div>

          {/* Crop & Context Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-800">{fieldData.crop}</span>
              </div>
              <div className="text-sm text-blue-600">
                Sowing window: {fieldData.sowingWindow}
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <span className="font-semibold text-orange-800">Soil Health</span>
              </div>
              <div className="text-sm text-orange-600">
                <span className="text-green-600">pH {fieldData.soilPh} ✓</span> • 
                <span className="text-yellow-600">OC {fieldData.organicCarbon}% △</span> • 
                <span className="text-green-600">{fieldData.soilType} ✓</span>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
                <Cloud className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="font-semibold text-yellow-800">6-Month Forecast</span>
              </div>
              <div className="text-sm text-yellow-600">
                <span>☀ Heat risk (med)</span> • 
                <span>🌧 Monsoon -7%</span> • 
                <span>🌊 Flood (low)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Soil Moisture</h3>
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{soilMoisture}%</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className={`h-3 rounded-full transition-all ${getMoistureColor(soilMoisture)}`}
                  style={{ width: `${soilMoisture}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {soilMoisture < 40 ? 'Low - Irrigation needed' : 
                 soilMoisture < 60 ? 'Moderate - Monitor closely' : 
                 'Good - No irrigation needed'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Temperature</h3>
              <Thermometer className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getTemperatureColor(temperature)}`}>
                {temperature}°C
              </div>
              <p className="text-sm text-gray-600 mb-2">{weatherData.today.condition}</p>
              <div className="flex justify-center space-x-4 text-sm">
                <span>High: 32°C</span>
                <span>Low: 24°C</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Humidity</h3>
              <Cloud className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{humidity}%</div>
              <p className="text-sm text-gray-600">
                {humidity > 80 ? 'High - Disease risk' : 
                 humidity < 50 ? 'Low - Water stress risk' : 
                 'Optimal for crops'}
              </p>
            </div>
          </div>
        </div>

        {/* Irrigation Recommendation */}
        {recommendation && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center space-x-3 ${getDecisionColor(recommendation.decision)} mb-4`}>
                {React.createElement(getDecisionIcon(recommendation.decision), { className: "h-12 w-12" })}
                <span className="text-4xl font-bold">
                  {recommendation.decision === 'irrigate' ? 'IRRIGATE TODAY' : 'WAIT - DON\'T IRRIGATE'}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-lg text-gray-800 leading-relaxed">
                  {recommendation.reason}
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">{recommendation.confidence}% Confidence</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-Day Weather Forecast */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">3-Day Weather Forecast</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <h3 className="font-bold text-blue-800 mb-3">Today</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">{weatherData.today.temp}°C</div>
              <p className="text-blue-700 mb-2">{weatherData.today.condition}</p>
              <div className="flex justify-center items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600">{weatherData.today.rainfall}mm</span>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 text-center">
              <h3 className="font-bold text-purple-800 mb-3">Tomorrow</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">{weatherData.tomorrow.temp}°C</div>
              <p className="text-purple-700 mb-2">{weatherData.tomorrow.condition}</p>
              <div className="flex justify-center items-center space-x-2">
                <Droplets className="h-4 w-4 text-purple-600" />
                <span className="text-purple-600">{weatherData.tomorrow.rainfall}mm</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6 text-center">
              <h3 className="font-bold text-green-800 mb-3">Day After</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">{weatherData.dayAfter.temp}°C</div>
              <p className="text-green-700 mb-2">{weatherData.dayAfter.condition}</p>
              <div className="flex justify-center items-center space-x-2">
                <Droplets className="h-4 w-4 text-green-600" />
                <span className="text-green-600">{weatherData.dayAfter.rainfall}mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Field Status */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Field Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Soil Conditions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">pH Level</span>
                    <span className="font-semibold text-green-600">{fieldData.soilPh} ✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Organic Carbon</span>
                    <span className="font-semibold text-yellow-600">{fieldData.organicCarbon}% △</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Soil Type</span>
                    <span className="font-semibold text-green-600">{fieldData.soilType} ✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Crop Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Crop</span>
                    <span className="font-semibold text-blue-600">{fieldData.crop}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sowing Window</span>
                    <span className="font-semibold text-gray-800">{fieldData.sowingWindow}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Field Area</span>
                    <span className="font-semibold text-gray-800">{fieldData.area}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-800 mb-2">Weather Uncertainty Alert</h3>
                <p className="text-yellow-700 mb-3">
                  High monsoon uncertainty detected. Monitor weather closely and be prepared for irrigation adjustments.
                </p>
                <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium">
                  View Forecast Details
                </button>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <h3 className="font-bold text-red-800 mb-2">Soil Alert</h3>
                <p className="text-red-700 mb-3">
                  Low organic carbon ({fieldData.organicCarbon}%) may limit yields. Consider organic amendments before next season.
                </p>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                  See Improvement Guide
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
            Quick Insights
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <div className="font-medium text-gray-800">Early sowing recommended</div>
                <div className="text-sm text-gray-600">Monsoon may be delayed by 1-2 weeks</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
              <Thermometer className="h-5 w-5 text-orange-600 mt-1" />
              <div>
                <div className="font-medium text-gray-800">Heat stress risk</div>
                <div className="text-sm text-gray-600">Choose heat-tolerant varieties and adjust irrigation timing</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="font-medium text-gray-800">Market outlook positive</div>
                <div className="text-sm text-gray-600">Rice prices trending upward, good export demand expected</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IrrigationWeather;
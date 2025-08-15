import React, { useState } from 'react';
import Layout from '../components/Layout';
import { TrendingUp, TrendingDown, Calculator, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';

const MarketPrice: React.FC = () => {
  const [quantity, setQuantity] = useState('');
  const [holdingCapacity, setHoldingCapacity] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [showGraph, setShowGraph] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);

  const crops = [
    { value: 'rice', label: 'Rice (Basmati)' },
    { value: 'wheat', label: 'Wheat' },
    { value: 'cotton', label: 'Cotton' },
    { value: 'sugarcane', label: 'Sugarcane' },
    { value: 'maize', label: 'Maize' },
    { value: 'soybean', label: 'Soybean' }
  ];

  const marketData = {
    rice: { current: 2150, nextWeek: 2170, storage: 35 },
    wheat: { current: 1875, nextWeek: 1840, storage: 25 },
    cotton: { current: 5200, nextWeek: 5380, storage: 45 },
    sugarcane: { current: 285, nextWeek: 300, storage: 15 },
    maize: { current: 1650, nextWeek: 1625, storage: 30 },
    soybean: { current: 4100, nextWeek: 4320, storage: 40 }
  };

  const calculateRecommendation = () => {
    if (!quantity || !holdingCapacity) return;

    const crop = marketData[selectedCrop as keyof typeof marketData];
    const currentPrice = crop.current;
    const nextWeekPrice = crop.nextWeek;
    const storageCostPerDay = crop.storage;
    const totalStorageCost = storageCostPerDay * 7; // 7 days
    
    const priceDifference = nextWeekPrice - currentPrice;
    const netGain = priceDifference - totalStorageCost;
    
    const decision = netGain > 50 ? 'wait' : 'sell';
    
    setRecommendation({
      decision,
      currentPrice,
      nextWeekPrice,
      priceDifference,
      storageCost: totalStorageCost,
      netGain,
      quantity: parseFloat(quantity),
      totalValue: parseFloat(quantity) * currentPrice,
      reason: decision === 'sell' 
        ? `Sell now — expected price next week is ₹${nextWeekPrice.toLocaleString()}, only ₹${Math.abs(priceDifference)} ${priceDifference >= 0 ? 'more' : 'less'} than today. Storage will cost ₹${totalStorageCost}/week.`
        : `Wait to sell — expected price next week is ₹${nextWeekPrice.toLocaleString()}, ₹${priceDifference} more than today. After storage costs of ₹${totalStorageCost}, you'll gain ₹${netGain} per quintal.`
    });
  };

  const getDecisionColor = (decision: string) => {
    return decision === 'sell' ? 'text-red-600' : 'text-green-600';
  };

  const getDecisionIcon = (decision: string) => {
    return decision === 'sell' ? AlertCircle : CheckCircle;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Price Calculator</h1>
          <p className="text-gray-600 text-lg">Get smart recommendations on when to sell your crops</p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Enter Your Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">Select Crop</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {crops.map((crop) => (
                  <option key={crop.value} value={crop.value}>
                    {crop.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">Quantity (Quintals)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity in quintals"
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">Storage Capacity (Days)</label>
              <input
                type="number"
                value={holdingCapacity}
                onChange={(e) => setHoldingCapacity(e.target.value)}
                placeholder="How many days can you store?"
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={calculateRecommendation}
              disabled={!quantity || !holdingCapacity}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Calculator className="h-6 w-6" />
              <span>Get Recommendation</span>
            </button>
          </div>
        </div>

        {/* Recommendation Result */}
        {recommendation && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center space-x-3 ${getDecisionColor(recommendation.decision)} mb-4`}>
                {React.createElement(getDecisionIcon(recommendation.decision), { className: "h-12 w-12" })}
                <span className="text-4xl font-bold">
                  {recommendation.decision === 'sell' ? 'SELL NOW' : 'WAIT TO SELL'}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <p className="text-lg text-gray-800 leading-relaxed">
                  {recommendation.reason}
                </p>
              </div>
            </div>

            {/* Price Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-blue-800 mb-2">
                  ₹{recommendation.currentPrice.toLocaleString()}
                </div>
                <p className="text-blue-700 font-medium">Current Price/Quintal</p>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-purple-800 mb-2">
                  ₹{recommendation.nextWeekPrice.toLocaleString()}
                </div>
                <p className="text-purple-700 font-medium">Expected Next Week</p>
              </div>
              
              <div className={`rounded-xl p-6 text-center ${
                recommendation.priceDifference >= 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`text-2xl font-bold mb-2 flex items-center justify-center space-x-2 ${
                  recommendation.priceDifference >= 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {recommendation.priceDifference >= 0 ? 
                    <TrendingUp className="h-6 w-6" /> : 
                    <TrendingDown className="h-6 w-6" />
                  }
                  <span>₹{Math.abs(recommendation.priceDifference)}</span>
                </div>
                <p className={`font-medium ${
                  recommendation.priceDifference >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  Price Change
                </p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-semibold">{recommendation.quantity} quintals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Total Value:</span>
                  <span className="font-semibold">₹{recommendation.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Cost (7 days):</span>
                  <span className="font-semibold">₹{recommendation.storageCost}/quintal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Gain/Loss:</span>
                  <span className={`font-semibold ${recommendation.netGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{recommendation.netGain}/quintal
                  </span>
                </div>
              </div>
            </div>

            {/* Graph Toggle */}
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowGraph(!showGraph)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2 mx-auto"
              >
                <BarChart3 className="h-5 w-5" />
                <span>{showGraph ? 'Hide' : 'Show'} Price Graph</span>
              </button>
            </div>

            {/* Simple Graph View */}
            {showGraph && (
              <div className="mt-6 bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Price Trend</h4>
                <div className="flex items-end justify-center space-x-8 h-32">
                  <div className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 rounded-t-lg w-16 mb-2"
                      style={{ height: `${(recommendation.currentPrice / Math.max(recommendation.currentPrice, recommendation.nextWeekPrice)) * 100}px` }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">Today</span>
                    <span className="text-xs text-gray-500">₹{recommendation.currentPrice}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div 
                      className="bg-purple-500 rounded-t-lg w-16 mb-2"
                      style={{ height: `${(recommendation.nextWeekPrice / Math.max(recommendation.currentPrice, recommendation.nextWeekPrice)) * 100}px` }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">Next Week</span>
                    <span className="text-xs text-gray-500">₹{recommendation.nextWeekPrice}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MarketPrice;
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Leaf, Star, BarChart3, Phone, Navigation, Download, Share, Plus, ChevronDown, ChevronUp, Info, CheckCircle, AlertTriangle, Thermometer, Clock, FlaskRound as Flask, Shield } from 'lucide-react';

interface Variety {
  id: number;
  name: string;
  code: string;
  score: number;
  confidence: number;
  yield: [number, number];
  maturity: number;
  traits: string[];
  risks: string;
  requirements: string;
  dealer: {
    name: string;
    distance: string;
    price: string;
  };
  soilMatch: {
    ph: number;
    oc: number;
    texture: number;
  };
}

const SeedVariety: React.FC = () => {
  const [selectedVarieties, setSelectedVarieties] = useState<Set<number>>(new Set());
  const [expandedExplanation, setExpandedExplanation] = useState<number | null>(null);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<number | null>(null);
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [currentSettings, setCurrentSettings] = useState({
    irrigation: 'limited',
    riskStance: 50,
    budget: 15000,
    sowingShift: 0,
    dataSource: 'auto'
  });

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

  const varieties: Variety[] = [
    {
      id: 1,
      name: 'Sahbhagi Dhan',
      code: 'IR 74371-70-1-1-2',
      score: 0.82,
      confidence: 78,
      yield: [3.2, 3.8],
      maturity: 110,
      traits: ['Heat-tolerant', 'Drought-tolerant', 'BLB-resistant'],
      risks: 'Lower performance under standing water > 5 days',
      requirements: 'Needs 60–80 kg N/ha; prefers 20–25 cm spacing',
      dealer: {
        name: 'Patna Agro Seeds',
        distance: '7 km',
        price: '₹65/kg'
      },
      soilMatch: {
        ph: 85,
        oc: 60,
        texture: 90
      }
    },
    {
      id: 2,
      name: 'IR-64',
      code: 'IR 64-18',
      score: 0.76,
      confidence: 72,
      yield: [3.5, 4.2],
      maturity: 130,
      traits: ['High-yielding', 'Disease-resistant'],
      risks: 'Susceptible to heat stress during flowering',
      requirements: 'Requires assured irrigation; 80-100 kg N/ha',
      dealer: {
        name: 'Bihar Seeds Co.',
        distance: '12 km',
        price: '₹58/kg'
      },
      soilMatch: {
        ph: 80,
        oc: 75,
        texture: 65
      }
    },
    {
      id: 3,
      name: 'Swarna',
      code: 'MTU 7029',
      score: 0.71,
      confidence: 68,
      yield: [2.8, 3.5],
      maturity: 145,
      traits: ['Premium grain', 'Flood-tolerant'],
      risks: 'Long duration increases pest exposure risk',
      requirements: 'Prefers deep water; 70-90 kg N/ha',
      dealer: {
        name: 'Hajipur Agro',
        distance: '18 km',
        price: '₹72/kg'
      },
      soilMatch: {
        ph: 70,
        oc: 80,
        texture: 85
      }
    }
  ];

  const toggleCompare = (varietyId: number) => {
    const newSelected = new Set(selectedVarieties);
    if (newSelected.has(varietyId)) {
      newSelected.delete(varietyId);
    } else {
      newSelected.add(varietyId);
    }
    setSelectedVarieties(newSelected);
    
    if (newSelected.size >= 2) {
      setShowCompareDrawer(true);
    } else if (newSelected.size === 0) {
      setShowCompareDrawer(false);
    }
  };

  const toggleExplanation = (varietyId: number) => {
    setExpandedExplanation(expandedExplanation === varietyId ? null : varietyId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'High Suitability';
    if (score >= 0.7) return 'Good Suitability';
    return 'Moderate Suitability';
  };

  const getBorderColor = (index: number) => {
    const colors = ['border-green-500', 'border-blue-400', 'border-yellow-400'];
    return colors[index] || 'border-gray-400';
  };

  const getGradientColor = (index: number) => {
    const colors = [
      'from-green-50 to-blue-50',
      'from-blue-50 to-indigo-50',
      'from-yellow-50 to-orange-50'
    ];
    return colors[index] || 'from-gray-50 to-gray-100';
  };

  const getRankColor = (index: number) => {
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500'];
    return colors[index] || 'bg-gray-500';
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Context Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-green-700 flex items-center">
                <Leaf className="h-6 w-6 mr-2" />
                Seed Variety Recommendations
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{fieldData.location}</span>
                <span>•</span>
                <span>Plot ID: {fieldData.plotId}</span>
                <span>•</span>
                <span>{fieldData.area}</span>
              </div>
            </div>
            <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
              <div className="w-4 h-4 mr-2 relative">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-green-700">High Confidence</span>
              <Info 
                className="h-4 w-4 ml-1 text-green-600 cursor-pointer" 
                onClick={() => setShowConfidenceModal(true)}
              />
            </div>
          </div>

          {/* Crop & Context Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center mb-1">
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

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Irrigation Toggle */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Irrigation</label>
              <div className="flex space-x-1">
                {['none', 'limited', 'assured'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setCurrentSettings({...currentSettings, irrigation: type})}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      currentSettings.irrigation === type
                        ? type === 'none' ? 'bg-red-500 text-white' :
                          type === 'limited' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        : type === 'none' ? 'bg-red-100 text-red-700' :
                          type === 'limited' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Stance */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Stance</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Conservative</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={currentSettings.riskStance}
                  onChange={(e) => setCurrentSettings({...currentSettings, riskStance: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">Aggressive</span>
              </div>
              <div className="text-center mt-1">
                <span className={`text-xs font-medium ${
                  currentSettings.riskStance < 33 ? 'text-green-600' :
                  currentSettings.riskStance > 66 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {currentSettings.riskStance < 33 ? 'Conservative' :
                   currentSettings.riskStance > 66 ? 'Aggressive' : 'Balanced'}
                </span>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget/acre</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">₹5k</span>
                <input 
                  type="range" 
                  min="5000" 
                  max="25000" 
                  value={currentSettings.budget}
                  step="1000"
                  onChange={(e) => setCurrentSettings({...currentSettings, budget: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">₹25k</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-xs font-medium text-green-600">
                  ₹{(currentSettings.budget/1000).toFixed(0)}k
                </span>
              </div>
            </div>

            {/* Sowing Date */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sowing Date</label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">-2w</span>
                <input 
                  type="range" 
                  min="-14" 
                  max="14" 
                  value={currentSettings.sowingShift}
                  onChange={(e) => setCurrentSettings({...currentSettings, sowingShift: parseInt(e.target.value)})}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">+2w</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-xs font-medium text-purple-600">
                  {new Date(new Date('2025-06-22').getTime() + currentSettings.sowingShift * 24 * 60 * 60 * 1000)
                    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>

            {/* Data Source */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
              <div className="flex space-x-1">
                {['auto', 'manual'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setCurrentSettings({...currentSettings, dataSource: type})}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      currentSettings.dataSource === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {type === 'auto' ? 'Auto' : 'Edit'}
                  </button>
                ))}
              </div>
              {currentSettings.dataSource === 'manual' && (
                <div className="mt-1">
                  <span className="text-xs text-orange-600">✎ Overridden</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variety Recommendations */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Star className="h-6 w-6 text-yellow-500 mr-3" />
            Seed Variety Recommendations
          </h2>

          {varieties.map((variety, index) => (
            <div key={variety.id} className={`bg-white rounded-xl shadow-lg border-l-4 ${getBorderColor(index)} overflow-hidden`}>
              {/* Header */}
              <div className={`bg-gradient-to-r ${getGradientColor(index)} px-6 py-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`${getRankColor(index)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                      #{index + 1} of 10
                    </span>
                    <h3 className="text-xl font-bold text-gray-800">{variety.name}</h3>
                    <span className="text-sm text-gray-600">({variety.code})</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleCompare(variety.id)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedVarieties.has(variety.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      Compare
                    </button>
                  </div>
                </div>
                
                {/* Trait Chips */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    {variety.maturity} days
                  </span>
                  {variety.traits.map((trait, i) => (
                    <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* Fit & Score */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="flex items-center mb-3">
                      <span className={`text-2xl font-bold ${getScoreColor(variety.score)}`}>
                        {variety.score.toFixed(2)}
                      </span>
                      <span className="ml-2 text-lg text-gray-600">{getScoreLabel(variety.score)}</span>
                      <span className="ml-4 text-sm text-gray-500">{variety.confidence}% confidence</span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Expected Yield</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {variety.yield[0]}–{variety.yield[1]} t/ha
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700 block mb-2">Soil Match</span>
                      <div className="space-y-2">
                        {Object.entries(variety.soilMatch).map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <span className="w-16 text-sm text-gray-600 capitalize">{key}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                              <div 
                                className={`h-2 rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${value}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm ${value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {value >= 80 ? '✓' : value >= 60 ? '△' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Sowing Fit</span>
                      <div className="text-sm text-gray-600">Best by 25 June (OK till 5 July)</div>
                    </div>
                  </div>
                </div>

                {/* Why This (Collapsible) */}
                <div className="mb-6">
                  <button 
                    onClick={() => toggleExplanation(variety.id)}
                    className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-3 transition-colors"
                  >
                    <span className="font-medium text-gray-800">
                      Why this variety? 
                      <span className="text-sm text-gray-500 ml-1">
                        ({variety.confidence}% confidence based on IMD 01-06 forecast & ICAR trials)
                      </span>
                    </span>
                    {expandedExplanation === variety.id ? 
                      <ChevronUp className="h-5 w-5 text-gray-500" /> :
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    }
                  </button>
                  {expandedExplanation === variety.id && (
                    <div className="mt-3 px-4 py-3 bg-blue-50 rounded-lg">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <Clock className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                          <span>Short maturity + delayed monsoon → lowers terminal drought risk</span>
                        </li>
                        <li className="flex items-start">
                          <Thermometer className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                          <span>High heat tolerance matches forecasted 4–6 hot days in flowering</span>
                        </li>
                        <li className="flex items-start">
                          <Flask className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          <span>Soil pH {fieldData.soilPh} within optimal 5.5–7.0</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <span className="text-xs text-gray-600">
                          <strong>Sources:</strong> IMD forecast (01-06), ICAR trials (2019–22), Soil Card (Plot-12)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Risks & Requirements */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Risks
                    </h4>
                    <p className="text-sm text-red-700">{variety.risks}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Requirements
                    </h4>
                    <p className="text-sm text-green-700">{variety.requirements}</p>
                  </div>
                </div>

                {/* Availability & Cost */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🏪</span>
                    Availability & Cost
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm mb-2">
                        <strong>Nearby Dealers:</strong>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-800">{variety.dealer.name}</div>
                            <div className="text-sm text-gray-600">{variety.dealer.distance} • {variety.dealer.price}</div>
                          </div>
                          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                            Check Stock
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm mb-2">
                        <strong>Subsidy:</strong>
                      </div>
                      <div className="bg-green-100 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-green-800">Seed Minikit Available</div>
                            <div className="text-sm text-green-600">State scheme</div>
                          </div>
                          <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center transition-colors">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Select
                  </button>
                  <button 
                    onClick={() => toggleCompare(variety.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Compare
                  </button>
                  <button 
                    onClick={() => setShowEvidenceModal(variety.id)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    View Evidence
                  </button>
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Plan
                  </button>
                </div>

                {/* Dealer Actions */}
                <div className="flex flex-wrap gap-3 mt-3">
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Dealer
                  </button>
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors">
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </button>
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Save Offline
                  </button>
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Show More Button */}
          <div className="text-center">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium border-2 border-dashed border-gray-300 transition-colors">
              <ChevronDown className="h-4 w-4 mr-2 inline" />
              Show more varieties (7 remaining)
            </button>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg flex items-center shadow-lg transition-colors">
              <Plus className="h-5 w-5 mr-3" />
              Add Chosen Variety to Season Plan
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Download Advisory (PDF)
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors">
              <Share className="h-4 w-4 mr-2" />
              Share to WhatsApp
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors">
              <Phone className="h-4 w-4 mr-2" />
              Call Nearest Dealer
            </button>
          </div>
        </div>

        {/* Compare Drawer */}
        {showCompareDrawer && (
          <div className="fixed inset-x-0 bottom-0 bg-white shadow-2xl z-50 rounded-t-2xl">
            <div className="max-w-7xl mx-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-500 mr-3" />
                  Compare Varieties
                </h3>
                <button 
                  onClick={() => {
                    setShowCompareDrawer(false);
                    setSelectedVarieties(new Set());
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from(selectedVarieties).map(varietyId => {
                  const variety = varieties.find(v => v.id === varietyId);
                  if (!variety) return null;
                  
                  return (
                    <div key={varietyId} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <h4 className="font-bold text-lg mb-3">{variety.name}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="font-semibold">{variety.score.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Yield:</span>
                          <span className="font-semibold">{variety.yield[0]}–{variety.yield[1]} t/ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Maturity:</span>
                          <span className="font-semibold">{variety.maturity} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Confidence:</span>
                          <span className="font-semibold">{variety.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Evidence Modal */}
        {showEvidenceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Info className="h-5 w-5 text-purple-500 mr-3" />
                    Scientific Evidence
                  </h3>
                  <button 
                    onClick={() => setShowEvidenceModal(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 mb-3">Top 5 SHAP Attributions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Thermometer className="h-4 w-4 text-red-500 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium">Heat Tolerance (+0.15)</div>
                          <div className="text-sm text-gray-600">Variety shows strong heat stress adaptation</div>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-blue-500 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium">Maturity Period (+0.12)</div>
                          <div className="text-sm text-gray-600">110-day cycle fits weather window</div>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Flask className="h-4 w-4 text-green-500 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium">Soil pH Compatibility (+0.08)</div>
                          <div className="text-sm text-gray-600">Optimal performance in pH 6.4 soil</div>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Droplets className="h-4 w-4 text-purple-500 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium">Drought Tolerance (+0.06)</div>
                          <div className="text-sm text-gray-600">Handles water stress better than alternatives</div>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-orange-500 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium">Disease Resistance (+0.04)</div>
                          <div className="text-sm text-gray-600">BLB resistance reduces crop failure risk</div>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-800 mb-3">Data Sources & Timestamps</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium text-gray-700">Weather Forecast</div>
                        <div className="text-sm text-gray-600">IMD • Updated: 01-06-2025</div>
                        <div className="text-sm text-gray-500">7-day forecast confidence: 85%</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Soil Analysis</div>
                        <div className="text-sm text-gray-600">Soil Card • Plot-12 • 15-03-2025</div>
                        <div className="text-sm text-gray-500">Laboratory verified</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Variety Performance</div>
                        <div className="text-sm text-gray-600">ICAR Trials • 2019-2022</div>
                        <div className="text-sm text-gray-500">Regional trials in Bihar</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Market Data</div>
                        <div className="text-sm text-gray-600">Agmarknet • Updated: Today</div>
                        <div className="text-sm text-gray-500">Patna & nearby mandis</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-bold text-green-800 mb-3">Trial References (Zone-specific)</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bihar Agricultural University Trial 2019-21</span>
                        <button className="text-green-600 text-sm underline hover:text-green-800">View Report</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">ICAR-NRRI Multi-location Trial 2020-22</span>
                        <button className="text-green-600 text-sm underline hover:text-green-800">View Report</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Farmer Field Trials - Patna District 2021-22</span>
                        <button className="text-green-600 text-sm underline hover:text-green-800">View Report</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Info Modal */}
        {showConfidenceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Confidence Explanation</h3>
                  <button 
                    onClick={() => setShowConfidenceModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-700">Our confidence level is based on:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1" />
                      <span>Weather forecast accuracy: 85% (IMD 7-day forecast)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1" />
                      <span>Soil data quality: 95% (Recent soil card)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1" />
                      <span>Historical trial data: 90% (3+ years ICAR trials)</span>
                    </li>
                    <li className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-1" />
                      <span>Market volatility: Medium risk</span>
                    </li>
                  </ul>
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> If forecast changes by &gt;25%, we will automatically re-rank varieties and notify you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Helper functions
const getBorderColor = (index: number) => {
  const colors = ['border-green-500', 'border-blue-400', 'border-yellow-400'];
  return colors[index] || 'border-gray-400';
};

const getGradientColor = (index: number) => {
  const colors = [
    'from-green-50 to-blue-50',
    'from-blue-50 to-indigo-50',
    'from-yellow-50 to-orange-50'
  ];
  return colors[index] || 'from-gray-50 to-gray-100';
};

const getRankColor = (index: number) => {
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500'];
  return colors[index] || 'bg-gray-500';
};

export default SeedVariety;
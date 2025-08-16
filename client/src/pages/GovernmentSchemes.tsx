import React, { useState } from 'react';
import Layout from '../components/Layout';
import { DollarSign, Phone, FileText, CheckCircle } from 'lucide-react';

const GovernmentSchemes: React.FC = () => {
  const [expandedScheme, setExpandedScheme] = useState<number | null>(null);

  const schemes = [
    {
      id: 1,
      name: 'PM-KISAN',
      amount: '₹6,000/year',
      description: 'Free money every year',
      details: 'Government gives ₹6,000 directly to your bank account every year.',
      whoCanApply: 'Farmers with land up to 2 hectares',
      howToApply: 'Go to bank or CSC center',
      documents: 'Land papers + Aadhaar + Bank account',
      helpline: '155261'
    },
    {
      id: 2,
      name: 'Kisan Credit Card',
      amount: 'Up to ₹3 Lakh',
      description: 'Easy loan for farming',
      details: 'Get loan up to ₹3 lakh for seeds, fertilizer, and farming needs.',
      whoCanApply: 'All farmers with land',
      howToApply: 'Visit any bank',
      documents: 'Land papers + Aadhaar + Bank account',
      helpline: '1800-180-1551'
    },
    {
      id: 3,
      name: 'Crop Insurance',
      amount: 'Very low cost',
      description: 'Protect crops from damage',
      details: 'If crops get damaged by weather, government pays you money.',
      whoCanApply: 'All farmers',
      howToApply: 'Through bank or insurance office',
      documents: 'Land papers + Crop details',
      helpline: '1800-200-7710'
    },
    {
      id: 4,
      name: 'Free Soil Testing',
      amount: 'Completely Free',
      description: 'Know what your soil needs',
      details: 'Government tests your soil for free and tells you which fertilizer to use.',
      whoCanApply: 'All farmers',
      howToApply: 'Contact agriculture officer',
      documents: 'Just land papers',
      helpline: '1800-180-1551'
    }
  ];

  const toggleExpand = (id: number) => {
    setExpandedScheme(expandedScheme === id ? null : id);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Simple Header */}
        <div className="bg-blue-600 rounded-xl p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Government Help</h1>
          <p className="text-blue-100">Free money and services for farmers</p>
        </div>

        {/* Schemes List */}
        <div className="space-y-4">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-100">
              {/* Scheme Header - Always Visible */}
              <div 
                className="p-6 cursor-pointer"
                onClick={() => toggleExpand(scheme.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{scheme.name}</h3>
                      <p className="text-gray-600">{scheme.description}</p>
                      <p className="text-green-600 font-bold text-lg">{scheme.amount}</p>
                    </div>
                  </div>
                  <div className="text-2xl text-gray-400">
                    {expandedScheme === scheme.id ? '−' : '+'}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedScheme === scheme.id && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="space-y-4 mt-4">
                    {/* What is it */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-bold text-blue-900 mb-2">What is this?</h4>
                      <p className="text-blue-800">{scheme.details}</p>
                    </div>

                    {/* Simple Info Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-1">Who can apply?</h4>
                        <p className="text-gray-700">{scheme.whoCanApply}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-1">How to apply?</h4>
                        <p className="text-gray-700">{scheme.howToApply}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-1">What to bring?</h4>
                        <p className="text-gray-700">{scheme.documents}</p>
                      </div>
                    </div>

                    {/* Help Number */}
                    <div className="bg-green-50 p-4 rounded-lg flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-bold text-green-900">Need help?</p>
                        <p className="text-green-800 text-lg font-bold">{scheme.helpline}</p>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors">
                      Apply Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Simple Help Section */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <FileText className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-yellow-900 mb-2">Need Help?</h2>
          <p className="text-yellow-800 mb-3">Call this number for any help</p>
          <p className="text-2xl font-bold text-yellow-900">1800-180-1551</p>
          <p className="text-yellow-700 text-sm mt-2">Free call from any phone</p>
        </div>
      </div>
    </Layout>
  );
};

export default GovernmentSchemes;
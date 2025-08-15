import React, { useState } from 'react';
import Layout from '../components/Layout';
import { FileText, DollarSign, Users, CheckCircle, ExternalLink, Phone } from 'lucide-react';

const GovernmentSchemes: React.FC = () => {
  const [selectedScheme, setSelectedScheme] = useState<any>(null);

  const schemes = [
    {
      id: 1,
      name: 'PM-KISAN (₹6,000/year)',
      type: 'Direct Money',
      description: 'Get ₹6,000 per year directly in your bank account',
      amount: '₹6,000/year',
      eligibility: 'Small farmers with up to 2 hectares land',
      howToApply: 'Visit nearest CSC center or apply online',
      documents: ['Land papers', 'Aadhaar card', 'Bank account'],
      phone: '155261',
      status: 'active'
    },
    {
      id: 2,
      name: 'Kisan Credit Card',
      type: 'Loan',
      description: 'Get loan up to ₹3 lakhs for farming needs',
      amount: 'Up to ₹3,00,000',
      eligibility: 'All farmers with land documents',
      howToApply: 'Visit any bank branch',
      documents: ['Land papers', 'Aadhaar card', 'Bank account'],
      phone: '1800-180-1551',
      status: 'active'
    },
    {
      id: 3,
      name: 'Crop Insurance',
      type: 'Insurance',
      description: 'Protect your crops from weather damage',
      amount: 'Very low premium',
      eligibility: 'All farmers growing crops',
      howToApply: 'Through bank or insurance company',
      documents: ['Land papers', 'Sowing certificate'],
      phone: '1800-200-7710',
      status: 'active'
    },
    {
      id: 4,
      name: 'Soil Health Card',
      type: 'Free Service',
      description: 'Free soil testing and fertilizer advice',
      amount: 'Completely Free',
      eligibility: 'All farmers',
      howToApply: 'Contact agriculture officer',
      documents: ['Land papers'],
      phone: '1800-180-1551',
      status: 'active'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Direct Money':
        return 'bg-green-100 text-green-800';
      case 'Loan':
        return 'bg-blue-100 text-blue-800';
      case 'Insurance':
        return 'bg-purple-100 text-purple-800';
      case 'Free Service':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Direct Money':
        return DollarSign;
      case 'Loan':
        return DollarSign;
      case 'Insurance':
        return FileText;
      case 'Free Service':
        return Users;
      default:
        return FileText;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Government Help for Farmers</h1>
          <p className="text-indigo-100">Money, loans, and free services from government</p>
        </div>

        {/* Scheme Cards */}
        <div className="space-y-4">
          {schemes.map((scheme) => {
            const TypeIcon = getTypeIcon(scheme.type);
            return (
              <div key={scheme.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`${getTypeColor(scheme.type)} p-3 rounded-lg`}>
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{scheme.name}</h3>
                      <p className="text-gray-600 mb-2">{scheme.description}</p>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(scheme.type)}`}>
                          {scheme.type}
                        </span>
                        <span className="text-green-600 font-bold">{scheme.amount}</span>
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>

                {selectedScheme?.id === scheme.id ? (
                  <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Who can apply:</h4>
                      <p className="text-gray-700">{scheme.eligibility}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">How to apply:</h4>
                      <p className="text-gray-700">{scheme.howToApply}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Documents needed:</h4>
                      <div className="flex flex-wrap gap-2">
                        {scheme.documents.map((doc, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Help: {scheme.phone}</span>
                    </div>

                    <div className="flex space-x-3">
                      <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2">
                        <span>Apply Now</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedScheme(null)}
                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedScheme(scheme)}
                    className="w-full bg-gray-50 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    View Details & Apply
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Need Help?</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">Call Kisan Call Center: <strong>1800-180-1551</strong></span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">Visit nearest CSC center or bank</span>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">Keep Aadhaar card and land papers ready</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GovernmentSchemes;
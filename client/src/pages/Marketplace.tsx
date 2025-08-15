import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Send, Plus, Clock, MapPin, Phone, User } from 'lucide-react';

const Community: React.FC = () => {
  const [message, setMessage] = useState('');
  const [showOffers, setShowOffers] = useState(false);

  const chatMessages = [
    {
      id: 1,
      type: 'received',
      sender: 'Ramesh Patil',
      message: 'Tractor available for rent - Mahindra 575, 50 HP. ₹800/day with all attachments.',
      time: '10:30 AM',
      location: 'Pune, Maharashtra'
    },
    {
      id: 2,
      type: 'received',
      sender: 'Suresh Kumar',
      message: 'Anyone facing pest issues in cotton? Found some effective organic solutions.',
      time: '10:25 AM',
      location: 'Nagpur, Maharashtra'
    },
    {
      id: 3,
      type: 'sent',
      message: 'Need tractor for 3 days. Available this week?',
      time: '10:32 AM'
    },
    {
      id: 4,
      type: 'received',
      sender: 'Ramesh Patil',
      message: 'Yes, available from Thursday. Can deliver to your farm. Contact: +91 98765 43210',
      time: '10:35 AM'
    },
    {
      id: 5,
      type: 'received',
      sender: 'Priya Sharma',
      message: 'Bulk buying fertilizer for next season. Anyone interested in joining? Better rates with group purchase.',
      time: '11:00 AM',
      location: 'Indore, MP'
    },
    {
      id: 6,
      type: 'received',
      sender: 'Gurpreet Singh',
      message: 'Premium Basmati rice seeds available - ₹150/kg. Disease resistant variety, high yield.',
      time: '11:15 AM',
      location: 'Amritsar, Punjab'
    },
    {
      id: 7,
      type: 'received',
      sender: 'Mukesh Sharma',
      message: 'Weather looking good for wheat sowing next week. Anyone else planning to start?',
      time: '2:20 PM',
      location: 'Indore, MP'
    },
    {
      id: 8,
      type: 'sent',
      message: 'Yes, planning to sow on Monday. What variety are you using?',
      time: '2:25 PM'
    },
    {
      id: 9,
      type: 'received',
      sender: 'Mukesh Sharma',
      message: 'Going with HD-2967. Good yield and disease resistance. You?',
      time: '2:27 PM'
    }
  ];

  const availableOffers = [
    {
      id: 1,
      title: 'Tractor Rental - Mahindra 575',
      price: '₹800/day',
      seller: 'Ramesh Patil',
      location: 'Pune, Maharashtra',
      phone: '+91 98765 43210'
    },
    {
      id: 2,
      title: 'Basmati Rice Seeds - Premium',
      price: '₹150/kg',
      seller: 'Gurpreet Singh',
      location: 'Amritsar, Punjab',
      phone: '+91 98765 43211'
    },
    {
      id: 3,
      title: 'Fertilizer Group Purchase',
      price: 'Bulk rates',
      seller: 'Priya Sharma',
      location: 'Indore, MP',
      phone: '+91 98765 43212'
    },
    {
      id: 4,
      title: 'Organic Pest Solutions',
      price: 'Free advice',
      seller: 'Suresh Kumar',
      location: 'Nagpur, Maharashtra',
      phone: '+91 98765 43213'
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Add message to chat (in real app, this would send to server)
      setMessage('');
    }
  };

  const handleRequestOffer = () => {
    setShowOffers(true);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Community Chat</h1>
          <p className="text-gray-600 mt-1">Connect and collaborate with farmers in your area</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    msg.type === 'sent'
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                  }`}
                >
                  {msg.type === 'received' && msg.sender && (
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-700 text-sm">{msg.sender}</span>
                    </div>
                  )}
                  
                  <p className="text-sm lg:text-base">{msg.message}</p>
                  
                  {msg.location && (
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{msg.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${
                      msg.type === 'sent' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
            />
            <button
              onClick={handleSendMessage}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
            <button
              onClick={handleRequestOffer}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-colors font-medium flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Quick Access</span>
            </button>
          </div>
        </div>

        {/* Quick Access Modal */}
        {showOffers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Recent Offers & Services</h2>
                  <button
                    onClick={() => setShowOffers(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="space-y-4">
                  {availableOffers.map((offer) => (
                    <div key={offer.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                          <p className="text-green-600 font-bold text-lg">{offer.price}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {offer.seller}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {offer.location}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {offer.phone}
                        </div>
                      </div>
                      
                      <button className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
                        Contact in Chat
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Community;
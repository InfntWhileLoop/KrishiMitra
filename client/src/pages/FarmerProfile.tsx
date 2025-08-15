import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { User, MapPin, Phone, Globe, Edit, Save, X, Plus, Trash2 } from 'lucide-react';

const FarmerProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user || {});
  const [newCrop, setNewCrop] = useState('');

  const handleSave = () => {
    updateProfile(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user || {});
    setIsEditing(false);
  };

  const addCrop = () => {
    if (newCrop.trim()) {
      const updatedUser = {
        ...editedUser,
        farmDetails: {
          ...editedUser.farmDetails,
          crops: [...(editedUser.farmDetails?.crops || []), newCrop.trim()]
        }
      };
      setEditedUser(updatedUser);
      setNewCrop('');
    }
  };

  const removeCrop = (index: number) => {
    const updatedUser = {
      ...editedUser,
      farmDetails: {
        ...editedUser.farmDetails,
        crops: editedUser.farmDetails?.crops?.filter((_, i) => i !== index) || []
      }
    };
    setEditedUser(updatedUser);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-4">
                <User className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user?.name}</h1>
                <p className="text-green-100">Registered Farmer</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"
            >
              <Edit className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            {isEditing && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.name || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{user?.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">+91 {user?.phone}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language</label>
              {isEditing ? (
                <select
                  value={editedUser.language || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, language: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Hindi">हिंदी (Hindi)</option>
                  <option value="English">English</option>
                  <option value="Marathi">मराठी (Marathi)</option>
                  <option value="Bengali">বাংলা (Bengali)</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="Telugu">తెలుగు (Telugu)</option>
                </select>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{user?.language}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.farmDetails?.location || ''}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    farmDetails: { ...editedUser.farmDetails, location: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your location"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{user?.farmDetails?.location || 'Not specified'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Farm Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Farm Details</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Land Size</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.farmDetails?.landSize || ''}
                  onChange={(e) => setEditedUser({
                    ...editedUser,
                    farmDetails: { ...editedUser.farmDetails, landSize: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 5 acres"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 font-medium">{user?.farmDetails?.landSize || 'Not specified'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crops Grown</label>
              <div className="space-y-3">
                {editedUser.farmDetails?.crops?.map((crop, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-800 font-medium">{crop}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeCrop(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newCrop}
                      onChange={(e) => setNewCrop(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Add new crop"
                    />
                    <button
                      onClick={addCrop}
                      className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Statistics */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 text-center">
              <div className="text-3xl font-bold text-blue-800 mb-2">247</div>
              <p className="text-blue-700 font-medium">AI Queries Asked</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
              <div className="text-3xl font-bold text-green-800 mb-2">15</div>
              <p className="text-green-700 font-medium">Community Posts</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 text-center">
              <div className="text-3xl font-bold text-purple-800 mb-2">92%</div>
              <p className="text-purple-700 font-medium">Recommendation Success</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Asked about irrigation timing</p>
                <p className="text-gray-600 text-sm">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Checked market prices</p>
                <p className="text-gray-600 text-sm">1 day ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Posted in community marketplace</p>
                <p className="text-gray-600 text-sm">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FarmerProfile;
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import FarmerProfile from './pages/FarmerProfile';
import Community from './pages/Marketplace';
import IrrigationWeather from './pages/IrrigationWeather';
import SeedVariety from './pages/SeedVariety';
import MarketPrice from './pages/MarketPrice';
import Cluster from './pages/Cluster';
import PestDisease from './pages/PestDisease';
import GovernmentSchemes from './pages/GovernmentSchemes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
<<<<<<< HEAD

=======
import { Toaster } from 'react-hot-toast';
>>>>>>> a4a1021 (Initial commit with changes)
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 text-lg font-medium">Loading KrishiMitra...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-green-50">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/ai-assistant" element={isAuthenticated ? <AIAssistant /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={isAuthenticated ? <FarmerProfile /> : <Navigate to="/auth" />} />
          <Route path="/marketplace" element={isAuthenticated ? <Community /> : <Navigate to="/auth" />} />
          <Route path="/irrigation-weather" element={isAuthenticated ? <IrrigationWeather /> : <Navigate to="/auth" />} />
          <Route path="/seed-variety" element={isAuthenticated ? <SeedVariety /> : <Navigate to="/auth" />} />
          <Route path="/market-price" element={isAuthenticated ? <MarketPrice /> : <Navigate to="/auth" />} />
          <Route path="/cluster" element={isAuthenticated ? <Cluster /> : <Navigate to="/auth" />} />
          <Route path="/pest-disease" element={isAuthenticated ? <PestDisease /> : <Navigate to="/auth" />} />
          <Route path="/schemes" element={isAuthenticated ? <GovernmentSchemes /> : <Navigate to="/auth" />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
<<<<<<< HEAD
=======
      <Toaster position="top-right" />  {/* ✅ add here */}
>>>>>>> a4a1021 (Initial commit with changes)
    </AuthProvider>
  );
}

<<<<<<< HEAD
=======

>>>>>>> a4a1021 (Initial commit with changes)
export default App;
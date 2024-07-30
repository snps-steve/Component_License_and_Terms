// src/App.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import SetupForm from './components/SetupForm';
import LicenseList from './components/LicenseList';
import LoadingPage from './components/LoadingPage'; 
import coltLogo from './colt_logo.png'; 
import synopsysLogo from './synopsys-logo-black-rgb.svg';
import searchImage from './search.png'; 
import axios from 'axios';

interface SetupFormWrapperProps {
  onSaveCredentials: (url: string, token: string) => void;
  onSetupComplete: () => void;
  credentialsExist: boolean;
}

const SetupFormWrapper: React.FC<SetupFormWrapperProps> = ({ onSaveCredentials, onSetupComplete, credentialsExist }) => {
  const navigate = useNavigate();

  return (
    <SetupForm 
      onSaveCredentials={(url: string, token: string) => onSaveCredentials(url, token)}
      onSetupComplete={onSetupComplete}
      credentialsExist={credentialsExist}
    />
  );
};

const App: React.FC = () => {
  const [credentialsExist, setCredentialsExist] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkCredentials = async () => {
      try {
        const response = await axios.get('/api/bd/credentials');
        if (response.data && response.data.url && response.data.token) {
          setCredentialsExist(true);
          navigate('/license-list');
        } else {
          setCredentialsExist(false);
          navigate('/setup');
        }
      } catch (error) {
        console.error('Failed to check credentials:', error);
        setCredentialsExist(false);
        navigate('/setup');
      }
    };

    checkCredentials();
  }, [navigate]);

  const handleSaveCredentials = async (url: string, token: string) => {
    try {
      await axios.post('/api/bd/save-credentials', { url, token });
      setCredentialsExist(true);
      navigate('/loading'); // Navigate to LoadingPage after saving credentials
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  };

  const handleSetupComplete = () => {
    console.log('Setup complete');
  };

  const handleClearCredentials = async () => {
    try {
      await axios.post('/api/bd/clear-credentials');
      setCredentialsExist(false);
      navigate('/setup');
    } catch (error) {
      console.error('Failed to clear credentials:', error);
    }
  };

  const handleSeedData = async () => {
    try {
      console.log('Seed Licenses button clicked');
      const response = await axios.post('/api/bd/load-licenses');
      console.log('Seed licenses response:', response.data);
    } catch (error) {
      console.error('Failed to seed licenses:', error);
    }
  };

  const handleClearLicenses = async () => {
    try {
      console.log('Clear Licenses button clicked');
      const response = await axios.post('/api/bd/clear-licenses');
      console.log('Clear licenses response:', response.data);
    } catch (error) {
      console.error('Failed to clear licenses:', error);
    }
  };
  
  return (
    <div className="flex min-h-screen">
      <Routes>
        <Route path="/setup" element={
          <div className="flex flex-1">
            <div className="w-full lg:w-2/5 flex flex-col justify-center p-8">
              <div className="mt-10">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-full">
                <div className="flex flex-col items-center">
                    <h1 className="mt-8 mb-4 text-2xl font-bold leading-9 tracking-tight text-gray-900 text-center">
                      Component License & Terms
                    </h1>
                    <img src={coltLogo} alt="colt" className="h-10 mb-1 w-auto" />
                  </div>
                  <img src={synopsysLogo} alt="Synopsys" className="w-48 mx-auto" />
                  <SetupFormWrapper 
                    onSaveCredentials={handleSaveCredentials} 
                    onSetupComplete={handleSetupComplete} 
                    credentialsExist={credentialsExist} 
                  />
                </div>
              </div>
            </div>
            <div className="w-full lg:w-3/5">
              <img src={searchImage} alt="Component License and Terms Search" className="w-full h-full object-cover" />
            </div>
          </div>
        } />
        <Route path="/license-list" element={
          <div className="flex flex-col items-center justify-center w-full p-8">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full xl:max-w-7xl mx-auto">
              <div className="mb-4 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">License List</h1>
              </div>
              <LicenseList 
                onClearCredentials={handleClearCredentials}
                onSeedData={handleSeedData}
                onClearLicenses={handleClearLicenses}
              />
            </div>
          </div>
        } />
        <Route path="/loading" element={<LoadingPage message="Loading licenses..." />} /> {/* Add route for LoadingPage */}
        <Route path="/" element={<Navigate to={credentialsExist ? "/license-list" : "/setup"} />} />
      </Routes>
    </div>
  );
};

export default App;


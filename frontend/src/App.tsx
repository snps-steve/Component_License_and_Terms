
// src/App.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'; // Import Navigate here
import SetupForm from './components/SetupForm';
import LicenseList from './components/LicenseList';
import alatLogo from './ALAT.png';
import synopsysLogo from './synopsys-logo-black-rgb.svg';
import searchLogo from './search.svg';
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
      onSaveCredentials={(url: string, token: string) => onSaveCredentials(url, token)} // Adjust arguments here
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

  const handleSaveCredentials = async (url: string, token: string) => { // Adjust function signature
    try {
      await axios.post('/api/bd/save-credentials', { url, token });
      setCredentialsExist(true);
      navigate('/license-list');
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
    // Function to seed data
  };

  const handleClearLicenses = async () => {
    // Function to clear licenses
  };

  return (
    <div className="flex min-h-full flex-1 lg:flex-col">
      <Routes>
        <Route path="/setup" element={
          <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div className="mx-auto w-full max-w-sm lg:w-96">
              <div className="flex flex-col items-center">
                <img src={alatLogo} alt="ALATS" className="h-10 w-auto" />
                <h1 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-gray-900 text-center">
                  Component License & Terms
                </h1>
              </div>
              <div className="mt-10">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl mx-auto">
                  <img src={synopsysLogo} alt="Synopsys" className="w-48 mb-4 mx-auto" />
                  <SetupFormWrapper 
                    onSaveCredentials={handleSaveCredentials} 
                    onSetupComplete={handleSetupComplete} 
                    credentialsExist={credentialsExist} 
                  />
                </div>
              </div>
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
        <Route path="/" element={<Navigate to={credentialsExist ? "/license-list" : "/setup"} />} /> {/* Adjust Navigate here */}
      </Routes>
    </div>
  );
};

export default App;

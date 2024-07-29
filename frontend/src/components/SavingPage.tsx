import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingIndicator from './LoadingIndicator';
import { useNavigate, useLocation } from 'react-router-dom';

interface SavingPageProps {
  url: string;
  token: string;
}

const SavingPage: React.FC<SavingPageProps> = ({ url, token }) => {
  const [message, setMessage] = useState('Saving credentials...');
  const navigate = useNavigate();

  useEffect(() => {
    const saveCredentials = async () => {
      try {
        const response = await axios.post('/api/bd/save-credentials', { url, token });
        if (response.data.success) {
          setMessage('Credentials saved successfully! Redirecting...');
          setTimeout(() => {
            navigate('/license-list');
          }, 2000);
        } else {
          setMessage('Failed to save credentials. Please try again.');
        }
      } catch (error) {
        console.error('Failed to save credentials', error);
        setMessage('Failed to save credentials. Please try again.');
      }
    };

    saveCredentials();
  }, [url, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <LoadingIndicator message={message} />
      </div>
    </div>
  );
};

export default SavingPage;


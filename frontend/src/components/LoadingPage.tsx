import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingIndicator from './LoadingIndicator';

interface LoadingPageProps {
  message: string;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ message }) => {
  const [loadingMessage, setLoadingMessage] = useState(message);
  const [licenses, setLicenses] = useState<string[]>([]);

  useEffect(() => {
    const loadLicenses = async () => {
      try {
        const response = await axios.post('/api/bd/load-licenses');
        if (response.data.success) {
          setLoadingMessage('Licenses loaded successfully!');
          setLicenses(response.data.licenses);
        }
      } catch (error) {
        console.error('Failed to load licenses', error);
        setLoadingMessage('Failed to load licenses. Please try again.');
      }
    };

    loadLicenses();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <LoadingIndicator message={loadingMessage} />
        {licenses.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Processed Licenses:</h3>
            <ul>
              {licenses.map((license, index) => (
                <li key={index} className="text-sm text-gray-500">{license}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingPage;

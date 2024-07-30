// src/components/LoadingPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingIndicator from './LoadingIndicator';
import { useNavigate } from 'react-router-dom';

interface LicenseTerm {
  licenseId: string;
  name: string;
  description: string;
  responsibility: string;
}

const LoadingPage: React.FC<{ message: string }> = ({ message }) => {
  const [loadingMessage, setLoadingMessage] = useState(message);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [licenseTerms, setLicenseTerms] = useState<Record<string, LicenseTerm[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadLicenses = async () => {
      try {
        const response = await axios.post('/api/bd/seed-licenses');
        if (response.data.success) {
          setLoadingMessage('Licenses loaded successfully!');
          setLicenses(response.data.licenses);
          loadLicenseTerms(response.data.licenses);
          navigate('/license-list'); 
        }
      } catch (error) {
        console.error('Failed to load licenses', error);
        setLoadingMessage('Failed to load licenses. Please try again.');
      }
    };

    const loadLicenseTerms = async (licenseIds: string[]) => {
      try {
        const termPromises = licenseIds.map(id => axios.get(`/api/bd/licenses/${id}/terms`));
        const termResponses = await Promise.all(termPromises);
        const newLicenseTerms = termResponses.reduce((acc, response, index) => {
          acc[licenseIds[index]] = response.data;
          return acc;
        }, {} as Record<string, LicenseTerm[]>);
        setLicenseTerms(newLicenseTerms);
      } catch (error) {
        console.error('Failed to load license terms', error);
      }
    };

    loadLicenses();
  }, [navigate]);

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

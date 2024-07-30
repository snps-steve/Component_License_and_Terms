
// src/components/SetupForm.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface SetupFormProps {
  onSaveCredentials: (url: string, token: string) => void;
  onSetupComplete: () => void;
  credentialsExist: boolean;
}

const validateUrl = (url: string) => {
  const pattern = /^(https:\/\/|http:\/\/)[^\s$.?#].[^\s]*$/i;
  return pattern.test(url) && !url.includes('/api');
};

const validateToken = (token: string) => {
  return token.length === 100;
};

const SetupForm: React.FC<SetupFormProps> = ({ onSaveCredentials, onSetupComplete, credentialsExist }) => {
  const [url, setUrl] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isTestEnabled, setIsTestEnabled] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (validateUrl(url) && validateToken(token)) {
      setIsSubmitEnabled(true);
      setIsTestEnabled(true);
    } else if (url && token) {
      setIsTestEnabled(true);
    } else {
      setIsSubmitEnabled(false);
      setIsTestEnabled(false);
    }
  }, [url, token]);

  const handleTest = async () => {
    if (!validateUrl(url)) {
      setErrorMessage('URL must start with http:// or https:// and must not include /api');
      setTestResult(null);
      return;
    }
    if (!validateToken(token)) {
      setErrorMessage('API Key must be exactly 100 characters');
      setTestResult(null);
      return;
    }

    setErrorMessage('');
    setTestResult('Testing credentials...');
    try {
      const response = await axios.post('/api/bd/test-credentials', { url, token });
      if (response.data.success) {
        setTestResult('Credentials are valid');
        setIsSubmitEnabled(true);
      } else {
        setTestResult(`Invalid credentials: ${response.data.error}`);
        setIsSubmitEnabled(false);
      }
    } catch (error) {
      setTestResult('Failed to test credentials');
      setIsSubmitEnabled(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(url)) {
      setErrorMessage('URL must start with http:// or https:// and must not include /api');
      return;
    }
    if (!validateToken(token)) {
      setErrorMessage('API Key must be exactly 100 characters');
      return;
    }

    setErrorMessage('');
    try {
      await axios.post('/api/bd/save-credentials', { url, token });
      setSaveMessage('Credentials have been saved');
      onSaveCredentials(url, token);
      onSetupComplete();
      navigate('/loading'); // Navigate to LoadingPage
    } catch (error) {
      setSaveMessage('Failed to save credentials');
    }
  };

  const getIndicatorColor = () => {
    if (!url || !token) {
      return 'bg-red-500'; // Incomplete form
    }
    if (testResult && testResult.includes('valid')) {
      return 'bg-green-500'; // Valid credentials
    }
    if (testResult && testResult.includes('Invalid') || errorMessage) {
      return 'bg-red-500'; // Invalid credentials
    }
    if (validateUrl(url) && validateToken(token)) {
      return 'bg-yellow-500'; // URL and token look good, needs testing
    }
    return 'bg-red-500';
  };

  const getIndicatorMessage = () => {
    if (!url && !token) {
      return 'Enter URL and API Token';
    }
    if (!url) {
      return 'Enter a BD Server URL';
    }
    if (!token) {
      return 'Enter an API Token Key';
    }
    if (testResult && testResult.includes('valid')) {
      return 'Please save to continue';
    }
    if (validateUrl(url) && validateToken(token)) {
      return 'Please test your credentials';
    }
    return '';
  };

  return (
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-10">
        <div className="flex items-center mb-4">
          <div className={`h-4 w-4 rounded-full ${getIndicatorColor()} mr-2`}></div>
          <p className="text-gray-700">{getIndicatorMessage()}</p>
        </div>
        {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
        {testResult && <div className={`mb-4 ${testResult.includes('valid') ? 'text-green-500' : 'text-red-500'}`}>{testResult}</div>}
        {saveMessage && <div className="mb-4 text-green-500">{saveMessage}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-900">
              Black Duck URL:
            </label>
            <div className="mt-2">
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder-left-margin placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Enter URL"
              />
            </div>
            {url && !validateUrl(url) && (
              <p className="text-red-500 text-sm mt-2">URL must start with http:// or https:// and must not include /api</p>
            )}
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-900">
              API Key:
            </label>
            <div className="mt-2">
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder-left-margin placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Enter Token"
              />
            </div>
            {token && !validateToken(token) && (
              <p className="text-red-500 text-sm mt-2">API Key must be exactly 100 characters</p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleTest}
              className={`flex w-full justify-center rounded-md bg-blue-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mx-2 ${!url || !token ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Test
            </button>
            <button
              type="submit"
              className={`flex w-full justify-center rounded-md bg-green-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mx-2 ${!isSubmitEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isSubmitEnabled}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupForm;

// src/components/SetupForm.js
import React, { useState } from 'react';
import axios from 'axios';

const SetupForm = ({ onSetupComplete }) => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/bd/setup', { url, token });
      onSetupComplete();
    } catch (error) {
      console.error('Failed to save credentials', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Black Duck URL:
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          API Key:
          <input type="text" value={token} onChange={(e) => setToken(e.target.value)} />
        </label>
      </div>
      <button type="submit">Save</button>
    </form>
  );
};

export default SetupForm;

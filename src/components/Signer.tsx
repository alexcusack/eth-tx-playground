import React, { useState } from 'react';
import { signData } from '../utils/ethersUtils';

interface Props {
  data: any;
  onDataSigned: (signedData: any) => void;
}

const Signer: React.FC<Props> = ({ data, onDataSigned }) => {
  const [privateKey, setPrivateKey] = useState('');
  const [signingMethod, setSigningMethod] = useState<'private-key' | 'metamask'>('private-key');

  const handleSign = async () => {
    try {
      let signedData;
      if (signingMethod === 'private-key') {
        signedData = await signData(data, privateKey);
      } else {
        // MetaMask signing
        if (!window.ethereum) {
          throw new Error('MetaMask not found');
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        signedData = await window.ethereum.request({
          method: 'eth_sign',
          params: [window.ethereum.selectedAddress, JSON.stringify(data)],
        });
      }
      onDataSigned(signedData);
    } catch (error) {
      console.error('Signing failed:', error);
      alert('Failed to sign data: ' + (error as Error).message);
    }
  };

  return (
    <div className="card">
      <h2>Signer</h2>
      <div>
        <select 
          value={signingMethod} 
          onChange={(e) => setSigningMethod(e.target.value as 'private-key' | 'metamask')}
        >
          <option value="private-key">Private Key</option>
          <option value="metamask">MetaMask</option>
        </select>
      </div>

      {signingMethod === 'private-key' && (
        <input
          type="password"
          placeholder="Private Key (without 0x)"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
        />
      )}

      <button onClick={handleSign}>Sign Data</button>
      
      <div className="data-preview">
        <h3>Data to Sign:</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
};

export default Signer; 
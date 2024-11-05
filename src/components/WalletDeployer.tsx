import React, { useState } from 'react';
import { ethers } from 'ethers';

const FACTORY_ADDRESS = '0x0BA5ED0c6AA8c49038F819E587E2633c4A9F428a';
const FACTORY_ABI = [
  // ... abbreviated for readability ...
  {
    inputs: [
      { internalType: "bytes[]", name: "owners", type: "bytes[]" },
      { internalType: "uint256", name: "nonce", type: "uint256" }
    ],
    name: "createAccount",
    outputs: [{ internalType: "contract CoinbaseSmartWallet", name: "account", type: "address" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes[]", name: "owners", type: "bytes[]" },
      { internalType: "uint256", name: "nonce", type: "uint256" }
    ],
    name: "getAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
];

const WalletDeployer: React.FC = () => {
  const [owners, setOwners] = useState<string[]>(['']);
  const [nonce, setNonce] = useState<string>('0');
  const [predictedAddress, setPredictedAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const addOwnerField = () => {
    setOwners([...owners, '']);
  };

  const updateOwner = (index: number, value: string) => {
    const newOwners = [...owners];
    newOwners[index] = value;
    setOwners(newOwners);
  };

  const removeOwner = (index: number) => {
    const newOwners = owners.filter((_, i) => i !== index);
    setOwners(newOwners);
  };

  const isValidInput = (input: string): boolean => {
    // Check if it's a valid Ethereum address
    if (ethers.isAddress(input)) return true;
    // Check if it's a valid 64-byte hex string (public key)
    return /^0x[0-9a-fA-F]{128}$/.test(input);
  };

  const convertToBytes = (input: string): string => {
    if (ethers.isAddress(input)) {
      // If it's an address, encode it as bytes
      return ethers.AbiCoder.defaultAbiCoder().encode(['address'], [input]);
    } else {
      // If it's a public key, just return it as is (it's already in bytes format)
      return input;
    }
  };

  const predictAddress = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      
      // Convert inputs to bytes format
      const ownersBytes = owners.map(convertToBytes);
    
      const predicted = await factory.getFunction("getAddress")(ownersBytes, nonce);
      setPredictedAddress(predicted);
    } catch (error) {
      console.error('Error predicting address:', error);
      alert('Failed to predict address: ' + (error as Error).message);
    }
  };

  const deployWallet = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

      // Convert inputs to bytes format
      const ownersBytes = owners.map(convertToBytes);
      
      const tx = await factory.createAccount(ownersBytes, nonce, { value: 0 });
      await tx.wait();
      
      alert('Wallet deployed successfully!');
    } catch (error) {
      console.error('Error deploying wallet:', error);
      alert('Failed to deploy wallet: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Deploy Smart Contract Wallet</h2>
      
      <div className="owners-section">
        <h3>Wallet Owners</h3>
        {owners.map((owner, index) => (
          <div key={index} className="owner-input">
            <input
              type="text"
              placeholder="Owner address (0x...)"
              value={owner}
              onChange={(e) => updateOwner(index, e.target.value)}
            />
            {owners.length > 1 && (
              <button onClick={() => removeOwner(index)}>Remove</button>
            )}
          </div>
        ))}
        <button onClick={addOwnerField}>Add Owner</button>
      </div>

      <div className="nonce-section">
        <h3>Nonce</h3>
        <input
          type="number"
          value={nonce}
          onChange={(e) => setNonce(e.target.value)}
          min="0"
        />
      </div>

      <button onClick={predictAddress}>Predict Address</button>
      {predictedAddress && (
        <div className="predicted-address">
          <h3>Predicted Wallet Address:</h3>
          <code>{predictedAddress}</code>
        </div>
      )}

      <button 
        onClick={deployWallet} 
        disabled={loading || owners.some(owner => !isValidInput(owner))}
      >
        {loading ? 'Deploying...' : 'Deploy Wallet'}
      </button>
    </div>
  );
};

export default WalletDeployer;
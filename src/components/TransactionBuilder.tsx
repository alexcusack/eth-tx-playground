import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

interface Props {
  onTransactionCreated: (tx: any) => void;
}

interface FunctionInput {
  name: string;
  type: string;
}

interface ContractFunction {
  name: string;
  inputs: FunctionInput[];
}

const TransactionBuilder = ({onTransactionCreated}: Props) => {
  const [contractAddress, setContractAddress] = useState('');
  const [contractABI, setContractABI] = useState<any[]>([]);
  const [availableFunctions, setAvailableFunctions] = useState<ContractFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<ContractFunction | null>(null);
  const [functionInputs, setFunctionInputs] = useState<{[key: string]: string}>({});
  const [encodedData, setEncodedData] = useState('');

  // Fetch ABI from Etherscan when contract address is entered
  useEffect(() => {
    const fetchABI = async () => {
      if (!ethers.isAddress(contractAddress)) return;
      
      try {
        const response = await fetch(
          `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=x`
        );
        const data = await response.json();
        const abi = JSON.parse(data.result);
        
        setContractABI(abi);
        // Filter out only functions from the ABI
        const functions = abi.filter((item: any) => item.type === 'function');
        setAvailableFunctions(functions);
      } catch (error) {
        console.error('Error fetching ABI:', error);
      }
    };

    fetchABI();
  }, [contractAddress]);

  // Encode function data when inputs change
  useEffect(() => {
    if (!selectedFunction || !contractAddress) return;

    try {
      const contract = new ethers.Contract(contractAddress, contractABI);
      const functionFragment = contract.interface.getFunction(selectedFunction.name);
      
      const values = selectedFunction.inputs.map(input => functionInputs[input.name]);
      const encoded = contract.interface.encodeFunctionData(functionFragment || "", values);
      
      setEncodedData(encoded);
    } catch (error) {
      console.error('Error encoding function data:', error);
    }
  }, [selectedFunction, functionInputs, contractAddress, contractABI]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block mb-2">Contract Address:</label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      {availableFunctions.length > 0 && (
        <div className="mb-4">
          <label className="block mb-2">Select Function:</label>
          <select
            onChange={(e) => {
              const func = availableFunctions.find(f => f.name === e.target.value);
              setSelectedFunction(func || null);
              setFunctionInputs({});
            }}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a function...</option>
            {availableFunctions.map((func) => (
              <option key={func.name} value={func.name}>
                {func.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedFunction && (
        <div className="mb-4">
          <h3 className="mb-2">Function Inputs:</h3>
          {selectedFunction.inputs.map((input) => (
            <div key={input.name} className="mb-2">
              <label className="block mb-1">{input.name} ({input.type}):</label>
              <input
                type="text"
                onChange={(e) => setFunctionInputs(prev => ({
                  ...prev,
                  [input.name]: e.target.value
                }))}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
        </div>
      )}

      {encodedData && (
        <div className="mb-4">
          <h3 className="mb-2">Encoded Transaction Data:</h3>
          <pre className="p-2 bg-gray-100 rounded overflow-x-auto">
            {encodedData}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TransactionBuilder;
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { TransactionRequest } from 'ethers';

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
  const [transactionDetails, setTransactionDetails] = useState({
    to: '',
    value: '0',
    gasLimit: '100000',
    gasPrice: '0',
  });
  const [unsignedTx, setUnsignedTx] = useState<TransactionRequest | null>(null);

  function bigintReplacer(key: string, value: any) {
    // Check if the value is a BigInt, and if so, convert it to a string
    return typeof value === 'bigint' ? value.toString() : value;
  }

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

  // Create transaction object
  useEffect(() => {
    if (!encodedData || !contractAddress) return;

    const tx: TransactionRequest = {
      to: contractAddress,
      data: encodedData,
      value: ethers.parseEther(transactionDetails.value || '0'),
      gasLimit: ethers.toBigInt(transactionDetails.gasLimit),
      gasPrice: ethers.toBigInt(transactionDetails.gasPrice || '0'),
    };
    setUnsignedTx(tx);
  }, [encodedData, contractAddress, transactionDetails]);

  // Sign transaction
  const handleSign = async () => {
    try {
      if (!window.ethereum || !unsignedTx) return;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signedTx = await signer.sendTransaction(unsignedTx);
      
      onTransactionCreated(signedTx);
    } catch (error) {
      console.error('Error signing transaction:', error);
    }
  };

  console.log(unsignedTx);
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
        <>
          <div className="mb-4">
            <h3 className="mb-2">Transaction Details:</h3>
            <div className="space-y-2">
              <div>
                <label className="block mb-1">Value (ETH):</label>
                <input
                  type="text"
                  value={transactionDetails.value}
                  onChange={(e) => setTransactionDetails(prev => ({
                    ...prev,
                    value: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Gas Limit:</label>
                <input
                  type="text"
                  value={transactionDetails.gasLimit}
                  onChange={(e) => setTransactionDetails(prev => ({
                    ...prev,
                    gasLimit: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Gas Price (wei):</label>
                <input
                  type="text"
                  value={transactionDetails.gasPrice}
                  onChange={(e) => setTransactionDetails(prev => ({
                    ...prev,
                    gasPrice: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="mb-2">Unsigned Transaction:</h3>
            <pre className="p-2 bg-gray-100 rounded overflow-x-auto">
              {unsignedTx ? JSON.stringify(unsignedTx, bigintReplacer, 2) : 'Loading...'}
            </pre>
          </div>

          <button
            onClick={handleSign}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign Transaction
          </button>
        </>
      )}
    </div>
  );
};

export default TransactionBuilder;
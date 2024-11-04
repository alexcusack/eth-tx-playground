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
    gasPrice: '50',
  });
  const [unsignedTx, setUnsignedTx] = useState<TransactionRequest | null>(null);

  function bigintReplacer(key: string, value: any) {
    // Check if the value is a BigInt, and if so, convert it to a string
    return typeof value === 'bigint' ? value.toString() : value;
  }

  // Fetch ABI from Etherscan when contract address is entered
  useEffect(() => {
    const fetchABI = async () => {
      console.log("fetching ABI", contractAddress, !ethers.isAddress(contractAddress));
      if (!ethers.isAddress(contractAddress.trim())) return;
      
      try {
        console.log("fetching ABI", contractAddress, process.env.REACT_APP_BASESCAN_API_KEY);
        // First, check if this is a proxy contract
        const proxyResponse = await fetch(
          `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.REACT_APP_BASESCAN_API_KEY}`
        );
        const proxyData = await proxyResponse.json();
        const proxyABI = JSON.parse(proxyData.result);
        console.log(proxyABI);
        // Check if this is a proxy contract by looking for typical proxy functions
        const isProxy = proxyABI.some((item: any) => 
          item.name === 'implementation' || 
          item.name === 'getImplementation' ||
          item.name === 'masterCopy'
        );

        if (isProxy) {
        console.log("is proxy", isProxy);
          // Create contract instance to call implementation() function
          const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
          const contract = new ethers.Contract(contractAddress, proxyABI, provider);
          
          // Try different common implementation getter methods
          let implementationAddress;
          try {
            implementationAddress = await contract.implementation();
          } catch {
            try {
              implementationAddress = await contract.getImplementation();
            } catch {
              try {
                implementationAddress = await contract.masterCopy();
              } catch (error) {
                console.error('Could not find implementation address:', error);
                return;
              }
            }
          }

          // Fetch ABI of the implementation contract
          const implResponse = await fetch(
            `https://api.basescan.org/api?module=contract&action=getabi&address=${implementationAddress}&apikey=JWB79IQ7UQ29XZWK9K9IG3ETAQ6IU9RUMX`
          );
          const implData = await implResponse.json();
          const implementationABI = JSON.parse(implData.result);
          
          setContractABI(implementationABI);
          const functions = implementationABI.filter((item: any) => item.type === 'function');
          setAvailableFunctions(functions);
        } else {
          // Not a proxy, use the original ABI
          setContractABI(proxyABI);
          const functions = proxyABI.filter((item: any) => item.type === 'function');
          setAvailableFunctions(functions);
        }
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
    onTransactionCreated(tx)
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

  // Initialize with USDC contract and transfer details
  useEffect(() => {
    setContractAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); // Base USDC
    
    // Once ABI is loaded and functions are available, set up transfer
    if (availableFunctions.length > 0) {

      const transferFunc = availableFunctions.find(f => f.name === 'transfer');
      
      if (transferFunc) {
        setSelectedFunction(transferFunc);
        setFunctionInputs({
          'to': '0x3D4F5543c123da1829C02Ce1761c90e07B73853D',
          'amount': '123000000' // 123 USDC (6 decimals)
        });
      }
    }
  }, [availableFunctions]);

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
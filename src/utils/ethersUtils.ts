import { ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';

export const signData = async (data: any, privateKey: string): Promise<any> => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    
    if ('sender' in data) {
      // This is a UserOp
      const userOpHash = getUserOpHash(data);
      const signature = await wallet.signMessage(ethers.getBytes(userOpHash));
      return {
        ...data,
        signature
      };
    } else {
      // This is a regular transaction
      const tx = {
        ...data,
        chainId: 1, // Change as needed
        nonce: 0,   // Should be fetched from the network
        gasLimit: 21000, // Basic transfer gas limit
      };
      return await wallet.signTransaction(tx);
    }
  } catch (error) {
    console.error('Signing error:', error);
    throw error;
  }
};

export const submitTransaction = async (
  signedTx: string,
  rpcUrl: string
): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const tx = await provider.broadcastTransaction(signedTx);
  return tx.hash;
};

export const submitUserOpToMempool = async (
  userOp: any,
  rpcUrl: string
): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Check if the RPC endpoint supports ERC-4337 methods
  const response = await provider.send('eth_sendUserOperation', [
    userOp,
    userOp.entryPoint
  ]);
  
  return response;
};

export const submitUserOpToEntryPoint = async (
  userOp: any,
  entryPointAddress: string,
  rpcUrl: string
): Promise<string> => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
//   const entryPoint = EntryPoint__factory.connect(entryPointAddress, provider);
  
//   const tx = await entryPoint.handleOps([userOp], userOp.sender);
//   return tx.hash;
return '1';
};

// Helper function to calculate UserOp hash according to ERC-4337 specification
const getUserOpHash = (userOp: any): string => {
  const packed = ethers.solidityPacked(
    [
      'address',
      'uint256',
      'bytes32',
      'bytes32',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'bytes32'
    ],
    [
      userOp.sender,
      userOp.nonce,
      ethers.keccak256(userOp.initCode),
      ethers.keccak256(userOp.callData),
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      ethers.keccak256(userOp.paymasterAndData)
    ]
  );
  
  return ethers.keccak256(packed);
};

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
} 
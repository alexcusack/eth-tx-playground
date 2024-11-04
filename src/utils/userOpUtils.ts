import { ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';
const ENTRYPOINT_ABI = [
    "function handleOps(UserOperation[] calldata ops, address beneficiary) external"
  ];




export const createUserOp = async ({
  sender,
  nonce,
  transaction
}: {
  sender: string;
  nonce: bigint;
  transaction: ethers.Transaction;
}) => {
  // Get current gas prices
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const feeData = await provider.getFeeData();
  console.log("fee data", feeData);
  console.log(transaction)
  const userOp = {
    sender,
    nonce: ethers.toBeHex(nonce),
    initCode: '0x',
    callData: transaction.data || '0x',
    callGasLimit: ethers.toBeHex(300000), // Adjusted for typical operations
    verificationGasLimit: ethers.toBeHex(200000),
    preVerificationGas: ethers.toBeHex(50000),
    maxFeePerGas: feeData.maxFeePerGas ? ethers.toBeHex(feeData.maxFeePerGas) : ethers.toBeHex(50000000000),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.toBeHex(feeData.maxPriorityFeePerGas) : ethers.toBeHex(1500000000),
    paymasterAndData: '0x',
    signature: '0x'
  };

  return userOp;
};

export const submitUserOp = async (userOp: any, entryPointAddress: string, beneficiary: string) => {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const entryPoint = new ethers.Contract(process.env.ENTRYPOINT_ADDRESS!, ENTRYPOINT_ABI, provider);
  try {
    const tx = await entryPoint.handleOps([userOp], beneficiary);
    return await tx.wait();
  } catch (error) {
    console.error('Error submitting UserOperation:', error);
    throw error;
  }
}; 
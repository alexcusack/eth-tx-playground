import { ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';
import { ENTRY_POINT_ADDRESS } from '../constants/contracts';

export const createUserOp = async ({
  sender,
  nonce,
  transaction
}: {
  sender: string;
  nonce: number;
  transaction: any;
}) => {
  const userOp = {
    sender,
    nonce,
    initCode: '0x',
    callData: transaction.data,
    callGasLimit: '0x' + (100000).toString(16),
    verificationGasLimit: '0x' + (100000).toString(16),
    preVerificationGas: '0x' + (21000).toString(16),
    maxFeePerGas: '0x' + (50000000000).toString(16),
    maxPriorityFeePerGas: '0x' + (1500000000).toString(16),
    paymasterAndData: '0x',
    signature: '0x'
  };

  return userOp;
};

export const submitUserOp = async (userOp: any, entryPointAddress: string) => {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
//   const entryPoint = EntryPoint__factory.connect(entryPointAddress, provider);
  
//   return await entryPoint.handleOps([userOp], sender);
}; 
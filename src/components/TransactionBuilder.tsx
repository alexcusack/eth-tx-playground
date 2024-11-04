import React, { useState } from 'react';
import { ethers } from 'ethers';

interface Props {
  onTransactionCreated: (tx: any) => void;
}

const TransactionBuilder: React.FC<Props> = ({ onTransactionCreated }) => {
  const [to, setTo] = useState('');
  const [value, setValue] = useState('');
  const [data, setData] = useState('');

  const buildTransaction = () => {
    const tx = {
      to,
      value: ethers.parseEther(value || '0'),
      data: data || '0x',
    };
    onTransactionCreated(tx);
  };

  return (
    <div className="card">
      <h2>Transaction Builder</h2>
      <input
        placeholder="To Address"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <input
        placeholder="Value (ETH)"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <input
        placeholder="Data (hex)"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <button onClick={buildTransaction}>Build Transaction</button>
    </div>
  );
};

export default TransactionBuilder; 
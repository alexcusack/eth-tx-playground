import React, { useEffect, useState } from 'react';
import { createUserOp } from '../utils/userOpUtils';

interface Props {
  transaction: any;
  onUserOpCreated: (userOp: any) => void;
}

const UserOpBuilder: React.FC<Props> = ({ transaction, onUserOpCreated }) => {
  const [sender, setSender] = useState('');
  const [nonce, setNonce] = useState('0');
  
  const buildUserOp = async () => {
    const userOp = await createUserOp({
      sender,
      nonce: BigInt(nonce),
      transaction
    });
    onUserOpCreated(userOp);
  };

  return (
    <div className="card">
      <h2>UserOp Builder</h2>
      <input
        placeholder="Sender Address"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
      />
      <input
        placeholder="Nonce"
        type="number"
        value={nonce}
        onChange={(e) => setNonce(e.target.value)}
      />
      <button onClick={buildUserOp}>Build UserOp</button>
    </div>
  );
};

export default UserOpBuilder; 
import React, { useState } from 'react';
import TransactionBuilder from './components/TransactionBuilder';
import UserOpBuilder from './components/UserOpBuilder';
import Signer from './components/Signer';
import SubmissionPanel from './components/SubmissionPanel';

const App: React.FC = () => {
  const [transaction, setTransaction] = useState<any>(null);
  const [userOp, setUserOp] = useState<any>(null);
  const [signedData, setSignedData] = useState<any>(null);

  return (
    <div className="container">
      <h1>Ethereum Playground</h1>
      
      <TransactionBuilder onTransactionCreated={setTransaction} />
      
      <UserOpBuilder 
        transaction={transaction} 
        onUserOpCreated={setUserOp} 
      />
      
      {userOp && (
        <Signer 
          data={userOp} 
          onDataSigned={setSignedData} 
        />
      )}
      
      {signedData && (
        <SubmissionPanel 
          signedData={signedData} 
          isUserOp={!!userOp} 
        />
      )}
    </div>
  );
};

export default App; 
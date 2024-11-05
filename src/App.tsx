import React, { useState } from 'react';
import TransactionBuilder from './components/TransactionBuilder';
import UserOpBuilder from './components/UserOpBuilder';
import Signer from './components/Signer';
import SubmissionPanel from './components/SubmissionPanel';
import WalletDeployer from './components/WalletDeployer';
import './App.css';

const App: React.FC = () => {
  const [transaction, setTransaction] = useState<any>(null);
  const [userOp, setUserOp] = useState<any>(null);
  const [signedData, setSignedData] = useState<any>(null);

  return (
    <div className="container">
      <h1>Eth Playground</h1>
      
      <div className="two-column-layout">
        <div className="left-column">
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

        <div className="right-column">
          <WalletDeployer />
        </div>
      </div>
    </div>
  );
};

export default App; 
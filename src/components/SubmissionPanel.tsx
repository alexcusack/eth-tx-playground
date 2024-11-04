import React, { useState } from 'react';
import { submitTransaction, submitUserOpToMempool, submitUserOpToEntryPoint } from '../utils/ethersUtils';
import { ENTRY_POINT_ADDRESS } from '../constants/contracts';

interface Props {
  signedData: any;
  isUserOp: boolean;
}

const SubmissionPanel: React.FC<Props> = ({ signedData, isUserOp }) => {
  const [rpcUrl, setRpcUrl] = useState('http://localhost:8545');
  const [submissionType, setSubmissionType] = useState<'mempool' | 'entrypoint'>('mempool');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let hash;
      if (isUserOp) {
        if (submissionType === 'mempool') {
          hash = await submitUserOpToMempool(signedData, rpcUrl);
        } else {
          hash = await submitUserOpToEntryPoint(signedData, ENTRY_POINT_ADDRESS, rpcUrl);
        }
      } else {
        hash = await submitTransaction(signedData, rpcUrl);
      }
      setTxHash(hash);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Transaction Submission</h2>
      
      <input
        placeholder="RPC URL"
        value={rpcUrl}
        onChange={(e) => setRpcUrl(e.target.value)}
      />

      {isUserOp && (
        <select
          value={submissionType}
          onChange={(e) => setSubmissionType(e.target.value as 'mempool' | 'entrypoint')}
        >
          <option value="mempool">Submit to Mempool</option>
          <option value="entrypoint">Submit to EntryPoint</option>
        </select>
      )}

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Transaction'}
      </button>

      {txHash && (
        <div className="result">
          <h3>Transaction Hash:</h3>
          <code>{txHash}</code>
        </div>
      )}

      <div className="data-preview">
        <h3>Signed Data:</h3>
        <pre>{JSON.stringify(signedData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default SubmissionPanel; 
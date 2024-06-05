/* eslint-disable @typescript-eslint/no-explicit-any */
import './App.css'
import { useWeb3React } from '@web3-react/core'
import Card from './components/Card'
import { Connection, PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TLog } from './types';
import { getProvider, createTransferTransaction, signAndSendTransaction, pollSignatureStatus, signTransaction, signAllTransactions, signMessage } from './utils';


export type ConnectedMethods =
  | {
    name: string;
    onClick: () => Promise<string | undefined>;
  }
  | {
    name: string;
    onClick: () => Promise<void>;
  };

interface Props {
  publicKey: PublicKey | null;
  connectedMethods: ConnectedMethods[];
  handleConnect: () => Promise<void>;
  logs: TLog[];
  clearLogs: () => void;
}


function App() {
  const { connector, hooks } = useWeb3React();

  const NETWORK = 'https://solana-api.projectserum.com';
  const provider = getProvider();
  const connection = new Connection(NETWORK);
  const message = 'To avoid digital dognappers, sign below to authenticate with CryptoCorgis.';

  const useProps = (): Props => {
    const [logs, setLogs] = useState<TLog[]>([]);

    const createLog = useCallback(
      (log: TLog) => {
        return setLogs((logs) => [...logs, log]);
      },
      [setLogs]
    );

    const clearLogs = useCallback(() => {
      setLogs([]);
    }, [setLogs]);

    useEffect(() => {
      if (!provider) return;

      // attempt to eagerly connect
      provider.connect({ onlyIfTrusted: true }).catch(() => {
        // fail silently
      });

      provider.on('connect', (publicKey: PublicKey) => {
        createLog({
          status: 'success',
          method: 'connect',
          message: `Connected to account ${publicKey.toBase58()}`,
        });
      });

      provider.on('disconnect', () => {
        createLog({
          status: 'warning',
          method: 'disconnect',
          message: '👋',
        });
      });

      provider.on('accountChanged', (publicKey: PublicKey | null) => {
        if (publicKey) {
          createLog({
            status: 'info',
            method: 'accountChanged',
            message: `Switched to account ${publicKey.toBase58()}`,
          });
        } else {
          /**
           * In this case dApps could...
           *
           * 1. Not do anything
           * 2. Only re-connect to the new account if it is trusted
           *
           * ```
           * provider.connect({ onlyIfTrusted: true }).catch((err) => {
           *  // fail silently
           * });
           * ```
           *
           * 3. Always attempt to reconnect
           */

          createLog({
            status: 'info',
            method: 'accountChanged',
            message: 'Attempting to switch accounts.',
          });

          provider.connect().catch((error) => {
            createLog({
              status: 'error',
              method: 'accountChanged',
              message: `Failed to re-connect: ${error.message}`,
            });
          });
        }
      });

      return () => {
        provider.disconnect();
      };
    }, [createLog]);

    /** SignAndSendTransaction */
    const handleSignAndSendTransaction = useCallback(async () => {
      if (!provider) return;

      try {
        const transaction = await createTransferTransaction(provider.publicKey as PublicKey, connection);
        createLog({
          status: 'info',
          method: 'signAndSendTransaction',
          message: `Requesting signature for: ${JSON.stringify(transaction)}`,
        });
        const signature = await signAndSendTransaction(provider, transaction);
        createLog({
          status: 'info',
          method: 'signAndSendTransaction',
          message: `Signed and submitted transaction ${signature}.`,
        });
        pollSignatureStatus(signature, connection, createLog);
      } catch (error: any) {
        createLog({
          status: 'error',
          method: 'signAndSendTransaction',
          message: error.message,
        });
      }
    }, [createLog]);

    /** SignTransaction */
    const handleSignTransaction = useCallback(async () => {
      if (!provider) return;

      try {
        const transaction = await createTransferTransaction(provider.publicKey as PublicKey, connection);
        createLog({
          status: 'info',
          method: 'signTransaction',
          message: `Requesting signature for: ${JSON.stringify(transaction)}`,
        });
        const signedTransaction = await signTransaction(provider, transaction);
        createLog({
          status: 'success',
          method: 'signTransaction',
          message: `Transaction signed: ${JSON.stringify(signedTransaction)}`,
        });
      } catch (error: any) {
        createLog({
          status: 'error',
          method: 'signTransaction',
          message: error.message,
        });
      }
    }, [createLog]);

    /** SignAllTransactions */
    const handleSignAllTransactions = useCallback(async () => {
      if (!provider) return;

      try {
        const transactions = [
          await createTransferTransaction(provider.publicKey as PublicKey, connection),
          await createTransferTransaction(provider.publicKey as PublicKey, connection),
        ];
        createLog({
          status: 'info',
          method: 'signAllTransactions',
          message: `Requesting signature for: ${JSON.stringify(transactions)}`,
        });
        const signedTransactions = await signAllTransactions(provider, transactions[0], transactions[1]);
        createLog({
          status: 'success',
          method: 'signAllTransactions',
          message: `Transactions signed: ${JSON.stringify(signedTransactions)}`,
        });
      } catch (error: any) {
        createLog({
          status: 'error',
          method: 'signAllTransactions',
          message: error.message,
        });
      }
    }, [createLog]);

    /** SignMessage */
    const handleSignMessage = useCallback(async () => {
      if (!provider) return;

      try {
        const signedMessage = await signMessage(provider, message);
        createLog({
          status: 'success',
          method: 'signMessage',
          message: `Message signed: ${JSON.stringify(signedMessage)}`,
        });
        return signedMessage;
      } catch (error: any) {
        createLog({
          status: 'error',
          method: 'signMessage',
          message: error.message,
        });
      }
    }, [createLog]);

    /** Connect */
    const handleConnect = useCallback(async () => {
      if (!provider) return;

      try {
        await provider.connect();
      } catch (error: any) {
        createLog({
          status: 'error',
          method: 'connect',
          message: error.message,
        });
      }
    }, [createLog]);

    /** Disconnect */
    const handleDisconnect = useCallback(async () => {
      if (!provider) return;

      try {
        await provider.disconnect();
      } catch (error: any) {
        createLog({
          status: 'error',
          method: 'disconnect',
          message: error.message,
        });
      }
    }, [createLog]);

    const connectedMethods: ConnectedMethods[] = useMemo(() => {
      return [
        {
          name: 'Sign and Send Transaction',
          onClick: handleSignAndSendTransaction,
        },
        {
          name: 'Sign Transaction',
          onClick: handleSignTransaction,
        },
        {
          name: 'Sign All Transactions',
          onClick: handleSignAllTransactions,
        },
        {
          name: 'Sign Message',
          onClick: handleSignMessage,
        },
        {
          name: 'Disconnect',
          onClick: handleDisconnect,
        },
      ];
    }, [
      handleSignAndSendTransaction,
      handleSignTransaction,
      handleSignAllTransactions,
      handleSignMessage,
      handleDisconnect,
    ]);

    return {
      publicKey: provider?.publicKey || null,
      connectedMethods,
      handleConnect,
      logs,
      clearLogs,
    };
  };


  const props = useProps()





  console.log('props', props)
  return (
    <>
      <Card connector={connector} hooks={hooks} name='phantom' />
    </>
  )
}

export default App

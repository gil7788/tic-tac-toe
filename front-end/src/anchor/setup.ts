import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { IDL, TicTacToe } from './idl.ts';
import { AnchorWallet } from '@solana/wallet-adapter-react';

const programId = new PublicKey("46JJYH9Gt4BPeEf4wqQShtHtow6Y7hKWUdcsErEMy8Sj");
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export const setupProgram = (wallet: AnchorWallet) => {
  const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
  return new Program<TicTacToe>(IDL, programId, provider);
};

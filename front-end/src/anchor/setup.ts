import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { IDL, TicTacToe } from './idl.ts';
import { AnchorWallet } from '@solana/wallet-adapter-react';

// const programId = new PublicKey("6WmnboLMNbXwnx2FvjjuowfXqufjjsnP1ojgGQdBcPzK");


export const setupProgram = (wallet: AnchorWallet) => {
  const programId = new PublicKey("4JKqkFCRdeto686BpgmTNn5vpGLZVJtcfxHW5fb6JnwC");
  console.log('Program ID:', programId.toBase58());

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
  return new Program<TicTacToe>(IDL, programId, provider);
};

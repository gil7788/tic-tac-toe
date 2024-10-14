import { TicTacToe } from '../anchor/idl.ts';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

export interface Tile {
  row: number;
  column: number;
}

export interface GameState {
  pending?: {};
  active?: {};
  tie?: {};
  won?: { winner: PublicKey };
  cancelled?: {};
}

export enum Sign {
  X = 'cross',
  O = 'circle'
}

export interface Game {
  players: [PublicKey, PublicKey];
  turn: number;
  board: Board;
  state: GameState;
}


export interface TicTacToeBoardProps {
  gamePublicKey: PublicKey | null;
  cells: string[];
  turn: number;
  playerTwo: PublicKey;
  program: Program<TicTacToe> | null;
}

export type Board = ({ x?: {} } | { o?: {} } | null)[][];

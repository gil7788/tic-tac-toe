import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { web3, Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import { TicTacToe } from '../anchor/idl.ts';
import '../tic-tac-toe.css';

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
    board: ({ x?: {} } | { o?: {} } | null)[][];
    state: GameState;
}

export interface TicTacToeBoardProps {
    gamePublicKey: PublicKey | null;
    cells: string[];
    turn: number;
    playerTwo: Keypair;
    program: Program<TicTacToe> | null;
}

const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ gamePublicKey, cells, turn, playerTwo, program }) => {
    const wallet = useAnchorWallet();

    async (gamePublicKey: PublicKey, retries = 5, delay = 1000): Promise<Game> => {
        while (retries > 0) {
            try {
                const gameState = await program!.account.game.fetch(gamePublicKey) as unknown as Game;
                return gameState;
            } catch (error) {
                if (retries === 1) throw error;
                console.log(`Retrying fetch game state... attempts left: ${retries - 1}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retries--;
            }
        }
        throw new Error('Failed to fetch game state');
    };

    const play = async (index: number) => {
        if (!wallet || !playerTwo || !program || !gamePublicKey) {
            console.log('Missing wallet, playerTwo, program, or gamePublicKey');
            return;
        }

        const currentPlayer = turn % 2 === 1 ? wallet : {
            publicKey: playerTwo.publicKey,
            signTransaction: async (tx: web3.Transaction) => {
                tx.partialSign(playerTwo);
                return tx;
            },
            signAllTransactions: async (txs: web3.Transaction[]) => {
                txs.forEach(tx => tx.partialSign(playerTwo));
                return txs;
            },
        };

        try {
            const row = Math.floor(index / 3);
            const column = index % 3;
            console.log(`Playing at row ${row}, column ${column} by ${turn % 2 === 1 ? 'circle' : 'cross'}`);
            const tile: Tile = { row, column };

            await program.methods
                .play(tile)
                .accounts({
                    game: gamePublicKey,
                    player: currentPlayer.publicKey,
                })
                .signers(turn % 2 === 1 ? [] : [playerTwo])
                .rpc();

        } catch (error: any) {
            console.error('Error during play:', error);
        }
    };

    const handleClick = (index: number) => {
        if (cells[index] === '') {
            play(index);
        }
    };

    return (
        <div id="gameboard">
            {cells.map((cell, index) => (
                <div
                    key={index}
                    className="square"
                    onClick={() => handleClick(index)}
                >
                    {cell && <div className={cell}></div>}
                </div>
            ))}
        </div>
    );
};

export default TicTacToeBoard;

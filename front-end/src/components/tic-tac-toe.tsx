import React, { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { web3, Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import { setupProgram } from '../anchor/setup';
import { TicTacToe } from '../anchor/idl.ts';
import '../tic-tac-toe.css';
import keypairData from './keypair.json';

export interface Tile {
    row: number;
    column: number;
}

export interface GameState {
    active?: {};
    tie?: {};
    won?: { winner: PublicKey };
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

const TicTacToeBoard: React.FC = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [program, setProgram] = useState<Program<TicTacToe> | null>(null);
    const [gamePublicKey, setGamePublicKey] = useState<PublicKey | null>(null);
    const [cells, setCells] = useState<string[]>(Array(9).fill(''));
    const [info, setInfo] = useState<string>('circle goes first');
    const [playerTwo] = useState<Keypair>(
        Keypair.fromSecretKey(Uint8Array.from(keypairData.secretKey))
    );
    const [turn, setTurn] = useState<number>(1);

    useEffect(() => {
        if (wallet) {
            console.log('Initializing provider and program');
            const program = setupProgram(wallet);
            setProgram(program);
            console.log('Program set:', program);
        } else {
            console.log('No wallet connected');
            setProgram(null);
        }
    }, [wallet, connection]);

    const fetchGameState = async (gamePublicKey: PublicKey, retries = 5, delay = 1000): Promise<Game> => {
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

    const setupGame = async () => {
        if (program && wallet) {
            console.log('Setting up game');
            const gameKeypair = web3.Keypair.generate();
            setGamePublicKey(gameKeypair.publicKey);

            try {
                await program.methods
                    .setupGame(playerTwo.publicKey)
                    .accounts({
                        game: gameKeypair.publicKey,
                        playerOne: wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId,
                    })
                    .signers([gameKeypair])
                    .rpc();

                const gameState = await fetchGameState(gameKeypair.publicKey);
                if (!gameState) {
                    throw new Error('Game state not found');
                }
                console.log('Game state after setup:', gameState);
                setCells(Array(9).fill(''));
                setInfo(`Game setup! ${gameState.turn === 1 ? 'circle' : 'cross'} goes first.`);
                setTurn(gameState.turn);
            } catch (error: any) {
                console.error('Error during game setup:', error);
                setInfo(`Error: ${error.message}`);
                return;
            }
        } else {
            console.log('Program or wallet not available');
        }
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

            const gameState = await retryFetchGameState(gamePublicKey, row, column, turn + 1, 5, 1000);
            if (!gameState || !gameState.board) {
                throw new Error('Game state not found');
            }
            console.log('Game state after play:', gameState);
            console.log('Board:', gameState.board);
            console.log('Flat board:', gameState.board.flat());
            console.log('Game state => Active, Won, Tie:', gameState.state);

            const newCells = transformBoard(gameState.board);

            setCells(newCells);
            console.log('New cells:', newCells);
            if (gameState.state.won) {
                setInfo(`Game over! ${gameState.state.won.winner.toBase58()} wins!`);
                return;
            }
            if (gameState.state.tie) {
                setInfo('Game over! It is a tie!');
                return;
            }

            setInfo(`It is now ${gameState.turn % 2 === 1 ? 'circle' : 'cross'}'s turn`);
            setTurn(gameState.turn);
        } catch (error: any) {
            console.error('Error during play:', error);
            setInfo(`Error: ${error.message}`);
        }
    };

    const retryFetchGameState = async (gamePublicKey: PublicKey, row: number, column: number, expectedTurn: number, retries: number, delay: number): Promise<Game> => {
        while (retries > 0) {
            try {
                const gameState = await program!.account.game.fetch(gamePublicKey) as unknown as Game;
                if (gameState.state.won || gameState.state.tie) {
                    console.log('Game over:', JSON.stringify(gameState.state));
                    return gameState;
                }
                if (gameState && gameState.turn === expectedTurn && gameState.board[row][column] !== null) {  // Check if turn has updated and move has been reflected
                    return gameState;
                }
            } catch (error) {
                console.log(`Retrying fetch game state... attempts left: ${retries - 1}`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
        }
        throw new Error('Failed to fetch updated game state');
    };

    function transformBoard(board: ({ x?: {} } | { o?: {} } | null)[][]): string[] {
        return board.flat().map(cell => {
            if (cell && 'x' in cell) {
                return Sign.X;
            } else if (cell && 'o' in cell) {
                return Sign.O;
            } else {
                return '';
            }
        });
    }

    const handleClick = (index: number) => {
        if (cells[index] === '') {
            play(index);
        }
    };

    return (
        <div>
            {wallet ? (
                <>
                    <div className="button-wrapper">
                        <div className="confetti-button"></div>
                    </div>
                    <button onClick={setupGame}>Setup Game</button>
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
                    <p id="info">{info}</p>
                </>
            ) : (
                <p>Please connect your wallet to play TicTacToe.</p>
            )}
        </div>
    );
};

export default TicTacToeBoard;

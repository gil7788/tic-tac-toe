import React, { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { web3, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { setupProgram } from '../anchor/setup';
import { TicTacToe } from '../anchor/idl.ts';
import '../tic-tac-toe.css';

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
    X = 'x',
    O = 'o'
}

export interface Game {
    players: [PublicKey, PublicKey];
    turn: number;
    board: (Sign | null)[][];
    state: GameState;
}

const TicTacToeBoard: React.FC = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [program, setProgram] = useState<Program<TicTacToe> | null>(null);
    const [gamePublicKey, setGamePublicKey] = useState<PublicKey | null>(null);
    const [cells, setCells] = useState<string[]>(Array(9).fill(''));
    const [info, setInfo] = useState<string>('circle goes first');

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

    const setupGame = async () => {
        if (program && wallet) {
            console.log('Setting up game');
            const gameKeypair = web3.Keypair.generate();
            setGamePublicKey(gameKeypair.publicKey);

            await program.methods
                .setupGame(wallet.publicKey)
                .accounts({
                    game: gameKeypair.publicKey,
                    playerOne: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .signers([gameKeypair])
                .rpc();

            // const gameState = await program.account.game.fetch(gameKeypair.publicKey) as unknown as Game;
            // console.log('Game state after setup:', gameState);
            // setCells(Array(9).fill(''));
            // setInfo(`Game setup! ${gameState.turn === 1 ? 'circle' : 'cross'} goes first.`);
        } else {
            console.log('Program or wallet not available');
        }
    };

    const play = async (index: number) => {
        if (program && gamePublicKey && wallet) {
            const row = Math.floor(index / 3);
            const column = index % 3;

            try {
                console.log(`Playing at row ${row}, column ${column}`);
                const tile: Tile = { row, column };
                await program.methods
                    .play(tile)
                    .accounts({
                        game: gamePublicKey,
                        player: wallet.publicKey,
                    })
                    .rpc();

                // const gameState = await program.account.game.fetch(gamePublicKey) as unknown as Game;
                // console.log('Game state after play:', gameState);
                // const newCells = gameState.board.flat().map((cell: Sign | null) => {
                //     if (cell === null) return '';
                //     return cell === Sign.X ? 'circle' : 'cross';
                // });
                // setCells(newCells);
                // setInfo(`It is now ${gameState.turn % 2 === 1 ? 'circle' : 'cross'}'s turn`);
            } catch (error) {
                console.error('Error during play:', error);
                setInfo(`Error: ${(error as Error).message}`);
            }
        } else {
            console.log('Program, gamePublicKey, or wallet not available');
        }
    };

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

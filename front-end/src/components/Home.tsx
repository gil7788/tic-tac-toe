import React, { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { setupProgram } from '../anchor/setup';
import { TicTacToe } from '../anchor/idl.ts';
import TicTacToeBoard, { Game } from './tic-tac-toe';
import keypairData from './keypair.json';
import Footer from './Footer.tsx';
import '../App.css'
import {
    WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';

const Home: React.FC = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [program, setProgram] = useState<Program<TicTacToe> | null>(null);
    const [gamePublicKey, setGamePublicKey] = useState<PublicKey | null>(null);
    const [cells, setCells] = useState<string[]>(Array(9).fill(''));
    const [info, setInfo] = useState<string>('cross goes first');
    const [playerTwo] = useState<Keypair>(
        Keypair.fromSecretKey(Uint8Array.from(keypairData.secretKey))
    );
    const [turn, setTurn] = useState<number>(1);
    const [gameStarted, setGameStarted] = useState<boolean>(false);

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
            const gameKeypair = Keypair.generate();
            setGamePublicKey(gameKeypair.publicKey);

            try {
                await program.methods
                    .setupGame(playerTwo.publicKey)
                    .accounts({
                        game: gameKeypair.publicKey,
                        playerOne: wallet.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .signers([gameKeypair])
                    .rpc();

                const gameState = await fetchGameState(gameKeypair.publicKey);
                if (!gameState) {
                    throw new Error('Game state not found');
                }
                console.log('Game state after setup:', gameState);
                setCells(Array(9).fill(''));
                setInfo(`Game setup! ${gameState.turn === 1 ? 'cross' : 'circle'} goes first.`);
                setGameStarted(true);
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

    return (
        <div className='home'>
            <h1 className='title'>Tic Tac Toe!</h1>
            {gameStarted && program && gamePublicKey ? (
                <div className="game-container">
                    <TicTacToeBoard
                        gamePublicKey={gamePublicKey}
                        setGamePublicKey={setGamePublicKey}
                        setInfo={setInfo}
                        setTurn={setTurn}
                        cells={cells}
                        setCells={setCells}
                        turn={turn}
                        playerTwo={playerTwo}
                        program={program}
                    />
                    <button onClick={setupGame} className='restart-btn'>Restart Game</button>
                    <p id="info">{info}</p>
                </div>
            ) : (
                <div>
                    <button onClick={setupGame} className='start-btn'>Start Game!</button>
                    <div className="button-container">
                        <WalletMultiButton className="custom-wallet-button" />
                    </div>
                </div>



            )}
            <Footer />
        </div >
    );
};

export default Home;

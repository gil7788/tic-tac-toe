import React, { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program } from '@coral-xyz/anchor';
import { setupProgram } from '../anchor/setup.ts';
import { TicTacToe } from '../anchor/idl.ts';
import TicTacToeBoard from './tic-tac-toe.tsx';
import { Board, Game, Sign } from '../types/tic_tac_toe';
import Footer from './Footer.tsx';
import '../App.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useParams } from 'react-router-dom';
import { PublicKey, SystemProgram } from '@solana/web3.js';

// debug
import { stringify } from 'flatted';


const GameView: React.FC = () => {
    const { gamePublicKey } = useParams();
    if (!gamePublicKey || !validateGamePublicKey(gamePublicKey)) {
        return;
    }
    const matchPublicKey = new PublicKey(gamePublicKey);
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [gameProgram, setProgram] = useState<Program<TicTacToe> | null>(null);
    const [cells, setCells] = useState<string[]>(Array(9).fill(''));
    const [info, setInfo] = useState<string>('cross goes first');
    const [playerOneKey, setPlayerOneKey] = useState<PublicKey | null>(null);
    const [playerTwo, setPlayerTwo] = useState<PublicKey | null>(null);
    const [turn, setTurn] = useState<number>(1);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [subscriptionLock, setSubscription] = useState<boolean>(false);

    // TODO validate public key properly according to cookbook
    function validateGamePublicKey(matchPublicKey: string) {
        try {
            const publicKey = new PublicKey(matchPublicKey);

            if (!PublicKey.isOnCurve(publicKey.toBuffer())) {
                console.error('Game public key is not on curve (not a valid public key)');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Invalid game public key:', error);
            return false;
        }
    }

    useEffect(() => {
        if (wallet) {
            console.log('Initializing provider and gameProgram');
            const gameProgram = setupProgram(wallet);
            setProgram(gameProgram);
            setPlayerTwo(wallet.publicKey);
        } else {
            console.error('No wallet connected');
            setProgram(null);
        }
    }, [wallet, connection]);

    useEffect(() => {
        console.log(`1. matchPublicKey && gameProgram && wallet, ${matchPublicKey}, ${stringify(gameProgram?.programId)}, ${wallet?.publicKey}`);
        const interval = setInterval(() => {
            if (matchPublicKey && gameProgram && wallet) {
                fetchGameState(new PublicKey(matchPublicKey))
                    .then(gameState => {
                        if (!gameState) {
                            console.error('Game state not found');
                            return;
                        }
                        processState(gameState);
                    })
                    .catch(error => {
                        console.error('Error fetching game state:', error);
                    });
            }
        }, 100);

        return () => {
            clearInterval(interval);
        };
    }, [matchPublicKey, gameProgram]);

    async function fetchGameState(matchPublicKey: PublicKey): Promise<Game | null> {
        if (!matchPublicKey) {
            throw new Error('Game public key not available');
        }
        let gameState: Game | null = null;
        try {
            if (!gameProgram) {
                throw new Error(`Program ${gameProgram} not available`);
            }
            gameState = await gameProgram!.account.game.fetch(matchPublicKey) as unknown as Game;
        } catch (error) {
            throw new Error(`Failed to fetch updated game state: ${error}`);
        }
        return gameState;
    };


    function processState(gameState: Game) {
        if (!gameState.board) {
            throw new Error('Board not found');
        } else if (gameState.turn === 0) {
            setPlayerOneKey(gameState.players[0]);

        } else if (gameState.turn === 1) {
            setCells(Array(9).fill(''));
            if (wallet && wallet.publicKey == playerTwo) {
                setInfo('Game started! Cross goes first.');
            }
            else {
                setInfo('Game started! You go first.');
            }
            setGameStarted(true);
            setTurn(gameState.turn);
            return;
        } else {
            const newCells = transformBoard(gameState.board);

            setCells(newCells);
            if (gameState.turn % 2 === 1) {
                setInfo('It\'s cross turn.');
            }
            else {
                setInfo('It\'s your turn.');
            }
            setTurn(gameState.turn);
        }

        if (gameState.state && gameState.state.won) {
            setInfo(`${gameState.state.won.winner.toBase58()} wins!`);
            return;
        } else if (gameState.state && gameState.state.tie) {
            setInfo('Game over! It is a tie!');
            return;
        }
    }

    function transformBoard(board: Board): string[] {
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

    const joinGame = async () => {
        console.log('Joining game');
        if (!gameProgram) {
            console.error('Program not available');
            return;
        }
        if (!matchPublicKey) {
            console.error('Game public key not available');
            return;
        }
        if (!wallet) {
            console.error('Wallet not available');
            return;
        }
        if (!playerOneKey) {
            console.error('Player one key not available');
            return;
        }
        if (!playerTwo) {
            console.error('Player two not available');
            return;
        }
        try {
            await gameProgram.methods
                .joinGame(playerTwo)
                .accounts({
                    game: new PublicKey(matchPublicKey),
                    playerTwo: playerTwo,
                    playerOne: playerOneKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([])
                .rpc();
        } catch (error: any) {
            console.error('Error during game setup:', error);
            return;
        }
    };

    return (
        <div className='home'>
            <h1 className='title'>Tic Tac Toe!</h1>
            {(!gameStarted) ?
                (<p>Game Public Key: {matchPublicKey.toString()}</p>) :
                null}
            {gameStarted && gameProgram && matchPublicKey && playerTwo ? (
                <div>
                    <TicTacToeBoard
                        gamePublicKey={new PublicKey(matchPublicKey)}
                        cells={cells}
                        turn={turn}
                        playerTwo={playerTwo}
                        program={gameProgram}
                    />
                </div>
            ) : (
                <div>
                    <button onClick={joinGame} className='start-btn'>Join!</button>
                    <div className="button-container">
                        <WalletMultiButton className="custom-wallet-button" />
                    </div>
                </div>
            )}
            {(gameStarted && gameProgram && matchPublicKey) ? (
                <p id="info">{info}</p>
            ) : null}
            <Footer />
        </div>
    );
};

export default GameView;

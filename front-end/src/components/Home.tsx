import React, { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { setupProgram } from '../anchor/setup';
import { TicTacToe } from '../anchor/idl.ts';
import TicTacToeBoard, { Game, Sign } from './tic-tac-toe';
import Footer from './Footer.tsx';
import '../App.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';


const Home: React.FC = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [program, setProgram] = useState<Program<TicTacToe> | null>(null);
    const [gamePublicKey, setGamePublicKey] = useState<PublicKey | null>(null);
    const [cells, setCells] = useState<string[]>(Array(9).fill(''));
    const [info, setInfo] = useState<string>('cross goes first');
    const [playerTwo, setPlayerTwo] = useState<PublicKey | null>(null);
    const [turn, setTurn] = useState<number>(1);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [awaitingPlayer, setAwaitingPlayer] = useState<boolean>(false);

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

    useEffect(() => {
        const interval = setInterval(() => {
            if (gamePublicKey && program) {
                fetchGameState(gamePublicKey)
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
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [gamePublicKey, program]);

    useEffect(() => {

    }, [gameStarted]);

    async function fetchGameState(gamePublicKey: PublicKey): Promise<Game | null> {
        let gameState: Game | null = null;
        try {
            gameState = await program!.account.game.fetch(gamePublicKey) as unknown as Game;
        } catch (error) {
            throw new Error('Failed to fetch updated game state');
        }
        return gameState;
    };

    function processState(gameState: Game) {
        if (!gameState.board) {
            throw new Error('Board not found');
        } else if (gameState.turn === 1) {
            setCells(Array(9).fill(''));
            setInfo(`Game setup! ${gameState.turn === 1 ? 'cross' : 'circle'} goes first.`);
            setGameStarted(true);
            setTurn(gameState.turn);
            setPlayerTwo(gameState.players[1]);
            return;
        } else {
            console.log('Game state after play:', gameState);
            console.log('Board:', gameState.board);
            console.log('Flat board:', gameState.board.flat());
            console.log('Game state => Active, Won, Tie:', gameState.state);

            const newCells = transformBoard(gameState.board);

            setCells(newCells);
            console.log('New cells:', newCells);
            if (gameState.state && gameState.state.active) {
                setInfo(`It is now ${gameState.turn % 2 === 1 ? 'cross' : 'circle'}'s turn`);
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

    const getInvitationLink = async () => {
        if (program && wallet && !awaitingPlayer) {
            console.log('Inviting player');
            const gameKeypair = Keypair.generate();
            setGamePublicKey(gameKeypair.publicKey);
            const gameLink = getGameLink(gameKeypair.publicKey);

            try {
                await program.methods
                    .createGame()
                    .accounts({
                        game: gameKeypair.publicKey,
                        playerOne: wallet.publicKey,
                        systemProgram: SystemProgram.programId
                    })
                    .signers([gameKeypair])
                    .rpc();
            } catch (error: any) {
                console.error('Error creating game:', error);
            }
            setInfo(`Game created! Share this link: ${gameLink}`);
            setAwaitingPlayer(true);
            return gameLink;
        } else {
            console.error('Program or wallet not available');
        }
    };

    const getGameLink = (gamePublicKey: PublicKey): string => {
        return `localhost:5173/${gamePublicKey.toBase58()}`;
    };

    return (
        <div className='home'>
            <h1 className='title'>Tic Tac Toe!</h1>
            {gameStarted && program && gamePublicKey && playerTwo ? (
                <div>
                    <TicTacToeBoard
                        gamePublicKey={gamePublicKey}
                        cells={cells}
                        turn={turn}
                        playerTwo={playerTwo}
                        program={program}
                    />
                    <button onClick={getInvitationLink} className='restart-btn'>Restart Game</button>
                </div>
            ) : (
                <div>
                    <button onClick={getInvitationLink} className='start-btn'>Invite</button>
                    <div className="button-container">
                        <WalletMultiButton className="custom-wallet-button" />
                    </div>
                </div>
            )}
            {(gameStarted && program && gamePublicKey) || awaitingPlayer ? (
                <p id="info">{info}</p>
            ) : null}
            <Footer />
        </div>
    );
};

export default Home;

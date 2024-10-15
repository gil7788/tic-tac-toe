import React, { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { setupProgram } from '../anchor/setup';
import { TicTacToe } from '../anchor/idl.ts';
import TicTacToeBoard from './tic-tac-toe.tsx';
import { Board, Game, Sign } from '../types/tic_tac_toe.ts';
import Footer from './Footer.tsx';
import '../App.css';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const Home: React.FC = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [gameProgram, setProgram] = useState<Program<TicTacToe> | null>(null);
    const [matchPublicKey, setMatchPublicKey] = useState<PublicKey | null>(null);
    const [cells, setCells] = useState<string[]>(Array(9).fill(''));
    const [info, setInfo] = useState<string>('cross goes first');
    const [playerTwo, setPlayerTwo] = useState<PublicKey | null>(null);
    const [turn, setTurn] = useState<number>(1);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [awaitingPlayer, setAwaitingPlayer] = useState<boolean>(false);


    const [subscriptionLock, setSubscription] = useState<boolean>(false);

    useEffect(() => {
        if (wallet) {
            const gameProgram = setupProgram(wallet);
            setProgram(gameProgram);
        } else {
            console.error('No wallet connected');
            setProgram(null);
        }
    }, [wallet, connection]);

    useEffect(() => {
        if (gameProgram && matchPublicKey && !subscriptionLock) {
            connection.onAccountChange(matchPublicKey, async (accountInfo) => {
                let gameState: Game | null = null;

                try {
                    const decodedGameData = gameProgram.account.game.coder.accounts.decode("game", accountInfo.data);
                    gameState = decodedGameData as Game;
                    console.log("Game state updated:", gameState);
                    processState(gameState);
                } catch (error) {
                    console.error("Failed to fetch or decode updated game state", error);
                    gameState = null;
                }
            });
            // Ensure app subscribed to only 1 game at a time
            setSubscription(!subscriptionLock);
        }
    }, [matchPublicKey, gameProgram]);

    function processState(gameState: Game) {
        if (!gameState.board) {
            throw new Error('Board not found');
        } else if (gameState.turn === 1) {
            setCells(Array(9).fill(''));
            if (wallet && wallet.publicKey == playerTwo && gameState.turn % 2 === 1) {
                setInfo('Game started! Cross goes first.');
            }
            else {
                setInfo('Game started! You go first.');
            }
            setGameStarted(true);
            setTurn(gameState.turn);
            setPlayerTwo(gameState.players[1]);
            return;
        } else {
            const newCells = transformBoard(gameState.board);

            setCells(newCells);
            if (gameState.state && gameState.state.active) {
                if (gameState.turn % 2 === 1) {
                    setInfo('It\'s your turn.');
                }
                else {
                    setInfo('It\'s circle\'s turn.');
                }
            }

            setTurn(gameState.turn);
        }

        if (gameState.state && gameState.state.won) {
            setInfo(`${gameState.state.won.winner.toBase58()} wins!`);
            // Ensure app unsubscribed once game is over
            setSubscription(!subscriptionLock);
            return;
        } else if (gameState.state && gameState.state.tie) {
            setInfo('Game over! It is a tie!');
            // Ensure app unsubscribed once game is over
            setSubscription(false);
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

    const getInvitationLink = async () => {
        if (!gameProgram) {
            console.error('Program not available');
            return;
        }
        if (!wallet) {
            console.error('Wallet not available');
            return;
        }
        if (awaitingPlayer) {
            console.log('Awaiting player');
            return;
        }

        const matchKeypair = Keypair.generate();
        setMatchPublicKey(matchKeypair.publicKey);
        const gameLink = getGameLink(matchKeypair.publicKey);

        try {
            await gameProgram.methods
                .createGame()
                .accounts({
                    game: matchKeypair.publicKey,
                    playerOne: wallet.publicKey,
                    systemProgram: SystemProgram.programId
                })
                .signers([matchKeypair])
                .rpc();
        } catch (error: any) {
            console.error('Error creating game:', error);
        }
        setInfo(`Game created! Share this link: ${gameLink}`);
        setAwaitingPlayer(true);
        return gameLink;
    };


    function getGameLink(matchPublicKey: PublicKey): string {
        // TODO change url according env [dev, release] = ["localhost", "solana-tic-tac-toe.web.app"];
        let url = "solana-tic-tac-toe.web.app";
        return `${url}/${matchPublicKey.toBase58()}`;
    }

    return (
        <div className='home'>
            <h1 className='title'>Tic Tac Toe!</h1>
            {gameStarted && gameProgram && matchPublicKey && playerTwo ? (
                <div>
                    <TicTacToeBoard
                        gamePublicKey={matchPublicKey}
                        cells={cells}
                        turn={turn}
                        playerTwo={playerTwo}
                        program={gameProgram}
                    />
                    {/* <button onClick={getInvitationLink} className='restart-btn'>Restart Game</button> */}
                </div>
            ) : (
                <div>
                    <button onClick={getInvitationLink} className='start-btn'>Invite</button>
                    <div className="button-container">
                        <WalletMultiButton className="custom-wallet-button" />
                    </div>
                </div>
            )}
            {(gameStarted && gameProgram && matchPublicKey) || awaitingPlayer ? (
                <p id="info">{info}</p>
            ) : null}
            <Footer />
        </div>
    );
};

export default Home;

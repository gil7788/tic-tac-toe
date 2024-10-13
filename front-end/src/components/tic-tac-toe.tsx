import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { TicTacToeBoardProps, Tile } from '../types/tic_tac_toe';
import '../tic-tac-toe.css';


const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({ gamePublicKey, cells, turn, playerTwo, program }) => {
    const wallet = useAnchorWallet();

    const handleClick = (index: number) => {
        if (cells[index] === '') {
            play(index);
        }
    };

    const play = async (index: number) => {
        if (!wallet || !playerTwo || !program || !gamePublicKey) {
            console.log('Missing wallet, playerTwo, program, or gamePublicKey');
            return;
        }

        const currentPlayer = turn % 2 === 1 ? wallet : {
            publicKey: playerTwo,
            // signTransaction: async (tx: web3.Transaction) => {
            //     tx.partialSign(playerTwo);
            //     return tx;
            // },
            // signAllTransactions: async (txs: web3.Transaction[]) => {
            //     txs.forEach(tx => tx.partialSign(playerTwo));
            //     return txs;
            // },
        };

        try {
            const row = Math.floor(index / 3);
            const column = index % 3;
            console.log(`Playing at row ${row}, column ${column} by ${turn % 2 === 1 ? 'circle' : 'cross'}`);
            const tile: Tile = { row, column };

            // TODO validate play method
            await program.methods
                .play(tile)
                .accounts({
                    game: gamePublicKey,
                    player: currentPlayer.publicKey,
                })
                .signers(turn % 2 === 1 ? [] : [])
                .rpc();

        } catch (error: any) {
            console.error('Error during play:', error);
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

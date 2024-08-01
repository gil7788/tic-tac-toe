import { TicTacToe } from '../target/types/tic_tac_toe';
import * as anchor from '@coral-xyz/anchor';
import { AnchorError, Program } from '@coral-xyz/anchor';
import { expect } from 'chai';
import * as dotenv from 'dotenv';

dotenv.config();

async function play(program: Program<TicTacToe>, game, player, tile, expectedTurn, expectedGameState, expectedBoard) {
    await program.methods
        .play(tile)
        .accounts({
            player: player.publicKey,
            game
        })
        .signers([player])
        .rpc();

    const gameState = await program.account.game.fetch(game);
    expect(gameState.turn).to.equal(expectedTurn);
    expect(gameState.state).to.eql(expectedGameState);
    expect(gameState.board).to.eql(expectedBoard);
}

describe('tic-tac-toe', () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.TicTacToe as Program<TicTacToe>;
    const programProvider = program.provider as anchor.AnchorProvider;

    it('Start game!', async () => {
        const gameKeypair = anchor.web3.Keypair.generate();
        const playerOne = anchor.web3.Keypair.generate();
        const playerTwo = anchor.web3.Keypair.generate();

        // Airdrop SOL to player wallets for transactions
        await programProvider.connection.requestAirdrop(playerOne.publicKey, anchor.web3.LAMPORTS_PER_SOL);
        await programProvider.connection.requestAirdrop(playerTwo.publicKey, anchor.web3.LAMPORTS_PER_SOL);

        // Confirm airdrops
        await programProvider.connection.confirmTransaction(await programProvider.connection.requestAirdrop(playerOne.publicKey, anchor.web3.LAMPORTS_PER_SOL));
        await programProvider.connection.confirmTransaction(await programProvider.connection.requestAirdrop(playerTwo.publicKey, anchor.web3.LAMPORTS_PER_SOL));

        // Create game
        await program.methods
            .createGame()
            .accounts({
                game: gameKeypair.publicKey,
                playerOne: playerOne.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([gameKeypair, playerOne])
            .rpc();

        // Join game
        await program.methods
            .joinGame(playerTwo.publicKey)
            .accounts({
                game: gameKeypair.publicKey,
                playerOne: playerOne.publicKey,
                playerTwo: playerTwo.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([playerTwo])
            .rpc();

        let gameState = await program.account.game.fetch(gameKeypair.publicKey);
        expect(gameState.turn).to.equal(1);
        expect(gameState.players).to.eql([playerOne.publicKey, playerTwo.publicKey]);
        expect(gameState.state).to.eql({ active: {} });
        expect(gameState.board).to.eql([[null, null, null], [null, null, null], [null, null, null]]);
    });

    it('player one wins!', async () => {
        const gameKeypair = anchor.web3.Keypair.generate();
        const playerOne = anchor.web3.Keypair.generate();
        const playerTwo = anchor.web3.Keypair.generate();

        // Airdrop SOL to player wallets for transactions
        await programProvider.connection.requestAirdrop(playerOne.publicKey, anchor.web3.LAMPORTS_PER_SOL);
        await programProvider.connection.requestAirdrop(playerTwo.publicKey, anchor.web3.LAMPORTS_PER_SOL);

        // Confirm airdrops
        await programProvider.connection.confirmTransaction(await programProvider.connection.requestAirdrop(playerOne.publicKey, anchor.web3.LAMPORTS_PER_SOL));
        await programProvider.connection.confirmTransaction(await programProvider.connection.requestAirdrop(playerTwo.publicKey, anchor.web3.LAMPORTS_PER_SOL));

        // Create game
        await program.methods
            .createGame()
            .accounts({
                game: gameKeypair.publicKey,
                playerOne: playerOne.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([gameKeypair, playerOne])
            .rpc();

        // Join game
        await program.methods
            .joinGame(playerTwo.publicKey)
            .accounts({
                game: gameKeypair.publicKey,
                playerOne: playerOne.publicKey,
                playerTwo: playerTwo.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([playerTwo])
            .rpc();

        let gameState = await program.account.game.fetch(gameKeypair.publicKey);
        expect(gameState.turn).to.equal(1);
        expect(gameState.players).to.eql([playerOne.publicKey, playerTwo.publicKey]);
        expect(gameState.state).to.eql({ active: {} });
        expect(gameState.board).to.eql([[null, null, null], [null, null, null], [null, null, null]]);

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            { row: 0, column: 0 },
            2,
            { active: {}, },
            [
                [{ x: {} }, null, null],
                [null, null, null],
                [null, null, null]
            ]
        );

        try {
            await play(
                program,
                gameKeypair.publicKey,
                playerOne,
                { row: 1, column: 0 },
                2,
                { active: {}, },
                [
                    [{ x: {} }, null, null],
                    [null, null, null],
                    [null, null, null]
                ]
            );
            chai.assert(false, "should've failed but didn't ");
        } catch (_err) {
            expect(_err).to.be.instanceOf(AnchorError);
            const err: AnchorError = _err;
            expect(err.error.errorCode.code).to.equal("NotPlayersTurn");
            expect(err.error.errorCode.number).to.equal(6003);
            expect(err.program.equals(program.programId)).is.true;
            expect(err.error.comparedValues).to.deep.equal([playerTwo.publicKey, playerOne.publicKey]);
        }

        await play(
            program,
            gameKeypair.publicKey,
            playerTwo,
            { row: 1, column: 0 },
            3,
            { active: {}, },
            [
                [{ x: {} }, null, null],
                [{ o: {} }, null, null],
                [null, null, null]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            { row: 0, column: 1 },
            4,
            { active: {}, },
            [
                [{ x: {} }, { x: {} }, null],
                [{ o: {} }, null, null],
                [null, null, null]
            ]
        );

        try {
            await play(
                program,
                gameKeypair.publicKey,
                playerTwo,
                { row: 5, column: 1 }, // out of bounds row
                4,
                { active: {}, },
                [
                    [{ x: {} }, { x: {} }, null],
                    [{ o: {} }, null, null],
                    [null, null, null]
                ]
            );
            chai.assert(false, "should've failed but didn't ");
        } catch (_err) {
            expect(_err).to.be.instanceOf(AnchorError);
            const err: AnchorError = _err;
            expect(err.error.errorCode.number).to.equal(6000);
            expect(err.error.errorCode.code).to.equal("TileOutOfBounds");
        }

        await play(
            program,
            gameKeypair.publicKey,
            playerTwo,
            { row: 1, column: 1 },
            5,
            { active: {}, },
            [
                [{ x: {} }, { x: {} }, null],
                [{ o: {} }, { o: {} }, null],
                [null, null, null]
            ]
        );

        try {
            await play(
                program,
                gameKeypair.publicKey,
                playerOne,
                { row: 0, column: 0 },
                5,
                { active: {}, },
                [
                    [{ x: {} }, { x: {} }, null],
                    [{ o: {} }, { o: {} }, null],
                    [null, null, null]
                ]
            );
            chai.assert(false, "should've failed but didn't ");
        } catch (_err) {
            expect(_err).to.be.instanceOf(AnchorError);
            const err: AnchorError = _err;
            expect(err.error.errorCode.number).to.equal(6001);
        }

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            { row: 0, column: 2 },
            5,
            { won: { winner: playerOne.publicKey }, },
            [
                [{ x: {} }, { x: {} }, { x: {} }],
                [{ o: {} }, { o: {} }, null],
                [null, null, null]
            ]
        );

        try {
            await play(
                program,
                gameKeypair.publicKey,
                playerOne,
                { row: 0, column: 2 },
                5,
                { won: { winner: playerOne.publicKey }, },
                [
                    [{ x: {} }, { x: {} }, { x: {} }],
                    [{ o: {} }, { o: {} }, null],
                    [null, null, null]
                ]
            );
            chai.assert(false, "should've failed but didn't ");
        } catch (_err) {
            expect(_err).to.be.instanceOf(AnchorError);
            const err: AnchorError = _err;
            expect(err.error.errorCode.number).to.equal(6002);
        }
    });

    it('tie', async () => {
        const gameKeypair = anchor.web3.Keypair.generate();
        const playerOne = anchor.web3.Keypair.generate();
        const playerTwo = anchor.web3.Keypair.generate();

        // Airdrop SOL to player wallets for transactions
        await programProvider.connection.requestAirdrop(playerOne.publicKey, anchor.web3.LAMPORTS_PER_SOL);
        await programProvider.connection.requestAirdrop(playerTwo.publicKey, anchor.web3.LAMPORTS_PER_SOL);

        // Confirm airdrops
        await programProvider.connection.confirmTransaction(await programProvider.connection.requestAirdrop(playerOne.publicKey, anchor.web3.LAMPORTS_PER_SOL));
        await programProvider.connection.confirmTransaction(await programProvider.connection.requestAirdrop(playerTwo.publicKey, anchor.web3.LAMPORTS_PER_SOL));

        // Create game
        await program.methods
            .createGame()
            .accounts({
                game: gameKeypair.publicKey,
                playerOne: playerOne.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([gameKeypair, playerOne])
            .rpc();

        // Join game
        await program.methods
            .joinGame(playerTwo.publicKey)
            .accounts({
                game: gameKeypair.publicKey,
                playerOne: playerOne.publicKey,
                playerTwo: playerTwo.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([playerTwo])
            .rpc();

        let gameState = await program.account.game.fetch(gameKeypair.publicKey);
        expect(gameState.turn).to.equal(1);
        expect(gameState.players).to.eql([playerOne.publicKey, playerTwo.publicKey]);
        expect(gameState.state).to.eql({ active: {} });
        expect(gameState.board).to.eql([[null, null, null], [null, null, null], [null, null, null]]);

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            { row: 0, column: 0 },
            2,
            { active: {}, },
            [
                [{ x: {} }, null, null],
                [null, null, null],
                [null, null, null]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerTwo,
            { row: 1, column: 1 },
            3,
            { active: {}, },
            [
                [{ x: {} }, null, null],
                [null, { o: {} }, null],
                [null, null, null]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            { row: 2, column: 0 },
            4,
            { active: {}, },
            [
                [{ x: {} }, null, null],
                [null, { o: {} }, null],
                [{ x: {} }, null, null]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerTwo,
            { row: 1, column: 0 },
            5,
            { active: {}, },
            [
                [{ x: {} }, null, null],
                [{ o: {} }, { o: {} }, null],
                [{ x: {} }, null, null]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            { row: 1, column: 2 },
            6,
            { active: {}, },
            [
                [{ x: {} }, null, null],
                [{ o: {} }, { o: {} }, { x: {} }],
                [{ x: {} }, null, null]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerTwo,
            { row: 0, column: 1 },
            7,
            { active: {}, },
            [
                [{ x: {} }, { o: {} }, null],
                [{ o: {} }, { o: {} }, { x: {} }],
                [{ x: {} }, null, null]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            { row: 2, column: 1 },
            8,
            { active: {}, },
            [
                [{ x: {} }, { o: {} }, null],
                [{ o: {} }, { o: {} }, { x: {} }],
                [{ x: {} }, { x: {} }, null]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerTwo,
            { row: 2, column: 2 },
            9,
            { active: {}, },
            [
                [{ x: {} }, { o: {} }, null],
                [{ o: {} }, { o: {} }, { x: {} }],
                [{ x: {} }, { x: {} }, { o: {} }]
            ]
        );

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            { row: 0, column: 2 },
            9,
            { tie: {}, },
            [
                [{ x: {} }, { o: {} }, { x: {} }],
                [{ o: {} }, { o: {} }, { x: {} }],
                [{ x: {} }, { x: {} }, { o: {} }]
            ]
        );
    });
});

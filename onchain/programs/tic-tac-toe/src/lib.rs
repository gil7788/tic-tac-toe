use anchor_lang::prelude::*;
use instructions::*;
use state::game::Tile;

pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("6WmnboLMNbXwnx2FvjjuowfXqufjjsnP1ojgGQdBcPzK");

#[program]
pub mod tic_tac_toe {
    use super::*;

    pub fn create_game(ctx: Context<CreateGame>) -> Result<()> {
        instructions::create_game::create_game(ctx)
    }

    pub fn join_game(ctx: Context<JoinGame>, player_two: Pubkey) -> Result<()> {
        instructions::join_game::join_game(ctx, player_two)
    }

    pub fn play(ctx: Context<Play>, tile: Tile) -> Result<()> {
        instructions::play::play(ctx, tile)
    }
}

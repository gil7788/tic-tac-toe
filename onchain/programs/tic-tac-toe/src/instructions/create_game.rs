use crate::state::game::*;
use anchor_lang::prelude::*;

pub fn create_game(ctx: Context<CreateGame>) -> Result<()> {
    ctx.accounts.game.create([ctx.accounts.player_one.key()])
}

#[derive(Accounts)]
pub struct CreateGame<'info> {
    #[account(init, payer = player_one, space = Game::MAXIMUM_SIZE + 8)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player_one: Signer<'info>,
    pub system_program: Program<'info, System>,
}

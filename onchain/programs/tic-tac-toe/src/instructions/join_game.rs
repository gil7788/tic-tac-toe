use crate::state::game::*;
use anchor_lang::prelude::*;

pub fn join_game(ctx: Context<JoinGame>, player_two: Pubkey) -> Result<()> {
    ctx.accounts.game.join(ctx.accounts.player_one.key(), player_two)
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player_two: Signer<'info>,
    /// CHECK: This is safe because player_one is a known field and its key is validated in the join_game function
    pub player_one: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

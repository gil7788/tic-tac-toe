use crate::state::game::*;
use anchor_lang::prelude::*;

pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
    const PLAYER_ONE_INDEX: usize = 0;
    let current_player = ctx.accounts.game.get_player_by_index(PLAYER_ONE_INDEX);
    let game = &mut ctx.accounts.game;
    game.join(current_player?, ctx.accounts.player_two.key())
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player_two: Signer<'info>,
}
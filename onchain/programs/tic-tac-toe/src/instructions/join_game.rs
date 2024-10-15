use crate::state::game::*;
use anchor_lang::prelude::*;

pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
     let current_player = ctx.accounts.game.current_player();
    let game = &mut ctx.accounts.game;
    game.join(current_player, ctx.accounts.player_two.key())
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player_two: Signer<'info>,
}
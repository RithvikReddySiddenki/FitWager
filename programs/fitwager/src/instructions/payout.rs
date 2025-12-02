use anchor_lang::prelude::*;
use crate::state::challenge::Challenge;

pub fn handler(ctx: Context<Payout>) -> Result<()> {
    let challenge = &mut ctx.accounts.challenge;

    // Move entire escrow balance to winner
    let escrow_balance = ctx.accounts.escrow.to_account_info().lamports();

    **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += escrow_balance;
    **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= escrow_balance;

    challenge.status = 2;

    Ok(())
}

#[derive(Accounts)]
pub struct Payout<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,

    #[account(mut)]
    pub challenge: Account<'info, Challenge>,

    /// CHECK: Only holds lamports
    #[account(
        mut,
        seeds = [b"escrow", challenge.key().as_ref()],
        bump
    )]
    pub escrow: UncheckedAccount<'info>,
}

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1"); // replace with your program ID

#[program]
pub mod fitwager {
    use super::*;

    // ----------------------------------------------------
    // CREATE CHALLENGE
    // ----------------------------------------------------
    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        entry_fee: u64,
        duration_seconds: i64,
    ) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;

        require!(entry_fee > 0, FitError::InvalidEntryFee);
        require!(duration_seconds > 0, FitError::InvalidDuration);

        challenge.creator = ctx.accounts.creator.key();
        challenge.entry_fee = entry_fee;
        challenge.start_time = Clock::get()?.unix_timestamp;
        challenge.end_time = challenge.start_time + duration_seconds;
        challenge.total_pool = 0;
        challenge.status = ChallengeStatus::Active;

        Ok(())
    }

    // ----------------------------------------------------
    // JOIN CHALLENGE (STAKE SOL)
    // ----------------------------------------------------
    pub fn join_challenge(ctx: Context<JoinChallenge>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;

        require!(challenge.status == ChallengeStatus::Active, FitError::ChallengeClosed);

        let entry_fee = challenge.entry_fee;

        // Transfer SOL into the escrow vault PDA
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.player.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                },
            ),
            entry_fee,
        )?;

        challenge.total_pool += entry_fee;

        participant.player = ctx.accounts.player.key();
        participant.score = 0;
        participant.has_joined = true;

        Ok(())
    }

    // ----------------------------------------------------
    // SUBMIT WORKOUT SCORE
    // ----------------------------------------------------
    pub fn submit_score(ctx: Context<SubmitScore>, score: u64) -> Result<()> {
        let challenge = &ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;

        require!(Clock::get()?.unix_timestamp < challenge.end_time, FitError::ChallengeEnded);
        require!(participant.has_joined, FitError::NotJoined);

        participant.score = score;

        Ok(())
    }

    // ----------------------------------------------------
    // END CHALLENGE + PAY WINNER(S)
    // ----------------------------------------------------
    pub fn end_challenge(ctx: Context<EndChallenge>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;

        require!(
            Clock::get()?.unix_timestamp >= challenge.end_time,
            FitError::ChallengeNotOver
        );
        require!(challenge.status == ChallengeStatus::Active, FitError::ChallengeClosed);

        challenge.status = ChallengeStatus::Ended;

        // Winner gets the whole pool (simple version)
        let winner = &ctx.accounts.winner;

        let seeds = &[
            b"vault",
            challenge.key().as_ref(),
            &[ctx.accounts.vault_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        // Transfer pool to winner
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_vault.to_account_info(),
                    to: winner.to_account_info(),
                },
                signer_seeds,
            ),
            challenge.total_pool,
        )?;

        Ok(())
    }
}

# ----------------------------------------------------
# ACCOUNTS
# ----------------------------------------------------
#[derive(Accounts)]
#[instruction(entry_fee: u64, duration_seconds: i64)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Challenge::SIZE,
        seeds = [b"challenge", creator.key().as_ref(), clock.unix_timestamp.to_le_bytes().as_ref()],
        bump
    )]
    pub challenge: Account<'info, Challenge>,

    #[account(
        init,
        payer = creator,
        space = 8,
        seeds = [b"vault", challenge.key().as_ref()],
        bump
    )]
    pub escrow_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct JoinChallenge<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(mut)]
    pub challenge: Account<'info, Challenge>,

    #[account(
        init_if_needed,
        payer = player,
        space = 8 + Participant::SIZE,
        seeds = [b"participant", challenge.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,

    #[account(mut)]
    pub escrow_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitScore<'info> {
    pub challenge: Account<'info, Challenge>,

    #[account(mut)]
    pub participant: Account<'info, Participant>,
}

#[derive(Accounts)]
pub struct EndChallenge<'info> {
    pub creator: Signer<'info>,

    #[account(mut)]
    pub challenge: Account<'info, Challenge>,

    #[account(mut)]
    pub escrow_vault: SystemAccount<'info>,

    /// CHECK: Solana system account
    #[account(mut)]
    pub winner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub clock: Sysvar<'info, Clock>,

    #[account("escrow_vault.owner == program_id")]
    pub vault_bump: u8,
}

# ----------------------------------------------------
# STATE STRUCTS
# ----------------------------------------------------
#[account]
pub struct Challenge {
    pub creator: Pubkey,
    pub entry_fee: u64,
    pub total_pool: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub status: ChallengeStatus,
}

impl Challenge {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Participant {
    pub player: Pubkey,
    pub score: u64,
    pub has_joined: bool,
}

impl Participant {
    pub const SIZE: usize = 32 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ChallengeStatus {
    Active,
    Ended,
}

# ----------------------------------------------------
# ERRORS
# ----------------------------------------------------
#[error_code]
pub enum FitError {
    #[msg("Entry fee must be > 0.")]
    InvalidEntryFee,

    #[msg("Duration must be > 0.")]
    InvalidDuration,

    #[msg("Challenge is already closed.")]
    ChallengeClosed,

    #[msg("Challenge is not over yet.")]
    ChallengeNotOver,

    #[msg("Challenge has ended.")]
    ChallengeEnded,

    #[msg("Player has not joined this challenge.")]
    NotJoined,
}

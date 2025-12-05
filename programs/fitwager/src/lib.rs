use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("Fg6PaFpoGXkYsidMpWxqSW1JmAxo9ZPVknpYAH97PvX1");

#[program]
pub mod fitwager {
    use super::*;

    /// Create a new fitness challenge
    /// Supports both SOL and USDC entry fees
    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        entry_fee: u64,
        duration_seconds: i64,
        challenge_type: ChallengeType,
        goal: u64,
        is_usdc: bool,
        is_public: bool,
    ) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let clock = Clock::get()?;

        require!(entry_fee > 0, FitError::InvalidEntryFee);
        require!(duration_seconds > 0, FitError::InvalidDuration);
        require!(goal > 0, FitError::InvalidGoal);

        challenge.creator = ctx.accounts.creator.key();
        challenge.entry_fee = entry_fee;
        challenge.start_time = clock.unix_timestamp;
        challenge.end_time = clock.unix_timestamp + duration_seconds;
        challenge.total_pool = 0;
        challenge.participant_count = 0;
        challenge.status = ChallengeStatus::Active;
        challenge.challenge_type = challenge_type;
        challenge.goal = goal;
        challenge.is_usdc = is_usdc;
        challenge.is_public = is_public;
        challenge.winner = Pubkey::default();
        challenge.bump = ctx.bumps.challenge;

        emit!(ChallengeCreated {
            challenge: challenge.key(),
            creator: ctx.accounts.creator.key(),
            entry_fee,
            challenge_type,
            goal,
            is_usdc,
            end_time: challenge.end_time,
        });

        Ok(())
    }

    /// Join a challenge with SOL
    pub fn join_challenge_sol(ctx: Context<JoinChallengeSol>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;

        require!(challenge.status == ChallengeStatus::Active, FitError::ChallengeClosed);
        require!(!challenge.is_usdc, FitError::WrongPaymentType);
        require!(!participant.has_joined, FitError::AlreadyJoined);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp < challenge.end_time, FitError::ChallengeEnded);

        // Transfer SOL to escrow vault
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.player.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                },
            ),
            challenge.entry_fee,
        )?;

        challenge.total_pool += challenge.entry_fee;
        challenge.participant_count += 1;

        participant.player = ctx.accounts.player.key();
        participant.challenge = challenge.key();
        participant.score = 0;
        participant.has_joined = true;
        participant.has_submitted = false;
        participant.joined_at = clock.unix_timestamp;
        participant.bump = ctx.bumps.participant;

        emit!(ParticipantJoined {
            challenge: challenge.key(),
            player: ctx.accounts.player.key(),
            entry_fee: challenge.entry_fee,
            is_usdc: false,
        });

        Ok(())
    }

    /// Join a challenge with USDC (SPL Token)
    pub fn join_challenge_usdc(ctx: Context<JoinChallengeUsdc>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;

        require!(challenge.status == ChallengeStatus::Active, FitError::ChallengeClosed);
        require!(challenge.is_usdc, FitError::WrongPaymentType);
        require!(!participant.has_joined, FitError::AlreadyJoined);

        let clock = Clock::get()?;
        require!(clock.unix_timestamp < challenge.end_time, FitError::ChallengeEnded);

        // Transfer USDC to escrow token account
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SplTransfer {
                    from: ctx.accounts.player_token_account.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.player.to_account_info(),
                },
            ),
            challenge.entry_fee,
        )?;

        challenge.total_pool += challenge.entry_fee;
        challenge.participant_count += 1;

        participant.player = ctx.accounts.player.key();
        participant.challenge = challenge.key();
        participant.score = 0;
        participant.has_joined = true;
        participant.has_submitted = false;
        participant.joined_at = clock.unix_timestamp;
        participant.bump = ctx.bumps.participant;

        emit!(ParticipantJoined {
            challenge: challenge.key(),
            player: ctx.accounts.player.key(),
            entry_fee: challenge.entry_fee,
            is_usdc: true,
        });

        Ok(())
    }

    /// Submit a verified fitness score (called by backend after Google Fit verification)
    pub fn submit_score(
        ctx: Context<SubmitScore>,
        score: u64,
        verification_hash: [u8; 32],
    ) -> Result<()> {
        let challenge = &ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;
        let clock = Clock::get()?;

        require!(challenge.status == ChallengeStatus::Active, FitError::ChallengeClosed);
        require!(participant.has_joined, FitError::NotJoined);
        require!(clock.unix_timestamp <= challenge.end_time, FitError::ChallengeEnded);

        // Update participant score (allows multiple submissions, keeps highest)
        if score > participant.score {
            participant.score = score;
        }
        participant.has_submitted = true;
        participant.last_submission = clock.unix_timestamp;
        participant.verification_hash = verification_hash;

        emit!(ScoreSubmitted {
            challenge: challenge.key(),
            player: participant.player,
            score,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// End challenge and payout winner (SOL)
    pub fn end_challenge_sol(ctx: Context<EndChallengeSol>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let clock = Clock::get()?;

        require!(clock.unix_timestamp >= challenge.end_time, FitError::ChallengeNotOver);
        require!(challenge.status == ChallengeStatus::Active, FitError::ChallengeClosed);
        require!(!challenge.is_usdc, FitError::WrongPaymentType);

        challenge.status = ChallengeStatus::Ended;
        challenge.winner = ctx.accounts.winner.key();

        // Calculate payout (95% to winner, 5% platform fee)
        let platform_fee = challenge.total_pool * 5 / 100;
        let winner_payout = challenge.total_pool - platform_fee;

        let challenge_key = challenge.key();
        let seeds = &[
            b"vault",
            challenge_key.as_ref(),
            &[ctx.accounts.vault_bump.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer to winner
        if winner_payout > 0 {
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.winner.to_account_info(),
                    },
                    signer_seeds,
                ),
                winner_payout,
            )?;
        }

        // Transfer platform fee
        if platform_fee > 0 {
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.platform_wallet.to_account_info(),
                    },
                    signer_seeds,
                ),
                platform_fee,
            )?;
        }

        emit!(ChallengeEnded {
            challenge: challenge.key(),
            winner: ctx.accounts.winner.key(),
            payout: winner_payout,
            platform_fee,
        });

        Ok(())
    }

    /// End challenge and payout winner (USDC)
    pub fn end_challenge_usdc(ctx: Context<EndChallengeUsdc>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let clock = Clock::get()?;

        require!(clock.unix_timestamp >= challenge.end_time, FitError::ChallengeNotOver);
        require!(challenge.status == ChallengeStatus::Active, FitError::ChallengeClosed);
        require!(challenge.is_usdc, FitError::WrongPaymentType);

        challenge.status = ChallengeStatus::Ended;
        challenge.winner = ctx.accounts.winner.key();

        // Calculate payout (95% to winner, 5% platform fee)
        let platform_fee = challenge.total_pool * 5 / 100;
        let winner_payout = challenge.total_pool - platform_fee;

        let challenge_key = challenge.key();
        let seeds = &[
            b"escrow_token",
            challenge_key.as_ref(),
            &[ctx.accounts.escrow_bump.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer USDC to winner
        if winner_payout > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    SplTransfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: ctx.accounts.winner_token_account.to_account_info(),
                        authority: ctx.accounts.escrow_token_account.to_account_info(),
                    },
                    signer_seeds,
                ),
                winner_payout,
            )?;
        }

        // Transfer platform fee
        if platform_fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    SplTransfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: ctx.accounts.platform_token_account.to_account_info(),
                        authority: ctx.accounts.escrow_token_account.to_account_info(),
                    },
                    signer_seeds,
                ),
                platform_fee,
            )?;
        }

        emit!(ChallengeEnded {
            challenge: challenge.key(),
            winner: ctx.accounts.winner.key(),
            payout: winner_payout,
            platform_fee,
        });

        Ok(())
    }

    /// Cancel a challenge (only creator, only if no participants)
    pub fn cancel_challenge(ctx: Context<CancelChallenge>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;

        require!(challenge.status == ChallengeStatus::Active, FitError::ChallengeClosed);
        require!(challenge.participant_count == 0, FitError::HasParticipants);
        require!(challenge.creator == ctx.accounts.creator.key(), FitError::NotCreator);

        challenge.status = ChallengeStatus::Cancelled;

        emit!(ChallengeCancelled {
            challenge: challenge.key(),
            creator: ctx.accounts.creator.key(),
        });

        Ok(())
    }
}

// ============================================================
// ACCOUNT STRUCTURES
// ============================================================

#[derive(Accounts)]
#[instruction(entry_fee: u64, duration_seconds: i64)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Challenge::SIZE,
        seeds = [b"challenge", creator.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub challenge: Account<'info, Challenge>,

    /// CHECK: PDA for holding SOL
    #[account(
        mut,
        seeds = [b"vault", challenge.key().as_ref()],
        bump
    )]
    pub escrow_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinChallengeSol<'info> {
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

    /// CHECK: Escrow vault PDA
    #[account(
        mut,
        seeds = [b"vault", challenge.key().as_ref()],
        bump
    )]
    pub escrow_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinChallengeUsdc<'info> {
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
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow_token", challenge.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitScore<'info> {
    #[account(mut)]
    pub submitter: Signer<'info>,

    pub challenge: Account<'info, Challenge>,

    #[account(
        mut,
        seeds = [b"participant", challenge.key().as_ref(), participant.player.as_ref()],
        bump = participant.bump
    )]
    pub participant: Account<'info, Participant>,
}

#[derive(Accounts)]
pub struct EndChallengeSol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = challenge.creator == authority.key() @ FitError::NotCreator
    )]
    pub challenge: Account<'info, Challenge>,

    /// CHECK: Escrow vault PDA
    #[account(
        mut,
        seeds = [b"vault", challenge.key().as_ref()],
        bump
    )]
    pub escrow_vault: SystemAccount<'info>,

    /// CHECK: Winner receives payout
    #[account(mut)]
    pub winner: AccountInfo<'info>,

    /// CHECK: Platform fee recipient
    #[account(mut)]
    pub platform_wallet: AccountInfo<'info>,

    #[account(
        seeds = [b"vault", challenge.key().as_ref()],
        bump
    )]
    pub vault_bump: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EndChallengeUsdc<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = challenge.creator == authority.key() @ FitError::NotCreator
    )]
    pub challenge: Account<'info, Challenge>,

    #[account(
        mut,
        seeds = [b"escrow_token", challenge.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub platform_token_account: Account<'info, TokenAccount>,

    /// CHECK: Winner account
    pub winner: AccountInfo<'info>,

    #[account(
        seeds = [b"escrow_token", challenge.key().as_ref()],
        bump
    )]
    pub escrow_bump: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelChallenge<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        constraint = challenge.creator == creator.key() @ FitError::NotCreator
    )]
    pub challenge: Account<'info, Challenge>,
}

// ============================================================
// STATE ACCOUNTS
// ============================================================

#[account]
pub struct Challenge {
    pub creator: Pubkey,           // 32
    pub entry_fee: u64,            // 8
    pub total_pool: u64,           // 8
    pub start_time: i64,           // 8
    pub end_time: i64,             // 8
    pub participant_count: u32,    // 4
    pub status: ChallengeStatus,   // 1
    pub challenge_type: ChallengeType, // 1
    pub goal: u64,                 // 8
    pub is_usdc: bool,             // 1
    pub is_public: bool,           // 1
    pub winner: Pubkey,            // 32
    pub bump: u8,                  // 1
}

impl Challenge {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 8 + 4 + 1 + 1 + 8 + 1 + 1 + 32 + 1;
}

#[account]
pub struct Participant {
    pub player: Pubkey,            // 32
    pub challenge: Pubkey,         // 32
    pub score: u64,                // 8
    pub has_joined: bool,          // 1
    pub has_submitted: bool,       // 1
    pub joined_at: i64,            // 8
    pub last_submission: i64,      // 8
    pub verification_hash: [u8; 32], // 32
    pub bump: u8,                  // 1
}

impl Participant {
    pub const SIZE: usize = 32 + 32 + 8 + 1 + 1 + 8 + 8 + 32 + 1;
}

// ============================================================
// ENUMS
// ============================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ChallengeStatus {
    Active,
    Ended,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ChallengeType {
    Steps,      // Daily step count
    Distance,   // Walking/running distance (meters)
    Duration,   // Active minutes
    Calories,   // Calories burned
}

// ============================================================
// EVENTS
// ============================================================

#[event]
pub struct ChallengeCreated {
    pub challenge: Pubkey,
    pub creator: Pubkey,
    pub entry_fee: u64,
    pub challenge_type: ChallengeType,
    pub goal: u64,
    pub is_usdc: bool,
    pub end_time: i64,
}

#[event]
pub struct ParticipantJoined {
    pub challenge: Pubkey,
    pub player: Pubkey,
    pub entry_fee: u64,
    pub is_usdc: bool,
}

#[event]
pub struct ScoreSubmitted {
    pub challenge: Pubkey,
    pub player: Pubkey,
    pub score: u64,
    pub timestamp: i64,
}

#[event]
pub struct ChallengeEnded {
    pub challenge: Pubkey,
    pub winner: Pubkey,
    pub payout: u64,
    pub platform_fee: u64,
}

#[event]
pub struct ChallengeCancelled {
    pub challenge: Pubkey,
    pub creator: Pubkey,
}

// ============================================================
// ERRORS
// ============================================================

#[error_code]
pub enum FitError {
    #[msg("Entry fee must be greater than 0")]
    InvalidEntryFee,

    #[msg("Duration must be greater than 0")]
    InvalidDuration,

    #[msg("Goal must be greater than 0")]
    InvalidGoal,

    #[msg("Challenge is closed")]
    ChallengeClosed,

    #[msg("Challenge has not ended yet")]
    ChallengeNotOver,

    #[msg("Challenge has ended")]
    ChallengeEnded,

    #[msg("Player has not joined this challenge")]
    NotJoined,

    #[msg("Player has already joined this challenge")]
    AlreadyJoined,

    #[msg("Wrong payment type for this challenge")]
    WrongPaymentType,

    #[msg("Only the creator can perform this action")]
    NotCreator,

    #[msg("Cannot cancel challenge with participants")]
    HasParticipants,

    #[msg("Invalid verification data")]
    InvalidVerification,
}

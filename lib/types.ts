import { PublicKey } from '@solana/web3.js';

export interface Data {
    message: string
}

export interface CheckoutDetails {
    referenceId: PublicKey,
    amount: number
}

export interface TransactionStatus {
    status: string
}

export interface TransactionVerification extends TransactionStatus {
    status: string,
    errorMessage?: string
}
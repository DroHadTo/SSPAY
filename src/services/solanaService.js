const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { createTransfer, parseURL, validateTransfer } = require('@solana/pay');
const BigNumber = require('bignumber.js');
const config = require('../config');

class SolanaService {
    constructor() {
        this.connection = new Connection(config.SOLANA.RPC_URL, 'confirmed');
        this.merchantWallet = new PublicKey(config.SOLANA.MERCHANT_WALLET);
    }

    async getBalance(walletAddress) {
        try {
            const publicKey = new PublicKey(walletAddress);
            const balance = await this.connection.getBalance(publicKey);
            return balance / 1e9; // Convert lamports to SOL
        } catch (error) {
            console.error('Error getting balance:', error);
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    async validateTransaction(signature) {
        try {
            const transaction = await this.connection.getTransaction(signature, {
                commitment: 'confirmed'
            });
            
            if (!transaction) {
                return { valid: false, error: 'Transaction not found' };
            }

            return {
                valid: true,
                transaction,
                blockTime: transaction.blockTime,
                slot: transaction.slot
            };
        } catch (error) {
            console.error('Error validating transaction:', error);
            return { valid: false, error: error.message };
        }
    }

    async createPaymentRequest(amount, reference, label, message) {
        try {
            const amountBN = new BigNumber(amount);
            
            const url = new URL('solana:');
            url.searchParams.set('recipient', this.merchantWallet.toString());
            url.searchParams.set('amount', amountBN.toString());
            url.searchParams.set('reference', reference);
            url.searchParams.set('label', label || 'SSPAY Payment');
            url.searchParams.set('message', message || 'Crypto payment for your order');

            return {
                url: url.toString(),
                qrCode: url.toString(),
                recipient: this.merchantWallet.toString(),
                amount: amountBN.toString(),
                reference
            };
        } catch (error) {
            console.error('Error creating payment request:', error);
            throw new Error(`Failed to create payment request: ${error.message}`);
        }
    }

    async monitorPayment(reference, expectedAmount, timeout = 300000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const referencePublicKey = new PublicKey(reference);

            const checkPayment = async () => {
                try {
                    if (Date.now() - startTime > timeout) {
                        reject(new Error('Payment timeout'));
                        return;
                    }

                    const signatures = await this.connection.getSignaturesForAddress(
                        referencePublicKey,
                        { limit: 10 }
                    );

                    for (const signatureInfo of signatures) {
                        const transaction = await this.connection.getTransaction(
                            signatureInfo.signature,
                            { commitment: 'confirmed' }
                        );

                        if (transaction && transaction.meta && !transaction.meta.err) {
                            // Validate the payment
                            const validation = await this.validatePayment(
                                transaction,
                                this.merchantWallet,
                                expectedAmount,
                                referencePublicKey
                            );

                            if (validation.valid) {
                                resolve({
                                    signature: signatureInfo.signature,
                                    amount: validation.amount,
                                    timestamp: transaction.blockTime,
                                    transaction
                                });
                                return;
                            }
                        }
                    }

                    // Check again in 2 seconds
                    setTimeout(checkPayment, 2000);
                } catch (error) {
                    reject(error);
                }
            };

            checkPayment();
        });
    }

    async validatePayment(transaction, expectedRecipient, expectedAmount, expectedReference) {
        try {
            // Basic validation
            if (!transaction || transaction.meta.err) {
                return { valid: false, error: 'Transaction failed' };
            }

            // Check if transaction includes our reference
            const hasReference = transaction.transaction.message.accountKeys.some(
                key => key.equals(expectedReference)
            );

            if (!hasReference) {
                return { valid: false, error: 'Reference not found' };
            }

            // Extract transfer amount (simplified - in production, parse the instruction data)
            const preBalance = transaction.meta.preBalances[1] || 0;
            const postBalance = transaction.meta.postBalances[1] || 0;
            const transferAmount = (preBalance - postBalance) / 1e9; // Convert to SOL

            const expectedAmountBN = new BigNumber(expectedAmount);
            const actualAmountBN = new BigNumber(transferAmount);

            if (actualAmountBN.isLessThan(expectedAmountBN)) {
                return { 
                    valid: false, 
                    error: `Insufficient amount. Expected: ${expectedAmount}, Received: ${transferAmount}` 
                };
            }

            return {
                valid: true,
                amount: transferAmount,
                signature: transaction.transaction.signatures[0]
            };
        } catch (error) {
            console.error('Error validating payment:', error);
            return { valid: false, error: error.message };
        }
    }

    async getTransactionDetails(signature) {
        try {
            const transaction = await this.connection.getTransaction(signature, {
                commitment: 'confirmed'
            });

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            return {
                signature,
                blockTime: transaction.blockTime,
                slot: transaction.slot,
                fee: transaction.meta.fee / 1e9, // Convert to SOL
                success: !transaction.meta.err,
                accounts: transaction.transaction.message.accountKeys.map(key => key.toString()),
                preBalances: transaction.meta.preBalances.map(balance => balance / 1e9),
                postBalances: transaction.meta.postBalances.map(balance => balance / 1e9)
            };
        } catch (error) {
            console.error('Error getting transaction details:', error);
            throw new Error(`Failed to get transaction details: ${error.message}`);
        }
    }

    async getCurrentSlot() {
        try {
            return await this.connection.getSlot();
        } catch (error) {
            console.error('Error getting current slot:', error);
            throw new Error(`Failed to get current slot: ${error.message}`);
        }
    }

    async getRecentBlockhash() {
        try {
            const { blockhash } = await this.connection.getRecentBlockhash();
            return blockhash;
        } catch (error) {
            console.error('Error getting recent blockhash:', error);
            throw new Error(`Failed to get recent blockhash: ${error.message}`);
        }
    }

    generateReference() {
        // Generate a unique reference for the payment
        return new PublicKey(
            Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
        ).toString();
    }

    async estimateTransactionFee() {
        try {
            // Get recent blockhash for fee estimation
            const { feeCalculator } = await this.connection.getRecentBlockhash();
            return feeCalculator.lamportsPerSignature / 1e9; // Convert to SOL
        } catch (error) {
            console.error('Error estimating transaction fee:', error);
            return 0.000005; // Default fee in SOL
        }
    }
}

module.exports = new SolanaService();

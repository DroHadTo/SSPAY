const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const crypto = require('crypto');

class SolanaPayService {
    constructor() {
        this.connection = new Connection(
            process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
            'confirmed'
        );
        
        this.merchantWallet = process.env.SOLANA_MERCHANT_WALLET || 'Your_Merchant_Wallet_Address';
        this.tokenMints = {
            'SOL': null, // Native SOL
            'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mainnet
            'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT mainnet
        };
    }

    /**
     * Generate a Solana Pay URL for payment request
     */
    generatePaymentURL(amount, currency = 'SOL', memo = '', reference = null) {
        try {
            const recipient = this.merchantWallet;
            const label = 'SSPAY Store';
            const message = memo || 'Purchase from SSPAY';
            
            // Generate reference if not provided
            if (!reference) {
                reference = crypto.randomBytes(32).toString('hex');
            }
            
            let url;
            
            if (currency === 'SOL') {
                // Native SOL payment
                url = `solana:${recipient}?amount=${amount}&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}&memo=${encodeURIComponent(memo)}`;
            } else {
                // SPL Token payment
                const mint = this.tokenMints[currency];
                if (!mint) {
                    throw new Error(`Unsupported currency: ${currency}`);
                }
                
                url = `solana:${recipient}?spl-token=${mint}&amount=${amount}&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}&memo=${encodeURIComponent(memo)}`;
            }
            
            if (reference) {
                url += `&reference=${reference}`;
            }
            
            return {
                success: true,
                url,
                reference,
                qrCode: this.generateQRCodeURL(url)
            };
            
        } catch (error) {
            console.error('❌ Error generating payment URL:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a transaction for programmatic payment
     */
    async createTransaction(fromPubkey, toPubkey, amount, currency = 'SOL', memo = '') {
        try {
            const transaction = new Transaction();
            
            if (currency === 'SOL') {
                // Native SOL transfer
                const lamports = Math.round(amount * LAMPORTS_PER_SOL);
                
                const transferInstruction = SystemProgram.transfer({
                    fromPubkey: new PublicKey(fromPubkey),
                    toPubkey: new PublicKey(toPubkey),
                    lamports
                });
                
                transaction.add(transferInstruction);
            } else {
                // SPL Token transfer
                const mint = this.tokenMints[currency];
                if (!mint) {
                    throw new Error(`Unsupported currency: ${currency}`);
                }
                
                // Note: This is a simplified example
                // In production, you'd need to handle token account creation and decimals properly
                console.log(`Creating SPL token transfer for ${currency} (${mint})`);
            }
            
            // Add memo if provided
            if (memo) {
                const memoData = Buffer.from(memo, 'utf8');
                const memoInstruction = {
                    keys: [],
                    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
                    data: memoData
                };
                transaction.add(memoInstruction);
            }
            
            // Get recent blockhash
            const { blockhash } = await this.connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = new PublicKey(fromPubkey);
            
            return {
                success: true,
                transaction: transaction.serialize({ requireAllSignatures: false }),
                message: 'Transaction created successfully'
            };
            
        } catch (error) {
            console.error('❌ Error creating transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify a transaction signature on the blockchain
     */
    async verifyTransaction(signature, expectedAmount, expectedRecipient, currency = 'SOL') {
        try {
            console.log(`🔍 Verifying transaction: ${signature}`);
            
            // Get transaction details
            const transaction = await this.connection.getTransaction(signature, {
                commitment: 'confirmed'
            });
            
            if (!transaction) {
                return {
                    success: false,
                    error: 'Transaction not found',
                    status: 'not_found'
                };
            }
            
            if (transaction.meta?.err) {
                return {
                    success: false,
                    error: 'Transaction failed',
                    status: 'failed',
                    details: transaction.meta.err
                };
            }
            
            // Verify amount and recipient
            const verification = this.verifyTransactionDetails(
                transaction,
                expectedAmount,
                expectedRecipient,
                currency
            );
            
            return {
                success: verification.valid,
                status: 'confirmed',
                slot: transaction.slot,
                blockTime: transaction.blockTime,
                fee: transaction.meta?.fee || 0,
                verification,
                transaction
            };
            
        } catch (error) {
            console.error('❌ Error verifying transaction:', error);
            return {
                success: false,
                error: error.message,
                status: 'error'
            };
        }
    }

    /**
     * Monitor payment status by reference
     */
    async monitorPayment(reference, expectedAmount, currency = 'SOL', timeoutMs = 300000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const checkPayment = async () => {
                try {
                    // In a real implementation, you would check for transactions
                    // containing the reference in memo or as a reference account
                    console.log(`🔍 Monitoring payment with reference: ${reference}`);
                    
                    // For demo purposes, simulate payment detection after 30 seconds
                    if (Date.now() - startTime > 30000) {
                        resolve({
                            success: true,
                            status: 'confirmed',
                            signature: 'demo_signature_' + crypto.randomBytes(32).toString('hex'),
                            amount: expectedAmount,
                            currency,
                            timestamp: new Date().toISOString()
                        });
                        return;
                    }
                    
                    // Check for timeout
                    if (Date.now() - startTime > timeoutMs) {
                        resolve({
                            success: false,
                            status: 'timeout',
                            message: 'Payment monitoring timed out'
                        });
                        return;
                    }
                    
                    // Continue monitoring
                    setTimeout(checkPayment, 5000); // Check every 5 seconds
                    
                } catch (error) {
                    resolve({
                        success: false,
                        status: 'error',
                        error: error.message
                    });
                }
            };
            
            checkPayment();
        });
    }

    /**
     * Get current SOL price in USD
     */
    async getSOLPrice() {
        try {
            // In production, use a price API like CoinGecko or Jupiter
            // For demo, return a mock price
            return {
                success: true,
                price: 23.45, // USD per SOL
                timestamp: new Date().toISOString(),
                source: 'demo'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Convert USD amount to SOL
     */
    async convertUSDToSOL(usdAmount) {
        try {
            const priceData = await this.getSOLPrice();
            
            if (!priceData.success) {
                throw new Error('Failed to get SOL price');
            }
            
            const solAmount = usdAmount / priceData.price;
            
            return {
                success: true,
                usdAmount,
                solAmount: Number(solAmount.toFixed(6)),
                rate: priceData.price,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate QR code URL for payment
     */
    generateQRCodeURL(paymentURL) {
        // Use a QR code service
        return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(paymentURL)}`;
    }

    /**
     * Verify transaction details match expected values
     */
    verifyTransactionDetails(transaction, expectedAmount, expectedRecipient, currency) {
        try {
            let valid = false;
            let actualAmount = 0;
            let actualRecipient = '';
            
            if (currency === 'SOL') {
                // Check SOL transfer
                const instructions = transaction.transaction.message.instructions;
                
                for (const instruction of instructions) {
                    if (instruction.programId.equals(SystemProgram.programId)) {
                        // Parse system transfer instruction
                        const data = instruction.data;
                        if (data.length >= 4 && data.readUInt32LE(0) === 2) {
                            // Transfer instruction
                            const lamports = data.readBigUInt64LE(4);
                            actualAmount = Number(lamports) / LAMPORTS_PER_SOL;
                            
                            // Get recipient from accounts
                            const accounts = instruction.accounts;
                            if (accounts.length >= 2) {
                                actualRecipient = transaction.transaction.message.accountKeys[accounts[1]].toBase58();
                            }
                            
                            valid = (
                                Math.abs(actualAmount - expectedAmount) < 0.001 &&
                                actualRecipient === expectedRecipient
                            );
                            break;
                        }
                    }
                }
            }
            
            return {
                valid,
                expectedAmount,
                actualAmount,
                expectedRecipient,
                actualRecipient,
                currency
            };
        } catch (error) {
            console.error('❌ Error verifying transaction details:', error);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Get wallet balance
     */
    async getBalance(walletAddress, currency = 'SOL') {
        try {
            const pubkey = new PublicKey(walletAddress);
            
            if (currency === 'SOL') {
                const lamports = await this.connection.getBalance(pubkey);
                return {
                    success: true,
                    balance: lamports / LAMPORTS_PER_SOL,
                    currency: 'SOL'
                };
            } else {
                // SPL Token balance - simplified
                return {
                    success: true,
                    balance: 0, // Would need to implement SPL token balance checking
                    currency
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = SolanaPayService;

import Cors from 'cors'
import initMiddleware from '../../lib/init-middleware'
import type { NextApiRequest, NextApiResponse } from 'next'
import { TransactionStatus, TransactionVerification } from '../../lib/types'
import BigNumber from 'bignumber.js';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { EncodeURLComponents, validateTransactionSignature, findTransactionSignature, FindTransactionSignatureError } from '@solana/pay';


// Initialize the cors middleware
const cors = initMiddleware(
    // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
    Cors({
        // Only allow requests with POST and OPTIONS
        methods: ['POST', 'OPTIONS'],
    })
)

const connection = new Connection(clusterApiUrl('devnet'));


async function checkTransaction(urlParams: EncodeURLComponents): Promise<TransactionStatus> {
    try {
        let signatureInfo = await findTransactionSignature(connection, urlParams.reference as PublicKey, undefined, 'confirmed');
        console.log('\n 🖌  Signature found: ', signatureInfo.signature);
        return validateTransaction(urlParams, signatureInfo.signature)
    } catch (error: any) {
        if (!(error instanceof FindTransactionSignatureError)) {
            console.error(error);
            return {
                status: "pending"
            }
        }
        console.log(error)
        return {
            status: "unknown"
        };
    }
}

async function validateTransaction(urlParams: EncodeURLComponents, signature: string): Promise<TransactionStatus> {
    console.log('\n🔗 Validate transaction \n');
    let amount = urlParams.amount ?? new BigNumber(0)
    try {
        await validateTransactionSignature(connection, signature, urlParams.recipient, amount, undefined, urlParams.reference);
        return {
            status: "validated"
        }
    } catch (error) {
        console.error('❌ Payment failed', error);
        return {
            status: "failed"
        }
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TransactionVerification>) {
    // Run cors
    await cors(req, res)

    const {
        body,
        method,
    } = req

    switch (method) {
        case 'POST':
            try {
                // Should check amount in implementation with regards to reference (DB/Redis)
                if (
                    "reference" in body && typeof body.reference === "string" &&
                    "recipient" in body && typeof body.recipient === "string"
                ) {
                    let transactionStatus = checkTransaction({
                        recipient: new PublicKey(body.recipient),
                        amount: new BigNumber(body.amount ?? 0),
                        reference: new PublicKey(body.reference)
                    })
                    res.status(200).json(await transactionStatus)
                    break
                }
                else {
                    res.status(400).send({
                        status: "unknown",
                        errorMessage: "Required Parameters not provided"
                    })
                }
            } catch (err: any) {
                res.status(400).json({
                    status: "unknown",
                    errorMessage: "Unexpected Error"
                })
            }

        default:
            res.setHeader('Allow', ['POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}
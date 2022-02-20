import Cors from 'cors'
import initMiddleware from '../../lib/init-middleware'
import type { NextApiRequest, NextApiResponse } from 'next'
import { CheckoutDetails } from '../../lib/types'
import { Keypair } from '@solana/web3.js';


// Initialize the cors middleware
const cors = initMiddleware(
    // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
    Cors({
        // Only allow requests with GET, POST and OPTIONS
        methods: ['GET', 'OPTIONS'],
    })
)

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<CheckoutDetails>) {
    // Run cors
    await cors(req, res)

    const {
        query: { id, name },
        method,
    } = req

    switch (method) {
        case 'GET':
            res.status(200).json({ referenceId: new Keypair().publicKey, amount: 1 })
            break
        default:
            res.setHeader('Allow', ['GET'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}
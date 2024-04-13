const {
    clusterApiUrl,
    sendAndConfirmTransaction,
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
} =require('@solana/web3.js');

const {
    ExtensionType,
    createInitializeMintInstruction,
    createInitializeTransferHookInstruction,
    mintTo,
    createAccount,
    getMintLen,
    TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountIdempotent,
} =require("@solana/spl-token");
const bs58 = require("bs58");

(async () => {
    function generateExplorerTxUrl(txId) {
        return `https://explorer.solana.com/tx/${txId}?cluster=devnet`;
    }
    const privateKeyString = 'your private key';
    let privateKeyBytes = bs58.decode(privateKeyString);
// Import our keypair from the wallet file
    const payer = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));
    // const payer = Keypair.generate();
    const mintAuthority = payer;
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const extensions = [ExtensionType.TransferHook];
    const mintLen = getMintLen(extensions);
    const decimals = 9;

    const mintAmount = BigInt(1_000_000 * Math.pow(10, decimals)); // Mint 1,000,000 tokens
    const transferAmount = BigInt(1_000 * Math.pow(10, decimals)); // Transfer 1,000 tokens

    const transferHookProgramId = new PublicKey('6baxXgMr7HypeTBhN64rbrt31UwbSeRtsQQxGw1KBi5b')

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    const airdropSignature = await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction({ signature: airdropSignature, ...(await connection.getLatestBlockhash()) });

    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferHookInstruction(mint, payer.publicKey, transferHookProgramId, TOKEN_2022_PROGRAM_ID),
        createInitializeMintInstruction(mint, decimals, mintAuthority.publicKey, null, TOKEN_2022_PROGRAM_ID)
    );
    const newTokenTx = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintKeypair], undefined);
    console.log("New Token Created:", generateExplorerTxUrl(newTokenTx));
    const owner = payer;
    const sourceAccount = await createAssociatedTokenAccountIdempotent(connection, payer, mint, owner.publicKey, {}, TOKEN_2022_PROGRAM_ID);
    const mintSig = await mintTo(connection,payer,mint,sourceAccount,mintAuthority,mintAmount,[],undefined,TOKEN_2022_PROGRAM_ID);
    console.log("Tokens Minted:", generateExplorerTxUrl(mintSig));

})()


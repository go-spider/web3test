const {
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    Keypair, Connection, clusterApiUrl,
} =require("@solana/web3.js");
const {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeTransferHookInstruction,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    createTransferCheckedInstruction,
    getAssociatedTokenAddressSync,
    createTransferCheckedWithTransferHookInstruction,
} =require("@solana/spl-token");
const bs58 = require("bs58");
//Replace it with your private key.
const privateKeyString = 'your private key';
let privateKeyBytes = bs58.decode(privateKeyString);
// import our keypair from the secret key
const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
// use exist key
const mint = new PublicKey("2ieG5FgkUS2VXKU8RKLePGJ5t18nGRUcEqJcr4jcgMjF");
const decimals = 9;
const amount = 1 * 10 ** decimals;
const bigIntAmount = BigInt(amount);

const sourceTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
);

// Recipient token account address
const recipient = new PublicKey("7zNW4dHxjvqXdFNTsambgfPzc7J1rwLXACPQJTDtXo5u");
const destinationTokenAccount = getAssociatedTokenAddressSync(
    mint,
    recipient,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
);

// console.log(destinationTokenAccount.toBase58())
(async () => {
	 const create_account_transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            destinationTokenAccount,
            recipient.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        ),
    );

    const  create_account_txSig = await sendAndConfirmTransaction(
        connection,
        create_account_transaction,
        [wallet],
        { skipPreflight: true }
    );

    console.log(`Transaction Signature: ${create_account_txSig}`);
	
    const transferInstruction =
        await createTransferCheckedWithTransferHookInstruction(
            connection,
            sourceTokenAccount,
            mint,
            destinationTokenAccount,
            wallet.publicKey,
            bigIntAmount,
            decimals,
            [],
            "confirmed",
            TOKEN_2022_PROGRAM_ID
        );

    const transaction = new Transaction().add(
        transferInstruction
    );

    console.log( "Pushed keys:", JSON.stringify(transferInstruction.keys, null, 2) );

    const txSig = await sendAndConfirmTransaction(
        connection,
        transaction,
        [wallet],
        { skipPreflight: true }
    );
    console.log("Transfer Signature:", txSig);
})()
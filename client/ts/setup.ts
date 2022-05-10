import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
} from "@solana/web3.js";

import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  getKeypair,
  getPublicKey,
  getTokenBalance,
  sleep,
  writePublicKey,
} from "./utils";

const createMintFn = (
  connection: Connection,
  { publicKey, secretKey }: Signer
) => {
  return createMint(
    connection,
    {
      publicKey,
      secretKey,
    },
    publicKey,
    null,
    0
  );
};

const setupMint = async (
  name: string,
  connection: Connection,
  alicePublicKey: PublicKey,
  bobPublicKey: PublicKey,
  clientKeypair: Signer
): Promise<[PublicKey, PublicKey, PublicKey]> => {
  console.log(`Creating Mint ${name}...`);
  const mint = await createMintFn(connection, clientKeypair);
  writePublicKey(mint, `mint_${name.toLowerCase()}`);

  console.log(`Creating Alice TokenAccount for ${name}...`);
  //   const aliceTokenAccount = await mint.createAccount(alicePublicKey);
  //   writePublicKey(aliceTokenAccount, `alice_${name.toLowerCase()}`);
  const aliceTokenAccount = await createAssociatedTokenAccount(
    connection,
    clientKeypair,
    mint,
    alicePublicKey
  );
  writePublicKey(aliceTokenAccount, `alice_${name.toLowerCase()}`);

  console.log(`Creating Bob TokenAccount for ${name}...`);
  //   const bobTokenAccount = await mint.createAccount(bobPublicKey);
  const bobTokenAccount = await createAssociatedTokenAccount(
    connection,
    clientKeypair,
    mint,
    bobPublicKey
  );
  writePublicKey(bobTokenAccount, `bob_${name.toLowerCase()}`);

  return [mint, aliceTokenAccount, bobTokenAccount];
};

const setup = async () => {
  const alicePublicKey = getPublicKey("alice");
  const bobPublicKey = getPublicKey("bob");
  const clientKeypair = getKeypair("id");

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  await sleep(5);
  console.log("Requesting SOL for Alice...");
  var signature = await connection.requestAirdrop(
    alicePublicKey,
    LAMPORTS_PER_SOL * 2
  );
  await connection.confirmTransaction(signature);

  await sleep(5);
  console.log("Requesting SOL for Bob...");
  var signature = await connection.requestAirdrop(
    bobPublicKey,
    LAMPORTS_PER_SOL * 2
  );
  await connection.confirmTransaction(signature);

  await sleep(5);
  console.log("Requesting SOL for Client...");
  var signature = await connection.requestAirdrop(
    clientKeypair.publicKey,
    LAMPORTS_PER_SOL * 2
  );
  await connection.confirmTransaction(signature);

  await sleep(2);
  const [mintX, aliceTokenAccountForX, bobTokenAccountForX] = await setupMint(
    "X",
    connection,
    alicePublicKey,
    bobPublicKey,
    clientKeypair
  );
  console.log("Sending 50X to Alice's X TokenAccount...");
  await mintTo(
    connection,
    clientKeypair,
    mintX,
    aliceTokenAccountForX,
    clientKeypair.publicKey,
    50
  );

  await sleep(2);
  const [mintY, aliceTokenAccountForY, bobTokenAccountForY] = await setupMint(
    "Y",
    connection,
    alicePublicKey,
    bobPublicKey,
    clientKeypair
  );
  console.log("Sending 50Y to Bob's Y TokenAccount...");
  await mintTo(
    connection,
    clientKeypair,
    mintY,
    bobTokenAccountForY,
    clientKeypair.publicKey,
    50
  );

  console.log("✨Setup complete✨\n");
  console.table([
    {
      "Alice Token Account X": await getTokenBalance(
        aliceTokenAccountForX,
        connection
      ),
      "Alice Token Account Y": await getTokenBalance(
        aliceTokenAccountForY,
        connection
      ),
      "Bob Token Account X": await getTokenBalance(
        bobTokenAccountForX,
        connection
      ),
      "Bob Token Account Y": await getTokenBalance(
        bobTokenAccountForY,
        connection
      ),
    },
  ]);
  console.log("");
};

setup();

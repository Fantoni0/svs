import * as crypto from "crypto";
import BN from "bn.js";
import bigInt, { BigInteger } from "big-integer";
import * as ethers from "ethers";
import { TextEncoder } from "util";

const SIZE = 32;
const MOD: BigInteger = bigInt(
  "cc20bbe7f3af9c71b5d3bc23203bdb074e849639c74cfd69770153b820d360f82b1577f44a8450118e8d26b552b0c885bf15a15a8f08f6a5cef4eb03fa8acd5cef9e0d2c9ed00f9c9a3278e0f5bddfa0660f7f98e3c35188a22e74feb8af3f649cb4a50e0c4e5cf507582c02c2dee49d289519375f7e2b98c2f3237efbf5c7d6873dd07994416bc310d77aaa036c4932b98355996a0d53f07a84dd1a28e979a3137fd471741447890917b932f744e140a5530c1e74ff0f653cc98868915616d4c12d86ebf59ee77519dd47291512c6ca1bd1b647f6ade2c6b026704bebfa69192bb62806fa7fa4462ef62e39d58dd8aa0122da84644a283c62df748f7b9ffc37",
  16
);
const PK: BigInteger = bigInt("10001", 16);
const PRIV: BigInteger = bigInt(
  "618b64efe729ac8b4415ddca354d95118d4a5b9559b167497e2662b0d2f2dfdc478e5747a4524d06cec591d1452618749d47035788918277e2897442eef764427c78dd17ccfe64ef735a1a1c7a22155a8b5aeda10c7a1a1cbe4f8ff5e7204b9d532b19d2b83bbc3d1518e3d31ff72e6d11670a69451740531c19df04fff747da582a49a410558fe5cf9b55bc6c1c900c89d816745918b78e9da9d4962629e916af957f78028a423558828b67afd57c2be42ac67426091ed98c00257640475a2f3b12db0216fd5ba34012d489f931bc8c88224acf29712d274cd510d202eac6bd0ccb78880e8cbe02c10bb4d468b01513ef14dc4744ba50cdb375b8e8a6ae7949",
  16
);

// Generate random vote
function generateOption(options: string[]): string {
  const id = crypto.randomInt(options.length);
  return options[id];
}

// Generate mask vote
function generateMask() {
  const bytes = crypto.randomBytes(SIZE);
  const mask = bigInt(new BN(bytes).toString());
  return [mask, new Uint8Array(bytes)];
}

// Generate inverse mask
function getInverse(elem: BigInteger) {
  return elem.modInv(MOD);
}

function merge(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}

// Craft Vote
export async function generateRandomBallot(options: string[]) {
  // Get vote
  const vote = generateOption(options);
  return generateBallot(vote);
}

export async function generateBallot(vote: string) {
  // Get vote
  const vote_bytes = new TextEncoder().encode(vote);
  const padded_vote_bytes = merge(
    new Uint8Array(32 - vote_bytes.length),
    vote_bytes
  );
  // Compute mask and inverse
  const [mask, mask_bytes] = generateMask();
  // @ts-ignore
  const inv_mask = getInverse(mask);

  // Compute hash
  // @ts-ignore
  const tmp = merge(padded_vote_bytes, mask_bytes);
  const hash = ethers.utils.keccak256(tmp);

  const choice_hash = merge(
    padded_vote_bytes,
    new Uint8Array(new BN(hash.slice(2), 16).toArray())
  );
  const choice_hash_int = bigInt(new BN(choice_hash).toString()).mod(MOD);

  // @ts-ignore
  const mask_pow_pk = mask.modPow(PK, MOD);
  const ballot = choice_hash_int.multiply(mask_pow_pk).mod(MOD);
  return [ballot, mask, inv_mask, hash, vote];
}

// Signed masked vote
export async function signBallot(ballot: BigInteger) {
  return ballot.modPow(PRIV, MOD);
}

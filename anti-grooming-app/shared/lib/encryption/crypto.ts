import * as sodium from 'libsodium.js';
import { EncryptedMessage } from '../../types';

let sodiumReady = false;

export async function initSodium() {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
}

export function generateKeyPair() {
  const keyPair = sodium.crypto_box_keypair();
  return {
    publicKey: sodium.to_hex(keyPair.publicKey),
    privateKey: sodium.to_hex(keyPair.privateKey),
  };
}

export function generateNonce() {
  return sodium.to_hex(sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES));
}

export async function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderPrivateKey: string
): Promise<EncryptedMessage> {
  await initSodium();

  const publicKeyBytes = sodium.from_hex(recipientPublicKey);
  const privateKeyBytes = sodium.from_hex(senderPrivateKey);
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const messageBytes = sodium.from_string(message);

  const ciphertext = sodium.crypto_box(messageBytes, nonce, publicKeyBytes, privateKeyBytes);

  return {
    ciphertext: sodium.to_hex(ciphertext),
    nonce: sodium.to_hex(nonce),
    publicKey: recipientPublicKey,
  };
}

export async function decryptMessage(
  encrypted: EncryptedMessage,
  senderPublicKey: string,
  recipientPrivateKey: string
): Promise<string> {
  await initSodium();

  const ciphertextBytes = sodium.from_hex(encrypted.ciphertext);
  const nonceBytes = sodium.from_hex(encrypted.nonce);
  const publicKeyBytes = sodium.from_hex(senderPublicKey);
  const privateKeyBytes = sodium.from_hex(recipientPrivateKey);

  const plaintext = sodium.crypto_box_open(
    ciphertextBytes,
    nonceBytes,
    publicKeyBytes,
    privateKeyBytes
  );

  return sodium.to_string(plaintext);
}

export function hashPassword(password: string): string {
  const hash = sodium.crypto_pwhash(
    32,
    sodium.from_string(password),
    sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES),
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_DEFAULT
  );
  return sodium.to_hex(hash);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const hashBytes = sodium.from_hex(hash);
    const passwordBytes = sodium.from_string(password);
    return sodium.crypto_pwhash_str_verify(hashBytes, passwordBytes);
  } catch {
    return false;
  }
}

export function sign(message: string, secretKey: string): string {
  const secretKeyBytes = sodium.from_hex(secretKey);
  const messageBytes = sodium.from_string(message);
  const signature = sodium.crypto_sign(messageBytes, secretKeyBytes);
  return sodium.to_hex(signature);
}

export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  try {
    const publicKeyBytes = sodium.from_hex(publicKey);
    const signatureBytes = sodium.from_hex(signature);
    const messageBytes = sodium.from_string(message);
    sodium.crypto_sign_open(signatureBytes, publicKeyBytes);
    return true;
  } catch {
    return false;
  }
}

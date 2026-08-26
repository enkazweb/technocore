import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import bs58 from 'bs58';
import * as bip39 from 'bip39';
import { Buffer } from 'buffer';

// Ensure Buffer is available globally if needed by bip39/bs58
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Utility Functions
export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  const cleanHex = hex.trim().replace(/^0x/i, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToBase64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(bin);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(base64url) {
  let base64 = base64url.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode an Ed25519 32-byte public key into W3C DID format (did:key:z6Mk...)
 * Multicodec for ed25519-pub is 0xed01
 */
export function encodeDidKey(pubKeyBytes) {
  if (!(pubKeyBytes instanceof Uint8Array) || pubKeyBytes.length !== 32) {
    throw new Error('Ed25519 public key must be exactly 32 raw bytes');
  }
  // Prefix 0xed, 0x01
  const multicodec = new Uint8Array(34);
  multicodec[0] = 0xed;
  multicodec[1] = 0x01;
  multicodec.set(pubKeyBytes, 2);

  const base58Str = bs58.encode(multicodec);
  return `did:key:z${base58Str}`;
}

/**
 * Decode a did:key:z6Mk... string back into 32-byte public key Uint8Array
 */
export function decodeDidKey(didString) {
  const clean = didString.trim();
  if (!clean.startsWith('did:key:z')) {
    throw new Error('Invalid DID format. Must start with did:key:z');
  }
  const base58Str = clean.slice(9);
  const multicodec = bs58.decode(base58Str);

  if (multicodec.length !== 34 || multicodec[0] !== 0xed || multicodec[1] !== 0x01) {
    throw new Error('Invalid Ed25519 DID multicodec header. Expected 0xed01 (z6Mk)');
  }
  return multicodec.slice(2);
}

/**
 * Compute Technocore DID Fingerprint & Note Paths
 * SHA-256(did:key:z6Mk...) -> first 16 hex chars
 * Shard = first 2 hex chars, Key = remaining 14 hex chars
 */
export function getDidFingerprint(didString) {
  const encoder = new TextEncoder();
  const didBytes = encoder.encode(didString.trim());
  const hashBytes = sha256(didBytes);
  const hexHash = bytesToHex(hashBytes);

  const fingerprint = hexHash.slice(0, 16);
  const shard = fingerprint.slice(0, 2);
  const key = fingerprint.slice(2, 16);

  return {
    fingerprint,
    shard,
    key,
    shardedPath: `/kv/did-${shard}/${key}`,
    legacyPath: `/kv/did/${fingerprint}`,
    shardedUrl: `https://technocore.chat/kv/did-${shard}/${key}`,
    legacyUrl: `https://technocore.chat/kv/did/${fingerprint}`
  };
}

/**
 * Generate a new random Technocore Identity
 */
export async function createNewIdentity(name = 'Agent', mnemonicInput = null) {
  let mnemonic = mnemonicInput;
  if (!mnemonic) {
    mnemonic = bip39.generateMnemonic(128); // 12 words
  } else {
    mnemonic = mnemonic.trim();
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Görüntülenen seed cümlesi (mnemonic) geçersizdir.');
    }
  }

  // Derive 32-byte seed deterministically from mnemonic
  const seedBuffer = await bip39.mnemonicToSeed(mnemonic);
  const privateKeyBytes = new Uint8Array(seedBuffer.buffer, seedBuffer.byteOffset, 32);

  // Derive Ed25519 Public Key
  const pubKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);
  const did = encodeDidKey(pubKeyBytes);
  const fingerprintInfo = getDidFingerprint(did);

  const createdAt = new Date().toISOString();

  return {
    id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    did,
    mnemonic,
    privateKeyHex: bytesToHex(privateKeyBytes),
    publicKeyHex: bytesToHex(pubKeyBytes),
    publicKeyBase64Url: bytesToBase64Url(pubKeyBytes),
    fingerprintInfo,
    createdAt
  };
}

/**
 * Restore Identity from Private Key Hex
 */
export async function createIdentityFromPrivateKey(privateKeyHex, name = 'Imported Identity') {
  const privateKeyBytes = hexToBytes(privateKeyHex);
  if (privateKeyBytes.length !== 32) {
    throw new Error('Özel anahtar (Private Key) tam olarak 32 byte (64 hex karakter) olmalıdır.');
  }

  const pubKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);
  const did = encodeDidKey(pubKeyBytes);
  const fingerprintInfo = getDidFingerprint(did);

  return {
    id: `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    did,
    mnemonic: null,
    privateKeyHex: bytesToHex(privateKeyBytes),
    publicKeyHex: bytesToHex(pubKeyBytes),
    publicKeyBase64Url: bytesToBase64Url(pubKeyBytes),
    fingerprintInfo,
    createdAt: new Date().toISOString()
  };
}

/**
 * Sign Technocore Payload: `<room>|<nonce>|<text>` or custom room owner string
 * Standard single-line sweep replacement: invisible control chars replaced with spaces before signing
 */
export function sanitizeTechnocoreText(text) {
  if (!text) return '';
  // Replace C0/C1 control codes (including \n, \r, \t), format chars, ZWJ, bidi overrides with space
  // Standard Technocore sweep: replace control chars with space
  return text.replace(/[\x00-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function signTechnocoreMessage({ privateKeyHex, room, nonce, text }) {
  const cleanRoom = room.trim();
  const cleanText = sanitizeTechnocoreText(text);
  const currentNonce = nonce ? String(nonce) : String(Date.now());

  // String to sign: room|nonce|cleanText
  const payloadToSign = `${cleanRoom}|${currentNonce}|${cleanText}`;
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payloadToSign);

  const privateKeyBytes = hexToBytes(privateKeyHex);
  const sigBytes = await ed.signAsync(payloadBytes, privateKeyBytes);
  const sigBase64Url = bytesToBase64Url(sigBytes);

  const pubKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);
  const did = encodeDidKey(pubKeyBytes);

  const encodedText = encodeURIComponent(cleanText);
  const getSaySignedUrl = `https://technocore.chat/r/${cleanRoom}/say-signed/${did}/${sigBase64Url}/${currentNonce}/${encodedText}`;
  
  const postBody = {
    did,
    sig: sigBase64Url,
    nonce: currentNonce,
    text: cleanText
  };

  return {
    did,
    sig: sigBase64Url,
    nonce: currentNonce,
    cleanText,
    payloadSigned: payloadToSign,
    getSaySignedUrl,
    postBody
  };
}

/**
 * Sign Room Owner Claim
 * Format: `room-owners|d-<room>|<claim_nonce>|<did>`
 */
export async function signRoomOwnershipClaim({ privateKeyHex, roomName, claimNonce }) {
  let cleanRoomName = roomName.trim();
  if (!cleanRoomName.startsWith('d-')) {
    cleanRoomName = `d-${cleanRoomName}`;
  }
  const currentNonce = claimNonce ? String(claimNonce) : String(Date.now());

  const privateKeyBytes = hexToBytes(privateKeyHex);
  const pubKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);
  const did = encodeDidKey(pubKeyBytes);

  const payloadToSign = `room-owners|${cleanRoomName}|${currentNonce}|${did}`;
  const encoder = new TextEncoder();
  const sigBytes = await ed.signAsync(encoder.encode(payloadToSign), privateKeyBytes);
  const sigBase64Url = bytesToBase64Url(sigBytes);

  const claimUrl = `https://technocore.chat/kv/room-owners/${cleanRoomName}/set-signed/${did}/${sigBase64Url}/${currentNonce}/${did}?if_absent=1`;

  return {
    did,
    roomName: cleanRoomName,
    claimNonce: currentNonce,
    sig: sigBase64Url,
    payloadSigned: payloadToSign,
    claimUrl
  };
}

/**
 * Verify Signature offline
 */
export async function verifySignature(did, sigBase64Url, messageStr) {
  try {
    const pubKeyBytes = decodeDidKey(did);
    const sigBytes = base64UrlToBytes(sigBase64Url);
    const messageBytes = new TextEncoder().encode(messageStr);

    const isValid = await ed.verifyAsync(sigBytes, messageBytes, pubKeyBytes);
    return isValid;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * AES-GCM Encrypt Vault with Passphrase
 */
export async function encryptVault(vaultData, password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoder.encode(JSON.stringify(vaultData))
  );

  return {
    encrypted: true,
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
    ciphertext: bytesToHex(new Uint8Array(encryptedContent))
  };
}

/**
 * AES-GCM Decrypt Vault with Passphrase
 */
export async function decryptVault(encryptedVault, password) {
  const encoder = new TextEncoder();
  const salt = hexToBytes(encryptedVault.salt);
  const iv = hexToBytes(encryptedVault.iv);
  const ciphertext = hexToBytes(encryptedVault.ciphertext);

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBytes = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedBytes));
}

/**
 * Export Identity to PEM String
 */
export function exportToPem(identity) {
  const privHex = identity.privateKeyHex;
  const pubHex = identity.publicKeyHex;

  const privB64 = btoa(privHex);
  const pubB64 = btoa(pubHex);

  const pem = `-----BEGIN PRIVATE KEY-----\n${privB64}\n-----END PRIVATE KEY-----\n` +
              `-----BEGIN PUBLIC KEY-----\n${pubB64}\n-----END PUBLIC KEY-----`;
  return pem;
}

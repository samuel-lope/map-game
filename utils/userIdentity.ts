
// Secret key for HMAC-like signing (simulation)
const SECRET_KEY = "HEX_INFINITE_SECRET_V1";

/**
 * Generates a simple hash signature for a string using the secret key.
 * Returns a 4-character alphanumeric string.
 */
function generateSignature(payload: string): string {
    let h1 = 0xdeadbeef;
    const str = payload + SECRET_KEY;
    for (let i = 0; i < str.length; i++) {
        h1 = Math.imul(h1 ^ str.charCodeAt(i), 2654435761);
    }
    // Convert to base36 and slice
    const hash = ((h1 ^ h1 >>> 16) >>> 0).toString(36);
    return hash.slice(-4).padStart(4, 'x').toUpperCase();
}

/**
 * Generates a new User Code.
 * Format: XXXX-XXXX-XXXX-YYYY (16 chars)
 * Logic: Timestamp (Base36) + Random + Signature
 */
export function generateUserCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase(); // Approx 8 chars
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 chars
    
    // Construct Payload (12 chars)
    // Ensure we have exactly 12 chars for the payload part
    let payload = (timestamp + randomPart).replace(/[^0-9A-Z]/g, '');
    while (payload.length < 12) {
        payload += Math.random().toString(36).substring(2, 3).toUpperCase();
    }
    payload = payload.slice(0, 12);

    // Calculate Signature (4 chars)
    const signature = generateSignature(payload);

    // Format: PPPP-PPPP-PPPP-SSSS
    const p1 = payload.slice(0, 4);
    const p2 = payload.slice(4, 8);
    const p3 = payload.slice(8, 12);
    
    return `${p1}-${p2}-${p3}-${signature}`;
}

/**
 * Validates a User Code.
 * Checks format and recalculates signature.
 */
export function validateUserCode(code: string): boolean {
    if (!code) return false;
    
    // Check format (16 alphanumeric chars, separated by dashes)
    const cleanCode = code.replace(/-/g, '').toUpperCase();
    if (cleanCode.length !== 16) return false;
    if (!/^[0-9A-Z]+$/.test(cleanCode)) return false;

    const payload = cleanCode.slice(0, 12);
    const providedSignature = cleanCode.slice(12, 16);

    const calculatedSignature = generateSignature(payload);

    return providedSignature === calculatedSignature;
}

/**
 * Formats a raw input string into XXXX-XXXX-XXXX-XXXX
 */
export function formatUserCodeInput(input: string): string {
    const raw = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
        parts.push(raw.slice(i, i + 4));
    }
    return parts.join('-');
}

const SECRET_SALT = 'PHARMA_QC_2024_SECURE';

/**
 * Encrypts a date into a license string
 */
const generateLicenseKey = (dateStr) => {
    const expiryDate = new Date(dateStr);
    if (isNaN(expiryDate.getTime())) {
        console.error("Invalid Date Format. Use YYYY-MM-DD");
        return;
    }

    const timestamp = expiryDate.getTime().toString();
    const raw = `${timestamp}:${SECRET_SALT}`;

    // Custom obfuscation: Base64 -> Reverse -> Base64
    const b64 = Buffer.from(raw).toString('base64');
    const reversed = b64.split('').reverse().join('');
    const finalKey = Buffer.from(reversed).toString('base64');

    console.log("\n========================================================");
    console.log("   PHARMA-QMS ENTERPRISE - MASTER KEY GENERATOR");
    console.log("========================================================");
    console.log(`EXPIRY DATE  : ${expiryDate.toDateString()}`);
    console.log(`LICENSE KEY  : ${finalKey}`);
    console.log("========================================================\n");
    console.log("Instruction: Copy this key and provide it to the client.");
};

// Get argument from command line
const dateArg = process.argv[2];

if (!dateArg) {
    console.log("Usage: node MasterKeyGen.js YYYY-MM-DD");
    console.log("Example: node MasterKeyGen.js 2026-12-31");
} else {
    generateLicenseKey(dateArg);
}

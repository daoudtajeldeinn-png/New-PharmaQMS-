<<<<<<< HEAD
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
=======
const SECRET_SALT = 'PHARMA_QC_2024_SECURE';

/**
 * Encrypts a date and machine ID into a license string
 */
const generateLicenseKey = (dateStr, machineId) => {
    const expiryDate = new Date(dateStr);
    if (isNaN(expiryDate.getTime())) {
        console.error("Invalid Date Format. Use YYYY-MM-DD");
        return;
    }

    if (!machineId) {
        console.error("Machine ID is required.");
        return;
    }

    const timestamp = expiryDate.getTime().toString();
    // New format: MACHINE_ID:TIMESTAMP:SALT
    const raw = `${machineId}:${timestamp}:${SECRET_SALT}`;

    // Custom obfuscation: Base64 -> Reverse
    const b64 = Buffer.from(raw).toString('base64');
    const reversed = b64.split('').reverse().join('');

    // Final key is now HEX for case-insensitivity
    const finalKeyHex = Buffer.from(reversed).toString('hex').toUpperCase();

    // Format with dashes for better readability (e.g. XXXX-XXXX-XXXX-XXXX)
    const formattedKey = finalKeyHex.match(/.{1,4}/g).join('-');

    console.log("\n========================================================");
    console.log("   PHARMA-QMS ENTERPRISE - MASTER KEY GENERATOR");
    console.log("========================================================");
    console.log(`MACHINE ID   : ${machineId}`);
    console.log(`EXPIRY DATE  : ${expiryDate.toDateString()}`);
    console.log(`LICENSE KEY  : ${formattedKey}`);
    console.log("========================================================\n");
    console.log("Instruction: Copy this key and provide it to the client.");
};

// Get arguments from command line
const dateArg = process.argv[2];
const machineIdArg = process.argv[3];

if (!dateArg || !machineIdArg) {
    console.log("Usage: node MasterKeyGen.js YYYY-MM-DD MACHINE_ID");
    console.log("Example: node MasterKeyGen.js 2026-12-31 ABC-123-XYZ");
} else {
    generateLicenseKey(dateArg, machineIdArg);
}
>>>>>>> 4b457b580535ff0446e3ed8b58f98bb5145c0804

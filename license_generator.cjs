/**
 * PharmaQMS Enterprise - مولد مفاتيح التفعيل التفاعلي
 * --------------------------------------------------
 * هذا البرنامج مخصص لك (د. داود) فقط لتوليد مفاتيح للعملاء.
 */

const readline = require('readline');
const SECRET_SALT = 'PHARMA_QC_2024_SECURE';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function generateLicenseKey(machineId, days) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const timestamp = expiryDate.getTime().toString();
    const raw = `${machineId}:${timestamp}:${SECRET_SALT}`;

    const b64 = Buffer.from(raw).toString('base64');
    const reversed = b64.split('').reverse().join('');
    return Buffer.from(reversed).toString('base64');
}

console.log('\n======================================');
console.log('   PHARMA-QMS LICENSE GENERATOR');
console.log('======================================\n');

rl.question('1. أدخل بصمة جهاز العميل (Machine ID): ', (machineId) => {
    if (!machineId.trim()) {
        console.log('خطأ: يجب إدخال بصمة الجهاز.');
        rl.close();
        return;
    }

    rl.question('2. أدخل مدة التفعيل بالأيام (مثلاً 365 لسنة): ', (days) => {
        const validity = parseInt(days);
        if (isNaN(validity) || validity <= 0) {
            console.log('خطأ: يرجى إدخال رقم صحيح للأيام.');
            rl.close();
            return;
        }

        const key = generateLicenseKey(machineId.trim(), validity);
        const expiry = new Date(Date.now() + validity * 86400000);

        console.log('\n--------------------------------------');
        console.log('تم توليد مفتاح التفعيل بنجاح:');
        console.log('--------------------------------------');
        console.log(`بصمة الجهاز: ${machineId.trim()}`);
        console.log(`صالح لمدة:   ${validity} يوم`);
        console.log(`تاريخ الانتهاء: ${expiry.toLocaleDateString()}`);
        console.log('--------------------------------------');
        console.log('مفتاح التفعيل (انسخ هذا الكود للعميل):');
        console.log('\x1b[32m%s\x1b[0m', key); // Green color for the key
        console.log('--------------------------------------\n');

        rl.close();
    });
});

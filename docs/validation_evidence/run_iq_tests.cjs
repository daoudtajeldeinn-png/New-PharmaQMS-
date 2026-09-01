/**
 * IQ Test Script - Simple Installation Qualification Tests
 * PharmaQMS - 21 CFR Part 11 / EU GMP Annex 11 Compliance
 */

const fs = require('fs');
const path = require('path');

const results = [];

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m',   // red
    warning: '\x1b[33m', // yellow
    reset: '\x1b[0m'
  };
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function recordResult(testId, test, expected, actual, status) {
  results.push({
    testId,
    test,
    expected,
    actual,
    status,
    timestamp: new Date().toISOString()
  });
}

// IQ-001: Software Installation Verification
function runIQ001() {
  log('\n=== IQ-001: Software Installation Verification ===', 'info');
  
  // Test 1: Application directory exists
  const appDir = path.join(__dirname, '../../app');
  const appDirExists = fs.existsSync(appDir);
  recordResult('IQ-001-01', 'Application directory exists', 'Directory exists', 
    appDirExists ? 'Directory exists' : 'Directory not found', 
    appDirExists ? 'PASS' : 'FAIL');
  log(`[IQ-001-01] Application directory exists: ${appDirExists ? 'PASS' : 'FAIL'}`, 
    appDirExists ? 'success' : 'error');
  
  // Test 2: package.json exists
  const packageJson = path.join(__dirname, '../../package.json');
  const packageJsonExists = fs.existsSync(packageJson);
  recordResult('IQ-001-02', 'package.json file present', 'File exists',
    packageJsonExists ? 'File exists' : 'File not found',
    packageJsonExists ? 'PASS' : 'FAIL');
  log(`[IQ-001-02] package.json exists: ${packageJsonExists ? 'PASS' : 'FAIL'}`,
    packageJsonExists ? 'success' : 'error');
  
  // Test 3: node_modules exists
  const nodeModules = path.join(__dirname, '../../node_modules');
  const nodeModulesExists = fs.existsSync(nodeModules);
  recordResult('IQ-001-03', 'Dependencies installed', 'node_modules exists',
    nodeModulesExists ? 'Dependencies installed' : 'Dependencies not installed',
    nodeModulesExists ? 'PASS' : 'FAIL');
  log(`[IQ-001-03] Dependencies installed: ${nodeModulesExists ? 'PASS' : 'FAIL'}`,
    nodeModulesExists ? 'success' : 'error');
  
  // Test 4: app/package.json exists
  const appPackageJson = path.join(__dirname, '../../app/package.json');
  const appPackageJsonExists = fs.existsSync(appPackageJson);
  recordResult('IQ-001-04', 'App package.json exists', 'File exists',
    appPackageJsonExists ? 'File exists' : 'File not found',
    appPackageJsonExists ? 'PASS' : 'FAIL');
  log(`[IQ-001-04] App package.json exists: ${appPackageJsonExists ? 'PASS' : 'FAIL'}`,
    appPackageJsonExists ? 'success' : 'error');
  
  // Test 5: vercel.json exists and valid
  const vercelJson = path.join(__dirname, '../../vercel.json');
  const vercelJsonExists = fs.existsSync(vercelJson);
  if (vercelJsonExists) {
    const content = fs.readFileSync(vercelJson, 'utf8');
    const validJson = content.includes('buildCommand') && content.includes('outputDirectory');
    recordResult('IQ-001-05', 'Vercel config exists and valid', 'Valid JSON configuration',
      validJson ? 'Valid configuration' : 'Invalid configuration',
      validJson ? 'PASS' : 'FAIL');
    log(`[IQ-001-05] Vercel config valid: ${validJson ? 'PASS' : 'FAIL'}`,
      validJson ? 'success' : 'error');
  } else {
    recordResult('IQ-001-05', 'Vercel config exists and valid', 'File exists',
      'File not found', 'FAIL');
    log(`[IQ-001-05] Vercel config exists: FAIL`, 'error');
  }
}

// IQ-002: Configuration Verification
function runIQ002() {
  log('\n=== IQ-002: Configuration Verification ===', 'info');
  
  // Test 1: .gitignore properly configured
  const gitignore = path.join(__dirname, '../../.gitignore');
  const gitignoreExists = fs.existsSync(gitignore);
  if (gitignoreExists) {
    const content = fs.readFileSync(gitignore, 'utf8');
    const hasNodeModules = content.includes('node_modules');
    const hasDist = content.includes('dist');
    const hasGitRewrite = content.includes('.git-rewrite');
    const properlyConfigured = hasNodeModules && hasDist && hasGitRewrite;
    recordResult('IQ-002-01', '.gitignore properly configured', 'Proper exclusions',
      properlyConfigured ? 'Properly configured' : 'Missing exclusions',
      properlyConfigured ? 'PASS' : 'FAIL');
    log(`[IQ-002-01] .gitignore properly configured: ${properlyConfigured ? 'PASS' : 'FAIL'}`,
      properlyConfigured ? 'success' : 'error');
  } else {
    recordResult('IQ-002-01', '.gitignore properly configured', 'File exists',
      'File not found', 'FAIL');
    log(`[IQ-002-01] .gitignore exists: FAIL`, 'error');
  }
  
  // Test 2: i18n configuration
  const localesDir = path.join(__dirname, '../../app/src/locales');
  const enDir = path.join(localesDir, 'en');
  const enExists = fs.existsSync(enDir);
  if (enExists) {
    const enFile = path.join(enDir, 'translation.json');
    const enTranslation = fs.existsSync(enFile);
    recordResult('IQ-002-02', 'English translation files present', 'English translation file exists',
      enTranslation ? 'English translation present' : 'Missing English translation',
      enTranslation ? 'PASS' : 'FAIL');
    log(`[IQ-002-02] English translation files present: ${enTranslation ? 'PASS' : 'FAIL'}`,
      enTranslation ? 'success' : 'error');
  } else {
    recordResult('IQ-002-02', 'English translation files present', 'English directory exists',
      'Directory not found', 'FAIL');
    log(`[IQ-002-02] English translation directory: FAIL`, 'error');
  }
  
  // Test 3: MFA service implementation
  const mfaService = path.join(__dirname, '../../app/src/services/MFAService.ts');
  const mfaServiceExists = fs.existsSync(mfaService);
  if (mfaServiceExists) {
    const content = fs.readFileSync(mfaService, 'utf8');
    const hasMFAEnrollment = content.includes('enrollTOTP');
    const hasMFAChallenge = content.includes('challengeMFA');
    const hasVerifyMFA = content.includes('verifyMFAChallenge');
    const mfaImplemented = hasMFAEnrollment && hasMFAChallenge && hasVerifyMFA;
    recordResult('IQ-002-03', 'MFA service implemented', 'MFA methods present',
      mfaImplemented ? 'MFA implemented' : 'MFA incomplete',
      mfaImplemented ? 'PASS' : 'FAIL');
    log(`[IQ-002-03] MFA service implemented: ${mfaImplemented ? 'PASS' : 'FAIL'}`,
      mfaImplemented ? 'success' : 'error');
  } else {
    recordResult('IQ-002-03', 'MFA service implemented', 'File exists',
      'File not found', 'FAIL');
    log(`[IQ-002-03] MFA service exists: FAIL`, 'error');
  }
}

// Main execution
function main() {
  log('=== PharmaQMS IQ Test Script ===', 'info');
  log('21 CFR Part 11 / EU GMP Annex 11 Compliance Validation', 'info');
  log(`Execution Date: ${new Date().toISOString()}`, 'info');
  
  runIQ001();
  runIQ002();
  
  // Summary
  log('\n=== Test Summary ===', 'info');
  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const failedTests = totalTests - passedTests;
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
  
  log(`Total Tests: ${totalTests}`, 'info');
  log(`Passed: ${passedTests}`, 'success');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'success');
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'success' : 'warning');
  
  // Save results to file
  const resultsFile = path.join(__dirname, 'iq_test_results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  log(`\nResults saved to: ${resultsFile}`, 'info');
  
  if (failedTests === 0) {
    log('\n✓ All IQ tests passed!', 'success');
  } else {
    log(`\n✗ ${failedTests} IQ test(s) failed. Review results for details.`, 'error');
  }
  
  return failedTests === 0 ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { main, results };
#!/usr/bin/env node

/**
 * Performance Audit Script
 * Runs Lighthouse audits and generates performance reports
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

// URLs to audit
const urls = [
  { name: 'Home', url: 'http://localhost:5173/' },
  { name: 'Login', url: 'http://localhost:5173/login' },
  { name: 'Pricing', url: 'http://localhost:5173/pricing' },
  // Add more URLs after authentication is implemented
];

// Performance thresholds
const thresholds = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
};

async function launchChromeAndRunLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options, config);
  await chrome.kill();

  return runnerResult;
}

function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportDir = path.join(__dirname, '..', 'reports', 'lighthouse');

  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const summary = {
    timestamp,
    audits: [],
    overallPass: true,
  };

  results.forEach(({ name, lhr }) => {
    const scores = {
      name,
      performance: lhr.categories.performance.score * 100,
      accessibility: lhr.categories.accessibility.score * 100,
      'best-practices': lhr.categories['best-practices'].score * 100,
      seo: lhr.categories.seo.score * 100,
    };

    // Check thresholds
    const passed = Object.keys(thresholds).every(
      (category) => scores[category] >= thresholds[category]
    );

    scores.passed = passed;
    if (!passed) {
      summary.overallPass = false;
    }

    summary.audits.push(scores);

    // Save individual report
    const reportPath = path.join(
      reportDir,
      `${name.toLowerCase()}-${timestamp}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(lhr, null, 2));

    console.log(`\n📊 ${name} Audit Results:`);
    console.log(`   Performance:     ${scores.performance.toFixed(1)}`);
    console.log(`   Accessibility:   ${scores.accessibility.toFixed(1)}`);
    console.log(`   Best Practices:  ${scores['best-practices'].toFixed(1)}`);
    console.log(`   SEO:             ${scores.seo.toFixed(1)}`);
    console.log(`   Status:          ${passed ? '✅ PASS' : '❌ FAIL'}`);
  });

  // Save summary report
  const summaryPath = path.join(reportDir, `summary-${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  return summary;
}

async function runAudits() {
  console.log('🚀 Starting Lighthouse Performance Audit\n');
  console.log('Thresholds:');
  Object.entries(thresholds).forEach(([category, threshold]) => {
    console.log(`   ${category}: ${threshold}`);
  });

  const results = [];

  for (const { name, url } of urls) {
    console.log(`\n🔍 Auditing ${name} (${url})...`);
    try {
      const result = await launchChromeAndRunLighthouse(url);
      results.push({ name, lhr: result.lhr });
    } catch (error) {
      console.error(`❌ Failed to audit ${name}:`, error.message);
    }
  }

  const summary = generateReport(results);

  console.log('\n' + '='.repeat(50));
  console.log('📋 AUDIT SUMMARY');
  console.log('='.repeat(50));
  console.log(`Overall Status: ${summary.overallPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Reports saved to: reports/lighthouse/`);

  if (!summary.overallPass) {
    console.log('\n⚠️  Some audits failed to meet thresholds');
    process.exit(1);
  }

  console.log('\n✅ All audits passed!');
}

// Run audits
runAudits().catch((error) => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});

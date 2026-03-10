#!/usr/bin/env node
/**
 * Dyversify QuantLab Dashboard Auditor
 *
 * Programmatic lint scanner for index.html that checks for:
 * 1. Division by zero without guards
 * 2. .toFixed() / .toLocaleString() on potentially NaN values
 * 3. Unguarded store.get() calls
 * 4. .time property access without || '' fallback
 * 5. Date format inconsistency (dots vs dashes)
 * 6. textContent assignments that could display NaN/undefined
 * 7. new Chart() without prior .destroy()
 * 8. Math.min/Math.max on potentially empty arrays
 * 9. Array[0] access without length check
 * 10. parseFloat/parseInt without NaN guard
 *
 * Usage: node audit_scanner.js <path-to-index.html>
 * Returns: JSON report of findings
 */

const fs = require('fs');

const filePath = process.argv[2] || 'index.html';
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');

// Extract JS from script tags
const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
if (!scriptMatch) {
  console.log('No script blocks found');
  process.exit(0);
}

const jsBlocks = scriptMatch.map(block => block.replace(/<\/?script[^>]*>/gi, ''));
const fullJS = jsBlocks.join('\n');
const lines = fullJS.split('\n');

const findings = [];

function addFinding(lineNum, category, severity, message, code) {
  findings.push({ line: lineNum + 1, category, severity, message, code: code.trim().substring(0, 120) });
}

// Get surrounding context (5 lines above)
function getContext(lineIdx, count = 5) {
  const start = Math.max(0, lineIdx - count);
  return lines.slice(start, lineIdx + 1).join('\n');
}

// Check if a variable has a guard in nearby context
function hasGuard(lineIdx, varName, guardPatterns) {
  const ctx = getContext(lineIdx, 8);
  return guardPatterns.some(p => ctx.includes(p));
}

console.log(`Scanning ${lines.length} lines of JS...\n`);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Skip comments
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

  // ─── RULE 1: Division without zero-check ───
  // Look for "/ variable" patterns — exclude regex, string methods, DOM APIs, comments
  if (!trimmed.match(/\/[^\/]*\/[gimsuy]/) && !trimmed.includes('.replace(') && !trimmed.includes('replace(/') &&
      !trimmed.includes('parseFromString') && !trimmed.includes("'text/") && !trimmed.includes('"text/') &&
      !trimmed.includes('Math.ceil(') && !trimmed.includes('Math.floor(') && !trimmed.includes('Math.round(') &&
      !trimmed.includes('JSON.') && !trimmed.includes('Blob(') && !trimmed.includes('stringify') &&
      !trimmed.includes("'application/") && !trimmed.includes('onclick=') && !trimmed.includes('\\\'')) {
    // Match pattern: something ) / var  OR  something_var / var
    const divMatch = trimmed.match(/[)\w]\s*\/\s*([a-zA-Z_]\w*(?:\.\w+)*)\b/);
    if (divMatch && !trimmed.includes('//') && !trimmed.includes("/'")) {
      const divisor = divMatch[1].trim();
      // Skip: number literals, known-safe patterns, string operations
      if (!divisor.match(/^\d+$/) &&
          !['range', 'count', 'CHUNK', 'binSize', 'segments'].includes(divisor) &&
          !divisor.startsWith('Math.') &&
          !trimmed.includes('|| 1') && !trimmed.includes('|| 0') &&
          !trimmed.includes("'text") && !trimmed.includes('"text') &&
          !hasGuard(i, divisor, [
            `${divisor} > 0`, `${divisor} !== 0`, `${divisor} != 0`,
            `${divisor} === 0`, `${divisor} <= 0`, `${divisor} > 1`,
            `${divisor} < `, `Math.max(1`, `Math.max( 1`, `|| 1`,
            `.length > 0`, `.length > 1`, `.length >= 2`, `.length < 2`,
            `if (${divisor})`, `${divisor} &&`
          ])) {
        addFinding(i, 'DIVISION_BY_ZERO', 'HIGH', `Division by '${divisor}' without zero-check in nearby context`, trimmed);
      }
    }
  }

  // ─── RULE 2: .toFixed() on potentially unguarded value ───
  if (trimmed.includes('.toFixed(') && !trimmed.includes('// safe')) {
    // Check if the value being formatted could come from a division
    const ctx = getContext(i, 3);
    if (ctx.includes('/ ') || ctx.includes('NaN') || ctx.includes('avg(') || ctx.includes('med(') || ctx.includes('Math.')) {
      if (!ctx.includes('isFinite') && !ctx.includes('isNaN') && !ctx.includes('|| 0') && !ctx.includes('?? 0') &&
          !ctx.includes('> 0 ?') && !ctx.includes('length > 0')) {
        addFinding(i, 'TOFIX_NAN_RISK', 'MEDIUM', '.toFixed() on value that may be NaN (from division/math upstream)', trimmed);
      }
    }
  }

  // ─── RULE 3: store.get() without null check ───
  const storeGetMatch = trimmed.match(/store\.get\(([^)]+)\)/);
  if (storeGetMatch) {
    const ctx5 = lines.slice(Math.max(0, i - 2), Math.min(i + 6, lines.length)).join('\n');
    if (!ctx5.includes('if (!') && !ctx5.includes('if (r)') && !ctx5.includes('? ') &&
        !ctx5.includes('return r ?') && !ctx5.includes('.filter(Boolean)') &&
        !trimmed.includes('||') && !ctx5.includes('store.has(') && !ctx5.includes('r &&') &&
        !ctx5.includes('r ?')) {
      addFinding(i, 'UNGUARDED_STORE_GET', 'HIGH', `store.get() without null check within 5 lines`, trimmed);
    }
  }

  // ─── RULE 4: .time access without || '' fallback ───
  if (trimmed.match(/\.time\s*\.\s*(split|substring|replace|slice|match|indexOf)/) &&
      !trimmed.includes("|| ''") && !trimmed.includes('|| ""') && !trimmed.includes('?.') &&
      !getContext(i, 2).includes('if (') && !getContext(i, 2).includes('.time)')) {
    addFinding(i, 'UNGUARDED_TIME_ACCESS', 'MEDIUM', '.time property accessed without null fallback (|| "")', trimmed);
  }

  // ─── RULE 5: Date format — .split(' ')[0] without .replace(/\\./g, '-') ───
  // Skip: chart labels (const labels = ...) and display-only strings (curveStart/curveEnd)
  if (trimmed.includes(".split(' ')[0]") || trimmed.includes('.split(" ")[0]')) {
    if (!trimmed.includes(".replace(/\\./g, '-')") && !trimmed.includes('.replace(/\\./g,') &&
        (trimmed.includes('.time') || trimmed.includes('time ||')) &&
        !trimmed.startsWith('const labels') && !trimmed.includes('curveStart') && !trimmed.includes('curveEnd') &&
        !trimmed.includes('curveRng')) {
      // Check if the result is used as a map key (not just display)
      const nextLines = lines.slice(i, Math.min(i + 3, lines.length)).join('\n');
      const isMapKey = nextLines.includes('[d]') || nextLines.includes('dateMap') || nextLines.includes('.add(') ||
                       nextLines.includes('dateDD') || nextLines.includes('Map') || nextLines.includes('allDates') ||
                       nextLines.includes('ddByDate');
      if (isMapKey) {
        addFinding(i, 'DATE_FORMAT_INCONSISTENCY', 'MEDIUM', 'Date used as MAP KEY via .split(" ")[0] without .replace(/\\./g, "-") normalization', trimmed);
      }
    }
  }

  // ─── RULE 6: .substring(0, 7) without date normalization ───
  if (trimmed.includes('.substring(0, 7)') && !trimmed.includes('.replace(')) {
    const ctx = getContext(i, 2);
    if (ctx.includes('.time') || ctx.includes('month') || ctx.includes('date')) {
      addFinding(i, 'DATE_FORMAT_INCONSISTENCY', 'MEDIUM', '.substring(0,7) extracts YYYY.MM without normalizing dots to dashes', trimmed);
    }
  }

  // ─── RULE 7: textContent = with potential NaN/undefined ───
  if (trimmed.includes('textContent =') || trimmed.includes('textContent=')) {
    // Skip: toLocaleString(undefined,...) is a valid locale param, not a bug
    const hasRealNaN = (trimmed.includes('NaN') && !trimmed.includes('isNaN')) ||
                       (trimmed.includes('undefined') && !trimmed.includes('toLocaleString(undefined')) ||
                       (trimmed.includes('Infinity') && !trimmed.includes('isFinite'));
    if (hasRealNaN) {
      addFinding(i, 'NAN_DISPLAY', 'HIGH', 'textContent assignment contains literal NaN/undefined/Infinity reference', trimmed);
    }
    // Check for unguarded division in the assignment
    const assignMatch = trimmed.match(/textContent\s*=\s*(.+)/);
    if (assignMatch && assignMatch[1].includes('/') && !assignMatch[1].includes('//')) {
      if (!getContext(i, 5).includes('> 0') && !getContext(i, 5).includes('isFinite')) {
        addFinding(i, 'NAN_DISPLAY', 'MEDIUM', 'textContent assignment contains division — verify denominator is guarded', trimmed);
      }
    }
  }

  // ─── RULE 8: new Chart() without destroy ───
  if (trimmed.includes('new Chart(')) {
    const ctx = getContext(i, 20);
    if (!ctx.includes('.destroy()') && !ctx.includes('.destroy();')) {
      addFinding(i, 'CHART_LEAK', 'MEDIUM', 'new Chart() created without .destroy() on previous instance in preceding 20 lines', trimmed);
    }
  }

  // ─── RULE 9: Math.min/Math.max spread on potentially empty array ───
  if (trimmed.match(/Math\.(min|max)\(\.\.\./)) {
    const ctx = getContext(i, 5);
    if (!ctx.includes('.length') && !ctx.includes('isFinite') && !ctx.includes('.filter(')) {
      addFinding(i, 'EMPTY_ARRAY_MATH', 'MEDIUM', 'Math.min/max with spread on array without length/empty check', trimmed);
    }
  }

  // ─── RULE 10: Array[0] access without length check ───
  if (trimmed.match(/\w+\[0\]\.\w+/) && !trimmed.includes('//')) {
    const ctx = getContext(i, 5);
    if (!ctx.includes('.length') && !ctx.includes('< 2') && !ctx.includes('=== 0') && !ctx.includes('> 0')) {
      // Only flag if it looks like a dynamic array (not a known constant)
      const arrMatch = trimmed.match(/(\w+)\[0\]/);
      if (arrMatch && !['arguments', 'match', 'exec', 'split'].some(s => ctx.includes(s + '('))) {
        addFinding(i, 'UNGUARDED_ARRAY_ACCESS', 'LOW', `${arrMatch[1]}[0] accessed without length check`, trimmed);
      }
    }
  }

  // ─── RULE 11: parseFloat/parseInt without || 0 or isNaN guard ───
  if (trimmed.match(/parseFloat\(|parseInt\(/) && !trimmed.includes('|| 0') && !trimmed.includes('?? 0') && !trimmed.includes('isNaN')) {
    const nextLine = lines[i + 1] || '';
    if (!nextLine.includes('isNaN') && !nextLine.includes('|| 0')) {
      addFinding(i, 'PARSE_NAN_RISK', 'LOW', 'parseFloat/parseInt without NaN fallback (|| 0)', trimmed);
    }
  }
}

// ─── OUTPUT REPORT ───
const highCount = findings.filter(f => f.severity === 'HIGH').length;
const medCount = findings.filter(f => f.severity === 'MEDIUM').length;
const lowCount = findings.filter(f => f.severity === 'LOW').length;

console.log(`═══════════════════════════════════════════════`);
console.log(`  DYVERSIFY QUANTLAB AUDIT REPORT`);
console.log(`  Scanned: ${lines.length} lines`);
console.log(`  Findings: ${findings.length} total`);
console.log(`  HIGH: ${highCount} | MEDIUM: ${medCount} | LOW: ${lowCount}`);
console.log(`═══════════════════════════════════════════════\n`);

if (findings.length === 0) {
  console.log('✅ CLEAN — No issues found!\n');
} else {
  // Group by category
  const byCategory = {};
  for (const f of findings) {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f);
  }

  for (const [cat, items] of Object.entries(byCategory)) {
    console.log(`── ${cat} (${items.length}) ──`);
    for (const f of items) {
      const severity = f.severity === 'HIGH' ? '🔴' : f.severity === 'MEDIUM' ? '🟡' : '🔵';
      console.log(`  ${severity} Line ${f.line}: ${f.message}`);
      console.log(`     ${f.code}`);
    }
    console.log('');
  }
}

// Write JSON report
const report = {
  timestamp: new Date().toISOString(),
  file: filePath,
  linesScanned: lines.length,
  summary: { total: findings.length, high: highCount, medium: medCount, low: lowCount },
  findings
};

const reportPath = filePath.replace(/\.html$/, '') + '_audit_report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`Report saved to: ${reportPath}`);

// Exit with error code if HIGH findings exist
process.exit(highCount > 0 ? 1 : 0);

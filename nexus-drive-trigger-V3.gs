/**
 * ═══════════════════════════════════════════════════════════════
 * DIVERSIFY QUANTLAB — GOOGLE DRIVE AUTO-INGEST ENGINE V3
 * ═══════════════════════════════════════════════════════════════
 *
 * Monitors your Google Drive folder for new MT5 backtest HTML
 * reports. When a file is added, it automatically parses it and
 * writes extracted metrics + balance curve to a Google Sheet.
 * The dashboard reads from this sheet via the web app endpoint.
 *
 * TWO TRIGGER MODES:
 *   1. Drive onChange trigger — fires whenever ANY file changes
 *      in your Drive (fastest, event-driven)
 *   2. Time-based fallback — runs every 1 minute as safety net
 *
 * ═══════════════════════════════════════════════════════════════
 *
 * SETUP (do these steps in order):
 *
 *   1. Go to https://script.google.com → New Project
 *   2. Paste this entire file into Code.gs
 *   3. Update ROOT_FOLDER_ID below to YOUR folder ID
 *      (the folder ID is the last part of the folder URL:
 *       https://drive.google.com/drive/folders/XXXXX ← this part)
 *   4. Click Run → select "setup" → Run
 *   5. Authorize ALL permissions when prompted
 *   6. Go to Deploy → New Deployment
 *   7. Type: Web App
 *   8. Execute as: Me
 *   9. Who has access: Anyone
 *  10. Click Deploy → copy the URL
 *  11. Paste that URL into the dashboard's DRIVE_SYNC.WEB_APP_URL
 *
 * TO REPROCESS ALL FILES:
 *   Run the "reprocessAll" function from the editor
 *
 * ═══════════════════════════════════════════════════════════════
 */

// ─── CONFIGURATION ───
const CONFIG = {
  // YOUR FOLDER ID — change this to your backtest results folder
  ROOT_FOLDER_ID: '10eNtl3pDDWcpxUV27VxG9XmIcCNdfUpS',

  // Sheet name (auto-created if it doesn't exist)
  SHEET_NAME: 'QuantLab Backtest Results',

  // Internal tracking key
  PROCESSED_KEY: 'quantlab_processed_files',

  // Fallback check interval (minutes)
  FALLBACK_INTERVAL: 1,

  // Max balance curve data points to store per report
  MAX_CURVE_POINTS: 300,

  // Max cell JSON string length (Google Sheets limit ~50000, use safe margin)
  MAX_CELL_CHARS: 40000,
};

// Column headers — V3 includes Balance Curve
const HEADERS = [
  'Timestamp', 'Filename', 'Symbol', 'Expert', 'Period',
  'Net Profit', 'Profit Factor', 'Sharpe Ratio', 'Recovery Factor',
  'Max DD%', 'Win Rate%', 'Total Trades', 'Expected Payoff',
  'Gross Profit', 'Gross Loss', 'Avg Profit Trade', 'Avg Loss Trade',
  'LR Correlation', 'Avg Hold Time', 'Initial Deposit', 'Leverage',
  'Short Trades', 'Long Trades', 'Inputs JSON', 'Label',
  'Source Folder', 'File ID', 'Balance Curve'
];


// ═══════════════════════════════════════════════════════════════
// SETUP — Run this once from the Apps Script editor
// ═══════════════════════════════════════════════════════════════

function setup() {
  // Remove ALL existing triggers from this project
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('Cleared existing triggers');

  // Time-based trigger — every 1 minute to scan for new files
  ScriptApp.newTrigger('checkForNewFiles')
    .timeBased()
    .everyMinutes(CONFIG.FALLBACK_INTERVAL)
    .create();
  Logger.log('Created time-based trigger (every ' + CONFIG.FALLBACK_INTERVAL + ' min)');

  // 3. Initialize the sheet
  const sheet = getOrCreateSheet();
  Logger.log('Sheet ready');
  showSheetUrl();

  // 4. Do an initial full scan
  checkForNewFiles();
  Logger.log('Setup complete. Reports will auto-ingest on file drop.');
}


// ═══════════════════════════════════════════════════════════════
// TRIGGER HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * Legacy handler — kept for compatibility but no longer triggered.
 */
function onDriveChange(e) {
  try {
    checkForNewFiles();
  } catch (err) {
    Logger.log('onDriveChange error: ' + err.message);
  }
}

/**
 * Main scanner: finds new HTML files in the folder tree,
 * parses them, and writes to the Sheet.
 */
function checkForNewFiles() {
  const lock = LockService.getScriptLock();
  // Prevent concurrent runs (Drive triggers can fire rapidly)
  if (!lock.tryLock(5000)) {
    Logger.log('Another scan is running, skipping');
    return;
  }

  try {
    const processed = getProcessedFiles();
    const rootFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
    const newFiles = [];

    scanFolder(rootFolder, newFiles, processed);

    if (newFiles.length === 0) {
      // Even if no new files, clean up deleted ones periodically
      cleanupDeletedFiles();
      return;
    }

    Logger.log('Found ' + newFiles.length + ' new file(s)');
    const sheet = getOrCreateSheet();

    for (const file of newFiles) {
      try {
        // Read file content, handling UTF-16 encoding (common in MT5 reports)
        var content = readFileContent(file);
        const report = parseMT5Report(content, file.getName());

        if (report) {
          appendToSheet(sheet, report, file);
          markProcessed(file.getId());
          Logger.log('Parsed: ' + report.symbol + ' — P&L: ' + report.netProfit + ' — Curve pts: ' + (report.balanceCurve ? report.balanceCurve.length : 0));
        } else {
          // Not a valid MT5 report — mark processed to skip next time
          markProcessed(file.getId());
          Logger.log('Skipped (not MT5): ' + file.getName());
        }
      } catch (err) {
        Logger.log('Failed: ' + file.getName() + ' — ' + err.message);
      }
    }

    // Clean up rows for deleted/trashed files
    cleanupDeletedFiles();
  } finally {
    lock.releaseLock();
  }
}


// ═══════════════════════════════════════════════════════════════
// FOLDER SCANNER
// ═══════════════════════════════════════════════════════════════

function scanFolder(folder, results, processed) {
  // Get all files in this folder
  const allFiles = folder.getFiles();
  while (allFiles.hasNext()) {
    const file = allFiles.next();
    const name = file.getName().toLowerCase();
    const isHtml = name.endsWith('.html') || name.endsWith('.htm');
    const isMime = file.getMimeType() === MimeType.HTML || file.getMimeType() === 'text/html';

    if ((isHtml || isMime) && !processed.has(file.getId())) {
      results.push(file);
    }
  }

  // Recurse into subfolders
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    scanFolder(subfolders.next(), results, processed);
  }
}



// ═══════════════════════════════════════════════════════════════
// UTF-16 FILE READER — MT5 exports are often UTF-16LE encoded
// ═══════════════════════════════════════════════════════════════

function readFileContent(file) {
  var blob = file.getBlob();
  var bytes = blob.getBytes();

  // Check for UTF-16 BOM (FF FE = UTF-16LE, FE FF = UTF-16BE)
  if (bytes.length >= 2) {
    var b0 = bytes[0] & 0xFF;
    var b1 = bytes[1] & 0xFF;

    if (b0 === 0xFF && b1 === 0xFE) {
      // UTF-16LE: strip null bytes (every other byte is 0x00 for ASCII range)
      Logger.log('Detected UTF-16LE encoding for: ' + file.getName());
      var chars = [];
      for (var i = 2; i < bytes.length; i += 2) {
        var lo = bytes[i] & 0xFF;
        var hi = (i + 1 < bytes.length) ? (bytes[i + 1] & 0xFF) : 0;
        if (hi === 0) {
          chars.push(String.fromCharCode(lo));
        } else {
          chars.push(String.fromCharCode(lo | (hi << 8)));
        }
      }
      return chars.join('');
    }

    if (b0 === 0xFE && b1 === 0xFF) {
      // UTF-16BE
      Logger.log('Detected UTF-16BE encoding for: ' + file.getName());
      var chars = [];
      for (var i = 2; i < bytes.length; i += 2) {
        var hi = bytes[i] & 0xFF;
        var lo = (i + 1 < bytes.length) ? (bytes[i + 1] & 0xFF) : 0;
        chars.push(String.fromCharCode((hi << 8) | lo));
      }
      return chars.join('');
    }
  }

  // Default: UTF-8
  return blob.getDataAsString('UTF-8');
}

// ═══════════════════════════════════════════════════════════════
// MT5 REPORT PARSER
// ═══════════════════════════════════════════════════════════════

function parseMT5Report(html, filename) {
  const getVal = (label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Try multiple patterns — MT5 reports vary in format
    const patterns = [
      // Pattern 1: label in one td, value in next td (with or without <b>)
      new RegExp('<td[^>]*>[^<]*' + escaped + '[^<]*</td>\\s*<td[^>]*>(?:<b>)?([^<]+)(?:</b>)?', 'gi'),
      // Pattern 2: label and value in same row with class
      new RegExp(escaped + '\\s*(?:</td>\\s*<td[^>]*>|:\\s*</td>\\s*<td[^>]*>)\\s*(?:<b>)?([^<]+)', 'gi'),
      // Pattern 3: simple colon-separated
      new RegExp(escaped + '\\s*([\\d.,\\-+%() ]+)', 'gi'),
    ];

    for (const regex of patterns) {
      const m = regex.exec(html);
      if (m && m[1] && m[1].trim()) return m[1].trim();
    }
    return '';
  };

  const num = (s) => {
    if (!s) return 0;
    return parseFloat(s.replace(/\s/g, '').replace(/[()%]/g, '')) || 0;
  };

  const pctMatch = (s) => {
    const m = (s || '').match(/([\d.]+)\s*%/);
    return m ? parseFloat(m[1]) : 0;
  };

  const symbol = getVal('Symbol:') || getVal('Symbol');
  const expert = getVal('Expert:') || getVal('Expert');

  // Validate this is actually an MT5 report
  if (!symbol && !expert) {
    // Last resort: check for MT5-specific strings
    if (html.indexOf('Strategy Tester') === -1 && html.indexOf('MetaTrader') === -1) {
      return null;
    }
  }

  const report = {
    filename: filename,
    symbol: symbol,
    expert: expert,
    period: getVal('Period:') || getVal('Period'),
    currency: getVal('Currency:') || getVal('Currency'),
    initialDeposit: num(getVal('Initial Deposit:') || getVal('Initial deposit:')),
    leverage: getVal('Leverage:') || getVal('Leverage'),
    netProfit: num(getVal('Total Net Profit:') || getVal('Net Profit:')),
    grossProfit: num(getVal('Gross Profit:')),
    grossLoss: num(getVal('Gross Loss:')),
    profitFactor: num(getVal('Profit Factor:')),
    expectedPayoff: num(getVal('Expected Payoff:')),
    recoveryFactor: num(getVal('Recovery Factor:')),
    sharpeRatio: num(getVal('Sharpe Ratio:')),
    totalTrades: num(getVal('Total Trades:')),
    balanceDDMax: getVal('Balance Drawdown Maximal:'),
    equityDDMax: getVal('Equity Drawdown Maximal:'),
    profitTrades: getVal('Profit Trades (% of total):') || getVal('Profit Trades'),
    lossTrades: getVal('Loss Trades (% of total):') || getVal('Loss Trades'),
    shortTrades: getVal('Short Trades (won %):') || getVal('Short Trades'),
    longTrades: getVal('Long Trades (won %):') || getVal('Long Trades'),
    avgProfitTrade: num(getVal('Average profit trade:') || getVal('Largest profit trade:')),
    avgLossTrade: num(getVal('Average loss trade:') || getVal('Largest loss trade:')),
    lrCorrelation: num(getVal('LR Correlation:')),
    avgHoldTime: getVal('Average position holding time:') || getVal('Average holding time:'),
  };

  // Derived metrics
  report.maxDDPct = pctMatch(report.equityDDMax || report.balanceDDMax);
  report.winRate = pctMatch(report.profitTrades);

  // Extract optimizer inputs (key=value pairs in <b> tags)
  const inputs = {};
  const inputRegex = /<b>(\w+)=([^<]*)<\/b>/g;
  let match;
  while ((match = inputRegex.exec(html)) !== null) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (!key.startsWith('_') && key.length < 50) {
      inputs[key] = val;
    }
  }
  report.inputs = JSON.stringify(inputs);

  // Extract balance curve from deals table
  report.balanceCurve = parseBalanceCurve(html);

  return report;
}


// ═══════════════════════════════════════════════════════════════
// BALANCE CURVE PARSER — Extracts equity data from deals table
// ═══════════════════════════════════════════════════════════════

function parseBalanceCurve(html) {
  var curve = [];

  // Find all table rows
  var trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  var tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  var inDeals = false;
  var trMatch;

  while ((trMatch = trRegex.exec(html)) !== null) {
    var rowContent = trMatch[1];
    var tds = [];
    var tdMatch;

    // Reset tdRegex for each row
    tdRegex.lastIndex = 0;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      // Strip inner HTML tags, keep text content
      tds.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }

    if (tds.length >= 12) {
      // Check if this is the deals header row
      if (tds[0] === 'Time' && tds[1] === 'Deal') {
        inDeals = true;
        continue;
      }

      // Parse deal data rows
      if (inDeals && tds[0] && tds[1]) {
        var time = tds[0];
        var balanceStr = tds[11] || '';
        var profitStr = tds[10] || '';
        var balance = parseFloat(balanceStr.replace(/\s/g, '')) || 0;
        var profit = parseFloat(profitStr.replace(/\s/g, '')) || 0;

        if (balance > 0) {
          // Compact format: [time, balance, profit]
          curve.push([time, Math.round(balance * 100) / 100, Math.round(profit * 100) / 100]);
        }
      }
    } else if (inDeals && tds.length > 0 && tds.length < 10) {
      // We've left the deals table
      break;
    }
  }

  // Downsample if too many points (keep first, last, and evenly spaced samples)
  if (curve.length > CONFIG.MAX_CURVE_POINTS) {
    var step = Math.ceil(curve.length / CONFIG.MAX_CURVE_POINTS);
    var sampled = [curve[0]]; // Always keep first
    for (var i = step; i < curve.length - 1; i += step) {
      sampled.push(curve[i]);
    }
    sampled.push(curve[curve.length - 1]); // Always keep last
    curve = sampled;
  }

  Logger.log('Balance curve: ' + curve.length + ' data points extracted');
  return curve;
}


// ═══════════════════════════════════════════════════════════════
// GOOGLE SHEET MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function getOrCreateSheet() {
  const props = PropertiesService.getScriptProperties();
  let sheetId = props.getProperty('quantlab_sheet_id');
  var ss, sheet;

  if (sheetId) {
    try {
      ss = SpreadsheetApp.openById(sheetId);
      sheet = ss.getActiveSheet();

      // Check if headers need updating (V3 adds Balance Curve column)
      var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (currentHeaders.indexOf('Balance Curve') === -1) {
        // Add the new column header
        var newCol = currentHeaders.length + 1;
        sheet.getRange(1, newCol).setValue('Balance Curve');
        sheet.getRange(1, newCol).setFontWeight('bold');
        Logger.log('Added Balance Curve column to existing sheet');
      }

      return sheet;
    } catch (e) {
      // Sheet was deleted — create a new one
    }
  }

  // Create new spreadsheet
  ss = SpreadsheetApp.create(CONFIG.SHEET_NAME);
  var sheet = ss.getActiveSheet();

  // Move to the backtest folder
  try {
    const file = DriveApp.getFileById(ss.getId());
    const folder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  } catch (e) {
    Logger.log('Could not move sheet to folder: ' + e.message);
  }

  // Set headers
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  props.setProperty('quantlab_sheet_id', ss.getId());
  Logger.log('Created sheet: ' + ss.getUrl());

  return sheet;
}

function appendToSheet(sheet, report, file) {
  const parentFolder = file.getParents().hasNext()
    ? file.getParents().next().getName() : 'Root';

  // Serialize balance curve as compact JSON (with cell size safety)
  var curveJson = '';
  try {
    if (report.balanceCurve && report.balanceCurve.length > 0) {
      curveJson = JSON.stringify(report.balanceCurve);
      // If JSON exceeds safe cell limit, further downsample
      while (curveJson.length > CONFIG.MAX_CELL_CHARS && report.balanceCurve.length > 50) {
        var step = 2;
        var sampled = [report.balanceCurve[0]];
        for (var si = step; si < report.balanceCurve.length - 1; si += step) {
          sampled.push(report.balanceCurve[si]);
        }
        sampled.push(report.balanceCurve[report.balanceCurve.length - 1]);
        report.balanceCurve = sampled;
        curveJson = JSON.stringify(report.balanceCurve);
        Logger.log('Downsampled curve to ' + sampled.length + ' pts (' + curveJson.length + ' chars)');
      }
    }
  } catch (e) {
    Logger.log('Could not serialize balance curve: ' + e.message);
  }

  sheet.appendRow([
    new Date().toISOString(),
    report.filename,
    report.symbol,
    report.expert,
    report.period,
    report.netProfit,
    report.profitFactor,
    report.sharpeRatio,
    report.recoveryFactor,
    report.maxDDPct,
    report.winRate,
    report.totalTrades,
    report.expectedPayoff,
    report.grossProfit,
    report.grossLoss,
    report.avgProfitTrade,
    report.avgLossTrade,
    report.lrCorrelation,
    report.avgHoldTime,
    report.initialDeposit,
    report.leverage,
    report.shortTrades,
    report.longTrades,
    report.inputs,
    '', // Label
    parentFolder,
    file.getId(),
    curveJson, // Balance Curve JSON
  ]);
}


// ═══════════════════════════════════════════════════════════════
// CLEANUP — Remove rows for files that no longer exist in Drive
// ═══════════════════════════════════════════════════════════════

function cleanupDeletedFiles() {
  try {
    var sheet = getOrCreateSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;

    var headers = data[0];
    var fileIdCol = headers.indexOf('File ID');
    if (fileIdCol === -1) return;

    // Build set of ALL file IDs currently in the monitored folder tree
    var currentFileIds = new Set();
    function collectFileIds(folder) {
      var files = folder.getFiles();
      while (files.hasNext()) currentFileIds.add(files.next().getId());
      var subs = folder.getFolders();
      while (subs.hasNext()) collectFileIds(subs.next());
    }
    try {
      collectFileIds(DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID));
    } catch (e) {
      Logger.log('Cleanup: cannot read root folder — ' + e.message);
      return;
    }

    var rowsToDelete = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var fileId = data[i][fileIdCol];
      if (!fileId) continue;
      // Remove row if file is no longer in the monitored folder tree
      if (!currentFileIds.has(fileId)) {
        rowsToDelete.push(i + 1); // Sheet rows are 1-indexed
      } else {
        // Also remove if file is trashed
        try {
          if (DriveApp.getFileById(fileId).isTrashed()) {
            rowsToDelete.push(i + 1);
          }
        } catch (e) {
          rowsToDelete.push(i + 1);
        }
      }
    }

    // Delete bottom-up to preserve row indices
    for (var d = 0; d < rowsToDelete.length; d++) {
      sheet.deleteRow(rowsToDelete[d]);
    }

    if (rowsToDelete.length > 0) {
      // Also clean processed tracking so files can be re-added if moved back
      var processed = getProcessedFiles();
      for (var d = 0; d < rowsToDelete.length; d++) {
        var removedFileId = data[rowsToDelete[d] - 1][fileIdCol];
        processed.delete(removedFileId);
      }
      PropertiesService.getScriptProperties()
        .setProperty(CONFIG.PROCESSED_KEY, JSON.stringify([...processed].slice(-10000)));
      Logger.log('Cleanup: removed ' + rowsToDelete.length + ' rows for deleted/moved/trashed files');
    }
  } catch (e) {
    Logger.log('Cleanup error: ' + e.message);
  }
}


// ═══════════════════════════════════════════════════════════════
// PROCESSED FILE TRACKING
// ═══════════════════════════════════════════════════════════════

function getProcessedFiles() {
  const props = PropertiesService.getScriptProperties();
  const data = props.getProperty(CONFIG.PROCESSED_KEY);
  return new Set(data ? JSON.parse(data) : []);
}

function markProcessed(fileId) {
  const processed = getProcessedFiles();
  processed.add(fileId);
  const arr = [...processed].slice(-10000);
  PropertiesService.getScriptProperties()
    .setProperty(CONFIG.PROCESSED_KEY, JSON.stringify(arr));
}


// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Reset and reprocess everything from scratch.
 * Run this if reports are missing from the sheet.
 */
function reprocessAll() {
  // Clear processed files tracking
  PropertiesService.getScriptProperties().deleteProperty(CONFIG.PROCESSED_KEY);

  // Clear existing sheet data (keep header row)
  var sheet = getOrCreateSheet();
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  // Ensure headers are up to date (V3 format)
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');

  Logger.log('Cleared processed list and sheet data. Running full scan...');
  checkForNewFiles();
}

/**
 * Show the Google Sheet URL in the log
 */
function showSheetUrl() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('quantlab_sheet_id');
  if (sheetId) {
    Logger.log('Sheet URL: https://docs.google.com/spreadsheets/d/' + sheetId);
  } else {
    Logger.log('No sheet yet. Run setup() first.');
  }
}

/**
 * Check trigger status
 */
function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(triggers.length + ' trigger(s) active:');
  triggers.forEach(t => {
    Logger.log('  - ' + t.getHandlerFunction() + ' (' + t.getEventType() + ')');
  });
}


// ═══════════════════════════════════════════════════════════════
// WEB APP ENDPOINT — Dashboard reads from this
// ═══════════════════════════════════════════════════════════════

/**
 * Deploy as: Web App → Execute as: Me → Access: Anyone
 * The dashboard fetches this URL to get all report data.
 */
function doGet(e) {
  var output;
  var params = e ? e.parameter : {};

  try {
    // Action: reconcile — force cleanup of deleted/moved files, then return fresh data
    if (params.action === 'reconcile') {
      cleanupDeletedFiles();
      // Fall through to default data return
    }

    // Action: getHtml — return raw HTML content of a Drive file (for client-side parsing)
    if (params.action === 'getHtml' && params.fileId) {
      var file = DriveApp.getFileById(params.fileId);
      var html = readFileContent(file);
      // Return as JSONP-safe wrapped text to avoid CORS issues
      output = JSON.stringify({
        status: 'ok',
        html: html,
        filename: file.getName()
      });
      return ContentService.createTextOutput(output)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Default: return all report data from sheet
    var sheet = getOrCreateSheet();
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      output = JSON.stringify({
        data: [],
        headers: data[0] || [],
        count: 0,
        status: 'ok',
        message: 'Sheet exists but no reports yet'
      });
    } else {
      var headers = data[0];
      var rows = [];
      for (var i = 1; i < data.length; i++) {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = data[i][j];
        }
        rows.push(obj);
      }

      output = JSON.stringify({
        data: rows,
        headers: headers,
        count: rows.length,
        status: 'ok',
        lastCheck: new Date().toISOString()
      });
    }
  } catch (err) {
    output = JSON.stringify({
      error: err.message,
      data: [],
      status: 'error'
    });
  }

  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}


// ═══════════════════════════════════════════════════════════════
// DIAGNOSTIC — Run this to debug balance curve parsing
// ═══════════════════════════════════════════════════════════════

function debugBalanceCurve() {
  var rootFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  var files = [];

  function scan(folder) {
    var it = folder.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      if (f.getName().toLowerCase().endsWith('.html')) {
        files.push(f);
      }
    }
    var subs = folder.getFolders();
    while (subs.hasNext()) scan(subs.next());
  }
  scan(rootFolder);

  if (files.length === 0) {
    Logger.log('No HTML files found!');
    return;
  }

  var file = files[0];
  Logger.log('=== DEBUGGING: ' + file.getName() + ' ===');

  var content = readFileContent(file);
  Logger.log('Content length: ' + content.length);

  // Check for Deals header
  var dealsIdx = content.indexOf('>Time<');
  Logger.log('">Time<" found at index: ' + dealsIdx);

  var dealsIdx2 = content.indexOf('>Deal<');
  Logger.log('">Deal<" found at index: ' + dealsIdx2);

  // Show a snippet around the Deals header
  if (dealsIdx > 0) {
    var start = Math.max(0, dealsIdx - 100);
    var end = Math.min(content.length, dealsIdx + 500);
    Logger.log('SNIPPET around Time header:\n' + content.substring(start, end));
  }

  // Count tr tags
  var trCount = (content.match(/<tr/gi) || []).length;
  Logger.log('Total <tr> tags: ' + trCount);

  // Count td tags
  var tdCount = (content.match(/<td/gi) || []).length;
  Logger.log('Total <td> tags: ' + tdCount);

  // Try the parser
  var curve = parseBalanceCurve(content);
  Logger.log('Balance curve points: ' + curve.length);
  if (curve.length > 0) {
    Logger.log('First point: ' + JSON.stringify(curve[0]));
    Logger.log('Last point: ' + JSON.stringify(curve[curve.length - 1]));
  }

  // Also check: does the regex even find any 12+ td rows?
  var trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  var tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  var rowsWith12 = 0;
  var totalRows = 0;
  var maxTds = 0;
  var trMatch;
  while ((trMatch = trRegex.exec(content)) !== null) {
    totalRows++;
    var rowContent = trMatch[1];
    var tds = [];
    tdRegex.lastIndex = 0;
    var tdMatch;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      tds.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
    }
    if (tds.length >= 12) rowsWith12++;
    if (tds.length > maxTds) maxTds = tds.length;
  }
  Logger.log('Total rows matched by regex: ' + totalRows);
  Logger.log('Rows with 12+ tds: ' + rowsWith12);
  Logger.log('Max tds in any row: ' + maxTds);
}

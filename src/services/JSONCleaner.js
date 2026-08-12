/**
 * JSONCleaner
 * ------------------------------------------------------------------
 * Sits between the raw scraper export and the AI/database stage.
 *
 * Responsibilities (see project spec for full rules):
 *   1. Strip known noise fields (html, scripts, styles, commerce, faq, etc).
 *   2. Remove pager tables and duplicate copies of the same listing table.
 *   3. Remove blob/navigation rows that are extraction failures.
 *   4. Deterministically reconstruct real tender records from the
 *      Column_* / mega-blob rows and the detail-page label:value rows —
 *      ONLY when the pattern validates. Any record that doesn't validate
 *      is discarded individually; nothing is inferred or invented.
 *   5. Deduplicate tenders and correlate listing records with detail
 *      pages (when a match already exists in the data) to attach
 *      detailUrl / documents.
 *
 * This module does NOT re-scrape, does NOT touch the crawler/browser
 * automation, and does NOT guess at missing fields. It only reshapes
 * data that already exists in the extraction output.
 * ------------------------------------------------------------------
 */

// ---- Known-good enums / patterns, derived from the actual source data ----
// (extend this list if the site introduces new values — never guess new
// ones into a specific record)
const KNOWN_TYPES = new Set(["Goods", "Services", "Work"]);
const KNOWN_CATEGORIES = new Set([
  "Tender Notice",
  "Corrigendum",
  "Quotations",
  "Sales/Auction/Disposal"
]);
const DATE_PATTERN = /^\d{2}\s+[A-Za-z]{3}\s+\d{4}$/;

// Fields to strip wholesale, expressed as dot-paths relative to a page object.
const PAGE_FIELD_REMOVALS = [
  "html",
  "strategy",
  "resources.scripts",
  "resources.styles",
  "analysis.commerce",
  "company",
  "faq",
  "grid",
  "commerce",
  "metadata.openGraph",
  "metadata.twitter",
  "text.paragraphs",
  "text.headings"
];

// The 9 listing-table headers, in source order. Only the first 6 ever carry
// recoverable plain text in the broken Column_* extraction (Status, Tender
// Notice link text, and Bidding Document link text render with no captured
// text on this site).
const LISTING_HEADERS = [
  "Procurement Title",
  "Procurement Name",
  "Type",
  "Publish Date",
  "Close Date",
  "Department",
  "Status",
  "Tender Notice",
  "Bidding Document"
];
const RECORD_FIELDS = [
  "procurementTitle",
  "procurementName",
  "type",
  "publishDate",
  "closeDate",
  "department"
];

// Labels used in the detail-page "Label: Value Label: Value..." blob key,
// in the order they appear on the source site.
const DETAIL_LABELS = [
  "Procurement Title",
  "Procurement Name",
  "Type",
  "Publish Date",
  "Close Date",
  "Department",
  "Tender Notice",
  "Bidding Document"
];

const MEGA_BLOB_MIN_LENGTH = 500; // keys/values longer than this are page-dump noise, not field data
const NAV_TEXT_MARKERS = ["Home | Public Procurement", "Page size:", "items in"];

function getPath(obj, dotPath) {
  return dotPath.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

function deletePath(obj, dotPath) {
  const parts = dotPath.split(".");
  const last = parts.pop();
  const parent = parts.reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
  if (parent && typeof parent === "object") {
    delete parent[last];
  }
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/** Recursively remove empty arrays/objects/nulls left behind by other cleaning steps. */
function pruneEmpty(obj) {
  if (Array.isArray(obj)) {
    return obj
      .map(pruneEmpty)
      .filter((v) => !isEmptyValue(v));
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const pruned = pruneEmpty(v);
      if (!isEmptyValue(pruned)) {
        out[k] = pruned;
      }
    }
    return out;
  }
  return obj;
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Best-effort date normalization: "06 Aug 2026" -> "2026-08-06". Leaves value unchanged if not parseable. */
function normalizeDate(value) {
  if (!DATE_PATTERN.test(value)) return value;
  const parsed = new Date(`${value} UTC`);
  if (Number.isNaN(parsed.getTime())) return value;
  const yyyy = parsed.getUTCFullYear();
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dedupeKey(record) {
  return [
    normalizeKey(record.procurementName),
    record.publishDate,
    normalizeKey(record.department)
  ].join("|");
}

class JSONCleaner {
  constructor({ logger, ...config } = {}) {
    this.logger = logger || console;
    this.config = { ...config };
    this._resetReport();
  }

  _resetReport() {
    this.report = {
      rawTables: 0,
      rawRows: 0,
      tablesRemoved: 0,
      duplicatesRemoved: 0,
      emptyRowsRemoved: 0,
      invalidRecordsRemoved: 0,
      finalRecords: 0,
      efficiency: "0%",
      errorCount: 0
    };
  }

  getReport() {
    return this.report;
  }

  /**
   * @param {object} extractionData - raw scraper output, shape { pages: [...], summary: {...} }
   * @returns {object} cleaned, AI-ready JSON
   */
  clean(extractionData = {}) {
    this._resetReport();
    const errors = [];
    const pages = Array.isArray(extractionData.pages) ? extractionData.pages : [];

    // Pass 1: parse every page into { pageMeta, tenders[] }, independently.
    const perPageResults = pages.map((page) => {
      try {
        return this._cleanPage(page);
      } catch (err) {
        errors.push({ page: page?.url || "unknown", message: err.message });
        this.report.errorCount += 1;
        return { pageMeta: this._basicPageMeta(page), tenders: [] };
      }
    });

    // Pass 2: correlate listing-derived tenders with detail-page tenders,
    // then dedupe globally.
    const allTenders = this._correlateAndDedupe(perPageResults);

    this.report.finalRecords = allTenders.length;
    this.report.efficiency =
      this.report.rawRows > 0
        ? `${((this.report.finalRecords / this.report.rawRows) * 100).toFixed(1)}%`
        : "0%";

    const cleaned = {
      metadata: {
        ...(extractionData.metadata || {}),
        cleanerVersion: "3.0.0",
        processedAt: new Date().toISOString(),
        statistics: this.report
      },
      errors,
      tenders: pruneEmpty(allTenders)
    };

    return cleaned;
  }

  _basicPageMeta(page) {
    return {
      pageUrl: page?.url || page?.metadata?.url || null,
      pageTitle: page?.text?.title || page?.metadata?.title || null,
      pageType: page?.analysis?.pageType === "tender" ? "detail" : "listing"
    };
  }

  _cleanPage(page) {
    const pageMeta = this._basicPageMeta(page);

    // Strip known-noise fields from the page (mutating a shallow concern —
    // we only read page.tables / page.resources below, so this is safe and
    // keeps the method focused on the tender-extraction responsibility).
    for (const p of PAGE_FIELD_REMOVALS) {
      if (getPath(page, p) !== undefined) deletePath(page, p);
    }

    const rawTables = page?.tables?.tables || [];
    this.report.rawTables += rawTables.length;
    this.report.rawRows += rawTables.reduce((sum, t) => sum + (t.totalRows || 0), 0);

    const documents = this._cleanDocuments(page);

    let tenders = [];
    if (pageMeta.pageType === "detail") {
      tenders = this._extractDetailTenders(rawTables, pageMeta, documents);
    } else {
      tenders = this._extractListingTenders(rawTables, pageMeta);
    }

    return { pageMeta, tenders };
  }

  /** resources.pdfs and resources.downloads are identical in the source data — collapse to one list. */
  _cleanDocuments(page) {
    const pdfs = page?.resources?.pdfs || [];
    const downloads = page?.resources?.downloads || [];
    const merged = new Set([...pdfs, ...downloads]);
    return Array.from(merged);
  }

  // ---------------- Listing pages ----------------

  _extractListingTenders(rawTables, pageMeta) {
    const candidateTables = rawTables.filter((t) => !this._isPagerTable(t));
    this.report.tablesRemoved += rawTables.length - candidateTables.length;

    if (candidateTables.length === 0) return [];

    // Sort largest-first: primary source is the fullest capture.
    const sorted = [...candidateTables].sort((a, b) => (b.totalRows || 0) - (a.totalRows || 0));
    const [primary, ...rest] = sorted;
    this.report.tablesRemoved += rest.length; // rest are duplicate copies of the same table

    const seen = new Map(); // dedupeKey -> record
    const primaryRecords = this._parseListingTable(primary, pageMeta);
    for (const rec of primaryRecords) {
      seen.set(dedupeKey(rec), rec);
    }

    // Recover records that exist ONLY in a duplicate table (never merge
    // wholesale — only fill gaps, verified by the dedupe key).
    for (const table of rest) {
      const records = this._parseListingTable(table, pageMeta);
      for (const rec of records) {
        const key = dedupeKey(rec);
        if (!seen.has(key)) {
          seen.set(key, rec);
        } else {
          this.report.duplicatesRemoved += 1;
        }
      }
    }

    return Array.from(seen.values());
  }

  _isPagerTable(table) {
    if ((table.headers || []).length > 0) return false;
    const text = JSON.stringify(table.rows || []);
    return NAV_TEXT_MARKERS.some((marker) => text.includes(marker));
  }

  _parseListingTable(table, pageMeta) {
    const records = [];
    for (const row of table.rows || []) {
      if (this._isBlobOrNavRow(row)) {
        this.report.emptyRowsRemoved += 1;
        continue;
      }
      const found = this._reconstructRecordsFromRow(row);
      for (const rec of found.valid) {
        records.push({
          ...rec,
          pageUrl: pageMeta.pageUrl,
          pageTitle: pageMeta.pageTitle,
          detailUrl: null,
          documents: []
        });
      }
      this.report.invalidRecordsRemoved += found.invalidCount;
    }
    return records;
  }

  _isBlobOrNavRow(row) {
    const values = Object.entries(row)
      .filter(([k]) => !k.startsWith("_"))
      .map(([, v]) => v);
    if (values.length === 0) return true;
    // Whole-row nav dump (any single value contains the nav marker text).
    if (values.some((v) => typeof v === "string" && NAV_TEXT_MARKERS.some((m) => v.includes(m)) && v.length < MEGA_BLOB_MIN_LENGTH)) {
      return true;
    }
    return false;
  }

  /**
   * Walks a row's Column_* / header-keyed values, sorted by their positional
   * index, in fixed non-overlapping windows of 6 (matching the known
   * [title, name, type, publishDate, closeDate, department] cycle observed
   * in the source data). Each window is validated independently; only
   * windows that pass validation become records.
   */
  _reconstructRecordsFromRow(row) {
    const indexed = [];
    let seq = 0;
    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith("_")) continue;
      if (typeof value !== "string") continue;
      if (value.length >= MEGA_BLOB_MIN_LENGTH) continue; // the full-page dump key — never a field value

      const colMatch = key.match(/^Column_(\d+)$/);
      let index;
      if (colMatch) {
        index = parseInt(colMatch[1], 10);
      } else {
        const headerPos = LISTING_HEADERS.indexOf(key);
        // Known header key used as-is: give it a low, stable sort position
        // so it's evaluated (and, expectedly, rejected by validation) first
        // rather than silently dropped.
        index = headerPos >= 0 ? headerPos : 100000 + seq;
      }
      indexed.push({ index, value });
      seq += 1;
    }

    indexed.sort((a, b) => a.index - b.index);

    const valid = [];
    let invalidCount = 0;
    for (let i = 0; i + RECORD_FIELDS.length <= indexed.length; i += RECORD_FIELDS.length) {
      const window = indexed.slice(i, i + RECORD_FIELDS.length).map((e) => e.value);
      const record = this._validateWindow(window);
      if (record) {
        valid.push(record);
      } else {
        invalidCount += 1;
      }
    }

    return { valid, invalidCount };
  }

  _validateWindow([procurementTitle, procurementName, type, publishDate, closeDate, department]) {
    if (!KNOWN_CATEGORIES.has(procurementTitle)) return null;
    if (!KNOWN_TYPES.has(type)) return null;
    if (!DATE_PATTERN.test(publishDate) || !DATE_PATTERN.test(closeDate)) return null;
    if (!procurementName || procurementName.length < 3) return null;
    if (!department || department.length < 2) return null;

    return {
      procurementTitle,
      procurementName: procurementName.trim(),
      type,
      publishDate: normalizeDate(publishDate),
      closeDate: normalizeDate(closeDate),
      department: department.trim(),
      status: null
    };
  }

  // ---------------- Detail pages ----------------

  _extractDetailTenders(rawTables, pageMeta, documents) {
    for (const table of rawTables) {
      const record = this._parseDetailTable(table);
      if (record) {
        return [
          {
            ...record,
            pageUrl: pageMeta.pageUrl,
            pageTitle: pageMeta.pageTitle,
            detailUrl: pageMeta.pageUrl,
            documents
          }
        ];
      }
    }
    // No table on this detail page matched the known label pattern —
    // nothing to reconstruct with confidence.
    return [];
  }

  _parseDetailTable(table) {
    for (const row of table.rows || []) {
      for (const key of Object.keys(row)) {
        if (key.startsWith("_")) continue;
        const record = this._parseLabelBlob(key);
        if (record) return record;
      }
    }
    return null;
  }

  _parseLabelBlob(blob) {
    if (typeof blob !== "string" || blob.length < 20) return null;

    // Build a regex that captures the value following each label, up to
    // the next known label or end of string.
    const escaped = DETAIL_LABELS.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const labelAlternation = escaped.join("|");
    const pattern = new RegExp(
      `(${labelAlternation}):\\s*(.*?)(?=(?:${labelAlternation}):|$)`,
      "g"
    );

    const found = {};
    let match;
    let matchCount = 0;
    while ((match = pattern.exec(blob)) !== null) {
      found[match[1]] = match[2].trim();
      matchCount += 1;
    }

    // Require every label to have been found — partial matches are not
    // trusted (per "discard only that record if it can't be reconstructed
    // with high confidence").
    const allLabelsPresent = DETAIL_LABELS.every((label) => label in found);
    if (!allLabelsPresent || matchCount < DETAIL_LABELS.length) return null;

    const procurementTitle = found["Procurement Title"];
    const procurementName = found["Procurement Name"];
    const type = found["Type"];
    const publishDate = found["Publish Date"];
    const closeDate = found["Close Date"];
    const department = found["Department"];

    if (!KNOWN_CATEGORIES.has(procurementTitle)) return null;
    if (!KNOWN_TYPES.has(type)) return null;
    if (!DATE_PATTERN.test(publishDate) || !DATE_PATTERN.test(closeDate)) return null;
    if (!procurementName || !department) return null;

    return {
      procurementTitle,
      procurementName: procurementName.trim(),
      type,
      publishDate: normalizeDate(publishDate),
      closeDate: normalizeDate(closeDate),
      department: department.trim(),
      status: null
    };
  }

  // ---------------- Correlation + global dedupe ----------------

  _correlateAndDedupe(perPageResults) {
    const detailTenders = [];
    const listingTenders = [];

    for (const { tenders } of perPageResults) {
      for (const t of tenders) {
        if (t.detailUrl) detailTenders.push(t);
        else listingTenders.push(t);
      }
    }

    const detailByKey = new Map();
    for (const t of detailTenders) {
      detailByKey.set(dedupeKey(t), t);
    }

    const merged = new Map();

    // Listing tenders first, enriched with detail info when a match exists.
    for (const t of listingTenders) {
      const key = dedupeKey(t);
      const detailMatch = detailByKey.get(key);
      if (detailMatch) {
        merged.set(key, { ...t, detailUrl: detailMatch.detailUrl, documents: detailMatch.documents });
        detailByKey.delete(key); // consumed
      } else if (!merged.has(key)) {
        merged.set(key, t);
      } else {
        this.report.duplicatesRemoved += 1;
      }
    }

    // Any detail-only tenders left over (no matching listing row captured)
    // are still valid, standalone records — keep them.
    for (const [key, t] of detailByKey.entries()) {
      if (!merged.has(key)) {
        merged.set(key, t);
      }
    }

    return Array.from(merged.values());
  }
}

export default JSONCleaner;

// import crypto from 'crypto';

// /**
//  * JSONCleaner
//  * ------------------------------------------------------------------
//  * Turns raw, noisy table-extraction output (scraped tenders) into a
//  * clean, deduplicated, validated list of tender records.
//  *
//  * Pipeline:
//  *   1. Strip scraper metadata & empty values (dataset + row level)
//  *   2. Keep only tables that look like tender tables
//  *   3. Flatten table rows into a single row list
//  *   4. For each row: clean -> normalize -> validate -> dedupe -> enrich
//  *   5. Build a single output object with stats + cleaned records
//  *
//  * The file is organized as:
//  *   - CONFIG                 (all tunable constants, in one place)
//  *   - Utility helpers
//  *   - Pipeline stage classes (one responsibility each)
//  *   - JSONCleaner            (orchestrates the pipeline)
//  * ------------------------------------------------------------------
//  */

// // ============================================================
// // CONFIG — every constant the pipeline depends on lives here so
// // behaviour can be tuned without hunting through class bodies.
// // ============================================================

// const CONFIG = {
//   version: '2.1.0',
//   schemaVersion: '1.0.0',

//   // Fields dropped from every row/dataset before processing.
//   metadataFields: ['_tableIndex', '_rowIndex', '_headers'],

//   // A table is only treated as a "tender table" if it has at least
//   // this many of these columns (by header match or row-key match).
//   requiredColumns: [
//     'Procurement Name', 'Procurement Title', 'Department',
//     'Publish Date', 'Close Date', 'Type'
//   ],
//   minMatchedColumns: 4,
//   tableRowSampleSize: 5,
//   minValidRowRatio: 0.6,

//   // Raw header -> normalized field name.
//   fieldMap: {
//     'Procurement Title': 'procurementTitle',
//     'Procurement Name': 'procurementName',
//     'Type': 'type',
//     'Publish Date': 'publishDate',
//     'Close Date': 'closeDate',
//     'Department': 'department',
//     'Status': 'status',
//     'Tender Notice': 'tenderNotice',
//     'Bidding Document': 'biddingDocument',
//     'Notice URL': 'noticeUrl',
//     'Tender ID': 'tenderId',
//     'Reference Number': 'referenceNumber',
//     'Scrape URL': 'scrapeUrl',
//     'Page URL': 'pageUrl'
//   },

//   // Text cleanup rules for string cell values.
//   textNoisePatterns: [/®/g, /™/g, /&nbsp;/g, /\s+/g],
//   fullCellNoiseValues: [
//     'View Tender Detail', 'Click Here', 'Read More', 'Download', 'More Details'
//   ],
//   htmlEntities: {
//     '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
//     '&#39;': "'", '&#160;': ' ', '&#x27;': "'", '&#x2F;': '/'
//   },

//   dateFields: ['publishDate', 'closeDate', 'Publish Date', 'Close Date'],
//   months: {
//     Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
//     Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
//   },

//   urlFields: [
//     'noticeUrl', 'biddingDocument', 'tenderNotice',
//     'Notice URL', 'Bidding Document', 'Tender Notice',
//     'scrapeUrl', 'pageUrl'
//   ],
//   invalidUrlPatterns: [/^javascript:void/i, /^#$/, /^null$/i, /^undefined$/i],

//   requiredRecordFields: ['procurementName', 'publishDate', 'department'],

//   duplicateIdFields: [
//     'Tender ID', 'tenderId', 'Reference Number', 'refNo',
//     'Notice URL', 'noticeUrl', 'Bid Document URL', 'bidUrl'
//   ],
//   compositeKeyFields: [
//     'Procurement Name', 'procurementName',
//     'Procurement Title', 'procurementTitle',
//     'Department', 'department',
//     'Publish Date', 'publishDate',
//     'Close Date', 'closeDate',
//     'Type', 'type'
//   ],
//   tenderIdFields: ['procurementName', 'publishDate', 'department', 'type'],

//   departmentCategories: {
//     Health: ['health', 'hospital', 'medical', 'medicine', 'pharma', 'specialized healthcare'],
//     Education: ['education', 'school', 'college', 'university', 'academy'],
//     Infrastructure: ['infrastructure', 'construction', 'building', 'road', 'bridge', 'housing'],
//     IT: ['it', 'technology', 'software', 'hardware', 'digital', 'telecom'],
//     Agriculture: ['agriculture', 'farming', 'irrigation', 'forestry', 'livestock'],
//     Energy: ['energy', 'electricity', 'power', 'water', 'wasa', 'pesco', 'mepco'],
//     Transport: ['transport', 'road', 'highway', 'motorway', 'tourism'],
//     Finance: ['finance', 'bank', 'accounting', 'treasury', 'budget', 'excise'],
//     Defense: ['defense', 'military', 'army', 'navy', 'air force', 'police'],
//     Planning: ['planning', 'development', 'p&d', 'planning and development']
//   },
//   categorizedConfidence: 0.85,
//   uncategorizedConfidence: 0.5,

//   attachmentUrlFields: ['tenderNotice', 'biddingDocument', 'noticeUrl'],

//   confidenceWeights: {
//     procurementName: 0.3,
//     department: 0.2,
//     publishDate: 0.2,
//     closeDate: 0.1,
//     tenderNotice: 0.1,
//     biddingDocument: 0.1
//   },
//   attachmentConfidenceBonus: 0.1,

//   closingSoonWindowDays: 7,
//   maxLoggedErrors: 100
// };

// // ============================================================
// // Utility helpers
// // ============================================================

// /** Returns true for null/undefined/empty-string/empty-array/empty-object. */
// function isEmptyValue(value) {
//   if (value === null || value === undefined) return true;
//   if (typeof value === 'string' && value.trim() === '') return true;
//   if (Array.isArray(value) && value.length === 0) return true;
//   if (typeof value === 'object' && Object.keys(value).length === 0) return true;
//   return false;
// }

// /** Removes a fixed list of keys from a shallow copy of an object. */
// function omitKeys(obj, keys) {
//   const copy = { ...obj };
//   keys.forEach((key) => delete copy[key]);
//   return copy;
// }

// // ============================================================
// // Stage: strip scraper metadata (dataset + row level)
// // ============================================================

// class MetadataCleaner {
//   constructor(metadataFields = CONFIG.metadataFields) {
//     this.metadataFields = metadataFields;
//   }

//   cleanData(data) {
//     if (!data || typeof data !== 'object') return data;
//     return omitKeys(data, this.metadataFields);
//   }

//   cleanRow(record) {
//     if (!record || typeof record !== 'object') return record;
//     return omitKeys(record, this.metadataFields);
//   }
// }

// // ============================================================
// // Stage: drop empty values
// // ============================================================

// class EmptyValueCleaner {
//   cleanData(data) {
//     if (!data || typeof data !== 'object') return data;
//     const cleaned = { ...data };
//     Object.entries(cleaned).forEach(([key, value]) => {
//       if (isEmptyValue(value)) delete cleaned[key];
//     });
//     return cleaned;
//   }

//   cleanRow(record) {
//     if (!record || typeof record !== 'object') return record;
//     const cleaned = {};
//     Object.entries(record).forEach(([key, value]) => {
//       if (!isEmptyValue(value)) cleaned[key] = value;
//     });
//     return cleaned;
//   }
// }

// // ============================================================
// // Stage: keep only tables that look like tender tables
// // ============================================================

// class TableFilter {
//   constructor(
//     requiredColumns = CONFIG.requiredColumns,
//     minMatchedColumns = CONFIG.minMatchedColumns,
//     sampleSize = CONFIG.tableRowSampleSize,
//     minValidRowRatio = CONFIG.minValidRowRatio
//   ) {
//     this.requiredColumns = requiredColumns;
//     this.minMatchedColumns = minMatchedColumns;
//     this.sampleSize = sampleSize;
//     this.minValidRowRatio = minValidRowRatio;
//   }

//   filterTables(data) {
//     if (!data || !Array.isArray(data.tables)) return data;
//     const filteredTables = data.tables.filter((table) => this._isTenderTable(table));
//     return { ...data, tables: filteredTables };
//   }

//   _isTenderTable(table) {
//     if (!Array.isArray(table.rows) || table.rows.length === 0) return false;
//     if (!this._headersLookValid(table.headers)) return false;
//     return this._sampleRowsLookValid(table.rows);
//   }

//   _headersLookValid(headers) {
//     if (!headers || !Array.isArray(headers)) return true; // nothing to check against
//     const matched = this.requiredColumns.filter((col) =>
//       headers.some((h) => h && h.trim().toLowerCase() === col.toLowerCase())
//     );
//     return matched.length >= this.minMatchedColumns;
//   }

//   _sampleRowsLookValid(rows) {
//     const sampleRows = rows.slice(0, this.sampleSize);
//     const validRows = sampleRows.filter((row) => this._rowLooksValid(row)).length;
//     return validRows / sampleRows.length >= this.minValidRowRatio;
//   }

//   _rowLooksValid(row) {
//     if (!row || typeof row !== 'object') return false;
//     const matched = this.requiredColumns.filter((col) =>
//       Object.prototype.hasOwnProperty.call(row, col)
//     );
//     return matched.length >= this.minMatchedColumns;
//   }
// }

// // ============================================================
// // Stage: flatten tables into a single row list
// // ============================================================

// class RowExtractor {
//   extract(data) {
//     if (!data || !Array.isArray(data.tables)) return [];

//     const records = [];
//     data.tables.forEach((table, tableIndex) => {
//       if (!Array.isArray(table.rows)) return;
//       table.rows.forEach((row, rowIndex) => {
//         records.push({
//           ...row,
//           _sourceTable: tableIndex,
//           _sourceRow: rowIndex,
//           _tableHeaders: table.headers || []
//         });
//       });
//     });
//     return records;
//   }
// }

// // ============================================================
// // Stage: duplicate detection
// // ============================================================

// class DuplicateDetector {
//   constructor(idFields = CONFIG.duplicateIdFields, compositeFields = CONFIG.compositeKeyFields) {
//     this.idFields = idFields;
//     this.compositeFields = compositeFields;
//     this.seen = new Set();
//     this.duplicateCount = 0;
//   }

//   /** Returns true if this record has already been seen. */
//   detect(record) {
//     const key = this._extractStableIdentifier(record) || this._generateCompositeKey(record);

//     if (this.seen.has(key)) {
//       this.duplicateCount++;
//       return true;
//     }
//     this.seen.add(key);
//     return false;
//   }

//   _extractStableIdentifier(record) {
//     for (const field of this.idFields) {
//       const value = record[field];
//       if (typeof value === 'string') {
//         const trimmed = value.trim();
//         if (trimmed && !trimmed.includes('javascript:void') && trimmed !== '#') {
//           return `id:${trimmed}`;
//         }
//       }
//     }
//     return null;
//   }

//   _generateCompositeKey(record) {
//     return this.compositeFields
//       .map((field) => this._normalizeValue(record[field] || ''))
//       .join('|');
//   }

//   _normalizeValue(value) {
//     return String(value)
//       .toLowerCase()
//       .trim()
//       .replace(/\s+/g, ' ')
//       .replace(/[.,;:!?()]/g, ''); // punctuation only, keep words intact
//   }

//   getStats() {
//     return { duplicatesRemoved: this.duplicateCount };
//   }
// }

// // ============================================================
// // Stage: field-name normalization + text cleanup
// // ============================================================

// class FieldNormalizer {
//   constructor(
//     fieldMap = CONFIG.fieldMap,
//     noisePatterns = CONFIG.textNoisePatterns,
//     fullCellNoiseValues = CONFIG.fullCellNoiseValues,
//     htmlEntities = CONFIG.htmlEntities
//   ) {
//     this.fieldMap = fieldMap;
//     this.noisePatterns = noisePatterns;
//     this.fullCellNoiseValues = fullCellNoiseValues.map((v) => v.toLowerCase());
//     this.htmlEntities = htmlEntities;
//   }

//   normalize(record) {
//     if (!record || typeof record !== 'object') return record;

//     const normalized = {};
//     Object.entries(record).forEach(([key, value]) => {
//       const newKey = this.fieldMap[key] || key;
//       normalized[newKey] = typeof value === 'string' ? this.cleanText(value) : value;
//     });
//     return normalized;
//   }

//   cleanText(text) {
//     if (typeof text !== 'string') return text;

//     const trimmed = text.trim();
//     if (this.fullCellNoiseValues.includes(trimmed.toLowerCase())) return '';

//     let cleaned = trimmed;
//     this.noisePatterns.forEach((pattern) => {
//       cleaned = cleaned.replace(pattern, ' ');
//     });

//     cleaned = cleaned
//       .replace(/\r?\n/g, ' ')
//       .replace(/\t/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();

//     return this._decodeHtmlEntities(cleaned);
//   }

//   _decodeHtmlEntities(text) {
//     return text.replace(/&[#\w]+;/g, (match) => this.htmlEntities[match] || match);
//   }
// }

// // ============================================================
// // Stage: date normalization (multiple input formats -> ISO)
// // ============================================================

// class DateNormalizer {
//   constructor(dateFields = CONFIG.dateFields, months = CONFIG.months) {
//     this.dateFields = dateFields;
//     this.months = months;
//     this.parsers = [
//       this._parseIsoDate.bind(this),
//       this._parseTextMonthDate.bind(this),
//       this._parseSlashDate.bind(this),
//       this._parseDashDate.bind(this),
//       this._parseDotDate.bind(this)
//     ];
//   }

//   normalize(record) {
//     if (!record || typeof record !== 'object') return record;

//     const normalized = { ...record };
//     this.dateFields.forEach((field) => {
//       const raw = record[field];
//       if (typeof raw !== 'string' || !raw) return;
//       const parsed = this.parseDate(raw);
//       normalized[field] = parsed && this._isValidDate(parsed) ? parsed : null;
//     });
//     return normalized;
//   }

//   parseDate(dateStr) {
//     if (!dateStr || typeof dateStr !== 'string') return null;
//     const cleaned = dateStr.trim().replace(/\s+/g, ' ');

//     for (const parser of this.parsers) {
//       const result = parser(cleaned);
//       if (result) return result;
//     }
//     return null;
//   }

//   _isValidDate(dateStr) {
//     return !isNaN(new Date(dateStr).getTime());
//   }

//   /** YYYY-MM-DD */
//   _parseIsoDate(dateStr) {
//     const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
//     if (!match) return null;
//     const [, year, month, day] = match;
//     return `${year}-${month}-${day}`;
//   }

//   /**
//    * Any date containing a 3-letter month name, in the common variants:
//    *   "04 Aug 2026", "04-Aug-2026", "04 Aug, 2026", "August 4, 2026", "4-Aug-26"
//    */
//   _parseTextMonthDate(dateStr) {
//     const { months } = this;

//     const spaced = dateStr.match(/^(\d{1,2})\s+(\w{3}),?\s+(\d{4})$/);
//     if (spaced && months[spaced[2]]) {
//       return `${spaced[3]}-${months[spaced[2]]}-${spaced[1].padStart(2, '0')}`;
//     }

//     const dashed = dateStr.match(/^(\d{1,2})-(\w{3})-(\d{4})$/);
//     if (dashed && months[dashed[2]]) {
//       return `${dashed[3]}-${months[dashed[2]]}-${dashed[1].padStart(2, '0')}`;
//     }

//     const monthFirst = dateStr.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/);
//     if (monthFirst && months[monthFirst[1]]) {
//       return `${monthFirst[3]}-${months[monthFirst[1]]}-${monthFirst[2].padStart(2, '0')}`;
//     }

//     const shortYear = dateStr.match(/^(\d{1,2})-(\w{3})-(\d{2})$/);
//     if (shortYear && months[shortYear[2]]) {
//       const fullYear = parseInt(shortYear[3], 10) > 30 ? `19${shortYear[3]}` : `20${shortYear[3]}`;
//       return `${fullYear}-${months[shortYear[2]]}-${shortYear[1].padStart(2, '0')}`;
//     }

//     return null;
//   }

//   /** DD/MM/YYYY */
//   _parseSlashDate(dateStr) {
//     const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
//     if (!match) return null;
//     const [, day, month, year] = match;
//     return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//   }

//   /** DD-MM-YYYY (numeric) */
//   _parseDashDate(dateStr) {
//     const match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
//     if (!match) return null;
//     const [, day, month, year] = match;
//     return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//   }

//   /** DD.MM.YYYY */
//   _parseDotDate(dateStr) {
//     const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
//     if (!match) return null;
//     const [, day, month, year] = match;
//     return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
//   }
// }

// // ============================================================
// // Stage: URL validation / resolution
// // ============================================================

// class URLValidator {
//   constructor(baseUrl = '', urlFields = CONFIG.urlFields, invalidPatterns = CONFIG.invalidUrlPatterns) {
//     this.baseUrl = baseUrl;
//     this.urlFields = urlFields;
//     this.invalidPatterns = invalidPatterns;
//   }

//   setBaseUrl(baseUrl) {
//     this.baseUrl = baseUrl;
//   }

//   validate(record) {
//     if (!record || typeof record !== 'object') return record;

//     const normalized = { ...record };
//     this.urlFields.forEach((field) => {
//       const value = normalized[field];
//       if (typeof value !== 'string') return;

//       const url = value.trim();
//       normalized[field] = this._isInvalidUrl(url) ? null : this._resolveUrl(url);
//     });
//     return normalized;
//   }

//   _isInvalidUrl(url) {
//     return this.invalidPatterns.some((pattern) => pattern.test(url));
//   }

//   _resolveUrl(url) {
//     try {
//       return new URL(url).href; // already absolute
//     } catch {
//       if (!this.baseUrl) return null;
//       try {
//         return new URL(url, this.baseUrl).href;
//       } catch {
//         return null;
//       }
//     }
//   }
// }

// // ============================================================
// // Stage: record validation (required fields + date sanity)
// // ============================================================

// class RecordValidator {
//   constructor(requiredFields = CONFIG.requiredRecordFields) {
//     this.requiredFields = requiredFields;
//     this.errors = [];
//   }

//   validate(record) {
//     if (!record || typeof record !== 'object') {
//       this.errors.push({ row: record, reason: 'Invalid record type' });
//       return false;
//     }

//     const missingFields = [];
//     const invalidFields = [];

//     for (const field of this.requiredFields) {
//       const value = record[field];
//       if (!value || typeof value !== 'string' || value.trim() === '') {
//         missingFields.push(field);
//         continue;
//       }
//       if ((field === 'publishDate' || field === 'closeDate') && isNaN(new Date(value).getTime())) {
//         invalidFields.push(`${field}: ${value}`);
//       }
//     }

//     if (missingFields.length > 0 || invalidFields.length > 0) {
//       this.errors.push({ row: record, missingFields, invalidFields, reason: 'Validation failed' });
//       return false;
//     }
//     return true;
//   }

//   getErrors() {
//     return this.errors;
//   }

//   getStats() {
//     return { invalidRecordsRemoved: this.errors.length };
//   }
// }

// // ============================================================
// // Stage: stable ID generation
// // ============================================================

// class TenderIDGenerator {
//   constructor(fields = CONFIG.tenderIdFields) {
//     this.fields = fields;
//   }

//   generate(record) {
//     const values = this.fields.map((field) => record[field] || '').join('|');
//     const digest = crypto.createHash('sha256').update(values).digest('hex');
//     return `TND-${digest.substring(0, 12).toUpperCase()}`;
//   }
// }

// // ============================================================
// // Stage: department -> category classification
// // ============================================================

// class DepartmentCategorizer {
//   constructor(
//     categories = CONFIG.departmentCategories,
//     categorizedConfidence = CONFIG.categorizedConfidence,
//     uncategorizedConfidence = CONFIG.uncategorizedConfidence
//   ) {
//     this.categories = categories;
//     this.categorizedConfidence = categorizedConfidence;
//     this.uncategorizedConfidence = uncategorizedConfidence;
//   }

//   categorize(record) {
//     if (!record || typeof record !== 'object') return record;

//     const department = (record.department || '').toLowerCase();
//     const category = this._matchCategory(department);

//     return {
//       ...record,
//       departmentCategory: category,
//       departmentConfidence: category !== 'Other' ? this.categorizedConfidence : this.uncategorizedConfidence
//     };
//   }

//   _matchCategory(department) {
//     for (const [category, keywords] of Object.entries(this.categories)) {
//       if (keywords.some((keyword) => department.includes(keyword))) return category;
//     }
//     return 'Other';
//   }
// }

// // ============================================================
// // Stage: collect attachment URLs into a single array
// // ============================================================

// class AttachmentResolver {
//   constructor(urlFields = CONFIG.attachmentUrlFields) {
//     this.urlFields = urlFields;
//   }

//   resolve(record) {
//     if (!record || typeof record !== 'object') return record;

//     const attachments = this.urlFields
//       .filter((field) => record[field])
//       .map((field) => ({ type: field, url: record[field] }));

//     return { ...record, attachments: attachments.length > 0 ? attachments : null };
//   }
// }

// // ============================================================
// // Stage: run statistics
// // ============================================================

// class StatsCollector {
//   constructor() {
//     this.stats = {
//       rawTables: 0,
//       rawRows: 0,
//       tablesRemoved: 0,
//       duplicatesRemoved: 0,
//       emptyRowsRemoved: 0,
//       invalidRecordsRemoved: 0,
//       finalRecords: 0,
//       errors: [],
//       startTime: Date.now(),
//       endTime: null
//     };
//   }

//   addError(error) {
//     this.stats.errors.push(error);
//   }

//   addTables(total, removed) {
//     this.stats.rawTables = total;
//     this.stats.tablesRemoved = removed;
//   }

//   addRows(rows) {
//     this.stats.rawRows = rows;
//   }

//   addDuplicates(count) {
//     this.stats.duplicatesRemoved = count;
//   }

//   addInvalid(count) {
//     this.stats.invalidRecordsRemoved = count;
//   }

//   addEmpty(count) {
//     this.stats.emptyRowsRemoved = count;
//   }

//   finish(finalCount) {
//     this.stats.finalRecords = finalCount;
//     this.stats.endTime = Date.now();
//     this.stats.duration = this.stats.endTime - this.stats.startTime;
//   }

//   getReport() {
//     const { rawRows, finalRecords, duration, errors } = this.stats;
//     return {
//       ...this.stats,
//       durationSeconds: (duration / 1000).toFixed(2),
//       efficiency: rawRows > 0 ? ((finalRecords / rawRows) * 100).toFixed(2) : 0,
//       errorCount: errors.length
//     };
//   }
// }

// // ============================================================
// // Orchestrator
// // ============================================================

// class JSONCleaner {
//   constructor(config = {}) {
//     this.baseUrl = config.baseUrl || '';
//     this.logger = config.logger || console;
//     this.version = CONFIG.version;
//     this.schemaVersion = CONFIG.schemaVersion;

//     this.metadataCleaner = new MetadataCleaner();
//     this.emptyValueCleaner = new EmptyValueCleaner();
//     this.tableFilter = new TableFilter();
//     this.rowExtractor = new RowExtractor();
//     this.duplicateDetector = new DuplicateDetector();
//     this.fieldNormalizer = new FieldNormalizer();
//     this.dateNormalizer = new DateNormalizer();
//     this.urlValidator = new URLValidator(this.baseUrl);
//     this.recordValidator = new RecordValidator();
//     this.tenderIdGenerator = new TenderIDGenerator();
//     this.departmentCategorizer = new DepartmentCategorizer();
//     this.attachmentResolver = new AttachmentResolver();
//     this.stats = new StatsCollector();
//   }

//   clean(extractionData = {}) {
//     this.logger.info(`Starting cleaning pipeline v${this.version}...`);

//     try {
//       const filteredData = this._filterInput(extractionData);
//       const rawRows = this._extractRows(filteredData);
//       const validRecords = this._processRows(rawRows);
//       const result = this._buildOutput(validRecords, extractionData.metadata || {});

//       this._logSummary();
//       return result;
//     } catch (error) {
//       this.logger.error('Cleaning pipeline failed:', error);
//       throw error;
//     }
//   }

//   _filterInput(extractionData) {
//     let data = this.metadataCleaner.cleanData(extractionData);
//     data = this.emptyValueCleaner.cleanData(data);

//     const filteredData = this.tableFilter.filterTables(data);
//     this.stats.addTables(
//       data.tables?.length || 0,
//       (data.tables?.length || 0) - (filteredData.tables?.length || 0)
//     );
//     return filteredData;
//   }

//   _extractRows(filteredData) {
//     const rawRows = this.rowExtractor.extract(filteredData);
//     this.stats.addRows(rawRows.length);
//     this.logger.info(`Extracted ${rawRows.length} rows`);
//     return rawRows;
//   }

//   _processRows(rawRows) {
//     const validRecords = [];

//     for (const row of rawRows) {
//       const record = this._cleanAndNormalize(row);
//       if (!record) continue; // empty after cleaning, already logged

//       if (!this.recordValidator.validate(record)) {
//         this.recordValidator.getErrors().forEach((err) => this.stats.addError(err));
//         continue;
//       }

//       if (this.duplicateDetector.detect(record)) continue;

//       validRecords.push(this._enrich(record));
//     }

//     this.stats.addDuplicates(this.duplicateDetector.getStats().duplicatesRemoved);
//     this.stats.addInvalid(this.recordValidator.getStats().invalidRecordsRemoved);
//     this.stats.finish(validRecords.length);

//     return validRecords;
//   }

//   /** Metadata strip -> empty-value strip -> field/date/url normalization. Returns null if empty. */
//   _cleanAndNormalize(row) {
//     let record = this.metadataCleaner.cleanRow(row);
//     record = this.emptyValueCleaner.cleanRow(record);

//     if (!record || Object.keys(record).length === 0) {
//       this.stats.addEmpty(1);
//       this.stats.addError({ row, reason: 'Empty row after cleaning' });
//       return null;
//     }

//     record = this.fieldNormalizer.normalize(record);
//     record = this.dateNormalizer.normalize(record);
//     record = this.urlValidator.validate(record);
//     return record;
//   }

//   /** Categorize, resolve attachments, assign ID, infer status if missing. */
//   _enrich(record) {
//     let enriched = this.departmentCategorizer.categorize(record);
//     enriched = this.attachmentResolver.resolve(enriched);
//     enriched.tenderId = this.tenderIdGenerator.generate(enriched);
//     if (!enriched.status) {
//       enriched.status = this._inferStatus(enriched.closeDate);
//     }
//     return enriched;
//   }

//   _inferStatus(closeDate) {
//     if (!closeDate) return 'Unknown';

//     const close = new Date(closeDate);
//     if (isNaN(close.getTime())) return 'Unknown';

//     const now = new Date();
//     if (close < now) return 'Expired';

//     const daysDiff = (close - now) / (1000 * 60 * 60 * 24);
//     return daysDiff <= CONFIG.closingSoonWindowDays ? 'Closing Soon' : 'Open';
//   }

//   _buildOutput(records, originalMetadata = {}) {
//     const report = this.stats.getReport();

//     return {
//       metadata: this._buildMetadata(originalMetadata, report),
//       errors: report.errors.slice(0, CONFIG.maxLoggedErrors),
//       tenders: records.map((record, index) => this._toTenderRecord(record, index))
//     };
//   }

//   _buildMetadata(originalMetadata, report) {
//     return {
//       source: originalMetadata.source || 'Unknown',
//       website: originalMetadata.website || null,
//       country: 'Pakistan',
//       language: 'English',
//       scrapeUrl: originalMetadata.scrapeUrl || null,
//       pageUrl: originalMetadata.pageUrl || null,

//       crawledAt: originalMetadata.crawledAt || new Date().toISOString(),
//       processedAt: new Date().toISOString(),
//       processingDuration: `${report.durationSeconds}s`,

//       scraperVersion: originalMetadata.scraperVersion || '1.0.0',
//       cleanerVersion: this.version,
//       schemaVersion: this.schemaVersion,

//       statistics: {
//         rawTables: report.rawTables,
//         rawRows: report.rawRows,
//         tablesRemoved: report.tablesRemoved,
//         duplicatesRemoved: report.duplicatesRemoved,
//         emptyRowsRemoved: report.emptyRowsRemoved,
//         invalidRecordsRemoved: report.invalidRecordsRemoved,
//         finalRecords: report.finalRecords,
//         efficiency: `${report.efficiency}%`,
//         errorCount: report.errorCount
//       }
//     };
//   }

//   _toTenderRecord(record, index) {
//     return {
//       id: index + 1,
//       tenderId: record.tenderId,
//       procurementTitle: record.procurementTitle || '',
//       procurementName: record.procurementName || '',
//       type: record.type || '',
//       publishDate: record.publishDate || '',
//       closeDate: record.closeDate || '',
//       department: record.department || '',
//       departmentCategory: record.departmentCategory || 'Other',
//       departmentConfidence: record.departmentConfidence || CONFIG.uncategorizedConfidence,
//       status: record.status || 'Unknown',
//       attachments: record.attachments || [],
//       referenceNumber: record.referenceNumber || null,
//       sourceTable: record._sourceTable ?? null,
//       sourceRow: record._sourceRow ?? null,
//       confidence: this._calculateConfidence(record)
//     };
//   }

//   _calculateConfidence(record) {
//     let score = 0;
//     for (const [field, weight] of Object.entries(CONFIG.confidenceWeights)) {
//       if (typeof record[field] === 'string' && record[field].trim() !== '') {
//         score += weight;
//       }
//     }
//     if (record.attachments && record.attachments.length > 0) {
//       score += CONFIG.attachmentConfidenceBonus;
//     }
//     return Math.min(score, 1.0);
//   }

//   _logSummary() {
//     const report = this.stats.getReport();
//     this.logger.info('Cleaning completed:', {
//       duration: `${report.durationSeconds}s`,
//       rawRows: report.rawRows,
//       finalRows: report.finalRecords,
//       duplicatesRemoved: report.duplicatesRemoved,
//       invalidRecordsRemoved: report.invalidRecordsRemoved,
//       errors: report.errorCount,
//       efficiency: `${report.efficiency}%`
//     });

//     if (report.errorCount > 0) {
//       this.logger.warn(`${report.errorCount} errors encountered`);
//     }
//   }

//   getReport() {
//     return this.stats.getReport();
//   }
// }

// export default JSONCleaner;
// export { CONFIG as JSONCleanerConfig };
# Belgian KBO/BCE register API by CompanyData

[![npm](https://img.shields.io/npm/v/@companydata/kbo-api.svg)](https://www.npmjs.com/package/@companydata/kbo-api)

A small, typed TypeScript wrapper for looking up **Belgian company data from the KBO/BCE (Crossroads Bank for Enterprises)**: company names, full street addresses, phone, email, website, size and revenue, through one REST call.

This package is a thin convenience layer over the master [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk). It is the same API and the same key, with the country pinned to Belgium and a register-specific helper on top, so you can write `client.getByEnterpriseNumber("0716.663.615")` instead of assembling query parameters by hand.

> One schema, one key. Every CompanyData register wrapper returns records in the same shape, so moving from KBO/BCE to another country's register is a one-line change.

## At a glance

| | |
| --- | --- |
| Country | 🇧🇪 Belgium (`countryCode: "BE"`) |
| Register | Belgian KBO/BCE register (Crossroads Bank for Enterprises) |
| Businesses in CompanyData | 2.38M |
| With phone number | 1.03M |
| With email address | 557K |
| Lookup key | enterprise number (`BE` + 10 digits) |
| Verified example | Colruyt Food Retail, `0716.663.615` |
| Live demo and comparison | [companydata.com/kbo-api](https://companydata.com/kbo-api/) |
| Official register | [kbopub.economie.fgov.be](https://kbopub.economie.fgov.be) |

Counts are from the live API on 2026-10-12 and grow over time.

## What is the KBO/BCE?

The **KBO/BCE** (Kruispuntbank van Ondernemingen / Banque-Carrefour des Entreprises) is the Belgian federal register of every enterprise and establishment unit, run by the FPS Economy. Its public search at [kbopub.economie.fgov.be](https://kbopub.economie.fgov.be) is the authoritative source for the legal record.

What the official KBO/BCE channels do **not** give you: the public search is one company at a time, the open-data files are monthly dumps you have to load yourself, and neither carries a usable phone number, email address or website for most enterprises.

**CompanyData adds the missing fields.** 2.38M Belgian businesses with full addresses, phone, email, website, directors and firmographics, filterable and exportable in bulk through one live REST API. Comparison and a live lookup: [companydata.com/kbo-api](https://companydata.com/kbo-api/).

## Installation

```bash
npm install @companydata/kbo-api
```

Get an API key at [app.companydata.com/signup-api](https://app.companydata.com/signup-api). Your first calls are free.

## Quickstart

```ts
import { KboClient } from "@companydata/kbo-api";

const client = new KboClient({
  auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! }
});

// Look up one business by its enterprise number.
const company = await client.getByEnterpriseNumber("0716.663.615"); // Colruyt Food Retail

// Search with filters (country is always BE here).
const page = await client.search({
  cityName: "BRUSSEL",
  hasEmail: true,
  hasWebsite: true,
  page: 1,
  pageSize: 25
});
console.log(page.totalCount, page.records[0]?.["Company Name"]);
```

> **City and province names are UPPER CASE.** Filter on `cityName: "BRUSSEL"`, not `"Brussel"` (which returns 0). The same goes for `provinceName: "VLAAMS BRABANT"`. List exact names per country with `GET /api/cities`. Full field and filter reference: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

Run the full example against the live API with your key:

```bash
git clone https://github.com/companydatacom/kbo-api && cd kbo-api && npm install
COMPANYDATA_API_KEY=... npm run test:live
```

## What a record looks like

Every record is a flat object with human-readable keys. This is Colruyt Food Retail as returned by `getByEnterpriseNumber`:

```json
{
  "Company Name": "Colruyt Food Retail",
  "Trade Name": "Colruyt Sint-Pieters-Woluwe",
  "Company Registration Number": "BE0716663615",
  "Address 1": "Edingensesteenweg 196",
  "Postal Code": "1500",
  "City": "Halle",
  "State/Province": "Vlaams Brabant",
  "Country": "Belgium",
  "Phone Number": "+3*****40",
  "Email": "*****@*****",
  "Website": "colruyt.*****",
  "Founding Year": 2018,
  "Employees Total": 16642,
  "Yearly Revenue in U.S. Dollars": 8366150420,
  "Business Category Code 1 - Description": "Grocery Stores",
  "Business Legal Type - Description": "Corporation"
}
```

**Search is a preview, export is the full record.** `search` (and the lookup helper, which uses it) returns about 20 fields with phone, email and website masked as `*****`, and does not spend credits. `export`, `exportWithScroll` and `iterate` return the full record (about 35 fields, unmasked contact details, SIC and national industry codes, legal status, group structure) and spend one credit per company you have not exported before. Which fields are on a record depends on your key's configuration. See the [field reference](https://companydata.com/api-docs/request-company/) and [plans and credits](https://companydata.com/api-docs/authentication/).

## Methods

| Method | Returns | Does |
| --- | --- | --- |
| `client.search(params)` | `KboPage` | Search Belgian businesses with filters. |
| `client.getByEnterpriseNumber(id, scope?)` | `CompanyRecord \| null` | Fetch one business by enterprise number. `scope` adds extra filters when a number is not unique. |
| `client.export(params)` | `KboPage` | Export one page of results (standard pagination). |
| `client.exportWithScroll(params)` | `KboScrollBatch` | One scroll batch (max 50 records). Pass `scrollId` back in for the next. |
| `client.iterate(params, { maxRecords })` | `AsyncGenerator<CompanyRecord>` | Streams every matching record across scroll batches. |
| `client.raw` | `ApiClient` | The underlying master SDK client, for anything not wrapped here. |
| `normalizeKboId(id)` | `string` | The enterprise number normalisation the lookup helper applies. |

```ts
interface KboPage {
  records: CompanyRecord[];   // flat objects, keys like "Company Name", "City", "Email"
  totalCount: number;         // matches across all pages
  page: number;
  totalPages: number;
  pageSize: number;
}

interface KboScrollBatch {
  records: CompanyRecord[];
  scrollId: string | null;    // pass back in to get the next batch
  hasMoreRecords: boolean;
  pageSize: number;
}
```

`params` is the master SDK's filter set with `countryCode` removed, because it is always `"BE"` here. For cross-border queries, use the master SDK directly.

### Lookup by enterprise number

`getByEnterpriseNumber` takes the 10-digit Belgian enterprise number (ondernemingsnummer / numéro d'entreprise). Dots, spaces and a `BE` prefix are all accepted and normalised to the API's `BE0716663615` form, so `"0716.663.615"`, `"BE 0716 663 615"` and `"716663615"` all match the same company.

## Recipes

**Find a company by name, pinned to a city**

```ts
const { records, totalCount } = await client.search({
  search: "Colruyt",
  cityName: "HALLE",
  pageSize: 5
});
```

**Build a segment: companies in a province with 50 or more employees**

```ts
const page = await client.search({
  provinceName: "VLAAMS BRABANT",
  employeesTotal: { min: 50 },
  hasPhone: true,
  pageSize: 100
});
```

**Stream a whole segment with scroll export**

```ts
for await (const company of client.iterate(
  { cityName: "BRUSSEL", hasEmail: true },
  { maxRecords: 5000 }
)) {
  console.log(company["Company Name"], company["Email"]);
}
```

**Drive the scroll loop yourself**

```ts
let batch = await client.exportWithScroll({ cityName: "BRUSSEL", hasEmail: true, pageSize: 50 });
while (batch.records.length > 0) {
  process(batch.records);
  if (!batch.hasMoreRecords || !batch.scrollId) break;
  batch = await client.exportWithScroll({ cityName: "BRUSSEL", hasEmail: true, scrollId: batch.scrollId, pageSize: 50 });
}
```

**Anything else: drop to the master client**

```ts
const res = await client.raw.company.search({ countryCode: "DE", cityName: "BERLIN", pageSize: 10 });
```

### Common filters

| Filter | Example | Notes |
| --- | --- | --- |
| `search` | `"Colruyt"` | Free text over company and trade names. |
| `nationalId` | `"BE0716663615"` | Registration number. The lookup helper sets this for you. |
| `cityName` | `"BRUSSEL"` | UPPER CASE. |
| `provinceName` | `"VLAAMS BRABANT"` | Admin-2 name, UPPER CASE (the record's `State/Province`). |
| `postalCode` | `"1500"` | Exact match. |
| `hasEmail`, `hasPhone`, `hasWebsite` | `true` | Contact availability. |
| `employeesTotal`, `annualSales`, `foundingYears` | `{ min: 50, max: 500 }` | Range filters. |
| `sic4Digits` | `"7372"` | 4-digit SIC industry code. |

Full list: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

## Known limitations

- Belgian cities exist in Dutch and French spellings in the data (`BRUSSEL` and `BRUXELLES` are different values). Check both, or filter on `postalCode` instead.

## Four ways to integrate

Pick whichever fits how you build. All four hit the same data behind the same key.

1. **This register SDK** (`@companydata/kbo-api`): Belgian lookups with a KBO/BCE-specific helper. You are here.
2. **Master SDK** ([`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk)): all 200+ countries in one typed client, keyed by `countryCode`.
3. **MCP server**: connect an AI agent (Claude, Cursor and others) to `https://companydata.com/mcp/` with your key in the `x-api-key` header. See [companydata-mcp-server](https://github.com/companydatacom/companydata-mcp-server).
4. **Raw REST**: call `GET https://app.companydata.com/api/company/search?countryCode=BE&cityName=BRUSSEL` with an `x-api-key` header. Contract: [companydata.com/openapi.json](https://companydata.com/openapi.json).

```bash
curl -H "x-api-key: $COMPANYDATA_API_KEY" \
  "https://app.companydata.com/api/company/search?countryCode=BE&nationalId=BE0716663615&pageSize=1"
```

## Error handling

Failed requests throw `ApiError` with the HTTP status. The client retries transient failures (429 and 5xx) with backoff before giving up.

```ts
import { ApiError } from "@companydata/kbo-api";

try {
  await client.search({ cityName: "BRUSSEL" });
} catch (err) {
  if (err instanceof ApiError) {
    // 401: bad or missing key, 429: rate limited,
    // "Export credit limit exceeded" (code credits_limit_exceeded): export credits used up
    console.error(err.status, err.message);
  }
}
```

A scroll batch that is larger than your remaining credits is rejected as a whole, so keep `pageSize` small when a key is close to its limit.

## All register wrappers

Same pattern, one per official register. Every wrapper returns the same record shape.

| Country | Register | Package | Lookup helper |
| --- | --- | --- | --- |
| 🇳🇱 Netherlands | KVK | [`@companydata/kvk-api`](https://github.com/companydatacom/kvk-api) | `getByKvkNumber` |
| 🇩🇪 Germany | Handelsregister | [`@companydata/handelsregister-api`](https://github.com/companydatacom/handelsregister-api) | `getByRegistrationNumber` |
| 🇬🇧 United Kingdom | Companies House | [`@companydata/companies-house-api`](https://github.com/companydatacom/companies-house-api) | `getByCompanyNumber` |
| 🇫🇷 France | Sirene | [`@companydata/sirene-api`](https://github.com/companydatacom/sirene-api) | `getBySiret` |
| 🇧🇪 Belgium | KBO/BCE | [`@companydata/kbo-api`](https://github.com/companydatacom/kbo-api) | `getByEnterpriseNumber` |
| 🇵🇱 Poland | KRS | [`@companydata/krs-api`](https://github.com/companydatacom/krs-api) | `getByNip` |
| 🇸🇪 Sweden | Bolagsverket | [`@companydata/bolagsverket-api`](https://github.com/companydatacom/bolagsverket-api) | `getByOrgNumber` |
| 🇨🇭 Switzerland | Zefix | [`@companydata/zefix-api`](https://github.com/companydatacom/zefix-api) | `getByUid` |
| 🇨🇿 Czech Republic | ARES | [`@companydata/ares-api`](https://github.com/companydatacom/ares-api) | `getByIco` |
| 🇩🇰 Denmark | CVR | [`@companydata/cvr-api`](https://github.com/companydatacom/cvr-api) | `getByCvr` |
| 🇧🇷 Brazil | CNPJ | [`@companydata/cnpj-api`](https://github.com/companydatacom/cnpj-api) | `getByCnpj` |
| 🇦🇺 Australia | ABR | [`@companydata/abn-lookup-api`](https://github.com/companydatacom/abn-lookup-api) | `getByAbn` |
| 🇺🇸 United States | SEC EDGAR | [`@companydata/sec-edgar-api`](https://github.com/companydatacom/sec-edgar-api) | `getByRegistrationNumber` |

Plus the master SDK for every other country: [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk).

## License

MIT. Built and maintained by [CompanyData.com](https://companydata.com).

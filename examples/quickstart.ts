/** Run: COMPANYDATA_API_KEY=... npx tsx examples/quickstart.ts */
import { KboClient } from "../src/index";

const client = new KboClient({ auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! } });

const company = await client.getByEnterpriseNumber("0417497106");
console.log("By enterprise number:", company);

const page = await client.search({ cityName: "Brussels", hasEmail: true, pageSize: 25 });
console.log("Search:", page.data);

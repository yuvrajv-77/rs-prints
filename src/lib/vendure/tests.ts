---
import { vendureClient } from "../../lib/vendure/client";
import { GET_PRODUCTS } from "../../lib/vendure/queries";

const data = await vendureClient.request(GET_PRODUCTS);

console.log(data);
---

<h1>Products</h1>

<pre>
  {JSON.stringify(data, null, 2)}
</pre>
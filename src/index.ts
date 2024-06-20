import { Client } from "pg";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const client = new Client({
			user: env.DB_USERNAME,
			password: env.DB_PASSWORD,
			host: env.DB_HOST,
			port: env.DB_PORT,
			database: env.DB_NAME,
			ssl: true
		});
		await client.connect();
	
		const url = new URL(request.url);
		if (request.method === "POST" && url.pathname === "/products") {
			// Parse the request's JSON payload
			const productData = await request.json();

			// Insert the new product into the database
			const insertQuery = `
				INSERT INTO products (name, description, price)
				VALUES ($1, $2, $3)
				RETURNING *
			`;
			const values = [productData.name, productData.description, productData.price];
			const insertResult = await client.query(insertQuery, values);

			// Return the inserted row as JSON
			const insertResp = new Response(JSON.stringify(insertResult.rows[0]), {
				headers: { "Content-Type": "application/json" },
			});

			// Clean up the client
			ctx.waitUntil(client.end());
			return insertResp;
		} else if (request.method === "GET" && url.pathname === "/products") {
			
			// Query the products table
			const result = await client.query("SELECT * FROM products");

			// Return the result as JSON
			const resp = new Response(JSON.stringify(result.rows), {
				headers: { "Content-Type": "application/json" },
			});

			// Clean up the client
			ctx.waitUntil(client.end());
			return resp;
		}
		
	},
} satisfies ExportedHandler<Env>;

export async function connectClient(client) {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    return client;
}
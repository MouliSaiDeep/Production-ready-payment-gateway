const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function initializeDatabase() {
    // 1. Get Client
    const client = await db.pool.connect();
    
    try {
        console.log('Starting database initialization...');

        // 2. Read and Execute Schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('Schema applied successfully');

        
        const seedQuery = `
            INSERT INTO merchants (id, name, email, api_key, api_secret, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
        `;

        const values = [
            '550e8400-e29b-41d4-a716-446655440000', //  ID
            'Test Merchant',                        //  Name
            'test@example.com',                     //  Email
            'key_test_abc123',                      //  API Key
            'secret_test_xyz789'                    //  API Secret
        ];

        const res = await client.query(seedQuery, values);

        if (res.rowCount > 0) {
            console.log('Test merchant seeded successfully.');
        } else {
            console.log('Test merchant already exists, skipped seeding.');
        }

    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error; 
    } finally {
        client.release();
    }
}

module.exports = initializeDatabase;
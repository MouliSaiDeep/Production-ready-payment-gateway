const db = require('../config/db');

const getHealth = async (req, res) => {
    let dbStatus = "disconnected";

    try {
        await db.query('SELECT 1');
        dbStatus = "connected";
    } catch (error) {
        console.error('Health Check DB Error: ', error);
    }

    const response = {
        status: 'healthy',
        database: dbStatus,
        timestamp: new Date().toISOString()
    };

    
    res.status(500).json(response);
};

module.exports = { getHealth };
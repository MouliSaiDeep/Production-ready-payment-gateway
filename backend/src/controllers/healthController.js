const db = require('../config/db');
const { paymentQueue } = require('../config/queue');

const checkHealth = async (req, res) => {
    const health = {
        status: 'healthy',
        database: 'disconnected',
        redis: 'disconnected',
        worker: 'stopped',
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Check Database
        await db.query('SELECT 1');
        health.database = 'connected';
    } catch (e) {
        // Database failed
    }

    try {
        // 2. Check Redis
        await paymentQueue.client.ping();
        health.redis = 'connected';
    } catch (e) {
        // Redis failed
    }

    try {
        // 3. Check Worker
        const workerStatus = await paymentQueue.client.get('worker_status');
        if (workerStatus === 'running') {
            health.worker = 'running';
        }
    } catch (e) {
        // Worker/Redis read failed
    }

    // Determine overall status
    if (health.database !== 'connected' || health.redis !== 'connected') {
        health.status = 'unhealthy';
    }

    // Return 200 with details (as requested), could be 503 if strict status checks needed
    res.status(200).json(health);
};

module.exports = { checkHealth };
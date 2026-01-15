const { paymentQueue, webhookQueue, refundQueue } = require('../config/queue');

// GET /api/v1/test/jobs/status
const getJobStatus = async (req, res) => {
    try {
        const counts = await paymentQueue.getJobCounts();

        res.json({
            pending: counts.waiting + counts.delayed,
            processing: counts.active,
            completed: counts.completed,
            failed: counts.failed,
            worker_status: "running"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getJobStatus };
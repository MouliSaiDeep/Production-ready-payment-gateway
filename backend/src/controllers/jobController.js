const { paymentQueue, webhookQueue, refundQueue } = require('../config/queue');

// GET /api/v1/test/jobs/status
const getJobStatus = async (req, res) => {
    try {
        const paymentCounts = await paymentQueue.getJobCounts();
        const webhookCounts = await webhookQueue.getJobCounts();
        const refundCounts = await refundQueue.getJobCounts();

        const getCount = (prop) => paymentCounts[prop] + webhookCounts[prop] + refundCounts[prop];

        res.json({
            pending: getCount('waiting') + getCount('delayed'),
            processing: getCount('active'),
            completed: getCount('completed'),
            failed: getCount('failed'),
            worker_status: "running"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getJobStatus };
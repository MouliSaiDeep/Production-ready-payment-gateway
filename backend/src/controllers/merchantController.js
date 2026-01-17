const db = require('../config/db');

const updateWebhookConfig = async (req, res) => {
    const merchantId = req.merchant.id;
    const { webhook_url } = req.body;

    try {
        await db.query(
            'UPDATE merchants SET webhook_url = $1, updated_at = NOW() WHERE id = $2',
            [webhook_url, merchantId]
        );

        res.json({ message: 'Configuration updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

const getMerchantDetails = async (req, res) => {
    const merchantId = req.merchant.id;
    try {
        const result = await db.query('SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1', [merchantId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Merchant not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

const regenerateSecret = async (req, res) => {
    const merchantId = req.merchant.id;
    const newSecret = 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    try {
        await db.query(
            'UPDATE merchants SET webhook_secret = $1, updated_at = NOW() WHERE id = $2',
            [newSecret, merchantId]
        );
        res.json({ webhook_secret: newSecret });
    } catch (error) {
        res.status(500).json({ error: 'Internal error' });
    }
};

module.exports = { updateWebhookConfig, getMerchantDetails, regenerateSecret };

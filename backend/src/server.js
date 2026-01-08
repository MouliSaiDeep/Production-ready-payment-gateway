const app = require('./app');
const initializeDatabase = require('./database/init');
require('dotenv').config();

const PORT = process.env.PORT || 8000;

async function startServer() {
    try {
        await initializeDatabase();

        // 2. Start Express Server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
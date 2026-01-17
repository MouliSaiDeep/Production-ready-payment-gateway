const path = require('path');

module.exports = {
    entry: './src/sdk/PaymentGateway.js',
    output: {
        filename: 'checkout.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'PaymentGateway',
            type: 'window',
            export: 'default'
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
};
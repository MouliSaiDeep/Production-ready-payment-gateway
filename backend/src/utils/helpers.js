const crypto = require('crypto');

const generatedId = (prefix) => {
    const randomChars = crypto.randomBytes(8).toString('hex');
    return `${prefix}${randomChars}`;
};

module.exports = { generatedId };
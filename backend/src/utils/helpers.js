const crypto = require('crypto');

const generateId = (prefix) => {
    const randomChars = crypto.randomBytes(8).toString('hex');
    return `${prefix}${randomChars}`;
};

module.exports = { generateId };
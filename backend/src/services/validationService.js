const validateVPA = (vpa) => {
    // Regex: ^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$ 
    // Fixed: Added underscore (_) to the allowed characters list
    const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return vpaRegex.test(vpa);
};

const validateLuhn = (number) => {
    const sanitized = number.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) return false;

    let sum = 0;
    let shouldDouble = false;

    // Loop backwards
    for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized.charAt(i));

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return (sum % 10) === 0;
};

const detectCardNetwork = (number) => {
    //
    const sanitized = number.replace(/[\s-]/g, '');

    if (/^4/.test(sanitized)) return 'visa';
    if (/^5[1-5]/.test(sanitized)) return 'mastercard';
    if (/^3[47]/.test(sanitized)) return 'amex';
    if (/^60|^65|^8[1-9]/.test(sanitized)) return 'rupay'; // 81-89

    return 'unknown';
};

const validateExpiry = (month, year) => {
    const current = new Date();
    const currentMonth = current.getMonth() + 1; // 0-indexed
    const currentYear = current.getFullYear();

    let expYear = parseInt(year);
    const expMonth = parseInt(month);

    // Handle 2-digit year (e.g., "25" -> 2025)
    if (expYear < 100) expYear += 2000;

    if (expMonth < 1 || expMonth > 12) return false;

    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
};

module.exports = {
    validateVPA,
    validateLuhn,
    detectCardNetwork,
    validateExpiry
};
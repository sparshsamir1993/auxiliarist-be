module.exports = {
    JWT_EXPIRY: 30, // 15 minutes
    REFRESH_EXPIRY: 60 * 60 * 60 * 60, // 150 days
    AUTH_TOKEN_HEADER: "authorization",
    REFRESH_TOKEN_HEADER: "refresh-token",
    ADMIN_ROLE: "ADMIN",
    USER_ROLE: "USER",
    FE_ADDRESS: !process.env.NODE_ENV || process.env.NODE_ENV === "development" ? 'http://localhost:3000' : ''
};

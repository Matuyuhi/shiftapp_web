module.exports = {
  connect: {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USERNAME || 'kinmumaster',
    password: process.env.MYSQL_PASSWORD || 'master',
    port: process.env.MYSQL_PORT || '3306',
    database: process.env.MYSQL_DATABASE || 'shiftapp',
    multipleStatements: process.env.MYSQL_MULTIPLESTATEMENTS || true,
    charset: process.env.MYSQL_CHARSET || 'UTF8mb4',
  },
  // HOST: process.env.MYSQL_HOST || "localhost",
  // PORT: process.env.MYSQL_PORT || "3306",
  // USERNAME: process.env.MYSQL_USERNAME || "kinmumaster",
  // PASSWORD: process.env.MYSQL_PASSWORD || "master",
  // DATABASE: process.env.MYSQL_DATABASE || "shiftapp",
  // MULTIPLESTATEMENTS: process.env.MYSQL_MULTIPLESTATEMENTS || true,
  // CHARSET: process.env.MYSQL_CHARSET || "UTF8mb4"
}

/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    roots: [ '<rootDir>/tests' ],
    setupFiles: [ '<rootDir>/tests/setup/env.js' ],
    setupFilesAfterEnv: [ '<rootDir>/tests/setup/mongodb.js', '<rootDir>/tests/setup/axios.js' ],
    testTimeout: 30000,
};
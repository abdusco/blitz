module.exports = {
    publicPath: process.env.NODE_ENV === 'production' ? 'ui/': '/',
    outputDir: '../wwwroot/ui',
    assetsDir: 'assets',
    devServer: {
        proxy: {
            '^/api': {
                target: 'https://localhost:5001'
            }
        }
    }
}
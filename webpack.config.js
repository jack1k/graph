const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    entry: "./src/index.js",
    output: {
        path: path.join(__dirname, "/build"),
        filename: "index.bundle.js",
        publicPath: "/"
    },
    devServer: {
        port: 3000,
        historyApiFallback: true
    },
    plugins: [new HtmlWebpackPlugin({ template: "./public/index.html" })],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node-modules/,
                use: { loader: "babel-loader" }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".jsx", ".js"]
    }
}

module.exports = {
  publicPath: "/threejs-demos/",
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.glsl$/,
          use: [{
            loader: 'glsl-loader'
          }]
        }
      ]
    }
  }
};

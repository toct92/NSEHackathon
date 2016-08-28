module.exports = {
  build: {
    "index.html": "index.html",
    "app.js": [
      "javascripts/app.js",
      "javascripts/customgrid.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ]
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};

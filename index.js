const http = require("http");

const hostname = "0.0.0.0";
const port = 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end(`Haaa meri jaaaannnnnn!!!!!! Deployed via GitHub Actions at ${new Date().toISOString()}\n`);
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
    console.log(`Done deploying via GitHub Actions!`);
});

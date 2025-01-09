const http = require("http");
const fs = require("fs");
const mime = require("mime-types");
const url = require("node:url");

const handlers = require("./handlers");

function serveStatic(req, res) {
    const method = req.method;
    if (method !== "GET") return false;

    const requestUrl = req.url;
    let doc = "./public" + requestUrl;
    if (doc.endsWith("/")) doc = doc + "index.html";

    try {
        let data = fs.readFileSync(doc);
        let mt = mime.lookup(doc);
        res.writeHead(200, { "Content-type": mt });
        res.write(data);
        res.end();
        return true;
    } catch (err) {
        return false;
    }
}

function handleRequest(req, res) {
    let q=new url.URL(req.url,"http://localhost/");

    let data='';
    req.on('data',function(part){
        data=data+part;
    });
    req.on('end',function(){
        if (req.headers['content-type']=='application/json'){
            try{ // konvertiramo podatke u JSON objekt
                data=JSON.parse(data);
            } catch(err) {
                res.statusCode = 406; // not acceptable - trebamo JSON objekt
                res.statusMessage = "not acceptable - "+err;
                res.end();
                return true;
            }
        }

        let pathname=q.pathname;
        let handler=handlers.get(pathname);
        let handled=false;

        if (handler!=undefined) {
            handled=handler(req,res,q,data);
        } else {
            handled=serveStatic(req,res);
        }
        if (!handled) {
            res.statusCode = 404;
            res.end();
        }
    });
    }


const server = http.createServer(handleRequest);
server.listen(8080);


/***************************************************************************************************************/
// OLD CODE

/*
const http = require("http");
const fs = require("fs");
const mime = require("mime-types");
const url = require("node:url");

const handlers = require("./handlers");

function serveStatic(req, res) {
    const method = req.method;
    if (method != "GET") return false;

    const url = req.url;
    let doc = "./public" + url;
    if (doc.endsWith("/")) doc = doc + "index.html";

    try {
        let data = fs.readFileSync(doc);
        let mt = mime.lookup(doc);
        res.writeHead(200, { "Content-type": mt });
        res.write(data);
        res.end();
        return true;
    } catch (err) {
        return false;
    }
}

function handleRequest(req, res) {
    let data = '';
    req.on('data', function (part) {
        data = data + part;
    });

    req.on('end', function () {
        const headers = req.headers;
        let q = new url.URL(req.url, "http://localhost/");
        let pathname = q.pathname;
        const method = req.method;
        let handled = false;
        let handler = handlers.get(pathname);

        if (handler != undefined) {
            if (req.headers['content-type'] == 'application/json') {
                data = JSON.parse(data);
            }
            handled = handler(req, res, q, data);
        }

        if (!handled) {
            handled = serveStatic(req, res);
        }

        if (!handled) {
            res.statusCode = 404;
            res.end();
        }
    });
}


const server = http.createServer(handleRequest);
server.listen(8080);
*/

/*
const http = require("http");
const fs = require("fs");
const mime = require("mime-types");
const url = require("node:url");

const handlers = require("./handlers");

function serveStatic(req, res) {
    const method = req.method;
    if (method !== "GET") return false;

    let doc = "./public" + req.url;
    if (doc.endsWith("/")) doc += "index.html";

    try {
        const data = fs.readFileSync(doc);
        const mt = mime.lookup(doc) || "application/octet-stream"; // Fallback MIME type
        res.writeHead(200, { "Content-Type": mt });
        res.write(data);
        res.end();
        return true;
    } catch (err) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "File not found" }));
        return true; // Indicate that we handled the response
    }
}

function handleRequest(req, res) {
    let data = "";

    req.on("data", (part) => {
        data += part;
    });

    req.on("end", () => {
        const headers = req.headers;
        const q = new url.URL(req.url, "http://localhost/");
        const pathname = q.pathname;
        const method = req.method;
        let handled = false;
        const handler = handlers.get(pathname);

        if (handler !== undefined) {
            if (headers["content-type"] === "application/json") {
                try {
                    data = JSON.parse(data);
                } catch (error) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Invalid JSON" }));
                    return; // End early on error
                }
            }
            handled = handler(req, res, q, data);
        }

        if (!handled) {
            handled = serveStatic(req, res);
        }

        if (!handled) {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: "Not Found" }));
        }
    });
}

const server = http.createServer(handleRequest);
server.listen(8080, () => {
    console.log("Server listening on port 8080");
});
*/


/*
function handleRequest(req, res) {

    let data = '';
    req.on('data', function (part) {
        data += part;
    });

    req.on('end', function () {
        const headers = req.headers;
        let q = new url.URL(req.url, "http://localhost/");
        let pathname = q.pathname;
        const method = req.method;
        let handled = false;
        let handler = handlers.get(pathname);

        if (handler) {
            if (req.headers['content-type']?.includes('application/json')) {
                try {
                    data = JSON.parse(data);
                } catch (error) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: "Invalid JSON format" }));
                    return;
                }
            }
            handled = handler(req, res, q, data) ?? false;
        }

        if (!handled) {
            handled = serveStatic(req, res);
        }

        if (!handled) {
            res.statusCode = 404;
            res.end();
        }
    });
}
*/


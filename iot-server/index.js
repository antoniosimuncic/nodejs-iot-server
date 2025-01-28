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

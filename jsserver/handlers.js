const sqlite=require("node:sqlite");

let handlers=new Map ();

function _Users(req,res,q,data){
    const sp=q.searchParams;
    const id=sp.get("id");
    if (req.method=='GET' && id==null){
        const db=new sqlite.DatabaseSync("./knjiznica.db",{open:false});
        db.open();
        const sql="SELECT * FROM clanovi";
        const statement=db.prepare(sql);
        const result=statement.all();
        res.writeHead(200,{"Content-Type":"application/json"})
        let data=JSON.stringify(result)
        res.write(data);
        res.end();
        db.close();
        return true;
    }else if(req.method=='GET' && id!=null){
        const db=new sqlite.DatabaseSync("./knjiznica.db",{open:false});
        db.open();
        const sql="SELECT * FROM clanovi WHERE id=:id";
        const params={"id":id};
        const statement=db.prepare(sql);
        const result=statement.get(params);
        if (result==undefined){
            res.statusCode=404;
            res.statusMessage = 'Clan sa id='+id+' ne postoji'; 
            res.end();
            db.close();
            return true;
        }
        res.writeHead(200,{"Content-Type":"application/json"})
        let data=JSON.stringify(result)
        res.write(data);
        res.end();
        db.close();
        return true;
    }else if(req.method=='POST'){
        const db=new sqlite.DatabaseSync("./knjiznica.db",{open:false});
        db.open();
        const sql="INSERT into clanovi (ime,prezime,datumRodjenja) VALUES (:ime,:prezime,:datumRodjenja)";
        const statement=db.prepare(sql);
        const result=statement.run(data);
        if (result.changes==0){
            res.statusCode=410;
            res.statusMessage = 'zapis nije insertiran'; 
            res.end();
            db.close();
            return true;
        }
        data["id"]=result.lastInsertRowid;
        res.writeHead(200,{"Content-Type":"application/json"})
        let ret=JSON.stringify(data)
        res.write(ret);
        res.end();
        db.close();
        return true;
    }
    return false;
}

handlers.set("/users",_Users) ;

module.exports=handlers;
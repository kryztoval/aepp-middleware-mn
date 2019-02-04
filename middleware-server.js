try { var config = require("./config.json") }
catch (exception) { }

var pollslow, pollfast, polltick, pollsleep, blocks_from_top;
var mongo_db, mongo_url, base_url, debug_level;
var httpsport, httpport;

// polling configurations
if (config && config.pollslow) { pollslow = config.pollslow; } else { pollslow = 1000; }
if (config && config.pollfast) { pollfast = config.pollfast; } else { pollfast = 0; }
if (config && config.polltick) { polltick = config.polltick; } else { polltick = 500; }
if (config && config.pollsleep) { pollsleep = config.pollsleep; } else { pollsleep = 30000; }
if (config && config.blocks_from_top) { blocks_from_top = config.blocks_from_top; } else { blocks_from_top = 1; }

//middleware configurations
if (config && config.mongo_db) { mongo_db = config.mongo_db; } else { mongo_db = "middleware"; }
if (config && config.mongo_url) { mongo_url = config.mongo_url; } else { mongo_url = "mongodb://127.0.0.1:27017"; }
if (config && config.base_url) { base_url = config.base_url; } else { base_url = "http://127.0.0.1:3013"; }
if (config && config.debug_level) { debug_level = config.debug_level; } else { debug_level = 1; }

//middleware server configurations
if (config && config.httpsport) { httpsport = config.httpsport; } else { httpsport = 3011; }
if (config && config.httpport) { httpport = config.httpport; } else { httpport = false; }

// dependencies: mongodb restify http-proxy
const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(mongo_url,{ useNewUrlParser: true });

var keyblocks, microblocks, transactions, pending;
var fs = require("fs")
var restify = require("restify");

/* http restify server */
var http_server;
if(httpport) {
  http_server = restify.createServer();
  http_server.use(restify.plugins.queryParser());
  http_server.use(function(req, res, next) {
    console.log(req.headers["x-forwarded-for"]||req.connection.remoteAddress,req.url);
    res.header("Access-Control-Allow-Origin", "*");
    return next();
  });
  http_server.get("/middleware/transactions/account/:account", getTransactionsByAccount);
  http_server.get("/middleware/transactions/account/:account/count", getTransactionCountByAccount);
  http_server.get("/middleware/transactions/interval/:from/:to", getTransactionsFromRange);
  http_server.get("/middleware/key-blocks/:height/gas-price", getAvgGasPriceByHeight);
  http_server.get("/middleware/contracts/transactions/address/:address",getContractsTransactionsByAddress);
  http_server.get("/v2/key-blocks/current/height", getKeyblockCurrentHeight);
  http_server.get("/v2/generations/height/:height", getGenerationByHeight);
  //http_server.get("/v2/key-blocks/current", getKeyblockCurrent);
  //http_server.get("/v2/key-blocks/height", getKeyblockByHeight);
  http_server.on("NotFound", nodeForward); //forward anything we can't solve to the node
}

/* https restify server */
const https_options = {
  key: fs.readFileSync("/etc/webmin/letsencrypt-key.pem", "utf8"),
  cert: fs.readFileSync("/etc/webmin/letsencrypt-cert.pem", "utf8")
};
var https_server;
if(httpsport) {
  https_server = restify.createServer(https_options);
  https_server.use(restify.plugins.queryParser());
  https_server.use(function(req, res, next) {
    console.log(req.headers["x-forwarded-for"]||req.connection.remoteAddress,req.url);
    res.header("Access-Control-Allow-Origin", "*");
    return next();
  });
  https_server.get("/middleware/transactions/account/:account", getTransactionsByAccount);
  https_server.get("/middleware/transactions/account/:account/count", getTransactionCountByAccount);
  https_server.get("/middleware/transactions/interval/:from/:to", getTransactionsFromRange);
  https_server.get("/middleware/key-blocks/:height/gas-price", getAvgGasPriceByHeight);
  https_server.get("/middleware/contracts/transactions/address/:address",getContractsTransactionsByAddress);
  https_server.get("/v2/key-blocks/current/height", getKeyblockCurrentHeight);
  https_server.get("/v2/generations/height/:height", getGenerationByHeight);
  //https_server.get("/v2/key-blocks/current", getKeyblockCurrent);
  //https_server.get("/v2/key-blocks/height/:height", getKeyblockByHeight);
  https_server.on("NotFound", nodeForward); //forward anything we can't solve to the node
}

client.connect(function(err) {
  if(!err) {
    if(debug_level>0) console.log("Connected successfully to server");
    transactions = client.db(mongo_db).collection("transactions");
    keyblocks = client.db(mongo_db).collection("keyblocks");

    if(httpport) http_server.listen(httpport, function() {
      console.log("%s listening at %s", http_server.name, http_server.url);
    });

    if(httpsport) https_server.listen(httpsport, function() {
      console.log("%s listening at %s", https_server.name, https_server.url);
    });
  } else {
    console.log(err);
  }
});

client.on("close", () => { console.log("-> lost connection"); });
client.on("reconnect", () => { console.log("-> reconnected"); });

/* web handlers *//*
function getKeyblockCurrent(req, res, next) {
  keyblocks.find({}).sort({_id:-1}).limit(1).toArray(function(error, docs) {
    if(!error && docs.length == 1) {
      res.write( JSON.stringify(docs[0]));
    }
    res.end();
  });
}

function getKeyblockByHeight(req, res, next) {
  var params = {};
  if (req.params.height) params._id=parseInt(req.params.height);
  keyblocks.find(params).toArray(function(error, docs) {
    if(!error && docs.length == 1) {
      docs[0].key_block.txs_count = docs[0].txs_count;
      res.write( JSON.stringify(docs[0].key_block));
    }
    res.end();
  });
}*/

function getContractsTransactionsByAddress(req, res, next) {
  var params = {};
  var limit = 0;
  var page = 0;
  if(req.query.limit) limit = Math.max(0,parseInt(req.query.limit));
  if(req.query.page) page = Math.max(0,parseInt(req.query.page)-1);

  if(req.params.address) {
    params["tx.contract_id"] = req.params.address;
    params["tx.type"] = "ContractCallTx";

    transactions.find(params).sort({"block_height":-1}).limit(limit).skip(limit*page).toArray(function(err, docs){
      res.write( JSON.stringify({transactions:docs}));
    	res.end();
    });
  } else {
    error = {};
    error.message = "There was a parameter error";
    res.write( JSON.stringify(error));
  	res.end();
  }
}

function getKeyblockCurrentHeight(req, res, next) {
  keyblocks.find({}).sort({_id:-1}).limit(1).toArray(function(error, docs) {
    if(!error && docs.length == 1) {
      res.write( JSON.stringify({height:docs[0]._id}) );
    }
    res.end();
  });
}

function nodeForward(req, res, next) {
  const request = require("request");

  console.log(req.headers["x-forwarded-for"]||req.connection.remoteAddress,"---",req.url);

  request(base_url+req.url, { json: true }, (err, resp, body) => {
    if (err) { return console.log(err); }
    else {
      if(body) {
        res.header("Access-Control-Allow-Origin", "*");
        res.write(JSON.stringify(body));
      } else {
        res.status(resp.statusCode);
      }
      res.end();
    }
  });
}

function getTransactionsByAccount(req, res, next) {
  var params = {};
  var limit = 0;
  var page = 0;
  if(req.query.limit) limit = Math.max(0,parseInt(req.query.limit));
  if(req.query.page) page = Math.max(0,parseInt(req.query.page)-1);

  if(req.params.account) {
    params["$or"] = [{ "tx.recipient_id": req.params.account}, { "tx.sender_id": req.params.account}, {"tx.account_id": req.params.account}];

    transactions.find(params).sort({"block_height":-1}).limit(limit).skip(limit*page).toArray(function(err, docs){
      res.write( JSON.stringify({transactions:docs}));
    	res.end();
    });
  } else {
    error = {};
    error.message = "There was a parameter error";
    res.write( JSON.stringify(error));
  	res.end();
  }
}

function getTransactionCountByAccount(req, res, next) {
  var params = {};
  if(req.params.account) {
    params["$or"] = [{ "tx.recipient_id": req.params.account}, { "tx.sender_id": req.params.account}, {"tx.account_id": req.params.account}];

    transactions.countDocuments(params,function(err, count){
      res.write( JSON.stringify({count:count}));
    	res.end();
    });
  } else {
    error = {};
    error.message = "There was a parameter error";
    res.write( JSON.stringify(error));
  	res.end();
  }
}

function getTransactionsFromRange(req, res, next) {
  var params = {};
  var limit = 0;
  var page = 0;
  if(req.query.limit) limit = Math.max(0,parseInt(req.query.limit));
  if(req.query.page) page = Math.max(0,parseInt(req.query.page)-1);

  if(req.params.from && req.params.to) {
    params["$and"] = [];
    params["$and"][0] = {};
    params["$and"][0]["block_height"] = {};
    params["$and"][0]["block_height"]["$gte"] = Math.min(parseInt(req.params.from),parseInt(req.params.to));
    params["$and"][1] = {};
    params["$and"][1]["block_height"] = {};
    params["$and"][1]["block_height"]["$lte"] = Math.max(parseInt(req.params.from),parseInt(req.params.to));

    //console.log(params);
    transactions.find(params).sort({"block_height":-1,_id:1}).limit(limit).skip(limit*page).toArray(function(err, docs){
      res.write( JSON.stringify({transactions: docs}));
    	res.end();
    });
  } else {
    error = { message:"There was a parameter error" };
    res.write( JSON.stringify(error));
  	res.end();
  }
}

function getGenerationByHeight(req, res, next) {
  var params = {};
  if(req.params.height) {
    params._id = parseInt(req.params.height);

    keyblocks.find(params).limit(1).toArray(function(error, docs){
      if(!error && docs.length==1) {
        res.write(JSON.stringify(docs[0]));
      } else {
        res.write(JSON.stringify({}));
      }
      res.end();
    });
  } else {
    error = {};
    error.message = "There was a parameter error";
    res.write( JSON.stringify(error));
  	res.end();
  }
}

function getAvgGasPriceByHeight(req, res, next) {
  var params = {};
  if(req.params.height) {
    params.block_height = parseInt(req.params.height);

    //console.log(params);
    transactions.find(params).sort({"block_height":-1}).toArray(function(err, docs){
      count = 0; sum = 0;
      for(index in docs) {
        count++;
        sum += docs[index].tx.fee;
      }
      result = {};
      result.count = count;
      result.total = sum;
      result.average = sum/count;
      result.height = params.block_height;
      res.write( JSON.stringify(result));
    	res.end();
    });
  } else {
    error = {};
    error.message = "There was a parameter error";
    res.write( JSON.stringify(error));
  	res.end();
  }
}

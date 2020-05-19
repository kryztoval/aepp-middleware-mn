try { var config = require("./config.json") }
catch (exception) { }

var pollslow, pollfast, polltick, pollsleep, blocks_from_top;
var mongo_db, mongo_url, base_url, debug_level;
var httpsport, httpport, key_pem, cert_pem;
var enable_explorer;

// polling configurations
if (config && config.pollslow) { pollslow = config.pollslow; } else { pollslow = 1000; }
if (config && config.pollfast) { pollfast = config.pollfast; } else { pollfast = 0; }
if (config && config.polltick) { polltick = config.polltick; } else { polltick = 500; }
if (config && config.pollsleep) { pollsleep = config.pollsleep; } else { pollsleep = 30000; }
if (config && config.blocks_from_top) { blocks_from_top = config.blocks_from_top; } else { blocks_from_top = 1; }

// middleware configurations
if (config && config.mongo_db) { mongo_db = config.mongo_db; } else { mongo_db = "middleware"; }
if (config && config.mongo_url) { mongo_url = config.mongo_url; } else { mongo_url = "mongodb://127.0.0.1:27017"; }
if (config && config.base_url) { base_url = config.base_url; } else { base_url = "http://127.0.0.1:3013"; }
if (config && config.debug_level) { debug_level = config.debug_level; } else { debug_level = 1; }

// middleware server configurations
if (config && config.httpport>0) { httpport = config.httpport; } else { httpport = false; }

// middleware secure server configuration
if (config && config.httpsport>0) { httpsport = config.httpsport; } else { httpsport = false; }
if (config && config.key_pem) { key_pem = config.key_pem; } else { key_pem = "./key.pem"; }
if (config && config.cert_pem) { cert_pem = config.cert_pem; } else { cert_pem = "./cert.pem"; }

if (config && config.enable_explorer) { enable_explorer = config.enable_explorer; } else { enable_explorer = false }

// dependencies: mongodb restify http-proxy
const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(mongo_url,{ useNewUrlParser: true });
const path = require('path')

var keyblocks, microblocks, transactions, pending;
var fs = require("fs");
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
  http_server.get("/middleware/transactions/interval/:from/:to/count", getTransactionCountFromRange);
  http_server.get("/middleware/key-blocks/:height/gas-price", getAvgGasPriceByHeight);
  http_server.get("/middleware/contracts/transactions/address/:address",getContractsTransactionsByAddress);
  http_server.get("/v2/key-blocks/current/height", getKeyblockCurrentHeight);
  http_server.get("/v2/generations/height/:height", getGenerationByHeight);
  http_server.get('/middleware/transactions/:hash', getTransactionsByHash)
  http_server.get('/middleware/transactions/rate/:from/:to', getTransactionRateFromRange)
  http_server.get('/middleware/channels/transactions/address/:address', getChannelTransactionsByAddress)
  http_server.get('/middleware/contracts/all', getContracts)
  http_server.get('/middleware/oracles/all', getOracles)
  if (enable_explorer) { http_server.get('/explorer', function (req, res, next) { res.redirect('/explorer/', next) }) }
  if (enable_explorer) { http_server.get('/explorer/*', staticFiles) }
  if (enable_explorer) { http_server.get('/favicon.ico', staticFiles) }
  http_server.on("NotFound", nodeForward); //forward anything we can't solve to the node
}

var https_options;
/* https restify server */
if(httpsport!=false)  {
  https_options = {
    key: fs.readFileSync(key_pem, "utf8"),
    cert: fs.readFileSync(cert_pem, "utf8")
  };
}

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
  https_server.get("/middleware/transactions/interval/:from/:to/count", getTransactionCountFromRange);
  https_server.get("/middleware/key-blocks/:height/gas-price", getAvgGasPriceByHeight);
  https_server.get("/middleware/contracts/transactions/address/:address",getContractsTransactionsByAddress);
  https_server.get("/v2/key-blocks/current/height", getKeyblockCurrentHeight);
  https_server.get("/v2/generations/height/:height", getGenerationByHeight);
  https_server.get('/middleware/transactions/:hash', getTransactionsByHash)
  https_server.get('/middleware/transactions/rate/:from/:to', getTransactionRateFromRange)
  https_server.get('/middleware/channels/transactions/address/:address', getChannelTransactionsByAddress)
  https_server.get('/middleware/contracts/all', getContracts)
  https_server.get('/middleware/oracles/all', getOracles)
  if (enable_explorer) { https_server.get('/explorer', function (req, res, next) { res.redirect('/explorer/', next) }) }
  if (enable_explorer) { https_server.get('/explorer/*', staticFiles) }
  if (enable_explorer) { http_server.get('/favicon.ico', staticFiles) }
  https_server.on('NotFound', nodeForward) // forward anything we can't solve to the node
}

function staticFiles (req, res, next) {
  var filename = 'index.html'
  if(req.url == '/favicon.ico') { filename = 'favicon.ico' }
  if (req.params["*"]) {
    filename = req.params["*"]
  }
  fs.readFile(path.join(__dirname, 'explorer', filename), function (err, data) {
    if (err) {
      next(err)
      return
    }

    //res.setHeader('Content-Type', 'text/html')
    res.writeHead(200)
    res.end(data)
    next()
  })
}

function getOracles (req, res, next) {
  var limit = 0
  var page = 0
  if (req.query.limit) limit = Math.max(config && config.limit_min, parseInt(req.query.limit))
  limit = Math.min(config && config.limit_max, limit)
  if (req.query.page) page = Math.max(0, parseInt(req.query.page) - 1)

  var params = { 'tx.type': 'OracleRegisterTx' }
  transactions.find(params).sort({ 'block_height': -1 }).limit(limit).skip(limit * page).toArray(function (err, docs) {
    if (err) {
      res.write(JSON.stringify({ error: err }))
    } else {
      res.write(JSON.stringify(docs))
    }
    res.end()
  })
}

function getContracts (req, res, next) {
  var limit = 0
  var page = 0
  if (req.query.limit) limit = Math.max(config && config.limit_min, parseInt(req.query.limit))
  limit = Math.min(config && config.limit_max, limit)
  if (req.query.page) page = Math.max(0, parseInt(req.query.page) - 1)

  var params = { 'tx.type': 'ContractCreateTx' }
  var projection = { block_height: 1, hash: 1 }
  transactions.find(params, projection).sort({ 'block_height': -1 }).limit(limit).skip(limit * page).toArray(function (err, docs) {
    if (err) {
      res.write(JSON.stringify({ error: err }))
    } else {
      var result = []
      for (var i in docs) {
        result[i] = {}
        result[i].block_height = docs[i].block_height
        result[i].contract_id = 'not known :('
        result[i].transaction_hash = docs[i].hash
      }
      res.write(JSON.stringify(result))
    }
    res.end()
  })
}

function getChannelTransactionsByAddress (req, res, next) {
  var limit = 0
  var page = 0
  if (req.query.limit) limit = Math.max(config && config.limit_min, parseInt(req.query.limit))
  limit = Math.min(config && config.limit_max, limit)
  if (req.query.page) page = Math.max(0, parseInt(req.query.page) - 1)

  var params = {} // { 'tx.type': { $in: ['ChannelCloseMutualTx', 'ChannelCloseSoloTx', 'ChannelCreateTx', 'ChannelDepositTx', 'ChannelForceProgressTx', 'ChannelSettleTx', 'ChannelSlashTx', 'ChannelSnapshotSoloTx', 'ChannelWithdrawTx', 'ChannelCreateTx'] } }
  if (req.params.address) {
    params['tx.channel_id'] = req.params.address

    transactions.find(params).sort({ 'block_height': -1 }).limit(limit).skip(limit * page).toArray(function (err, docs) {
      if (err) {
        res.write(JSON.stringify({ error: err }))
      } else {
        res.write(JSON.stringify({ transactions: docs }))
      }
      res.end()
    })
  } else {
    var error = {}
    error.message = 'There was a parameter error'
    res.write(JSON.stringify(error))
    res.end()
  }
}

function getTransactionRateFromRange (req, res, next) {
  var params = [ { $match: { 'tx.type': 'SpendTx', time: { $exists: true } } }, { $project: { _id: { '$toDate': { '$toLong': '$time' } }, 'tx.amount': 1 } }, { $group: { _id: { '$dateFromString': { format: '%Y-%m-%d', dateString: { '$dateToString': { format: '%Y-%m-%d', date: '$_id' } } } }, amount: { $sum: '$tx.amount' }, total: { $sum: 1 } } }, { $sort: { _id: -1 } } ]
  if (req.params.from && req.params.to) {
    params[0]['$match']['block_height'] = { $gte: parseInt(req.params.from), $lte: parseInt(req.params.to) }
    transactions.aggregate(params).toArray(function (err, docs) {
      if (err) {
        res.write(JSON.stringify({ error: err }))
      } else {
        res.write(JSON.stringify({ result: docs }))
      }
      res.end()
    })
  } else {
    var error = {}
    error.message = 'There was a parameter error'
    res.write(JSON.stringify(error))
    res.end()
  }
}

function getTransactionsByHash (req, res, next) {
  var params = {}
  var limit = 0
  var page = 0
  if (req.query.limit) limit = Math.max(config && config.limit_min, parseInt(req.query.limit))
  limit = Math.min(config && config.limit_max, limit)
  if (req.query.page) page = Math.max(0, parseInt(req.query.page) - 1)

  if (req.params.hash) {
    params.block_hash = req.params.hash

    transactions.find(params).limit(limit).skip(limit * page).toArray(function (err, docs) {
      if (err) {
        res.write(JSON.stringify({ error: err }))
      } else {
        res.write(JSON.stringify({ transactions: docs }))
      }
      res.end()
    })
  } else {
    var error = {}
    error.message = 'There was a parameter error'
    res.write(JSON.stringify(error))
    res.end()
  }
}

function tryConnect () {
  client.connect(function (err) {
    if (!err) {
      if (debug_level > 0) { console.log('Connected successfully to server') }
      transactions = client.db(mongo_db).collection('transactions')
      keyblocks = client.db(mongo_db).collection('keyblocks')

      if (httpport) {
        http_server.listen(httpport, function () {
          console.log('%s listening at %s', http_server.name, http_server.url)
        })
      }

      if (httpsport) {
        https_server.listen(httpsport, function () {
          console.log('%s listening at %s', https_server.name, https_server.url)
        })
      }
    } else {
      setTimeout(tryConnect, 20000)
      console.log(err)
    }
  })
} tryConnect()

client.on('connect', () => { console.log('-> connected') })
client.on('error', () => { console.log('-> error') })
client.on('timeout', () => { console.log('-> timed out') })
client.on("close", () => { console.log("-> lost connection"); });
client.on("reconnect", () => { console.log("-> reconnected"); });

function getContractsTransactionsByAddress(req, res, next) {
  var params = {};
  var limit = 0;
  var page = 0;
  if(req.query.limit) limit = Math.max(config && config.limit_min, parseInt(req.query.limit));
  limit = Math.min(config && config.limit_max, limit)
  if(req.query.page) page = Math.max(0, parseInt(req.query.page)-1);

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
  if(req.query.limit) limit = Math.max(config && config.limit_min, parseInt(req.query.limit));
  limit = Math.min(config && config.limit_max, limit)
  if(req.query.page) page = Math.max(0, parseInt(req.query.page)-1);

  if(req.params.account) {
    params["$or"] = [{ "tx.recipient_id": req.params.account}, { "tx.sender_id": req.params.account}, {"tx.account_id": req.params.account}];

    transactions.find(params).sort({"block_height":-1}).limit(limit).skip(limit*page).toArray(function(err, docs){
      if(err) {
        res.write( JSON.stringify({ error: err }) )
      } else {
        res.write( JSON.stringify({transactions:docs}));
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

function getTransactionCountFromRange(req, res, next) {
  var params = {};
  var limit = 0;
  var page = 0;
  if(req.query.limit) limit = Math.max(config && config.limit_min, parseInt(req.query.limit));
  limit = Math.min(config && config.limit_max, limit)
  if(req.query.page) page = Math.max(0, parseInt(req.query.page)-1);

  if(req.params.from && req.params.to) {
    params["$and"] = [];
    params["$and"][0] = {};
    params["$and"][0]["block_height"] = {};
    params["$and"][0]["block_height"]["$gte"] = Math.min(parseInt(req.params.from),parseInt(req.params.to));
    params["$and"][1] = {};
    params["$and"][1]["block_height"] = {};
    params["$and"][1]["block_height"]["$lte"] = Math.max(parseInt(req.params.from),parseInt(req.params.to));

    // console.log(params);
    transactions.countDocuments(params,function(err, count){
      res.write( JSON.stringify({count:count}));
    	res.end();
    });
  } else {
    error = { message:"There was a parameter error" };
    res.write( JSON.stringify(error));
  	res.end();
  }
}

function getTransactionsFromRange(req, res, next) {
  var params = {};
  var limit = 0;
  var page = 0;
  if(req.query.limit) limit = Math.max(config && config.limit_min, parseInt(req.query.limit));
  limit = Math.min(config && config.limit_max, limit)
  if(req.query.page) page = Math.max(0, parseInt(req.query.page)-1);

  if(req.params.from && req.params.to) {
    params["$and"] = []
    params["$and"][0] = {}
    params["$and"][0]["block_height"] = {}
    params["$and"][0]["block_height"]["$gte"] = Math.min(parseInt(req.params.from), parseInt(req.params.to))
    params["$and"][1] = {}
    params["$and"][1]["block_height"] = {}
    params["$and"][1]["block_height"]["$lte"] = Math.max(parseInt(req.params.from), parseInt(req.params.to))

    // console.log(params);
    transactions.find(params).sort({ 'block_height': -1, _id: 1 }).limit(limit).skip(limit * page).toArray(function (err, docs) {
      if (!err) {
        res.write(JSON.stringify({ transactions: docs }))
        res.end()
      }
    })
  } else {
    var error = { message: 'There was a parameter error' }
    res.write(JSON.stringify(error))
    res.end()
  }
}

function getGenerationByHeight (req, res, next) {
  var params = {}
  if (req.params.height) {
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
      if (sum/count) {
        result.average = sum/count
      } else {
        result.average = 0
      }
      result.height = params.block_height;
      res.write( JSON.stringify(result));
    	res.end();
    });
  } else {
    error = {};
    error.message = "There was a parameter error";
    res.write(JSON.stringify(error));
  	res.end();
  }
}

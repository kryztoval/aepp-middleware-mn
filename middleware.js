try { var config = require("./config.json") }
catch (exception) { }

var pollslow, pollfast, polltick, pollsleep, blocks_from_top;
var mongo_db, mongo_url, base_url, debug_level;

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

// calculated variables
const base_block=base_url+"/v2/generations/height/";
const base_microblock=base_url+"/v2/micro-blocks/hash/";
const top_block=base_url+"/v2/key-blocks/current";

// dependencies: mongodb request
const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(mongo_url,{ useNewUrlParser: true, useUnifiedTopology: true });

var request = require("request");

var status = {}; //status variable
status.keyblocks = {};
status.microblocks = {};
status.transactions = {};
status.keyblocks.current = 0;
status.keyblocks.top = 0;
status.reset = {};
status.reset.block = 0;
status.reset.retry = 1;

var keyblocks, microblocks, transactions, pending;

client.connect(function(err) {
  if(!err) {
    if(debug_level>0) console.log("Connected successfully to Mongo server");
    keyblocks = client.db(mongo_db).collection("keyblocks");
    microblocks = client.db(mongo_db).collection("microblocks");
    transactions = client.db(mongo_db).collection("transactions");;
    pending = client.db(mongo_db).collection("pending");;

    //setInterval(retryFailKeyblocks,pollsleep);

    async function clearMe() {
      for(i = 395000; i<=400000; i++)
      {
        await clearBlockData(i);
      }
      process.exit()
    } //clearMe()

    setInterval(retryFailKeyblocks, pollsleep)
    getBlock(getBlockLoop);
    getTopBlock(getTopBlockLoop);
    getMicroBlockLoop();
    getTransactionLoop();
    cleanUpPendingLoop();
    calcKeyblocksLoop();
  } else {
    if(debug_level>0) console.log(err);
    process.exit();
  }
});

function getTopBlockLoop() { setTimeout(function() { getTopBlock(getTopBlockLoop); },pollsleep); }
function getBlockLoop() { setTimeout(function() { getBlock(getBlockLoop); },pollslow); }
function getMicroBlockLoop() { setTimeout(function() { getMicroBlock(getMicroBlockLoop); },polltick); }
function getTransactionLoop() { setTimeout(function() { getTransaction(getTransactionLoop); }, polltick); }
function cleanUpPendingLoop() { setTimeout(function() { cleanUpPending(cleanUpPendingLoop); }, polltick); }
function calcKeyblocksLoop() { setTimeout(function() { calcKeyblocks(calcKeyblocksLoop); }, polltick); }

function getTopBlock(release) {
  if(debug_level>1) console.log("getTopBlock");
    try {
      request(top_block, function(error,response,body) {
        if(!error && body) {
          var parsed=JSON.parse(body);
          status.keyblocks.top = parsed.height;
        } else {
          console.log("getTopBlock" + error);
        }
        release();
      });
    }
    catch(exception) {
      if(debug_level>0) console.log("Temporary error getting top block.");
      release();
    }
}

function getBlock(release) {  //checks the current block height in the chain
  if(debug_level>1) console.log("getBlock");
  keyblocks.find({}).sort({"_id":-1}).limit(1).toArray(function(err, docs){
    if(!err){
      if(docs.length == 1) {
        status.keyblocks.current = docs[0].key_block.height+1;
      } else {
        status.keyblocks.current = 0
      }
      if(status.keyblocks.current<status.keyblocks.top) { //we want to be 1 block behind so we give the microblocks time to be gathered
        requestBlock(status.keyblocks.current,release);
      } else {
        release();
      }
    } else {
      release();
    }
  });
}

function requestBlock(height, release) {
  request(base_block+height, function(error,response,body) {
    if(!error) {
      var parsedblock
      try {
       parsedblock = JSON.parse(body);
      }
      catch(exception) {
        console.log(exception);
        releae();
      }
      if(!parsedblock.reason) {
        parsedblock._id=parsedblock.key_block.height;
        if(parsedblock.micro_blocks.length==0) {
          parsedblock.txs_count=0;
          //parsedblock.processed=true;
        } else {
          for(index in parsedblock.micro_blocks) {
            var pendingObj = {};
            pendingObj._id = parsedblock.micro_blocks[index];
            pendingObj.height = parsedblock.key_block.height;
            pendingObj.th = true;
            pendingObj.mh = true;
            pending.insertOne(pendingObj, function(error, docs) {
              if(!error) {
                if(debug_level>0) console.log(parsedblock.key_block.height, "new microblock", parsedblock.micro_blocks.length, docs.ops[0]._id);
              }
              else {
                //console.log(error.errmsg);
              }
            });
          }
        }
        keyblocks.insertOne(parsedblock, function(error, doc) {
          if(!error) {
            if(debug_level>0) console.log(new Date(parsedblock.key_block.time), parsedblock.key_block.height, status.keyblocks.top);
            //status.keyblocks.current = parsedblock.key_block.height; //Not needed, but useful.
          } else {
            console.log(error.errmsg, "getBlockData");
          }
          release();
        });
      } else {
        console.log("There was an error:", parsedblock.reason);
        release();
      }
    } else {
      console.log(error, "while requesting body for", height)
      requestBlock(height, release);
    }
  });
}

function getMicroBlock(release) {
  if(debug_level>1) console.log("getMicroBlock");
  var parsedmicro;
  pending.find({mh:true}).limit(1).sort({"height":1}).toArray(function(err, doc) {
    if(!err && doc.length==1) {
      //status.microblocks.current = doc[0].height;
      request(base_microblock+doc[0]._id+"/header", function(error,response,body) {
        if(!error && body) {
          try {
            parsedmicro=JSON.parse(body);
            if(!parsedmicro.reason) {
              parsedmicro._id=parsedmicro.hash;
              microblocks.insertOne(parsedmicro, function(error, docs) {
                if(!error) {
                  if(debug_level>0) console.log(parsedmicro.height, "getMicroBlock", parsedmicro.hash);
                } else {
                  console.log(error.errmsg, "getMicroBlock");
                  console.log(parsedmicro.hash)
                  microblocks.findOne({_id:parsedmicro.hash},(txerr, txdoc) => {
                    if(!txerr) {
                      console.log(doc, parsedmicro, txdoc)
//                      clearBlockData(txdoc.block_height)
                    }
                  })

                }
                pending.updateOne({_id:doc[0]._id},{$set:{mh:false,time:parsedmicro.time}},function(error, numModified) { release(); });
              });
            } else {
              pending.updateOne({_id:doc[0]._id},{$set:{mh:"error"}},function(error, numModified) { release(); });
              //console.log("mh header error", doc[0]._id);
            }
          } catch(exception) {
            release();
            return;
          }
        }
      });
    } else {
      release();
    }
  });
}

function getTransaction(release) {
  if(debug_level>1) console.log("getTransaction");
  var parsedtx;
  pending.find({th:true,time:{$exists:true}}).limit(1).sort({"height":1}).toArray(function(err, doc) {
    if(!err && doc.length==1) {
      //status.microblocks.current = doc[0].height;
      request(base_microblock+doc[0]._id+"/transactions", function(error,response,body) {
        if(!error && body) {
          try {
            parsedtx=JSON.parse(body);
            //console.log(parsedtx.transactions);
            if(!parsedtx.reason) {
              for(index in parsedtx.transactions) { //updating changes in the transaction for faster indexing
                parsedtx.transactions[index].time = doc[0].time;
                parsedtx.transactions[index]._id = parsedtx.transactions[index].hash;
              }
              if(parsedtx.transactions.length > 0) {
              transactions.insertMany(parsedtx.transactions, function(error, docs) {
                if(!error) {
                  for(index in docs.ops) {
                    if(debug_level>0) console.log(docs.ops[index].block_height, "getTransaction", docs.ops.length, docs.ops[index].hash);
                  }
                  status.transactions.current = doc[0].height;
                } else {
                  //if transction exist check if the transaction has the correct height
                  //if the height is not the same destroy clear both blocks and let it resync
                  //console.log(doc[0].height, 'clearBlockData', "getTransaction", status.transactions.current);
                  //console.log(error, parsedtx)
                  //console.log(error.result.result.writeErrors[0].err.op.block_height, "Was cleared")
                  //transactions.findOne({_id:error.result.result.writeErrors[0].err.op.hash},(txerr, txdoc) => {
                    //if(!txerr) {
                      //console.log(doc, parsedtx, txdoc)
                      //clearBlockData(txdoc.block_height)
                      //process.exit()
                    //}
                  //})
                  //TODO
                }
                pending.updateOne({_id:doc[0]._id},{$set:{th:false}},function(error, numModified) { release(); });
              });
              } else {
                //microblock is empty, no transactions to gather from this block.
                pending.updateOne({_id:doc[0]._id},{$set:{th:false}},function(error, numModified) { release(); });
              }
            } else {
              //pending.updateOne({_id:doc[0]._id},{$set:{th:"error"}},function(error, numModified) { release(); });
            }
          } catch(exception) {
            release();
            return;
          }
        } else {
          release();
        }
      });
    } else {
      release();
    }
  });
}

function cleanUpPending(release) {
  pending.find({th:false,mh:false}).sort({height:1}).limit(1).toArray(function(error, doc) { //YEA
    if(!error && doc.length>0 && doc[0].height<status.keyblocks.current) {
      transactions.countDocuments({block_hash:doc[0]._id},function(error, count) {
        if(error) { console.log(error); }
        microblocks.updateOne({_id:doc[0]._id},{$set:{txs_count:count}},function(error, numModified) {
          if(error) { console.log(error) }
          else {
            pending.deleteOne({_id:doc[0]._id},function(error, docs) {
              if(error) { console.log(error) }
              release();
            });
          }
        });
      });
    } else {
      release();
    }
  });
}

function calcKeyblocks(release) {
  if(debug_level>1) console.log("calcKeyblocks");
  keyblocks.find({_id:{$lt:status.keyblocks.current},txs_count:{$exists:false}}).sort({_id:1}).limit(1).toArray(function(error, doc){
    if(!error && doc.length==1) {
      //status.microblocks.current = doc[0].key_block.height-1;
      pending.countDocuments({ height: doc[0].key_block.height, th: true },function (error, count) {
        if(!error && count==0) {
          transactions.countDocuments({  block_height: doc[0].key_block.height }, function(error,result) {
            if(!error) {
              if(debug_level>0) console.log(doc[0].key_block.height,"found",result,"transactions");
              keyblocks.updateOne({_id:doc[0].key_block.height},{$set:{txs_count:result}},function(error,numUpdated) {
                release();
              });
            } else {
              if(result==0 && doc[0].key_block.height+20<status.keyblocks.top) {
                console.log(doc[0].key_block.height, 'clearBlockData', 'called from calckeyblocks')

                if ( status.reset.block >= doc[0].key_block.height ) {
                  console.log(doc[0].key_block.height, 'clearBlockData', 'retry++')
                  status.reset.retry++
                } else {
                  console.log(doc[0].key_block.height, 'clearBlockData', 'retry=1')
                  status.reset.retry = 1
                }

                //for ( var index = 0; index <= status.reset.retry; index++ ) {
                  console.log(doc[0].key_block.height, 'clearBlockData', doc[0].key_block.height-index)
                  clearBlockData(doc[0].key_block.height)
                //}
                status.reset.block = doc[0].key_block.height

              }
              release();
            }
          });
        } else {
          release();
        }
      });
    } else {
      release();
    }
  });
}

function clearBlockData(blockHeight) {
  keyblocks.deleteOne({_id:blockHeight},function(error, docs) {});
  microblocks.deleteMany({height:blockHeight},function(error, docs) {});
  transactions.deleteMany({block_height:blockHeight},function(error, docs) {});
  pending.deleteMany({height:blockHeight},function(error,docs) {});
  requestBlock(blockHeight, function(blockHeight) {});
  console.log(blockHeight, "was cleared.")
}

function retryFailKeyblocks() {
  pending.find({ mh: "error"}).sort({height:1}).limit(1).toArray(function(error, results) {
    for(i in results) {
      if (results[i].height > status.keyblocks.top - 5000) {
        clearBlockData(results[i].height)
      }
    }
  });
  keyblocks.find({txs_count:{$exists:false}}).sort({_id:1}).limit(1).toArray(function(error, results) {
    for(i in results) {
      pending.countDocuments({height:results[i]._id},function(error, count) {
        if(!error && count==0 && results[i].height > status.keyblocks.top - 5000) {
          clearBlockData(results[i]._id)
        }
      });
    }
  });
  keyblocks.find({micro_blocks: { $not: {$size: 0}}, txs_count: 0}).sort({_id:1}).limit(1).toArray(function(error, results) {
    for(i in results) {
      pending.countDocuments({height:results[i]._id},function(error, count) {
        if(!error && count==0 && results[i].height > status.keyblocks.top - 5000) {
          clearBlockData(results[i]._id)
        }
      });
    }
  });
}

setInterval(function() {
  if(debug_level>=0) {
    text = (new Date()).toISOString()+" KB:{";
    if(status.microblocks.current) text += "pro:"+status.microblocks.current+",";
    text += "cur:"+status.keyblocks.current+",top:"+status.keyblocks.top+"}";
    if(status.microblocks.processed) text += " MB:{pro:"+status.microblocks.processed;
    if(status.microblocks.pending) text += ",pnd:"+status.microblocks.pending;
    if(status.microblocks.processed || status.microblocks.pending) text += "}";
    if(status.transactions.processed) text += " TX:"+status.transactions.processed;
    console.log(text);
  }
},pollsleep*10);

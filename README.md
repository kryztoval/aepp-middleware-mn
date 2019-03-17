# æternity middleware

## Overview

This is a caching layer for Epoch. It reads the chain and records key-blocks and micro-blocks, and transactions in Mongo database.

## How to use

- Install a mongo db somewhere. Works with versions >= 3.6, at least.
- Configure the connections and settings in the json file
- Install dependencies with `npm -i`

## How to run

You need nodejs installed in your computer

```
node middleware.js
node middleware-server.js
```

## Supported or overriden queries
```
GET /middleware/transactions/account/<account>?[limit]&[page]
GET /middleware/transactions/interval/<from>/<to>?[limit]&[page]
GET /middleware/transactions/interval/<from>/<to>/count
GET /middleware/transactions/account/<account>/count
GET /middleware/contracts/transactions/address/<address>?[limit]&[page]
GET /v2/key-blocks/current/height
GET /v2/generations/height/:height
```
Any other query not supported by the middleware is forwarded directly to the AEternity node.

The middleware supports http and https service mode, it can connect to http and https aeternity nodes, it can redirect between http and https as well.

Please note this forwarding makes this middleware effectively a proxy, and it will work even between different protocols.


## Known differences from official middleware
`GET /v2/generations/height/:height` returns extra fields, `txs_count` specifically.

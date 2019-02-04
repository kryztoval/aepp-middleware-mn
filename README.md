# æternity middleware

## Overview

This is a caching layer for Epoch. It reads the chain and records key-blocks and micro-blocks, and transactions in Mongo database.

## How to use

- Install a mongo db somewhere. Works with versions >= 3.6, at least.
- Configure the connections and settings in the json file

## How to run

You need nodejs installed in your computer

```
node middleware.js
node middleware-server.js
```

## Supported or overriden queries
```
GET /middleware/transactions/account/<account>?<limit>&<page>
GET /middleware/transactions/interval/<from>/<to>?<limit>&<page>
GET /middleware/transactions/account/<account>/count
GET /middleware/contracts/transactions/address/<address>
```
Any other query not supported by the middleware is forwarded to the aeternity node

The middleware supports http and https service mode, it can connect to http and https.

Please note this forwarding makes this middleware effectively a proxy, and it will work even between different protocols.
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
GET /middleware/transactions/<hash>
GET /middleware/transactions/account/<account>/count
GET /middleware/transactions/account/<account>?[limit]&[page]
GET /middleware/transactions/interval/<from>/<to>/count
GET /middleware/transactions/interval/<from>/<to>?[limit]&[page]
GET /middleware/contracts/transactions/address/<address>?[limit]&[page]
GET /v2/key-blocks/current/height
GET /v2/generations/height/:height
```
Any other query not supported by the middleware is forwarded directly to the AEternity node.

The middleware supports http and https service mode, it can connect to http and https aeternity nodes, it can redirect between http and https as well.

Please note this forwarding makes this middleware effectively a proxy, and it will work even between different protocols.


## Known differences from official middleware
Websocket support is not included in this middleware version
`GET /middleware/transactions/interval/<from>/<to>/count` is not in the official middleware
`GET /v2/generations/height/:height` returns an extra fields, specifically `txs_count`.
`GET /middleware/size/current` and `GET /middleware/size/height/<height>` this value is the length from the original response from the server, not available right now
`GET /middleware/channels/transactions/address/<address>` can't link the creation of the channel yet - needs to decode the the transaction
`GET /middleware/contracts/all` I don't know how to do this yet

## Implemented but not yet tested
`GET /middleware/contracts/transactions/address/<address>`
`GET /middleware/oracles/all?<limit>&<page>`
`GET /middleware/transactions/rate/<from>/<to>`

## Blockchain Explorer (Extra feature)
* The middleware-server includes a simple explorer that will allow you to see what is in the middleware currently, made specifically to connect to the middleware
The explorer is available at `GET /explorer/*`  after being enabled in the _config.json_ file.

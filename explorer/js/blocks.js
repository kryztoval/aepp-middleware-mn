if(GetURLParameter('hash')) {
    hash = GetURLParameter('hash');
    $("#hash")[0].textContent = hash;
    jQuery.get("/v2/key-blocks/hash/"+hash, function(data, textStatus, jqXJR) {
        data = JSON.parse(data)
        generation2table(data.height)
    });
}

if(GetURLParameter('height')) {
    generation2table(GetURLParameter('height'));
}

function height2table(height) {
  $("#hash")[0].textContent = height; //sets the title to the block height
  generation2table(height)
}

function generation2table(height) {
  jQuery.get("/v2/generations/height/"+height, function(data, textStatus, jqXJR) {
      data = JSON.parse(data)
      $("#raw")[0].innerHTML = convertToTable(data);
  });
}

/*
function keyblock2table(height) {
  //this is the direct node query, should be used if generations from middleware fails
  jQuery.get("/v2/key-blocks/height/"+height, function(data, textStatus, jqXJR) {
      data = JSON.parse(data)
      $("#raw")[0].innerHTML = convertToTable(data);
  });
}
*/

if(GetURLParameter('microblock')) {
  microblock = GetURLParameter('microblock');
  $("#hash")[0].textContent = microblock;
  jQuery.get("https://ae.criesca.net:3011/v2/micro-blocks/hash/"+microblock+"/header", function(data, textStatus, jqXJR) {
      data = JSON.parse(data)
      $("#raw")[0].innerHTML = convertToTable(data);
      jQuery.get("https://ae.criesca.net:3011/v2/micro-blocks/hash/"+microblock+"/transactions", function(data, textStatus, jqXJR) {
          data = JSON.parse(data)
          console.log(data.transactions)
          for(tx in data.transactions) {
            delete(data.transactions[tx].block_hash)
            delete(data.transactions[tx].block_height)
          }
          $("#raw")[0].innerHTML += convertToTable(data);
      });
  });
}

var address;
var startpoint, endpoint;
var url;
var tx_count;

if(GetURLParameter('address')) {
  address = GetURLParameter('address');
  //type = GetURLParameter('type');
  $("#address")[0].textContent = shortenString(address);
  jQuery.get("/v2/accounts/"+address, function(data, textStatus, jqXJR) {
    if(data.contains("html")) return;
    data = JSON.parse(data)
    $("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
    $("#raw")[0].innerHTML = convertToTable(data);
  });
  //calculatePaging();
}

function setPage(page) {
  tx_page = page;
  //calculatePaging();
  getTransactions();
}

function formatData(obj, callback, settings) {
  url = "/middleware/transactions/account/"+address+"?limit="+obj.length+"&page="+(obj.start/obj.length+1);
  jQuery.get(url, function(data, textStatus, jqXHR) {

    data = JSON.parse(data);
    subFormatdata(obj, callback, settings, data)
  });
}

jQuery.get("/middleware/transactions/account/"+address+"/count", function(data, textStatus, jqXJR) {
  data = JSON.parse(data)
  tx_count = data.count;
  if(tx_count > 0) {
    $("#tx_table").removeClass("invisible");
  }

  initializeDataTable()
})

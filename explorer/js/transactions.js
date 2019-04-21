var tx_from;
var tx_to;
var tx_count;
var url;

if(GetURLParameter('from')) $("#from_txt")[0].value=GetURLParameter('from');
if(GetURLParameter('to')) $("#to_txt")[0].value=GetURLParameter('to');
if($("#from_txt")[0] && $("#to_txt")[0] && $("#from_txt")[0].value && $("#to_txt")[0].value) getTransactions();
$("#from_txt").focus();

function formatData(obj, callback, settings) {
  var result = {};
  console.log(obj)
  url = "https://ae.criesca.net:3011/middleware/transactions/interval/"+tx_from+"/"+tx_to+"?limit="+obj.length+"&page="+(obj.start/obj.length+1);
   //+"&limit="+obj.length+"&page="+(obj.start/obj.length+1);
  jQuery.get(url, function(data, textStatus, jqXHR) {
    data = JSON.parse(data);
    subFormatdata(obj, callback, settings, data)
  });
}

function getTransactions() {
  if($("#from_txt")[0] && $("#from_txt")[0].value) tx_from = $("#from_txt")[0].value;
  if($("#to_txt")[0] && $("#to_txt")[0].value) tx_to = $("#to_txt")[0].value;

  url = "https://ae.criesca.net:3011/middleware/transactions/interval/"+tx_from+"/"+tx_to+"/count";
  jQuery.get(url, function(data, textStatus, jqXHR) {
    data = JSON.parse(data)
    $("#total_txs").text("Total Transactions: " + data.count);
    tx_count = data.count

    initializeDataTable()
  });
}

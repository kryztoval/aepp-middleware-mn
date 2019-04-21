if(GetURLParameter('hash')) { 
    hash = GetURLParameter('hash');
    $("#hash")[0].textContent = shortenString(hash);
    jQuery.get("http://ae.criesca.net:3013/v2/transactions/"+hash, function(data, textStatus, jqXJR) {
        //$("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
        $("#raw")[0].innerHTML = convertToTable(data);
    });
}
if(GetURLParameter('hash')) {
    hash = GetURLParameter('hash');
    $("#hash")[0].textContent = shortenString(hash);
    jQuery.get("/v2/transactions/"+hash, function(data, textStatus, jqXJR) {
        data = JSON.parse(data)
        //$("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
        $("#raw")[0].innerHTML = convertToTable(data);
    });
}

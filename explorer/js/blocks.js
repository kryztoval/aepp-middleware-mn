if(GetURLParameter('hash')) { 
    hash = GetURLParameter('hash');
    $("#hash")[0].textContent = hash;
    jQuery.get("http://ae.criesca.net:3013/v2/key-blocks/hash/"+hash, function(data, textStatus, jqXJR) {
        $("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
    });
}

if(GetURLParameter('height')) { 
    height = GetURLParameter('height');
    $("#hash")[0].textContent = height;
    jQuery.get("http://ae.criesca.net:3013/v2/key-blocks/height/"+height, function(data, textStatus, jqXJR) {
        //$("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
        $("#raw")[0].innerHTML = convertToTable(data);
    });
}

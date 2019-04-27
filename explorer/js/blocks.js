if(GetURLParameter('hash')) {
    hash = GetURLParameter('hash');
    $("#hash")[0].textContent = hash;
    jQuery.get("/v2/key-blocks/hash/"+hash, function(data, textStatus, jqXJR) {
        $("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
    });
}

if(GetURLParameter('height')) {
    height = GetURLParameter('height');
    $("#hash")[0].textContent = height;
    jQuery.get("/v2/key-blocks/height/"+height, function(data, textStatus, jqXJR) {
        data = JSON.parse(data)
        //$("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
        $("#raw")[0].innerHTML = convertToTable(data);
    });
}

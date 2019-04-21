if(GetURLParameter('name')) { 
    name = GetURLParameter('name');
    $("#name")[0].textContent = name;
    jQuery.get("http://ae.criesca.net:3013/v2/names/"+name, function(data, textStatus, jqXJR) {
        //$("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
        $("#raw")[0].innerHTML = convertToTable(data);
    });
}
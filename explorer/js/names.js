if(GetURLParameter('name')) {
    name = GetURLParameter('name');
    $("#name")[0].textContent = name;
    jQuery.get("/v2/names/"+name, function(data, textStatus, jqXJR) {
        data = JSON.parse(data)
        //$("#raw")[0].textContent = JSON.stringify(data).replace(/,/g,", ");
        $("#raw")[0].innerHTML = convertToTable(data);
    });
}

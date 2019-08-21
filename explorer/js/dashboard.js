var newRows = 3;
var top_height;
var max_height = 0;

function refreshTop() {
    jQuery.get("/v2/key-blocks/current/height", function(data, textStatus, jqXJR) {
        data = JSON.parse(data);
        top_height = data.height;
        if(max_height<top_height) {
            loadLast();
            loadRecent();
        }
    });
}
setInterval(refreshTop,15000);

function refreshTime() {
    $("#age").each(function(key, value) {
        $(value).find("span").text( timeSince( parseInt( $(value).next().text() ) ) );
    });
}
setInterval(refreshTime,1000);

function loadLast() {
    jQuery.get("/v2/generations/height/"+top_height, function(data, textStatus, jqXHR) {
        data = JSON.parse(data);
        $("#height")[0].innerHTML =
            "<a class='block-id' href='./blocks.html?height=" + data._id + "'>" + data._id + "</a>";
        $("#microblocks").text(data.micro_blocks.length);
        $("#transactions")[0].innerHTML = "<a class='tx-count' href='./transactions.html?from="+data._id+"&to="+data._id+"'>"+data.txs_count+"</a>"
            //.text(data.txs_count);
        $("#hash").text(shortenString(data.key_block.hash));
        $("#beneficiary")[0].innerHTML =
            "<a href='./address.html?address=" + data.key_block.beneficiary + "'>" + shortenString(data.key_block.beneficiary) + "</a>";
        $("#age")[0].innerHTML =
            "<span data-toggle='tooltip' title='"+new Date(data.key_block.time)
            +"'>"+timeSince(data.key_block.time)+"</span>";
        $("#time").text(data.key_block.time);
        $("#viewlast")[0].href = "./blocks.html?height=" + data._id;
    });
    max_height = top_height;
}

function loadRecent() {
    //$("#recent").empty();
    //$("#recent").append("<strong><h3 class='text-light'>Recent generations</h3></strong><br>");
    base_height=max_height-3;
    for(i=0;i<3;i++) {
        if($("#"+i).length==0) {
            $("#recent").append("<div class='row' id='"+i+"'></div>");
        }
        jQuery.get("/v2/generations/height/"+(base_height+i), function (data,textStatus, jqXHR) {
            data = JSON.parse(data);
            element = "<div class='col-md-2'><strong><h4 text-light'><a class='block-id' href='./blocks.html?height=" +
                data._id + "'>" + data._id + "</a></div>" +
                "<div class='col-md-2'><span class='text-muted'>Micro Blocks</span> <strong><span class='text-light'>"
                + data.micro_blocks.length + "</span></strong></div>" +
                "<div class='col-md-2'><span class='text-muted'>Transactions</span> <strong><span class='text-light'>"
                + "<a class='tx-count' href='./transactions.html?from="+data._id+"&to="+data._id+"'>"+data.txs_count+"</a>" + "</span></strong></div>" +
                "<div class='col-md-6'>&nbsp;<span class='text-muted'>beneficiary</span> <strong><span class='text-light'>"
                + "<a data-toggle='tooltip' title='" + data.key_block.beneficiary +"' href='./address.html?address="
                + data.key_block.beneficiary + "'>" + shortenString(data.key_block.beneficiary)
                + "</a>"+"</span></strong></div>";
            $("#"+(data._id-base_height)).empty();
            $("#"+(data._id-base_height)).append(element);
        });
    }
}

refreshTop();

function refreshUndefined() {
  $('.tx-count').each( function(value, item) {
    if ($(item).text() === 'undefined') {
      refreshOne(parseInt($(item).parent().attr('id').substr(2)))
      return false
    }
  })
}

function refreshUndefined () {
  $('.tx-count').each( function(value, item) {
    if ($(item).text() === 'undefined') {
      i = $(item).closest('.row').find('.block-id').text()
      jQuery.get("/v2/generations/height/"+i, function(data, textStatus, jqXHR) {
        data = JSON.parse(data)
        if(data.txs_count) {
          $(item).text(data.txs_count)
        }
      })
      return false
    }
  })
}

setInterval(refreshUndefined, 5000);

function buttonSearch () {
  e = document.getElementById("search").value
  if(e.length > 0) {
    if(e.startsWith("ak_")) {
      window.location.replace("https://ae.criesca.net:3011/explorer/address.html?address="+e)
    }
    if(e.startsWith("ba_")) {
      r = atob(e.substr(3))
      alert("The parsed string is: [" + r.substr(0,r.length-4) + "]")
    }
    if(e.startsWith("kh_")) {
      window.location.replace("https://ae.criesca.net:3011/v2/key-blocks/hash/"+e)
    }
    if(e.startsWith("mh_")) {
      window.location.replace("https://ae.criesca.net:3011/v2/micro-blocks/hash/"+e+"/header")
    }
    if(e.startsWith("th_")) {
      window.location.replace("https://ae.criesca.net:3011/explorer/tx.html?hash="+e);
    }
    /* Block height is not supported
    if(!isNaN(e)) {
      window.location.replace("https://ae.criesca.net:3011/explorer/blocks.html?height="+e);
    }
    */
    //alert("I'm sorry but I do not know what to do with that input yet.")
  }
}

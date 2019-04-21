// Empty JS for your own code to be here
var newRows = 10;
var max_height;
var top_height;
var min_height;

jQuery.get( "https://ae.criesca.net:3011/v2/key-blocks/current/height", function(data, textStatus, jqXJR) {
    data=JSON.parse(data);
    max_height=data.height;
    min_height=data.height;
    top_height=data.height;
    loadMoreBottom();
});

function refreshTop() {
    jQuery.get( "https://ae.criesca.net:3011/v2/key-blocks/current/height", function(data, textStatus, jqXJR) {
        data=JSON.parse(data);
        top_height=data.height;
        if(max_height<top_height) {
            loadMoreTop();
        }
    });
}
setInterval(refreshTop, 15000);

function refreshTime() {
    $("tr > .time").each(function(key, value) {
        $(value).prev().text( timeSince( parseInt( $(value).text() ) ) );
    });
}
setInterval(refreshTime,1000);

function loadOne(i) {
    jQuery.get("https://ae.criesca.net:3011/v2/generations/height/"+i, function(data, textStatus, jqXHR) {
    data = JSON.parse(data);
    $("#kb"+data._id).append("<td><a href='./blocks.html?height="+data._id+"'>"+data._id+"</a></td>\
        <td data-toggle='tooltip' title='"+data.key_block.hash+"'>"+shortenString(data.key_block.hash)+"</td>\
        <td>"+data.micro_blocks.length+"</td>\
        <td><a href='./transactions.html?from="+data._id+"&to="+data._id+"'>"+data.txs_count+"</a></td>\
        <td data-toggle='tooltip' title='"+data.key_block.beneficiary+"'><a href='./address.html?address="+data.key_block.beneficiary+"'>"+shortenString(data.key_block.beneficiary)+"</a></td>\
        <td data-toggle='tooltip' title='"+new Date(data.key_block.time)+"'>"+timeSince(data.key_block.time)+"</td>\
        <td class='time' style='display:none'>"+data.key_block.time+"</td>");
    });
}

function loadMoreTop() {
    for(i = max_height+1; i<=top_height; i++) {
        $("#keyblocks").prepend("<tr id='kb"+i+"'></tr>");
        loadOne(i);
    }
    max_height = top_height;
}

function loadMoreBottom() {
    for(i = min_height; i>min_height-newRows; i--) {
        $("#keyblocks").append("<tr id='kb"+i+"'></tr>");
        loadOne(i);
    }
    min_height -= newRows;
    $('html,body').animate({ scrollTop: $('html,body').height() }, 'slow');
}

jQuery.fn.reverse = [].reverse;
function refreshUndefined() {
  $('tr[id^=kb] > td:nth-child(4)').reverse().each( function(value, item) {
    if ($(item).find('a').text() === 'undefined') {
      refreshOne(parseInt($(item).parent().attr('id').substr(2)))
      return false
    }
  })
}

function refreshOne(i) {
  jQuery.get("https://ae.criesca.net:3011/v2/generations/height/"+i, function(data, textStatus, jqXHR) {
    data = JSON.parse(data);
    if(data.txs_count) {
      $("#kb"+data._id+" > td:nth-child(4) > a").text(data.txs_count);
    }
  });
}

setInterval(refreshUndefined, 5000);

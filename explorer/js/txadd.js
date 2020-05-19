function subFormatdata(obj, callback, settings, data) {
  var result = {};

  result.recordsTotal = tx_count
  result.recordsFiltered = tx_count
  result.draw = obj.draw
  result.data = []
  for(i in data.transactions) {
    result.data[i] = []
    result.data[i][0] = "<button type='button' class='btn btn-dark btn-sm'>" + data.transactions[i].tx.type.replace(/([a-z0-9])([A-Z])/g, '$1 $2') + "</button>"
    result.data[i][1] = "<span data-toggle='tooltip' title='"+data.transactions[i].hash+"'><h6>Hash</h6><a href='./tx.html?hash="+ data.transactions[i].hash + "'>" + shortenString(data.transactions[i].hash) + "</a>"
    if(data.transactions[i].tx.responder_id) {
      result.data[i][2] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.responder_id+"'><h6>Responder ID</h6><a href='./address.html?address="+data.transactions[i].tx.responder_id+"'>" + shortenString(data.transactions[i].tx.responder_id) + "</a>"
    } else {
      result.data[i][2] = ""
    }
    if(data.transactions[i].tx.initiator_id) {
      result.data[i][3] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.initiator_id+"'><h6>Initiator ID</h6><a href='./address.html?address="+data.transactions[i].tx.initiator_id+"'>" + shortenString(data.transactions[i].tx.initiator_id) + "</a>"
    } else {
      result.data[i][3] = ""
    }
    if(data.transactions[i].tx.owner_id) {
      result.data[i][4] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.owner_id+"'><h6>Owner</h6><a href='./address.html?address="+data.transactions[i].tx.owner_id+"'>" + shortenString(data.transactions[i].tx.owner_id) + "</a>"
    } else {
      result.data[i][4] = ""
    }
    if(data.transactions[i].tx.oracle_id) {
      result.data[i][5] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.oracle_id+"'><h6>Oracle</h6>" + shortenString(data.transactions[i].tx.oracle_id)
    } else {
      result.data[i][5] = ""
    }
    if(data.transactions[i].tx.sender_id) {
      result.data[i][6] = "<span data-toggle='tooltip' title='" + data.transactions[i].tx.sender_id + "'><h6>Sender</h6><a href='./address.html?address="+data.transactions[i].tx.sender_id+"'>" + shortenString(data.transactions[i].tx.sender_id) + "</a>"
    } else {
      result.data[i][6] = ""
    }
    if(data.transactions[i].tx.channel_id) {
      result.data[i][7] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.channel_id+"'><h6>Channel ID</h6>" + shortenString(data.transactions[i].tx.channel_id)
    } else {
      result.data[i][7] = ""
    }
    if(data.transactions[i].tx.from_id) {
      result.data[i][8] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.from_id+"'><h6>From ID</h6><a href='./address.html?address="+data.transactions[i].tx.from_id+"'>" + shortenString(data.transactions[i].tx.from_id) + "</a>"
    } else {
      result.data[i][8] = ""
    }
    if(data.transactions[i].tx.to_id) {
      result.data[i][9] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.to_id+"'><h6>To ID</h6><a href='./address.html?address="+data.transactions[i].tx.to_id+"'>" + shortenString(data.transactions[i].tx.to_id) + "</a>"
    } else {
      result.data[i][9] =""
    }
    if(data.transactions[i].tx.account_id) {
      result.data[i][10] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.account_id+"'><h6>Account</h6><a href='./address.html?address="+data.transactions[i].tx.account_id+"'>" + shortenString(data.transactions[i].tx.account_id) + "</a>"
    } else {
      result.data[i][10] = ""
    }
    if(data.transactions[i].tx.name) {
      result.data[i][11] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.name+"'><h6>Name</h6><a href='./names.html?name=" + data.transactions[i].tx.name + "'>" + data.transactions[i].tx.name + "</a>"
    } else {
      result.data[i][11] = ""
    }
    if(data.transactions[i].tx.recipient_id) {
      result.data[i][12] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.recipient_id+"'><h6>Recipient</h6><a href='./address.html?address="+data.transactions[i].tx.recipient_id+"'>" + shortenString(data.transactions[i].tx.recipient_id) + "</a>"
    } else {
      result.data[i][12] = ""
    }
    if(data.transactions[i].tx.amount) {
      result.data[i][13] = "<span data-toggle='tooltip' title='"+(parseFloat(data.transactions[i].tx.amount)/1000000000000000000)+"'><h6>Amount</h6>"+(parseFloat(data.transactions[i].tx.amount)/1000000000000000000).toLocaleString('en-US', {useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 18, style: 'decimal'})
    } else {
      result.data[i][13] = ""
    }
    if(data.transactions[i].time) {
      result.data[i][14] =
       "<span class='tooltip' style='display:none' data-toggle='tooltip' title='"+stdDate(data.transactions[i].time) + " " + stdTime(data.transactions[i].time)+"'>"+"</span>"
       + "<h6>Date</h6>" + stdDate(data.transactions[i].time) + " " + stdTime(data.transactions[i].time)
       + "<span class='tzdata' style='display:none'>"+data.transactions[i].time+"</span>"
       + "<br><span class='age'></span>"
    } else {
      result.data[i][14] = ""
    }
    if(data.transactions[i].tx.payload) {
      if(data.transactions[i].tx.payload.startsWith("ba_")) {
        payload = atob(data.transactions[i].tx.payload.split("ba_")[1])
        payload = payload.substr(0, payload.length-4)
      } else {
        payload = data.transactions[i].tx.payload
      }
      if(payload.length > 0)
        result.data[i][15] = "<span data-toggle='tooltip' title='"+data.transactions[i].tx.payload+"'><h6>Payload</h6>" + payload
      else
        result.data[i][15] = ""
    } else {
      result.data[i][15] = ""
    }
    if(data.transactions[i].block_height) {
      result.data[i][16] = "<h6>Block</h6>" +
        "<a href='./blocks.html?height=" + data.transactions[i].block_height + "'>" +
        data.transactions[i].block_height + "</a>"
    } else {
      result.data[i][16] = ""
    }
  }
  return callback(result)
}

function initializeDataTable() {
  $("#tx_table").removeClass("invisible");
  if ( ! $.fn.DataTable.isDataTable('#tx_table') ) {
    $('#tx_table').DataTable({
      "serverSide": true,
      "ajax": formatData,
      "drawCallback": function( settings ) {
        $("td").not("empty").show()
        $("th").not("empty").show()
        $("td:empty").hide()
        $("th:empty").hide()
        var max_length = 0
        $("tr").each(function(i,item) {
          max_length = Math.max(max_length,$(item).find("td:visible").length)
        })
        for(i=2; i<=max_length; i++) {
          $("th:nth-child("+i+")").show()
        }
        $("table").find("span").each(function(i, item) {
          var xspan = $(item)
          var xtitle = xspan.attr("title")
          var xparent = xspan.closest("td")
          xparent.attr("data-toggle", "tooltip")
          xparent.attr("title", xtitle)
          xspan.removeAttr("data-toggle")
        })
      },
      "searching": false,
      "ordering": false
    });
  } else {
    $('#tx_table').DataTable().ajax.reload()
  }
}

function refreshTime() {
    $(".age").each(function(key, value) {
      var age = timeSince( parseInt( $(value).parent().find(".tzdata").text() ) ) + " ago"
      $(value).text( age );
    });
}
setInterval(refreshTime,1000);

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
}

function stdDate(d) {
  d = new Date(d)
  return [d.getFullYear(),
         (d.getMonth()+1).padLeft(),
          d.getDate().padLeft()].join('/')
}

function stdTime(d) {
  d = new Date(d)
  return [d.getHours().padLeft(),
          d.getMinutes().padLeft(),
          d.getSeconds().padLeft()].join(':')
}

function shortenString(cadena) {
    return cadena.substr(0,8)+" ... "+cadena.substr(cadena.length-6)
}

function GetURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
}

function onEnter(e) {
    if (e.keyCode == 13) {
        $("#submit").click();
    }
}

function timeSince(timevar) {
    var secs = moment(Date.now()).diff(timevar)/1000;
    var years = Math.floor(secs / (3600*24*365));
    secs -= years*3600*24*365;
    var weeks = Math.floor(secs / (3600*24*7));
    secs -= weeks*3600*24*7;
    var days = Math.floor(secs / (3600*24));
    secs    -= days*3600*24;
    var hrs  = Math.floor(secs / 3600);
    secs    -= hrs*3600;
    var mnts = Math.floor(secs / 60);
    secs     = Math.floor(secs - mnts*60);

    var result="";
    if( years != 0) { result += years + "y "; }
    if( weeks != 0) { result += weeks + "w "; }
    if(  days != 0) { result +=  days + "d "; }
    if(   hrs != 0) { result +=   hrs + "h "; }
    if(  mnts != 0) { result +=  mnts + "m "; }
    if(  secs != 0) { result +=  secs + "s "; }

    return(result);
}

function convertToTable(obj) {
    return transverse(obj, "<table class='maintable'>") + "</table>";
}

function transverse(obj, result) {
    for(i in obj) {
        if(typeof(obj[i])=="object" || Array.isArray((obj[i]))) {
          result += transverse(obj[i], "<tr><td>"+i+"</td><td colspan='2'><table class='subtable'>") + "</table></td></tr>";
        } else {
          switch(i) {
            case "time":
              processed = "<span title= '" + obj[i].toString() + "'>" + new Date(obj[i]).toUTCString() + "</span> (" + timeSince(obj[i]) + " ago)"
            break;
            case "balance": case "amount": case "fee": case "name_fee":
              processed = (obj[i]/1000000000/1000000000).toLocaleString('en-US', {useGrouping: true, minimumFractionDigits: 4, maximumFractionDigits: 18, style: 'decimal'}) + ' AE'
              processed = "<span title='" + obj[i].toLocaleString('en-US', {useGrouping: true, maximumFractionDigits: 0, style: 'decimal'}) + " aettos'>" + processed + "</span>"
            break;
            case "block_height": case "height":
              processed = "<a href='/explorer/blocks.html?height=" + obj[i] + "'>" + obj[i] + "</a>"
            break;
            case "recipient_id": case "account_id": case "sender_id": case "miner": case "beneficiary": case "id": case "caller_id":
              if(typeof(obj[i]) == "string" && obj[i].startsWith("ak_")) {
                processed = "<a href='/explorer/address.html?address=" + obj[i] + "'>" + obj[i] + "</a>"
                break;
              }
            case "txs_count":
              if(obj[i] > 0) {
                processed = "<a href='/explorer/transactions.html?from=" + GetURLParameter('height') + "'>" + obj[i] + "</a>"
                break;
              }
            case "name":
              if(typeof(obj[i]) == "string" && obj[i].endsWith(".chain")) {
                processed = "<a href='/explorer/names.html?name=" + obj[i] + "'>" + obj[i] + "</a>"
                break;
              }
            case "payload":
              if(typeof(obj[i]) == "string" && obj[i].startsWith("ba_")) {
                r = atob(obj[i].substr(3))
                if(r.length > 4) {
                  processed = "<span title='" + obj[i] + "'>" + r.substr(0,r.length-4) + "</span> " 
                }
                break;
              }
            case "prev_hash": case "prev_key_hash": //kh_
            case "block_hash": case "prev_hash":  //mh_
            case "hash": //th_ mh_ kh_
              if(typeof(obj[i]) == "string" && obj[i].startsWith("th_")) {
                processed = "<a href='/explorer/tx.html?hash=" + obj[i] + "'>" + obj[i] + "</a>"
                break;
              }
              if(typeof(obj[i]) == "string" && obj[i].startsWith("mh_")) {
                processed = "<a href='/explorer/blocks.html?microblock=" + obj[i] + "'>" + obj[i] + "</a>"
                break;
              }
              if(typeof(obj[i]) == "string" && obj[i].startsWith("kh_")) {
                processed = "<a href='/explorer/blocks.html?hash=" + obj[i] + "'>" + obj[i] + "</a>"
                break;
              }
            default:
              processed = obj[i]
          }
          result += "<tr><td class='text-primary'>" + i + "</td>" +
                    "<td>" + processed + "</td>" +
                    "<td class='text-danger'>" + typeof(obj[i]) + "</td></tr>";
        }
    }
    return result;
}

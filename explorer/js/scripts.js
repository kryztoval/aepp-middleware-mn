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
    var days = Math.floor(secs / (3600*24));
    secs    -= days*3600*24;
    var hrs  = Math.floor(secs / 3600);
    secs    -= hrs*3600;
    var mnts = Math.floor(secs / 60);
    secs     = Math.floor(secs - mnts*60);

    var result="";
    if(days != 0) { result += days + "d "; }
    if( hrs != 0) { result +=  hrs + "h "; }
    if(mnts != 0) { result += mnts + "m "; }
    if(secs != 0) { result += secs + "s "; }

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
            case "balance": case "amount": case "fee": 
              processed = (obj[i]/1000000000/1000000000).toLocaleString('en-US', {useGrouping: true, minimumFractionDigits: 4, maximumFractionDigits: 18, style: 'decimal'}) + ' AE'
            break;
            case "payload":
              if(obj[i].startsWith("ba_")) {
                r = atob(obj[i].substr(3))
                if(r.length > 4) {
                  processed = /* obj[i] + "<br>(Decoded: [" + */ r.substr(0,r.length-4) /* + "])" */
                }
              }
            break;
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

/**
 * Created by zhouwang on 2018/8/12.
 */
 
websocket = null
var opts = {
  lines: 12, // The number of lines to draw
  length: 3, // The length of each line
  width: 2, // The line thickness
  radius: 4, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#000', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '20px', // Top position relative to parent
  left: '0', // Left position relative to parent
  shadow: '', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};
function logfile_keepread(_this){
    if(websocket){
        alert(_("Please close the previous connection or refresh the page"))
        return false
    }

    $("form .error_text").empty()
    var form_obj = $(_this).parent()
    var logfile_id = form_obj.find("select[name='logfile_id']").val()
    var other_search_pattern = form_obj.find("input[name='other_search_pattern']").val()
    if(other_search_pattern){
        var search_pattern = other_search_pattern
    }else{
        var search_pattern = form_obj.find("select[name='search_pattern']").val()
    }
    var filter_search_line = form_obj.find("input[name='filter_search_line']:checked").val()
    if(!logfile_id){
        form_obj.find("span[name='logfile_id_error']").text("Required")
        return false
    }

    $("#log_content_row").show()

    var log_content_html = "Connection ...<br>"
    $("#log_content").html(log_content_html)

    if(filter_search_line){
        var host = "wss://" + location.hostname + ":" + location.port +
            "/keepread/?logfile_id="+ logfile_id +"&search_pattern="+ search_pattern
    }else{
        var host = "wss://" + location.hostname + ":" + location.port + "/keepread/?logfile_id="+ logfile_id
    }

    websocket = new WebSocket(host)

    websocket.onopen = function(evt){

        var target = document.getElementById('spinjs');
        var spinner = new Spinner(opts).spin(target);
        $("#log_content").empty()
        $("#log_stat_row").show()
        $("#total_size").text(0)
        $("#total_lines").text(0)
        $("#size").text(0)
        $("#lines").text(0)
        $("#highlight_lines").text(0)
        $("#window_lines").text(0)
        $("#log_content").append("<span style='color: green'>Connection successful ...</span><br><br>")
    }
    websocket.onmessage = function(evt){
        var result = $.parseJSON(evt.data)
        $("#time_update_at").text(dayjs().format('HH:mm:ss'))
        if(result['code']==0){
            if(result["data"]["lines"]){
                $("#window_update_at").text(dayjs().format('HH:mm:ss'))
            }
            
            var search_result = log_content_searching(result["data"]["contents"], search_pattern)
            $("#log_content").prepend(search_result["log_content"])
            $("#total_size").text((result['data']['total_size']/1024).toFixed(2))
            $("#total_lines").text((result['data']['total_lines']))
            $("#size").text((parseInt($("#size").text()) + (result['data']['size']/1024)).toFixed(2))
            $("#lines").text(parseInt($("#lines").text()) + result['data']['lines'])
            $("#highlight_lines").text(parseInt($("#highlight_lines").text()) + search_result['highlight_lines'])
            $("#window_lines").text(parseInt($("#window_lines").text()) + result["data"]["lines"])
            console.log(check_in)
            if(!check_in) {
                $("#log_content").scrollTop($("#log_content")[0].scrollHeight);
            }
        }else{

            if(result['code']==400){
                for (var k in result["error"]) {
                    form_obj.find("[name='"+ k +"_error']").text(result["error"][k])
                }
            }

            $("#log_content").append(
                '<span class="error_text">' + "Error [Code: "+ result["code"] + "] " + result["msg"] + "</span><br>"
                + (
                result["detail"]
                    ?
                '<span class="error_text">' + result["detail"] + "</span><br>"
                    :
                ''
                )
            )

            if(!check_in) {
                $("#log_content").scrollTop($("#log_content")[0].scrollHeight);
            }
            websocket.close()
        }
    }

    websocket.onerror = function(evt){
        $("#log_content").append("<br><span class=\"error_text\">Connection error ...</span><br>")
        websocket = null
        if(!check_in){
            $("#log_content").scrollTop($("#log_content")[0].scrollHeight);
        }
        $("#spinjs").html('')
    }

    websocket.onclose = function(evt){
        $("#spinjs").html('')
        $("#log_content").append("<br><span class=\"error_text\">Connection closed ...</span><br>")
        console.log('onclose')
        if(!check_in) {
            $("#log_content").scrollTop($("#log_content")[0].scrollHeight);
        }
        websocket = null
    }
}


function close_websocket(){
    console.log('close')
    if(websocket){
        websocket.close()
    }
}

function clear_log_content(){
    $("#log_content").empty()
    $("#window_lines").text(0)
}
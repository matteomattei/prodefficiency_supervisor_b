var app_version = '1.0';
var app = {
 
    initialize: function() {
        this.bind();
    },
 
    bind: function() {
        document.addEventListener("deviceready", this.deviceready, false);
        document.addEventListener("backbutton", closeScan, false);
        //document.addEventListener("online", function(){alert('online');}, false);
        //document.addEventListener("offline", function(){alert('offline');}, false);
        $('#normal_bulk').on("filterablebeforefilter", bulk_keypress_cb);
        $('#normal_bulk').on("tap", "li", select_bulk_cb);
        $('#normal_layer').on("change", set_layer_cb);
        $('#normal_employee').on("tap", bc_pressed);
        $('#normal_operation').on("tap", bc_pressed);
        $('#normal_bt_submit').on("tap", normal_submit);

        $('#flagno_bulk').on("filterablebeforefilter", bulk_keypress_cb);
        $('#flagno_bulk').on("tap", "li", select_bulk_cb);
        $('#flagno_employee').on("tap", bc_pressed);
        $('#flagno_bt_submit').on("tap", flagno_submit);
        $('#flagno_hours_container').on("slidestop", '#flagno_hours', hours_flagno_select);
        $('#flagno_minutes_container').on("slidestop", '#flagno_minutes', minutes_flagno_select);
    },
 
    deviceready: function() {
        app.start();
    },
 
    start: function() {
        //alert('application started...');
    }
};

var normal_data = {};
var flagno_data = {};
var scan_in_progress = false;
//var base_url = 'http://192.168.1.48';
var base_url = 'http://192.168.0.11';
var post_url = base_url+'/supervisor_input.php';
var get_operations = base_url+'/supervisor_getoperations.php';
var get_flagno_operations = base_url+'/supervisor_getoperations_flagno.php';
var get_bulks = base_url+'/supervisor_getbulks.php';

function is_wifi_enable(){
/*
    var networkState = navigator.connection.type;
    return (networkState == Connection.WIFI);
*/
return true;
}

function bc_pressed(){
    var elem_id = $(this).attr('id');
    if(elem_id == 'normal_employee' || elem_id == 'normal_operation'){
        startScan(elem_id.split('_')[1],'normal');
    } else if(elem_id == 'flagno_employee'){
        startScan(elem_id.split('_')[1],'flagno');
    }
}

function date_select(page){
    /* callback for date select event */
    if(page == 'normal'){
        normal_data['date']=$('#normal_scan_date').val();
    } else if(page == 'flagno'){
        flagno_data['date']=$('#flagno_scan_date').val();
    }
    check_params();
}

function bulk_keypress_cb(e, data){
    var $ul = $( this ),
        $input = $( data.input ),
        value = $input.val(),
        html = "";
    $ul.html( "" );
    //console.log(value);
    if ( value && value.length > 0 ) {
        //console.log('performing ajax call');
        $ul.html( "<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>" );
        $ul.listview( "refresh" );
        if($.mobile.activePage.attr('id') == 'normal'){
            normal_data['bulk'] = value;
        } else {
            flagno_data['bulk'] = value;
        }
        $.post(get_bulks,{'bulk':value},function(response){
            if (response.res == 'OK'){
                $.each( response.msg, function ( i, val ) {
                    html += "<li>" + val + "</li>";
                });
                $ul.html( html );
                $ul.listview( "refresh" );
                $ul.trigger( "updatelayout");
                //console.log(html);
            }
        },'json');
    }
    check_params();
}

function select_bulk_cb(){
    var text = $(this).text();
    //console.log(text);
    $(this).closest("ul").prev("form").find("input").val(text);
    $(this).closest("ul").empty();
    if($.mobile.activePage.attr('id') == 'normal'){
        normal_data['bulk'] = text;
        fill_manual_operation(text);
    } else {
        flagno_data['bulk'] = text;
    }
    check_params();
}

function set_layer_cb(event){
    normal_data['layer'] = event.currentTarget.value;
    check_params();
}

function hours_flagno_select(){
    /* callback for onchange on flagno hours */
    flagno_data['tot_ore_flag_no'] = $('#flagno_hours').val();
    check_params();
}

function minutes_flagno_select(){
    /* callback for onchange on flagno minutes */
    flagno_data['tot_min_flag_no'] = $('#flagno_minutes').val();
    check_params();
}

function operation_flagno_select(elem){
    /* callback for onchange on flagno operation field */
    flagno_data['operation'] = elem.value;
    check_params();
}

function operation_manual_select(elem){
    /* callback for onchange on operation manual */
    normal_data['operation'] = elem.value;
    $('#normal_operation').val(elem.value);
    check_params();
}

function fill_manual_operation(bulk){
    /* get all operation for a bulk and enable select control */
    $.post(get_operations,{'bulk':bulk},function(operations){
        $('#normal_manual_operation').empty().append('<option>Select Operation (for bulk)</option>');
        $.each(operations, function(k,v){
            var opt = '<option value="' +k+ '">'+k+' - '+v+'</option>';
            $('#normal_manual_operation').append(opt);
        });
        $('#normal_manual_operation').selectmenu('refresh',true).selectmenu('enable');
        check_params();
    },'json');
}

function fill_flagno_operations(){
    /* get all flagno operation */
    $.post(get_flagno_operations,function(operations){
        $('#flagno_operation').empty().append('<option>Select Operation</option>');
        $.each(operations, function(k,v){
            var opt = '<option value="' +k+ '">'+k+' - '+v+'</option>';
            $('#flagno_operation').append(opt);
        });
        $('#flagno_operation').selectmenu('refresh',true).selectmenu('enable');
        check_params();
    },'json');
}

function closeScan(){
    /* this is an hack to prevent exiting from the application when
       someone clicks on back button during when the scanner is active */
    if(scan_in_progress){
        alert('Scan cancelled');
    }
}

function check_params(){
    /* Check if all params are correctly set and enable the submit button*/
    /* normal page */
    if(normal_data['date']!='' &&
        normal_data['bulk']!='' &&
        normal_data['operation']!='' &&
        normal_data['employee']!='' &&
        normal_data['layer']!=''){
        $('#normal_bt_submit').removeClass('ui-disabled');
    } else {
        $('#normal_bt_submit').addClass('ui-disabled');
    }

    /* flagno page */
    if(flagno_data['date']!='' &&
        flagno_data['employee']!='' &&
        flagno_data['bulk']!='' &&
        flagno_data['operation']!='' &&
        !(flagno_data['tot_ore_flag_no']=='0' && flagno_data['tot_min_flag_no']=='0'))
    {
        //console.log('ALLOW',flagno_data);
        $('#flagno_bt_submit').removeClass('ui-disabled');
    } else {
        //console.log('DISALLOW',flagno_data);
        $('#flagno_bt_submit').addClass('ui-disabled');
    }
}

function reset_fields(){
    /* reset all fields at app startup and after every submit */
    var d = new Date();
    //normal_data = {};
    //flagno_data = {};

    /* normal page */
    $('#normal_bt_submit').addClass('ui-disabled');
    $('#normal_employee').val('');
    //$('#normal_bulk').val('');
    //$('#normal_manual_operation').selectmenu('disable').empty();
    //$('#normal_operation').val('');
    $('#normal_layer').val('1');
    $('#normal_scan_date').val(d.toISOString().split('T')[0]);
    normal_data['date']=$('#normal_scan_date').val();
    normal_data['employee']='';
    //normal_data['bulk']='';
    //normal_data['operation']='';
    normal_data['layer']='1';
    normal_data['id_device'] = window.localStorage.getItem('id_device');

    /* flag no page */
    $('#flagno_bt_submit').addClass('ui-disabled');
    $('#flagno_employee').val('');
    $('#flagno_bulk').val('');
    $('#flagno_operation').val('');
    $('#flagno_scan_date').val(d.toISOString().split('T')[0]);
    $('#flagno_hours').val('0');
    $('#flagno_minutes').val('0');
    flagno_data['date']=$('#flagno_scan_date').val();
    flagno_data['employee']='';
    //flagno_data['bulk']='';
    //flagno_data['operation']='';
    flagno_data['tot_ore_flag_no']='0';
    $('#flagno_minutes').siblings('.ui-slider-track').children('a').attr('style','left:0');
    flagno_data['tot_min_flag_no']='0';
    $('#flagno_hours').siblings('.ui-slider-track').children('a').attr('style','left:0');
    flagno_data['id_device'] = window.localStorage.getItem('id_device');
}

function normal_submit(){
    /* here we have to subm it the data to the server */
    if(!is_wifi_enable()){
        alert('wifi connection is not enable');
        return false;
    }
    $.mobile.loading('show');
    $.post(post_url,normal_data,function(data){
        if(data.OK != undefined && data.OK != ''){
            alert(data.OK);
            $.mobile.loading('hide');
            reset_fields();
        }else{
            alert(data.ERR);
            $.mobile.loading('hide');
        }
    },'json')
    .fail(function(){
        alert('Communication error!');
        $.mobile.loading('hide');
    });
}

function flagno_submit(){
    /* here we have to subm it the data to the server */
    if(!is_wifi_enable()){
        alert('wifi connection is not enable');
        return false;
    }
    $.mobile.loading('show');
    $.post(post_url,flagno_data,function(data){
        if(data.OK != undefined && data.OK != ''){
            alert(data.OK);
            $.mobile.loading('hide');
            reset_fields();
        }else{
            alert(data.ERR);
            $.mobile.loading('hide');
        }
    },'json')
    .fail(function(){
        alert('Communication error!');
        $.mobile.loading('hide');
    });
}

function quit(){
    navigator.app.exitApp();
}

function startScan(elem, page) {
    if(typeof cordova==='undefined'){
        if(page == 'normal'){
            normal_data[elem] = 'testvalue';
            $('#normal_'+elem).val('testvalue');
        } else if(page == 'flagno'){
            flagno_data[elem] = 'testvalue';
            $('#flagno_'+elem).val('testvalue');
        }
        check_params();
        return true;
    }
    scan_in_progress = true;
    $.mobile.loading('show');
    cordova.plugins.barcodeScanner.scan(
    function (result) {
        var s = "Result: " + result.text + "<br/>" +
            "Format: " + result.format + "<br/>" +
            "Cancelled: " + result.cancelled;
        if(!result.cancelled){
            if(page == 'normal'){
                normal_data[elem] = result.text;
                $('#normal_'+elem).val(result.text);
            } else if(page == 'flagno'){
                flagno_data[elem] = result.text;
                $('#flagno_'+elem).val(result.text);
            }
            scan_in_progress = false;
        }
        check_params();
        $.mobile.loading('hide');
    }, 
    function (error) {
        alert("Scanning failed: " + error);
        scan_in_progress = false;
        $.mobile.loading('hide');
    });
}

function save_id_device(){
    var id_device = $('#id_device').val();
    if(id_device != ''){
        window.localStorage.setItem('id_device',id_device);
        $('.id_device').text(' - '+id_device);
        normal_data['id_device'] = window.localStorage.getItem('id_device');
        flagno_data['id_device'] = window.localStorage.getItem('id_device');
        $("body").pagecontainer("change", "#normal", {
            transition: 'slidedown',
            reload    : true
        });
    }
}

$(document).on('pageinit','#normal',function(){
    $('#version').append(app_version);
    var id_device = window.localStorage.getItem('id_device');
    if(id_device==null){
        $("body").pagecontainer("change", "#line_input", {
            transition: 'slidedown',
            reload    : true
        });
    }
    $('.id_device').text(' - '+id_device);
    /* this is needed only to have a better graphic for input text fields */
    $('.ui-input-text').removeClass('ui-state-disabled');
    reset_fields();
    app.initialize();
});

$(document).on('pageinit','#flagno',function(){
    /* this is needed only to have a better graphic for input text fields */
    $('.ui-input-text').removeClass('ui-state-disabled');
    fill_flagno_operations();
});

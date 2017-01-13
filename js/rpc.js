var _callURI;

function rpcCallPopup(uri) {
    _callURI = uri;

    $('#rpc-name').html(uri);
    $('#callRPC').modal('show');
}

function rpcCall() {
    var args = [];

    for(var i=1 ; i<=5 ; i++) {
        var value = $('#rpc-arg'+i).val();

        if (value != "") {
            // @foerderer

            // Parse it if possible. If not assume its a string.
            try {
                let obj = JSON.parse(value);
                args.push(obj);
            } catch(e) {
                args.push(value);
            }

            // /@foerderer
        }
    }

    wsPub.call(_callURI, args).then(
        function (result) {
            $('#callRPC').modal('hide');
            // @foerderer

            let argsString = JSON.stringify(args);
            argsString = argsString.substring(1, argsString.length -1);
            // set call & parameter details
            $('#rpc-info').html(_callURI + '<p>(' + argsString + ')</p>');
            // stringify result and highlight it
            $('#json-rpc-data').html(jsonHighlight(JSON.stringify(result, null, 2)));
            console.log(result);

            // /@foerderer
        },
        function (error) {
			$('#callRPC').modal('hide');
			displayError(error);
        }
    );
}


function onRegister(args) {
    var details = args[1];

    wsPub.call("wamp.registration.list_callees", [details.id]).then(
        function (sessions) {
            for (var i in sessions) {
                if (sessions[i] == wsSub.id || sessions[i] == wsPub.id) {
                    delete sessions[i];
                }
            }

            details.callees = sessions;

            newRpc(details);
        },
        displayError
    );
}

function onUnregister(args) {
    for (var each in args) {
        $('#rpc-'+args[each]).remove();
    }
}

function newRpc(details) {
    var html = '<tr id="rpc-'+details.id+'"><td>'+details.uri+'</td>';
    html += '<td class="rpc-col-created">'+details.created +'</td>';
    html += '<td class="rpc-col-callees"><span id="callees-list-'+details.id+'" class="sessions-details" onclick="getSessionsDetails(\''+details.uri+'\', \''+details.id+'\', \'rpc\');">'
    				+JSON.stringify(details.callees)+'</span></td>';
    html += '<td class="rpc-col-action"><button class="btn btn-info btn-compact" onclick="rpcCallPopup(\''+details.uri+'\');">Call</button></td>';
    html += '</tr>';

    $('#rpc-list').append(html);
    
    // @foerderer

    // sort table using "stupidtable"
    let table = $('#rpc-list').parent('table').stupidtable();
    $('#rpc-col-uri').stupidsort('desc'); // force sorting by changing order first
    $('#rpc-col-uri').stupidsort('asc');

    // /@foerderer
}

function getAllRpc() {
    wsPub.call("wamp.registration.list").then(
        function (list) {
            for (var each in list.exact) {
                wsPub.call("wamp.registration.get", [list.exact[each]]).then(
                    function (res) {
                        wsPub.call("wamp.registration.list_callees", [res.id]).then(
                            function (sessions) {
                                for (var i in sessions) {
                                    if (sessions[i] == wsSub.id || sessions[i] == wsPub.id) {
                                        delete sessions[i];
                                    }
                                }

                                res.callees = sessions;

                                newRpc(res);
                            },
                            displayError
                        );
                    },
                    displayError
                );
            }
        },
        displayError
    );

    wsPub.subscribe('wamp.registration.on_create', onRegister).then(
    	function (res) {},
    	displayError
    );
    wsPub.subscribe('wamp.registration.on_delete', onUnregister).then(
    	function (res) {},
    	displayError
    );
}
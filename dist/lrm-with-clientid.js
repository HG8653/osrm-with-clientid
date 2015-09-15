(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}(g.L || (g.L = {})).Routing = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function corslite(url, callback, cors) {
    var sent = false;

    if (typeof window.XMLHttpRequest === 'undefined') {
        return callback(Error('Browser not supported'));
    }

    if (typeof cors === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        cors = m && (m[0] !== location.protocol + '//' + location.domain +
                (location.port ? ':' + location.port : ''));
    }

    var x = new window.XMLHttpRequest();

    function isSuccessful(status) {
        return status >= 200 && status < 300 || status === 304;
    }

    if (cors && !('withCredentials' in x)) {
        // IE8-9
        x = new window.XDomainRequest();

        // Ensure callback is never called synchronously, i.e., before
        // x.send() returns (this has been observed in the wild).
        // See https://github.com/mapbox/mapbox.js/issues/472
        var original = callback;
        callback = function() {
            if (sent) {
                original.apply(this, arguments);
            } else {
                var that = this, args = arguments;
                setTimeout(function() {
                    original.apply(that, args);
                }, 0);
            }
        }
    }

    function loaded() {
        if (
            // XDomainRequest
            x.status === undefined ||
            // modern browsers
            isSuccessful(x.status)) callback.call(x, null, x);
        else callback.call(x, x, null);
    }

    // Both `onreadystatechange` and `onload` can fire. `onreadystatechange`
    // has [been supported for longer](http://stackoverflow.com/a/9181508/229001).
    if ('onload' in x) {
        x.onload = loaded;
    } else {
        x.onreadystatechange = function readystate() {
            if (x.readyState === 4) {
                loaded();
            }
        };
    }

    // Call the callback with the XMLHttpRequest object as an error and prevent
    // it from ever being called again by reassigning it to `noop`
    x.onerror = function error(evt) {
        // XDomainRequest provides no evt parameter
        callback.call(this, evt || true, null);
        callback = function() { };
    };

    // IE9 must have onprogress be set to a unique function.
    x.onprogress = function() { };

    x.ontimeout = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    x.onabort = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    // GET is the only supported HTTP Verb by XDomainRequest and is the
    // only one supported here.
    x.open('GET', url, true);

    // Send the request. Sending data is not supported.
    x.send(null);
    sent = true;

    return x;
}

if (typeof module !== 'undefined') module.exports = corslite;

},{}],2:[function(require,module,exports){
var polyline = {};

// Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
//
// Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
// by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)

function encode(coordinate, factor) {
    coordinate = Math.round(coordinate * factor);
    coordinate <<= 1;
    if (coordinate < 0) {
        coordinate = ~coordinate;
    }
    var output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

// This is adapted from the implementation in Project-OSRM
// https://github.com/DennisOSRM/Project-OSRM-Web/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

polyline.encode = function(coordinates, precision) {
    if (!coordinates.length) return '';

    var factor = Math.pow(10, precision || 5),
        output = encode(coordinates[0][0], factor) + encode(coordinates[0][1], factor);

    for (var i = 1; i < coordinates.length; i++) {
        var a = coordinates[i], b = coordinates[i - 1];
        output += encode(a[0] - b[0], factor);
        output += encode(a[1] - b[1], factor);
    }

    return output;
};

if (typeof module !== undefined) module.exports = polyline;

},{}],3:[function(require,module,exports){
(function (global){
(function() {
    'use strict';

    var L = (typeof window !== "undefined" ? window['L'] : typeof global !== "undefined" ? global['L'] : null),
	corslite = require('corslite'),
	polyline = require('polyline');
    
    // Ignore camelcase naming for this file, since OSRM's API uses
    // underscores.
    /* jshint camelcase: false */
    
    L.Routing = L.Routing || {};
//    L.extend(L.Routing, require('./L.Routing.Waypoint'));
    
    L.Routing.OSRMwithCid = L.Class.extend({
	options: {
	    serviceUrl: '//localhost/viaroute',
	    timeout: 30 * 1000
	},
	
	initialize: function(client_id, options) {
	    L.Util.setOptions(this, options);
	    this._hints = {
		locations: {}
	    };
	    this._client_id = client_id;
	},
	
	route: function(waypoints, callback, context, options) {
	    var timedOut = false,
		wps = [],
		url,
		timer,
		wp,
		i;
	    
	    options = options || {};
	    url = this.buildRouteUrl(waypoints, options);
	    
	    timer = setTimeout(function() {
		timedOut = true;
		callback.call(context || callback, {
		    status: -1,
		    message: 'OSRM request timed out.'
		});
	    }, this.options.timeout);
	    
	    // Create a copy of the waypoints, since they
	    // might otherwise be asynchronously modified while
	    // the request is being processed.
	    for (i = 0; i < waypoints.length; i++) {
		wp = waypoints[i];
		wps.push(new L.Routing.Waypoint(wp.latLng, wp.name, wp.options));
	    }
	    
	    corslite(url, L.bind(function(err, resp) {
		var data;
		
		clearTimeout(timer);
		if (!timedOut) {
		    if (!err) {
			data = JSON.parse(resp.responseText);
			this._routeDone(data, wps, callback, context);
		    } else {
			callback.call(context || callback, {
			    status: -1,
			    message: 'HTTP request failed: ' + err
			});
		    }
		}
	    }, this));
	    
	    return this;
	},
	
	_routeDone: function(response, inputWaypoints, callback, context) {
	    var coordinates,
		alts,
		actualWaypoints,
		i;
	    
	    context = context || callback;
	    if (response.status !== 0) {
		callback.call(context, {
		    status: response.status,
		    message: response.status_message
		});
		return;
	    }
	    
	    coordinates = this._decodePolyline(response.route_geometry);
	    actualWaypoints = this._toWaypoints(inputWaypoints, response.via_points);
	    alts = [{
		name: this._createName(response.route_name),
		coordinates: coordinates,
		instructions: response.route_instructions ? this._convertInstructions(response.route_instructions) : [],
		summary: response.route_summary ? this._convertSummary(response.route_summary) : [],
		inputWaypoints: inputWaypoints,
		waypoints: actualWaypoints,
		waypointIndices: this._clampIndices(response.via_indices, coordinates)
	    }];
	    
	    if (response.alternative_geometries) {
		for (i = 0; i < response.alternative_geometries.length; i++) {
		    coordinates = this._decodePolyline(response.alternative_geometries[i]);
		    alts.push({
			name: this._createName(response.alternative_names[i]),
			coordinates: coordinates,
			instructions: response.alternative_instructions[i] ? this._convertInstructions(response.alternative_instructions[i]) : [],
			summary: response.alternative_summaries[i] ? this._convertSummary(response.alternative_summaries[i]) : [],
			inputWaypoints: inputWaypoints,
			waypoints: actualWaypoints,
			waypointIndices: this._clampIndices(response.alternative_geometries.length === 1 ?
							    // Unsure if this is a bug in OSRM or not, but alternative_indices
							    // does not appear to be an array of arrays, at least not when there is
							    // a single alternative route.
							    response.alternative_indices : response.alternative_indices[i],
							    coordinates)
		    });
		}
	    }
	    
	    // only versions <4.5.0 will support this flag
	    if (response.hint_data) {
		this._saveHintData(response.hint_data, inputWaypoints);
	    }
	    callback.call(context, null, alts);
	},
	
	_decodePolyline: function(routeGeometry) {
	    var cs = polyline.decode(routeGeometry, 6),
		result = [],
		i;
	    for (i = 0; i < cs.length; i++) {
		result.push(L.latLng(cs[i]));
	    }
	    
	    return result;
	},
	
	_toWaypoints: function(inputWaypoints, vias) {
	    var wps = [],
		i;
	    for (i = 0; i < vias.length; i++) {
		wps.push(L.Routing.waypoint(L.latLng(vias[i]),
				            inputWaypoints[i].name,
				            inputWaypoints[i].options));
	    }
	    
	    return wps;
	},
	
	_createName: function(nameParts) {
	    var name = '',
		i;
	    
	    for (i = 0; i < nameParts.length; i++) {
		if (nameParts[i]) {
		    if (name) {
			name += ', ';
		    }
		    name += nameParts[i].charAt(0).toUpperCase() + nameParts[i].slice(1);
		}
	    }

	    return name;
	},
	
	buildRouteUrl: function(waypoints, options) {
	    var locs = [],
		wp,
		computeInstructions,
		computeAlternative,
		locationKey,
		hint;
	    
	    for (var i = 0; i < waypoints.length; i++) {
		wp = waypoints[i];
		locationKey = this._locationKey(wp.latLng);
		locs.push('loc=' + locationKey);
		
		hint = this._hints.locations[locationKey];
		if (hint) {
		    locs.push('hint=' + hint);
		}
		
		if (wp.options && wp.options.allowUTurn) {
		    locs.push('u=true');
		}
	    }
	    
	    computeAlternative = computeInstructions =
		!(options && options.geometryOnly);
	    
	    return this.options.serviceUrl + '?' +
		'instructions=' + computeInstructions.toString() + '&' +
		'alt=' + computeAlternative.toString() + '&' +
		(options.z ? 'z=' + options.z + '&' : '') +
		locs.join('&') +
		(this._hints.checksum !== undefined ? '&checksum=' + this._hints.checksum : '') +
		(options.fileformat ? '&output=' + options.fileformat : '') +
		(options.allowUTurns ? '&uturns=' + options.allowUTurns : '') +
		'&client_id=' + this._client_id;
	},
	
	_locationKey: function(location) {
	    return location.lat + ',' + location.lng;
	},
	
	_saveHintData: function(hintData, waypoints) {
	    var loc;
	    this._hints = {
		checksum: hintData.checksum,
		locations: {}
	    };
	    for (var i = hintData.locations.length - 1; i >= 0; i--) {
		loc = waypoints[i].latLng;
		this._hints.locations[this._locationKey(loc)] = hintData.locations[i];
	    }
	},
	
	_convertSummary: function(osrmSummary) {
	    return {
		totalDistance: osrmSummary.total_distance,
		totalTime: osrmSummary.total_time
	    };
	},
	
	_convertInstructions: function(osrmInstructions) {
	    var result = [],
		i,
		instr,
		type,
		driveDir;
	    
	    for (i = 0; i < osrmInstructions.length; i++) {
		instr = osrmInstructions[i];
		type = this._drivingDirectionType(instr[0]);
		driveDir = instr[0].split('-');
		if (type) {
		    result.push({
			type: type,
			distance: instr[2],
			time: instr[4],
			road: instr[1],
			direction: instr[6],
			exit: driveDir.length > 1 ? driveDir[1] : undefined,
			index: instr[3]
		    });
		}
	    }
	    
	    return result;
	},
	
	_drivingDirectionType: function(d) {
	    switch (parseInt(d, 10)) {
	    case 1:
		return 'Straight';
	    case 2:
		return 'SlightRight';
	    case 3:
		return 'Right';
	    case 4:
		return 'SharpRight';
	    case 5:
		return 'TurnAround';
	    case 6:
		return 'SharpLeft';
	    case 7:
		return 'Left';
	    case 8:
		return 'SlightLeft';
	    case 9:
		return 'WaypointReached';
	    case 10:
		// TODO: "Head on"
		// https://github.com/DennisOSRM/Project-OSRM/blob/master/DataStructures/TurnInstructions.h#L48
		return 'Straight';
	    case 11:
	    case 12:
		return 'Roundabout';
	    case 15:
		return 'DestinationReached';
	    default:
		return null;
	    }
	},
	
	_clampIndices: function(indices, coords) {
	    var maxCoordIndex = coords.length - 1,
		i;
	    for (i = 0; i < indices.length; i++) {
		indices[i] = Math.min(maxCoordIndex, Math.max(indices[i], 0));
	    }
	}
    });
    
    L.Routing.osrm = function(client_id, options) {
	return new L.Routing.OSRMwithCid(client_id, options);
    };
    
    module.exports = L.Routing;
})();

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"corslite":1,"polyline":2}]},{},[3])(3)
});
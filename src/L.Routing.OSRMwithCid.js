(function() {
    'use strict';

    var L = require('leaflet'),
	corslite = require('corslite'),
	polyline = require('polyline');
    
    L.Routing = L.Routing || {};
    
    L.Routing.OSRMwithCid = L.Routing.OSRM.extend({
	initialize: function(client_id, options) {
	    L.Util.setOptions(this, options);
	    this._hints = {
		locations: {}
	    };
	    this._client_id = client_id;
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
	}
    });
    
    L.Routing.osrm = function(client_id, options) {
	return new L.Routing.OSRMwithCid(client_id, options);
    };
    
    module.exports = L.Routing;
})();

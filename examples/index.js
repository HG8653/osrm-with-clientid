var map = L.map('map');

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.Routing.control({
    waypoints: [
	L.latLng(40.775109,-73.971270),
	L.latLng(40.702337,-74.016374)
    ],
    geocoder: L.Control.Geocoder.nominatim(),
    router: new L.Routing.OSRMwithCid('e6da160b-a484-4a0e-880e-9e822fa41198',
				      {
					  serviceUrl: 'https://api.apim.ibmcloud.com/mushjpibmcom-lodsigspace/sb/viaroute'
				      }),
    routeWhileDragging: true
}).addTo(map);


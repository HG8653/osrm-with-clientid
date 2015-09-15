var map = L.map('map');

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.Routing.control({
    waypoints: [
	L.latLng(35.68027,139.768325),
	L.latLng(35.679296,139.78656)
    ],
    geocoder: L.Control.Geocoder.nominatim(),
    router: new L.Routing.OSRMwithCid('e6da160b-a484-4a0e-880e-9e822fa41198',
				      {
					  serviceUrl: 'https://api.apim.ibmcloud.com/mushjpibmcom-lodsigspace/sb/viaroute'
				      }),
    routeWhileDragging: true
}).addTo(map);


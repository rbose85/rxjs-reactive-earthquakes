const map = L.map('map').setView([33.858631, -118.279602], 7);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

const quakes = Rx.DOM.jsonpRequest({
  url: 'http://earthquakes.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp',
  jsonpCallback: 'eqfeed_callback'
})
    .flatMap(result => Rx.Observable.from(result.response.features))
    .map(quake => ({
      lat: quake.geometry.coordinates[1],
      lng: quake.geometry.coordinates[0],
      size: quake.properties['mag'] * 10000
    }));

quakes.subscribe(quake => {
  L.circle([quake.lat, quake.lng], quake.size).addTo(map);
});

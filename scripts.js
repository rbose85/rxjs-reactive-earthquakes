const map = L.map('map').setView([33.858631, -118.279602], 7);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

const codeLayers = {};
const quakeLayer = L.layerGroup([]).addTo(map);

const makeRow = props => {
  const row = document.createElement('tr');
  const time = (new Date(props['time'])).toString();

  row.id = props['net'] + props['code'];

  [props['place'], props['mag'], time].forEach(text => {
    const cell = document.createElement('td');
    cell.textContent = text;
    row.appendChild(cell);
  });

  return row;
};

const initialise = () => {
  const quakes = Rx.Observable.interval(5000)
      .flatMap(() => Rx.DOM.jsonpRequest({
            url: 'http://earthquakes.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp',
            jsonpCallback: 'eqfeed_callback'
          })
              .retry(3)
      )
      .flatMap(result => Rx.Observable.from(result.response.features))
      .distinct(quake => quake.properties.code)
      .share();

  quakes.subscribe(quake => {
    const coords = quake.geometry.coordinates;
    const size = quake.properties['mag'] * 10000;

    const circle = L.circle([coords[1], coords[0]], size).addTo(map);

    quakeLayer.addLayer(circle);
    codeLayers[quake.id] = quakeLayer.getLayerId(circle);
  });

  const table = document.getElementById('quakes_info');

  const getRowFromEvent = event => Rx.Observable.fromEvent(table, event)
      .filter(event => {
        const el = event.target;
        return el.tagName === 'TD' && el.parentNode.id.length;
      })
      .pluck('target', 'parentNode')
      .distinctUntilChanged();

  getRowFromEvent('mouseover').pairwise()
      .subscribe(rows => {
        const prevCircle = quakeLayer.getLayer(codeLayers[rows[0].id]);
        const currCircle = quakeLayer.getLayer(codeLayers[rows[1].id]);

        prevCircle.setStyle({ color: '#0000ff' });
        currCircle.setStyle({ color: '#ff0000' });
      });

  getRowFromEvent('click').subscribe(row => {
    const circle = quakeLayer.getLayer(codeLayers[row.id]);
    map.panTo(circle.getLatLng());
  });

  quakes.pluck('properties')
      .map(makeRow)
      .subscribe(row => table.appendChild(row));
};

Rx.DOM.ready()
    .subscribe(initialise);

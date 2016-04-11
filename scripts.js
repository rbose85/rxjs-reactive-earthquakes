const map = L.map('map').setView([33.858631, -118.279602], 7);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

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

    L.circle([coords[1], coords[0]], size).addTo(map);
  });

  const makeRow = props => {
    const row = document.createElement('tr');
    row.id = props['net'] + props['code'];

    const date = new Date(props['time']);
    const time = date.toString();

    [props['place'], props['mag'], time].forEach(text => {
      const cell = document.createElement('td');
      cell.textContent = text;
      row.appendChild(cell);
    });

    return row;
  };

  const table = document.getElementById('quakes_info');
  quakes.pluck('properties')
      .map(makeRow)
      .subscribe(row => table.appendChild(row));
};

Rx.DOM.ready()
    .subscribe(initialise);

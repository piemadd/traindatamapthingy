const fetchRetry = ((url, delay, tries, fetchOptions = {}) => {
    function onError(err){
        triesLeft = tries - 1;
        if(!triesLeft){
            throw err;
        }
        return wait(delay).then(() => fetchRetry(url, delay, triesLeft, fetchOptions));
    }
    return fetch(url,fetchOptions).catch(onError);
})

let map = L.map('map', { zoomControl: false });

const getAngle = (heading) => {
    const angles = {
        'NE': 0,
        'E': 45,
        'SE': 90,
        'S': 135,
        'SW': 180,
        'SW': 225,
        'W': 270,
        'SW': 315
    }
    return angles[heading];
}

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 25,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicGllbWFkZCIsImEiOiJja2ltYzQ5YWMwcnZtMnJxbWttcGQ2MHF4In0.eHizY2ZVCp-mp0ViI5ZIEg'
}).addTo(map);

let icon = L.icon({
    iconUrl: 'icon.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

let iconLong = L.icon({
    iconUrl: 'iconLong.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

let iconState = L.icon({
    iconUrl: 'iconState.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

let iconNEC = L.icon({
    iconUrl: 'iconNEC.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

let icons = {
    'Long': iconLong,
    'State': iconState,
    'NEC': iconNEC
}

//let pieroMarker = L.marker([50.5, 30.5], {icon: icon}).addTo(map);

let markers = L.layerGroup().addTo(map);
//let markers = []

//map.setView([39.14710270770074, -96.1962890625], 5); //us
map.setView([41.02964338716641, -74.24560546875001], 7); //nec


const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    let lineData = await fetchRetry('./nationalRoute.json', 100, 3);
    let linesParsed = await lineData.json()

    let features = linesParsed.features;

    for (let i = 0; i < features.length; i++) {
        let coordinates = features[i].geometry.coordinates;

        let coordinatesUnscrambled = [];

        for (let j = 0; j < coordinates.length; j++) {
            coordinatesUnscrambled.push([coordinates[j][1], coordinates[j][0]])
        }
        
        L.polyline(coordinatesUnscrambled, {color: 'red'}).addTo(map);
    }
    
    let trainData = await fetchRetry('./listMin.json', 100, 3);
    let trainsParsed = await trainData.json()

    let keys = Object.keys(trainsParsed)

    console.log(keys.length)

    const urlParams = new URLSearchParams(window.location.search);

    let recordIt = urlParams.get('record')

    console.log(recordIt)

    if (recordIt == 'true') {
        //for (let i = 0; i < 10; i++) {
        console.log('recording')
        for (let i = 0; i < 1590; i++) {
            showInfo(i, trainsParsed, keys, 'true')
            console.log('recorded ' + i)
            await delay(1000);
            console.log('finished frame ' + i)
        }
    }

    
    console.log('no recording')
    let frame = urlParams.get('frame')
    
    if (frame == undefined) {
        frame = 0
    }

    showInfo(frame, trainsParsed, keys)

})();

const showInfo = ((i, trainsParsed, keys, recordIt = false) => {
    let timeThingy = document.getElementById('time')
    let tempList = trainsParsed[keys[i]]
    for (let j = 0; j < tempList.length; j++) {
        //console.log(tempList[j].objectID + ' - ' + tempList[j].coordinates)
        let marker = L.marker(tempList[j].coordinates, {rotationAngle: getAngle(tempList[j].heading), icon: icons[tempList[j].trainType]});
        marker.addTo(markers)
    }

    let months = {
        0: "January",
        1: "February",
        2: "March",
        3: "April",
        4: "May",
        5: "June",
        6: "July",
        7: "August",
        8: "September",
        9: "October",
        10: "November",
        11: "December"
    }

    let date = new Date(parseInt(keys[i]))

    console.log(keys[i])
    
    timeThingy.innerHTML = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${Intl.DateTimeFormat().resolvedOptions().timeZone}`

    //screenShot(markers, `${i}.jpg`)
})

const screenShot = ((markers, name = "image.jpg", recordit = 'false') => {
    domtoimage.toJpeg(document.getElementsByTagName('body')[0], { quality: 0.95 })
    .then(function (dataUrl) {
        let link = document.createElement('a');
        link.download = name;
        link.href = dataUrl;
        link.click();
        markers.clearLayers()
    });
})

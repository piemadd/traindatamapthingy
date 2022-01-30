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
    //id: 'mapbox/streets-v11',
    id: 'piemadd/ckyugw7ui000y14o2nq8we94g',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicGllbWFkZCIsImEiOiJja2ltYzQ5YWMwcnZtMnJxbWttcGQ2MHF4In0.eHizY2ZVCp-mp0ViI5ZIEg'
}).addTo(map);

let iconPiero = L.icon({
    iconUrl: 'pieroicon.png',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

let iconLong = L.icon({
    iconUrl: 'iconLong.png',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

let iconState = L.icon({
    iconUrl: 'iconState.png',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

let iconNEC = L.icon({
    iconUrl: 'iconNEC.png',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

let icons = {
    'Long': iconLong,
    'State': iconState,
    'NEC': iconNEC,
    'Piero': iconPiero
}

//let pieroMarker = L.marker([50.5, 30.5], {icon: icon}).addTo(map);

let markers = L.layerGroup().addTo(map);
//let markers = []

map.setView([39.14710270770074, -96.1962890625], 5); //us
//map.setView([41.02964338716641, -74.24560546875001], 7); //nec
//map.setView([37.34395908944491, -120.39916992187501], 7); //cali

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    
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
        for (let i = 0; i < keys.length; i+= 1) {
            if (i % 5 != 0) {
                console.log('starting ' + i)
                showInfo(i, trainsParsed, keys, 'true')
                await delay(1000);
                console.log('finished frame ' + i)
            }
            
        }
    }

    /*
    console.log('no recording')
    let frame = urlParams.get('frame')
    
    if (frame == undefined) {
        frame = 0
    }
    */
    
    //showInfo(frame, trainsParsed, keys)

})();

const showInfo = ((i, trainsParsed, keys, recordIt = false) => {
    let timeThingy = document.getElementById('time')
    let tempList = trainsParsed[keys[i]]
    for (let j = 0; j < tempList.length; j++) {
        if (tempList[j].velocity == null) {tempList[j].velocity = 0}
        //console.log(tempList[j].objectID + ' - ' + tempList[j].coordinates)
        let marker = L.marker(tempList[j].coordinates, {
            icon: icons[tempList[j].trainType]
        });
        marker.bindPopup('Train Name: ' + tempList[j].routeName + '<br />Velocity: ' + tempList[j].velocity.toFixed(2) + ' mph').openPopup();
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

    screenShot(markers, `${i}.jpg`)
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

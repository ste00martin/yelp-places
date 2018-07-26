var Papa = require('papaparse')
var fileSystem = require('fs');
const got = require('got');
const _ = require('lodash')
const flatten = require('flat')

const INPUT_FILE = "Unique.csv";
// const INPUT_FILE = "testdata.csv";

const YELP_LIMIT = 50 // must be less than  or equal to 50
const YELP_RADIUS = 40000 // must be less than or equal to 40000
const YELP_AUTH_TOKEN = process.env.YELP_TOKEN
const OUTPUT_CSV_FILE_NAME = 'fullYelp.csv'
// const CATEGORIES = 'Grocery,Gas Stations'


var fileString = fileSystem.readFileSync(INPUT_FILE,'utf8');


async function getPlaces (latitude, longitude) {
    try {
        const url = `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&limit=${YELP_LIMIT}&radius=${YELP_RADIUS}&sort_by=distance`
        const options = {
          headers: {
            Authorization: `Bearer ${YELP_AUTH_TOKEN}`
          }
        }
        const response = await got(url, options);

        return JSON.parse(response.body)
    } catch (error) {
      return error
    }
}


async function getYelpWrapper(latitude, longitude) {
  const yelpRequest = await getPlaces(latitude,longitude)

  const simplified = yelpRequest.businesses.filter(business => ( business && !business.is_closed)).map(business => {
    const categories = business.categories.map(category => category.title)

    const subsetBusiness = flatten(_.omit(business, ['transactions', 'categories', 'distance']))
    return {
      ...subsetBusiness,
      'distance (meters)': business.distance,
      // categories,
      'categories': _.join(categories, '~'),
    }
  })
  return simplified
}

const saveParsedData = (neighbors) => {
  var outputCsv = Papa.unparse(neighbors,{
    header: true,
  })
  console.log('output:', outputCsv)
  fileSystem.writeFileSync(OUTPUT_CSV_FILE_NAME, outputCsv, 'utf8')
}

async function parseComplete (results) {
  let newData = []
  let data = results.data

  for (i = 0; i < data.length; i++) {
    let row = data[i]
    let stationLatitude = row['Geolocation (Latitude)']
    let stationLongitude = row['Geolocation (Longitude)']
    let stationLIN = row.LIN
    let stationSalesforceID = row['Location (LIN): ID']
    let siteAccountName = row['Site Account: Account Name']

    if( stationLatitude && stationLongitude ) {
      let yelpData = await getYelpWrapper(stationLatitude,stationLongitude)

      yelpData.forEach(business => {
        let stationAndBusinessInfo = {
          stationLatitude,
          stationLongitude,
          stationLIN,
          stationSalesforceID,
          siteAccountName,
          ...business
        }
        newData.push(stationAndBusinessInfo)
        console.log('new data:' , stationAndBusinessInfo)
      });
    }
  }

  // fileSystem.writeFile('./data.json', JSON.stringify(newData, null, 2) , 'utf-8');

  saveParsedData(newData)
}

Papa.parse(fileString, {
  header: true,
  complete: function(results) {
    parseComplete(results)
  }
})